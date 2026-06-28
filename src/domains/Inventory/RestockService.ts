import { VendingMachineRepository } from "@/infrastructure/repositories/VendingMachineRepository"
import { SlotRepository } from "@/infrastructure/repositories/SlotRepository"
import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import { InventoryRepository } from "@/infrastructure/repositories/InventoryRepository"
import { TransactionRepository } from "@/infrastructure/repositories/TransactionRepository"
import {
  inferUnitsSold,
  spreadSalesOverDays,
  MAX_SPREAD_DAYS,
} from "@/domains/Inventory/reconciliation"

export type RestockSlotInfo = {
  slotId: string
  labelCode: string
  productId: string
  productName: string
  recommendedPrice: number
  capacity: number
  currentQuantity: number
}

export type RestockRepos = {
  machineRepo: VendingMachineRepository
  slotRepo: SlotRepository
  productRepo: ProductRepository
  inventoryRepo: InventoryRepository
  txRepo: TransactionRepository
}

export type RecordRestockResult = {
  success: boolean
  totalSold: number
  refilledSlots: number
  daysSpread: number
  telemetrySkipped: boolean
  error?: string
}

/** Slots (with product info) for the restock count screen. Org-scoped. */
export async function getRestockSlots(
  repos: Pick<RestockRepos, "machineRepo" | "slotRepo" | "productRepo">,
  organizationId: string,
  machineId: string
): Promise<{ success: boolean; slots: RestockSlotInfo[]; hasTelemetry: boolean; error?: string }> {
  const { machineRepo, slotRepo, productRepo } = repos

  const machine = await machineRepo.findById(machineId)
  if (!machine || machine.organizationId !== organizationId) {
    return { success: false, slots: [], hasTelemetry: false, error: "Machine not found" }
  }

  const [slots, products] = await Promise.all([
    slotRepo.findByMachineId(machineId),
    productRepo.findByOrganizationId(organizationId),
  ])
  const productMap = new Map(products.map((p) => [p.id, p]))

  const result: RestockSlotInfo[] = slots
    .filter((s) => s.productId)
    .map((s) => {
      const product = productMap.get(s.productId!)
      return {
        slotId: s.id,
        labelCode: s.labelCode,
        productId: s.productId!,
        productName: product?.name ?? "Unknown product",
        recommendedPrice: product?.recommendedPrice ?? 0,
        capacity: s.capacity,
        currentQuantity: s.currentQuantity,
      }
    })
    .sort((a, b) => a.labelCode.localeCompare(b.labelCode))

  const hasTelemetry = !!machine.cardReaderId?.trim()
  return { success: true, slots: result, hasTelemetry }
}

/**
 * Record a restock: for each slot the owner enters how many units are left and
 * what to refill to. We update slot/inventory counts and — for machines WITHOUT
 * card-reader telemetry — infer sales from the drop and write them as real
 * transactions spread across the days since the last count.
 *
 * Pure domain logic (no Next.js cache revalidation); callers handle that.
 */
export async function recordRestockCounts(
  repos: RestockRepos,
  organizationId: string,
  machineId: string,
  entries: { slotId: string; leftNow: number; refillTo: number }[]
): Promise<RecordRestockResult> {
  const { machineRepo, slotRepo, productRepo, inventoryRepo, txRepo } = repos

  const machine = await machineRepo.findById(machineId)
  if (!machine || machine.organizationId !== organizationId) {
    return { success: false, totalSold: 0, refilledSlots: 0, daysSpread: 0, telemetrySkipped: false, error: "Machine not found" }
  }

  const [slots, products] = await Promise.all([
    slotRepo.findByMachineId(machineId),
    productRepo.findByOrganizationId(organizationId),
  ])
  const slotMap = new Map(slots.map((s) => [s.id, s]))
  const productMap = new Map(products.map((p) => [p.id, p]))

  const hasTelemetry = !!machine.cardReaderId?.trim()
  const reconCardReader = `MANUAL-${machineId}`

  // Elapsed days for spreading inferred sales (manual machines only)
  const DAY_MS = 86_400_000
  let elapsedDays = 14
  if (!hasTelemetry) {
    const lastDate = await txRepo.findLatestByCardReader(reconCardReader)
    if (lastDate) elapsedDays = Math.round((Date.now() - lastDate.getTime()) / DAY_MS)
  }
  const n = Math.max(1, Math.min(elapsedDays, MAX_SPREAD_DAYS))

  // soldByProduct aggregates sales across all of a product's slots
  const soldByProduct = new Map<string, { sold: number; price: number; slotCode: string }>()
  let totalSold = 0
  let refilledSlots = 0

  for (const entry of entries) {
    const slot = slotMap.get(entry.slotId)
    if (!slot || !slot.productId) continue

    const lastKnown = slot.currentQuantity
    const leftNow = Math.max(0, Math.floor(entry.leftNow))
    const refillTo = Math.max(leftNow, Math.floor(entry.refillTo))

    const sold = inferUnitsSold(lastKnown, leftNow)
    const added = Math.max(0, refillTo - leftNow)

    await slotRepo.setSlotQuantity(slot.id, refillTo)
    await inventoryRepo.applyReconciliation(slot.productId, added, sold, organizationId)

    if (added > 0) refilledSlots++
    if (sold > 0) {
      totalSold += sold
      const existing = soldByProduct.get(slot.productId)
      if (existing) {
        existing.sold += sold
      } else {
        soldByProduct.set(slot.productId, {
          sold,
          price: productMap.get(slot.productId)?.recommendedPrice ?? 0,
          slotCode: slot.labelCode,
        })
      }
    }
  }

  // Write inferred sales as transactions, spread across the period (manual only)
  if (!hasTelemetry && totalSold > 0) {
    const now = new Date()
    const perDayItems = new Map<number, { productId: string; quantity: number; salePrice: number; slotCode: string }[]>()

    for (const [productId, info] of soldByProduct) {
      const spread = spreadSalesOverDays(info.sold, n)
      for (let d = 0; d < spread.length; d++) {
        if (spread[d] <= 0) continue
        const items = perDayItems.get(d) ?? []
        items.push({ productId, quantity: spread[d], salePrice: info.price, slotCode: info.slotCode })
        perDayItems.set(d, items)
      }
    }

    for (const [d, items] of perDayItems) {
      // d = 0 is the oldest day in the window, n-1 is today
      const createdAt = new Date(now.getTime() - (n - 1 - d) * DAY_MS)
      const total = items.reduce((sum, i) => sum + i.quantity * i.salePrice, 0)
      await txRepo.createSale(
        {
          organizationId,
          cardReaderId: reconCardReader,
          createdAt,
          transactionType: "SALE",
          total,
          last4CardDigits: "RECON",
          data: { source: "reconciliation", machineId },
        },
        items
      )
    }
  }

  return {
    success: true,
    totalSold,
    refilledSlots,
    daysSpread: hasTelemetry ? 0 : n,
    telemetrySkipped: hasTelemetry,
  }
}

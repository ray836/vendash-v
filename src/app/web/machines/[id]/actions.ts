"use server"

import { db } from "@/infrastructure/database"
import { VendingMachineRepository } from "@/infrastructure/repositories/VendingMachineRepository"
import { SlotRepository } from "@/infrastructure/repositories/SlotRepository"
import { LocationRepository } from "@/infrastructure/repositories/LocationRepository"
import { PreKitRepository } from "@/infrastructure/repositories/PreKitRepository"
import { TransactionRepository } from "@/infrastructure/repositories/TransactionRepository"
import { InventoryRepository } from "@/infrastructure/repositories/InventoryRepository"
import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import * as VendingMachineService from "@/domains/VendingMachine/VendingMachineService"
import * as PreKitService from "@/domains/PreKit/PreKitService"
import * as TransactionService from "@/domains/Transaction/TransactionService"
import { CreatePreKitItemRequest, CreatePreKitRequest } from "@/domains/PreKit/schemas/CreatePreKitSchemas"
import { UpdatePreKitItemRequest, UpdatePreKitRequest } from "@/domains/PreKit/schemas/UpdatePreKitSchemas"
import { MachineWithSlotsDTO, MachineDetailDataDTO } from "@/domains/VendingMachine/schemas/vendingMachineDTOs"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import {
  inferUnitsSold,
  spreadSalesOverDays,
  MAX_SPREAD_DAYS,
} from "@/domains/Inventory/reconciliation"

export async function getMachineWithSlots(machineId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const machineRepo = new VendingMachineRepository(db)
  const slotRepo = new SlotRepository(db)
  const locationRepo = new LocationRepository(db)

  try {
    const result: MachineWithSlotsDTO | null = await VendingMachineService.getMachineWithSlots(machineRepo, slotRepo, locationRepo, machineId)
    if (!result) throw new Error("Machine not found")

    return {
      machine: result,
      slots: result.slots,
      revenue: { daily: 0, weekly: 0, monthly: 0 },
      setup: result.setup,
      lastRestocked: result.lastRestocked,
      lastMaintenance: result.lastMaintenance,
      alerts: [],
    } as MachineDetailDataDTO
  } catch (error) {
    console.error("Failed to get machine with slots:", error)
    throw new Error("Failed to get machine configuration")
  }
}

export async function createPreKit(machineId: string, items: CreatePreKitItemRequest[]) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const preKitRepo = new PreKitRepository(db)
    const request: CreatePreKitRequest = {
      machineId,
      userId: session.user.id,
      items: items.map((item) => ({ ...item, preKitId: "" })),
    }
    const result = await PreKitService.createPreKit(preKitRepo, request)
    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to create pre-kit:", error)
    return { success: false, error: "Failed to create pre-kit" }
  }
}

export async function getMachinePreKit(machineId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const preKitRepo = new PreKitRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const [result, inventoryList] = await Promise.all([
      PreKitService.getMachinePreKit(preKitRepo, machineId),
      inventoryRepo.findByOrganizationId(organizationId),
    ])
    if (!result) return { success: true, data: null }
    const inventoryMap = new Map(inventoryList.map((inv) => [inv.productId, inv.storage]))
    const resultWithStock = {
      ...result,
      items: result.items.map((item) => ({ ...item, inStock: inventoryMap.get(item.productId) ?? 0 })),
    }
    return { success: true, data: resultWithStock }
  } catch (error) {
    console.error("Failed to get machine pre-kit:", error)
    return { success: false, error: "Failed to get machine pre-kit" }
  }
}

export async function updatePreKitItems(
  preKitId: string,
  items: UpdatePreKitItemRequest[]
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const preKitRepo = new PreKitRepository(db)
    const request: UpdatePreKitRequest = { id: preKitId, userId: session.user.id, items }
    await PreKitService.updatePreKitItems(preKitRepo, request)
    return { success: true }
  } catch (error) {
    console.error("Failed to update pre-kit items:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// --- Manual sales capture via count reconciliation -------------------------

export type RestockSlotInfo = {
  slotId: string
  labelCode: string
  productId: string
  productName: string
  recommendedPrice: number
  capacity: number
  currentQuantity: number
}

/** Slots (with product info) for the restock count dialog. */
export async function getRestockSlots(
  machineId: string
): Promise<{ success: boolean; slots: RestockSlotInfo[]; hasTelemetry: boolean; error?: string }> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  try {
    const machineRepo = new VendingMachineRepository(db)
    const slotRepo = new SlotRepository(db)
    const productRepo = new ProductRepository(db)

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
  } catch (error) {
    console.error("getRestockSlots:", error)
    return { success: false, slots: [], hasTelemetry: false, error: "Failed to load slots" }
  }
}

/**
 * Record a restock: for each slot the owner enters how many units are left and
 * what to refill to. We update slot/inventory counts and — for machines WITHOUT
 * card-reader telemetry — infer sales from the drop and write them as real
 * transactions spread across the days since the last count.
 */
export async function recordRestockCounts(
  machineId: string,
  entries: { slotId: string; leftNow: number; refillTo: number }[]
): Promise<{
  success: boolean
  totalSold: number
  refilledSlots: number
  daysSpread: number
  telemetrySkipped: boolean
  error?: string
}> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  try {
    const machineRepo = new VendingMachineRepository(db)
    const slotRepo = new SlotRepository(db)
    const productRepo = new ProductRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const txRepo = new TransactionRepository(db)

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

    revalidatePath(`/web/machines/${machineId}`)
    revalidatePath("/web/products")

    return {
      success: true,
      totalSold,
      refilledSlots,
      daysSpread: hasTelemetry ? 0 : n,
      telemetrySkipped: hasTelemetry,
    }
  } catch (error) {
    console.error("recordRestockCounts:", error)
    return { success: false, totalSold: 0, refilledSlots: 0, daysSpread: 0, telemetrySkipped: false, error: "Failed to record restock" }
  }
}

export async function getMachineTransactions(machineId: string, startDate: Date, endDate: Date) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  console.log("startDate", startDate)
  console.log("endDate", endDate)
  const transactionRepo = new TransactionRepository(db)

  try {
    const result = await TransactionService.getTransactionsForMachine(transactionRepo, machineId, startDate, endDate)
    console.log("result", result)
    console.log("99999999999  ")
    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching machine transactions:", error)
    return { success: false, error: "Failed to fetch transactions" }
  }
}

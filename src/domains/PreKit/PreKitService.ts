import { PreKit, PreKitItem } from "./entities/PreKit"
import { BasePreKit, BasePreKitItem, PreKitStatus, PublicPreKit } from "./schemas/PrekitSchemas"
import { CreatePreKitRequest, CreatePreKitResponse } from "./schemas/CreatePreKitSchemas"
import { UpdatePreKitRequest } from "./schemas/UpdatePreKitSchemas"
import { PreKitRepository } from "@/infrastructure/repositories/PreKitRepository"
import { SlotRepository } from "@/infrastructure/repositories/SlotRepository"
import { VendingMachineRepository } from "@/infrastructure/repositories/VendingMachineRepository"
import { RouteRepository } from "@/infrastructure/repositories/RouteRepository"
import { InventoryRepository } from "@/infrastructure/repositories/InventoryRepository"
import { InventoryTransactionRepository } from "@/infrastructure/repositories/InventoryTransactionRepository"
import { InventoryTransaction } from "@/domains/Inventory/entities/InventoryTransaction"

export async function getOrgPreKits(repo: PreKitRepository, orgId: string): Promise<PublicPreKit[]> {
  return repo.getOrgPreKits(orgId)
}

export async function getMachinePreKit(repo: PreKitRepository, machineId: string): Promise<PublicPreKit | null> {
  return repo.getByMachineId(machineId)
}

export async function createPreKit(
  repo: PreKitRepository,
  request: CreatePreKitRequest
): Promise<CreatePreKitResponse> {
  const now = new Date()

  const preKit: BasePreKit = {
    id: crypto.randomUUID(),
    machineId: request.machineId,
    status: PreKitStatus.OPEN,
    createdAt: now,
    updatedAt: now,
    createdBy: request.userId,
    updatedBy: request.userId,
  }

  const items: PreKitItem[] = request.items.map(
    (item) =>
      new PreKitItem({
        ...item,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        createdBy: request.userId,
        updatedBy: request.userId,
        preKitId: preKit.id,
      })
  )

  return repo.create(new PreKit(preKit), items, request.userId) as Promise<CreatePreKitResponse>
}

export async function pickPreKit(repo: PreKitRepository, preKitId: string, userId: string): Promise<void> {
  await repo.updateStatus(preKitId, PreKitStatus.PICKED, userId)
}

export async function updatePreKitItems(repo: PreKitRepository, request: UpdatePreKitRequest): Promise<void> {
  const updatedItems: PreKitItem[] = request.items.map(
    (item) =>
      new PreKitItem({
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: request.userId,
        updatedBy: request.userId,
        preKitId: request.id,
        id: item.id ?? crypto.randomUUID(),
      })
  )

  await repo.updateItems(request.id, updatedItems, request.userId)

  // If pre-kit was PICKED, editing it means the picker needs to re-pick — reset to OPEN
  const preKit = await repo.findById(request.id)
  if (preKit && preKit.status === PreKitStatus.PICKED) {
    await repo.updateStatus(request.id, PreKitStatus.OPEN, request.userId)
  }
}

export async function deletePreKit(repo: PreKitRepository, preKitId: string): Promise<void> {
  await repo.delete(preKitId)
}

export interface RecalculatePreKitRequest {
  preKitId: string
  userId: string
  restockThreshold?: number
}

export interface RecalculatePreKitResponse {
  preKitId: string
  updated: boolean
  changes: {
    slotId: string
    slotCode: string
    productName: string
    oldQuantity: number
    newQuantity: number
    difference: number
  }[]
  totalItemsBefore: number
  totalItemsAfter: number
}

export async function recalculatePreKit(
  preKitRepo: PreKitRepository,
  slotRepo: SlotRepository,
  request: RecalculatePreKitRequest
): Promise<RecalculatePreKitResponse> {
  const { preKitId, userId, restockThreshold = 30 } = request

  const preKit = await preKitRepo.findById(preKitId)
  if (!preKit) throw new Error(`PreKit ${preKitId} not found`)

  if (preKit.status !== PreKitStatus.OPEN) {
    throw new Error(`Cannot recalculate pre-kit with status ${preKit.status}. Only OPEN pre-kits can be recalculated.`)
  }

  const currentItems = await preKitRepo.getItems(preKitId)
  const slots = await slotRepo.findByMachineId(preKit.machineId)

  const newItems: PreKitItem[] = []
  const changes: RecalculatePreKitResponse["changes"] = []
  let totalOldQuantity = 0
  let totalNewQuantity = 0

  for (const slot of slots) {
    const currentQuantity = slot.currentQuantity
    const capacity = slot.capacity || 10
    const percentageFull = (currentQuantity / capacity) * 100
    const existingItem = currentItems.find((item) => item.slotId === slot.id)
    const oldQuantity = existingItem?.quantity || 0

    if (percentageFull <= restockThreshold) {
      const quantityToRestock = capacity - currentQuantity
      if (quantityToRestock > 0) {
        newItems.push(
          new PreKitItem({
            id: existingItem?.id || crypto.randomUUID(),
            preKitId,
            productId: slot.productId ?? '',
            slotId: slot.id,
            quantity: quantityToRestock,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userId,
            updatedBy: userId,
          })
        )
        totalNewQuantity += quantityToRestock
        if (oldQuantity !== quantityToRestock) {
          changes.push({
            slotId: slot.id,
            slotCode: slot.labelCode,
            productName: "",
            oldQuantity,
            newQuantity: quantityToRestock,
            difference: quantityToRestock - oldQuantity,
          })
        }
      }
    }

    if (existingItem) totalOldQuantity += oldQuantity
  }

  await preKitRepo.updatePreKitItems(preKitId, newItems, userId)
  await preKitRepo.updateStatus(preKitId, PreKitStatus.OPEN, userId)

  return { preKitId, updated: changes.length > 0, changes, totalItemsBefore: totalOldQuantity, totalItemsAfter: totalNewQuantity }
}

export interface GeneratePreKitRequest {
  machineId: string
  userId: string
  routeStopId?: string
  scheduledDate?: Date
  restockThreshold?: number
}

export interface GeneratePreKitResponse {
  preKit: PublicPreKit
  items: PreKitItem[]
  totalItems: number
  estimatedRestockTime: number
}

export async function generatePreKitForMachine(
  preKitRepo: PreKitRepository,
  slotRepo: SlotRepository,
  machineRepo: VendingMachineRepository,
  request: GeneratePreKitRequest
): Promise<GeneratePreKitResponse> {
  const machine = await machineRepo.findById(request.machineId)
  if (!machine) throw new Error(`Machine ${request.machineId} not found`)

  const existingPreKits = await preKitRepo.findByMachineId(request.machineId)
  const openPreKit = existingPreKits.find((pk) => pk.status === PreKitStatus.OPEN)
  if (openPreKit) throw new Error(`Machine ${request.machineId} already has an open pre-kit`)

  const slots = await slotRepo.getSlotsWithProducts(request.machineId)
  if (slots.length === 0) throw new Error(`Machine ${request.machineId} has no configured slots`)

  const restockThreshold = request.restockThreshold ?? 30
  const now = new Date()
  const preKitItems: BasePreKitItem[] = []

  const preKit: BasePreKit = {
    id: crypto.randomUUID(),
    machineId: request.machineId,
    routeStopId: request.routeStopId,
    scheduledDate: request.scheduledDate,
    status: PreKitStatus.OPEN,
    createdAt: now,
    updatedAt: now,
    createdBy: request.userId,
    updatedBy: request.userId,
  }

  for (const slot of slots) {
    const currentQuantity = slot.currentQuantity || 0
    const capacity = slot.capacity || 10
    const percentageFull = (currentQuantity / capacity) * 100

    if (percentageFull <= restockThreshold) {
      const quantityToRestock = capacity - currentQuantity
      if (quantityToRestock > 0) {
        preKitItems.push({
          id: crypto.randomUUID(),
          preKitId: preKit.id,
          productId: slot.productId ?? '',
          slotId: slot.id,
          quantity: quantityToRestock,
          createdAt: now,
          updatedAt: now,
          createdBy: request.userId,
          updatedBy: request.userId,
        })
      }
    }
  }

  if (preKitItems.length === 0) {
    throw new Error(`Machine ${request.machineId} doesn't need restocking at ${restockThreshold}% threshold`)
  }

  const preKitEntity = new PreKit(preKit)
  const preKitItemEntities = preKitItems.map((item) => new PreKitItem(item))
  const createdPreKit = await preKitRepo.create(preKitEntity, preKitItemEntities, request.userId)

  const totalItems = preKitItems.reduce((sum, item) => sum + item.quantity, 0)
  const estimatedRestockTime = 5 + preKitItems.length * 2

  return { preKit: createdPreKit, items: preKitItemEntities, totalItems, estimatedRestockTime }
}

export interface GeneratePreKitsForRouteRequest {
  routeId: string
  userId: string
  scheduledDate?: Date
  restockThreshold?: number
  skipMachinesWithOpenPreKits?: boolean
}

export interface MachinePreKitResult {
  machineId: string
  locationId: string
  locationName?: string
  status: "generated" | "skipped" | "error"
  preKitId?: string
  totalItems?: number
  estimatedRestockTime?: number
  error?: string
}

export interface GeneratePreKitsForRouteResponse {
  routeId: string
  results: MachinePreKitResult[]
  totalPreKitsGenerated: number
  totalItemsToStock: number
  totalEstimatedTime: number
}

export async function generatePreKitsForRoute(
  preKitRepo: PreKitRepository,
  slotRepo: SlotRepository,
  machineRepo: VendingMachineRepository,
  routeRepo: RouteRepository,
  request: GeneratePreKitsForRouteRequest
): Promise<GeneratePreKitsForRouteResponse> {
  const route = await routeRepo.findByIdWithStops(request.routeId)
  if (!route) throw new Error(`Route ${request.routeId} not found`)

  const results: MachinePreKitResult[] = []
  let totalPreKitsGenerated = 0
  let totalItemsToStock = 0
  let totalEstimatedTime = 0

  for (const stop of route.stops) {
    if (!stop.vendingMachineIds || stop.vendingMachineIds.length === 0) continue

    for (const machineId of stop.vendingMachineIds) {
      try {
        if (request.skipMachinesWithOpenPreKits !== false) {
          const existingPreKits = await preKitRepo.findByMachineId(machineId)
          const hasOpenPreKit = existingPreKits.some((pk) => pk.status === "OPEN")
          if (hasOpenPreKit) {
            results.push({ machineId, locationId: stop.locationId, locationName: stop.locationName, status: "skipped", error: "Machine already has an open pre-kit" })
            continue
          }
        }

        const result = await generatePreKitForMachine(preKitRepo, slotRepo, machineRepo, {
          machineId,
          userId: request.userId,
          routeStopId: stop.id,
          scheduledDate: request.scheduledDate,
          restockThreshold: request.restockThreshold,
        })

        results.push({
          machineId,
          locationId: stop.locationId,
          locationName: stop.locationName,
          status: "generated",
          preKitId: result.preKit.id,
          totalItems: result.totalItems,
          estimatedRestockTime: result.estimatedRestockTime,
        })

        totalPreKitsGenerated++
        totalItemsToStock += result.totalItems
        totalEstimatedTime += result.estimatedRestockTime
      } catch (error) {
        results.push({
          machineId,
          locationId: stop.locationId,
          locationName: stop.locationName,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }
  }

  totalEstimatedTime += route.stops.length * 5

  return { routeId: request.routeId, results, totalPreKitsGenerated, totalItemsToStock, totalEstimatedTime }
}

export async function stockPreKit(
  preKitRepo: PreKitRepository,
  slotRepo: SlotRepository,
  inventoryRepo: InventoryRepository,
  inventoryTransactionRepo: InventoryTransactionRepository,
  preKitId: string,
  userId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const preKit = await preKitRepo.findById(preKitId)
    if (!preKit) return { success: false, error: "Pre-kit not found" }

    if (preKit.status !== PreKitStatus.PICKED) {
      return { success: false, error: "Pre-kit must be in PICKED status to be stocked: current status is " + preKit.status }
    }

    const items = await preKitRepo.getItems(preKitId)

    for (const item of items) {
      const slot = await slotRepo.findById(item.slotId)
      if (!slot) return { success: false, error: `Slot ${item.slotId} not found` }

      await slotRepo.updateSlotQuantity(item.slotId, slot.currentQuantity + item.quantity)

      const transaction = InventoryTransaction.create({
        productId: item.productId,
        organizationId,
        transactionType: "stock",
        quantity: -item.quantity,
        locationFrom: "storage",
        locationTo: `machine_${preKit.machineId}_slot_${item.slotId}`,
        referenceType: "prekit",
        referenceId: preKitId,
        notes: `Stocked ${item.quantity} units to machine ${preKit.machineId}, slot ${item.slotId}`,
        createdBy: userId,
        metadata: { preKitId, machineId: preKit.machineId, slotId: item.slotId },
      })

      await inventoryTransactionRepo.create(transaction)
      await inventoryRepo.transferStorageToMachines(item.productId, item.quantity, organizationId)
    }

    await preKitRepo.updateStatus(preKitId, PreKitStatus.STOCKED, userId)
    return { success: true }
  } catch (error) {
    console.error("Error stocking pre-kit:", error)
    return { success: false, error: "Failed to stock pre-kit" }
  }
}

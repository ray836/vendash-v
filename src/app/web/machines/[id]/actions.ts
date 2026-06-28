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
import * as RestockService from "@/domains/Inventory/RestockService"

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

// Re-exported from RestockService (the shared core) so existing UI imports keep working.
export type RestockSlotInfo = RestockService.RestockSlotInfo

/** Update a single slot's price and/or current quantity (Overview quick-edit panel). */
export async function updateSlot(
  slotId: string,
  fields: { price?: number; currentQuantity?: number }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  try {
    const slotRepo = new SlotRepository(db)
    const slot = await slotRepo.findById(slotId)
    if (!slot || slot.organizationId !== organizationId) {
      return { success: false, error: "Slot not found" }
    }
    await slotRepo.updateSlotFields(slotId, fields)
    return { success: true }
  } catch (error) {
    console.error("updateSlot:", error)
    return { success: false, error: "Failed to update slot" }
  }
}

export async function getRestockSlots(
  machineId: string
): Promise<{ success: boolean; slots: RestockSlotInfo[]; hasTelemetry: boolean; error?: string }> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  try {
    return await RestockService.getRestockSlots(
      {
        machineRepo: new VendingMachineRepository(db),
        slotRepo: new SlotRepository(db),
        productRepo: new ProductRepository(db),
      },
      organizationId,
      machineId
    )
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
): Promise<RestockService.RecordRestockResult> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  try {
    const result = await RestockService.recordRestockCounts(
      {
        machineRepo: new VendingMachineRepository(db),
        slotRepo: new SlotRepository(db),
        productRepo: new ProductRepository(db),
        inventoryRepo: new InventoryRepository(db),
        txRepo: new TransactionRepository(db),
      },
      organizationId,
      machineId,
      entries
    )

    if (result.success) {
      revalidatePath(`/web/machines/${machineId}`)
      revalidatePath("/web/products")
    }
    return result
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

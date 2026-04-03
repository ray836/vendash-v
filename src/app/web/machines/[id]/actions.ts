"use server"

import { db } from "@/infrastructure/database"
import { VendingMachineRepository } from "@/infrastructure/repositories/VendingMachineRepository"
import { SlotRepository } from "@/infrastructure/repositories/SlotRepository"
import { LocationRepository } from "@/infrastructure/repositories/LocationRepository"
import { PreKitRepository } from "@/infrastructure/repositories/PreKitRepository"
import { TransactionRepository } from "@/infrastructure/repositories/TransactionRepository"
import { InventoryRepository } from "@/infrastructure/repositories/InventoryRepository"
import * as VendingMachineService from "@/domains/VendingMachine/VendingMachineService"
import * as PreKitService from "@/domains/PreKit/PreKitService"
import * as TransactionService from "@/domains/Transaction/TransactionService"
import { CreatePreKitItemRequest, CreatePreKitRequest } from "@/domains/PreKit/schemas/CreatePreKitSchemas"
import { UpdatePreKitItemRequest, UpdatePreKitRequest } from "@/domains/PreKit/schemas/UpdatePreKitSchemas"
import { MachineWithSlotsDTO, MachineDetailDataDTO } from "@/domains/VendingMachine/schemas/vendingMachineDTOs"
import { auth } from "@/lib/auth"

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

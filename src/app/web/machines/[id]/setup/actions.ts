"use server"

import { ProductUseCase } from "@/core/use-cases/Product/ProductUseCase"
import { DrizzleProductRepository } from "@/infrastructure/repositories/drizzle-ProductRepo"
import { db } from "@/infrastructure/database"
import { SaveSlotsUseCase } from "@/core/use-cases/VendingMachine/SaveSlotsUseCase"
import { DrizzleSlotRepository } from "@/infrastructure/repositories/drizzle-SlotRepo"
import { PublicSlotDTO } from "@/core/domain/DTOs/slotDTOs"
import { DrizzleVendingMachineRepository } from "@/infrastructure/repositories/drizzle-VendingMachineRepo"
import { GetMachineWithSlotsUseCase } from "@/core/use-cases/VendingMachine/GetMachineWithSlotsUseCase"
import { VendingMachineUseCase } from "@/core/use-cases/VendingMachine/VendingMachineUseCase"

// get products for machine

export async function getOrgProducts() {
  const orgId = "1"
  const productRepo = new DrizzleProductRepository(db)
  const productUseCase = new ProductUseCase(productRepo)
  const orgProducts = await productUseCase.findByOrganizationId(orgId)
  return orgProducts
}

// export async function getSlots(machineId: string) {
//   const slotRepo = new DrizzleSlotRepository(db)
//   const slots = await slotRepo.getSlots(machineId)
//   return slots
// }

export async function getMachineWithSlots(machineId: string) {
  const machineRepo = new DrizzleVendingMachineRepository(db)
  const slotRepo = new DrizzleSlotRepository(db)
  const getMachineWithSlotsUseCase = new GetMachineWithSlotsUseCase(
    machineRepo,
    slotRepo
  )

  try {
    const result = await getMachineWithSlotsUseCase.execute(machineId)
    if (!result) {
      throw new Error("Machine not found")
    }
    return result
  } catch (error) {
    console.error("Failed to get machine with slots:", error)
    throw new Error("Failed to get machine configuration")
  }
}

export async function saveSlots(machineId: string, slots: PublicSlotDTO[]) {
  try {
    const slotRepo = new DrizzleSlotRepository(db)
    const machineRepo = new DrizzleVendingMachineRepository(db)
    const saveSlotsUseCase = new SaveSlotsUseCase(slotRepo, machineRepo)
    await saveSlotsUseCase.execute(machineId, slots)
    return { success: true }
  } catch (error) {
    console.error("Failed to save slots:", error)
    throw new Error("Failed to save machine configuration")
  }
}

export async function getMachine(machineId: string) {
  const machineRepo = new DrizzleVendingMachineRepository(db)
  const machineUseCase = new VendingMachineUseCase(machineRepo)
  const machine = await machineUseCase.getVendingMachine(machineId)
  return machine
}

export async function updateMachine(
  machineId: string,
  updates: { cardReaderId: string }
) {
  try {
    const machineRepo = new DrizzleVendingMachineRepository(db)
    const machineUseCase = new VendingMachineUseCase(machineRepo)

    await machineUseCase.updateVendingMachine(
      { cardReaderId: updates.cardReaderId },
      "1", // userId
      machineId
    )

    return { success: true }
  } catch (error) {
    console.error("Failed to update machine:", error)
    throw new Error("Failed to update machine configuration")
  }
}

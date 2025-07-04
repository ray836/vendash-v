"use server"

import { DrizzleProductRepository } from "@/infrastructure/repositories/DrizzleProductRepository"
import { db } from "@/infrastructure/database"
import { SaveSlotsUseCase } from "@/domains/Slot/use-cases/SaveSlotsUseCase"
import { DrizzleSlotRepository } from "@/infrastructure/repositories/DrizzleSlotRepository"
import { DrizzleVendingMachineRepository } from "@/infrastructure/repositories/DrizzleVendingMachineRepository"
import { DrizzleLocationRepository } from "@/infrastructure/repositories/DrizzleLocationRepository"
import { GetMachineWithSlotsUseCase } from "@/domains/VendingMachine/use-cases/GetMachineWithSlotsUseCase"
import { GetVendingMachineUseCase } from "@/domains/VendingMachine/use-cases/GetVendingMachineUseCase"
import { UpdateMachineCardReaderUseCase } from "@/domains/VendingMachine/use-cases/UpdateMachineCardReaderUseCase"
import { PublicVendingMachineDTO } from "@/domains/VendingMachine/schemas/vendingMachineDTOs"
import { PublicSlotDTO } from "@/domains/Slot/schemas/SlotSchemas"
import { GetOrgProductsUseCase } from "@/domains/Product/use-cases/GetOrgProducts"
import { UpdateVendingMachineInfoRequestDTO } from "@/domains/VendingMachine/schemas/UpdateVendingMachineInfoSchemas"
import { UpdateVendingMachineInfoUseCase } from "@/domains/VendingMachine/use-cases/UpdateVendingMachineInfoUseCase"
import { GetLocationsUseCase } from "@/domains/Location/use-cases/GetLocationsUseCase"

// get products for machine

export async function getOrgProducts() {
  const orgId = "1"
  const productRepo = new DrizzleProductRepository(db)
  // const productUseCase = new ProductUseCase(productRepo)
  const getOrgProductsUseCase = new GetOrgProductsUseCase(productRepo)
  const products = await getOrgProductsUseCase.execute(orgId)
  // const productsWithInventorySalesOrderData =
  //   await productUseCase.execute(products)
  // return productsWithInventorySalesOrderData
  return products
}

// export async function getSlots(machineId: string) {
//   const slotRepo = new DrizzleSlotRepository(db)
//   const slots = await slotRepo.getSlots(machineId)
//   return slots
// }

export async function getMachineWithSlots(machineId: string) {
  const machineRepo = new DrizzleVendingMachineRepository(db)
  const slotRepo = new DrizzleSlotRepository(db)
  const locationRepo = new DrizzleLocationRepository(db)
  const getMachineWithSlotsUseCase = new GetMachineWithSlotsUseCase(
    machineRepo,
    slotRepo,
    locationRepo
  )

  try {
    const result = await getMachineWithSlotsUseCase.execute(machineId)
    if (!result) {
      throw new Error("Machine not found")
    }
    console.log("got here result:::", result)
    return result
  } catch (error) {
    console.error("Failed to get machine with slots:", error)
    throw new Error("Failed to get machine configuration")
  }
}

export async function saveSlots(
  machineId: string,
  slots: PublicSlotDTO[],
  ccReaderId: string
) {
  try {
    const slotRepo = new DrizzleSlotRepository(db)
    const machineRepo = new DrizzleVendingMachineRepository(db)
    const saveSlotsUseCase = new SaveSlotsUseCase(slotRepo, machineRepo)
    await saveSlotsUseCase.execute({
      machineId,
      slots,
      userId: "1",
      ccReaderId,
      organizationId: "1",
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to save slots:", error)
    throw new Error("Failed to save machine configuration")
  }
}

export async function getMachine(machineId: string) {
  const machineRepo = new DrizzleVendingMachineRepository(db)
  const getVendingMachineUseCase = new GetVendingMachineUseCase(machineRepo)
  const machine = await getVendingMachineUseCase.execute(machineId)
  console.log("machineId", machineId)
  console.log("machine:", machine)
  return machine
}

export async function updateMachine(
  machineId: string,
  updates: { cardReaderId?: string }
) {
  try {
    const machineRepo = new DrizzleVendingMachineRepository(db)
    const slotRepo = new DrizzleSlotRepository(db)
    const updateMachineCardReaderUseCase = new UpdateMachineCardReaderUseCase(
      machineRepo,
      slotRepo
    )

    const updatedMachine: PublicVendingMachineDTO =
      await updateMachineCardReaderUseCase.execute(
        machineId,
        updates.cardReaderId || "",
        "1" // userId
      )
    console.log("updated machine", updatedMachine)

    return updatedMachine
  } catch (error) {
    console.error("Failed to update machine:", error)
    throw new Error("Failed to update machine configuration")
  }
}

export async function updateMachineInfo(
  id: string,
  updateData: UpdateVendingMachineInfoRequestDTO
) {
  try {
    const machineRepo = new DrizzleVendingMachineRepository(db)
    const updateVendingMachineInfoUseCase = new UpdateVendingMachineInfoUseCase(
      machineRepo
    )
    const result = await updateVendingMachineInfoUseCase.execute(id, updateData)
    return JSON.stringify({
      success: true,
      data: result,
    })
  } catch (error) {
    return JSON.stringify({
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
      data: null,
    })
  }
}

export async function getLocationsServer() {
  const repo = new DrizzleLocationRepository(db)
  const useCase = new GetLocationsUseCase(repo)
  // Use your actual org ID here
  const orgId = "1"
  return await useCase.execute(orgId)
}

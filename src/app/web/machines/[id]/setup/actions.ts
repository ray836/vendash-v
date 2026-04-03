"use server"

import { db } from "@/infrastructure/database"
import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import { SlotRepository } from "@/infrastructure/repositories/SlotRepository"
import { VendingMachineRepository } from "@/infrastructure/repositories/VendingMachineRepository"
import { LocationRepository } from "@/infrastructure/repositories/LocationRepository"
import * as VendingMachineService from "@/domains/VendingMachine/VendingMachineService"
import * as ProductService from "@/domains/Product/ProductService"
import * as SlotService from "@/domains/Slot/SlotService"
import * as LocationService from "@/domains/Location/LocationService"
import { PublicSlotDTO } from "@/domains/Slot/schemas/SlotSchemas"
import { UpdateVendingMachineInfoRequestDTO } from "@/domains/VendingMachine/schemas/UpdateVendingMachineInfoSchemas"
import { auth } from "@/lib/auth"

export async function getOrgProducts() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const productRepo = new ProductRepository(db)
  return ProductService.getOrgProducts(productRepo, organizationId)
}

export async function getMachineWithSlots(machineId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const machineRepo = new VendingMachineRepository(db)
  const slotRepo = new SlotRepository(db)
  const locationRepo = new LocationRepository(db)

  try {
    const result = await VendingMachineService.getMachineWithSlots(machineRepo, slotRepo, locationRepo, machineId)
    if (!result) throw new Error("Machine not found")
    console.log("got here result:::", result)
    return result
  } catch (error) {
    console.error("Failed to get machine with slots:", error)
    throw new Error("Failed to get machine configuration")
  }
}

export async function saveSlots(machineId: string, slots: PublicSlotDTO[], ccReaderId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const slotRepo = new SlotRepository(db)
    const machineRepo = new VendingMachineRepository(db)
    await SlotService.saveSlots(slotRepo, machineRepo, {
      machineId,
      slots,
      userId: session.user.id,
      ccReaderId,
      organizationId,
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to save slots:", error)
    throw new Error("Failed to save machine configuration")
  }
}

export async function getMachine(machineId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const machineRepo = new VendingMachineRepository(db)
  const machine = await VendingMachineService.getMachine(machineRepo, machineId)
  console.log("machineId", machineId)
  console.log("machine:", machine)
  return machine
}

export async function updateMachine(machineId: string, updates: { cardReaderId?: string }) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const machineRepo = new VendingMachineRepository(db)
    const slotRepo = new SlotRepository(db)
    const updatedMachine = await VendingMachineService.updateMachineCardReader(
      machineRepo,
      slotRepo,
      machineId,
      updates.cardReaderId || "",
      session.user.id
    )
    console.log("updated machine", updatedMachine)
    return updatedMachine
  } catch (error) {
    console.error("Failed to update machine:", error)
    throw new Error("Failed to update machine configuration")
  }
}

export async function updateMachineInfo(id: string, updateData: UpdateVendingMachineInfoRequestDTO) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const machineRepo = new VendingMachineRepository(db)
    const result = await VendingMachineService.updateMachineInfo(machineRepo, id, updateData)
    return JSON.stringify({ success: true, data: result })
  } catch (error) {
    return JSON.stringify({ success: false, error: error instanceof Error ? error.message : "An unknown error occurred", data: null })
  }
}

export async function getLocationsServer() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const locationRepo = new LocationRepository(db)
  return LocationService.getLocations(locationRepo, organizationId)
}

import { VendingMachine } from "./entities/VendingMachine"
import { VendingMachineRepository } from "@/infrastructure/repositories/VendingMachineRepository"
import { LocationRepository } from "@/infrastructure/repositories/LocationRepository"
import { SlotRepository } from "@/infrastructure/repositories/SlotRepository"
import { Slot } from "@/domains/Slot/entities/Slot"
import {
  PublicVendingMachineDTO,
  MachineWithSlotsDTO,
} from "./schemas/vendingMachineDTOs"
import { CreateVendingMachineRequestDTO } from "./schemas/CreateVendingMachineSchemas"
import { UpdateVendingMachineInfoRequestDTO } from "./schemas/UpdateVendingMachineInfoSchemas"
import { UpdateVendingMachineStatusRequestDTO } from "./schemas/UpdateVendingMachineStatusSchemas"

export async function getMachines(
  machineRepo: VendingMachineRepository,
  locationRepo: LocationRepository,
  organizationId: string
): Promise<PublicVendingMachineDTO[]> {
  const machines = await machineRepo.findByOrganizationId(organizationId)
  const locationIds = [...new Set(machines.map((m) => m.locationId))]
  const locations = await Promise.all(locationIds.map((id) => locationRepo.findById(id)))
  const locationMap = new Map<string, string>()
  locations.forEach((loc) => { if (loc) locationMap.set(loc.id, loc.name) })

  return machines.map((machine) => ({
    id: machine.id,
    type: machine.type,
    locationId: machine.locationId,
    locationName: locationMap.get(machine.locationId) || undefined,
    model: machine.model,
    notes: machine.notes,
    status: machine.status,
    organizationId: machine.organizationId,
    cardReaderId: machine.cardReaderId,
    createdAt: machine.createdAt,
    updatedAt: machine.updatedAt,
  }))
}

export async function getMachine(
  machineRepo: VendingMachineRepository,
  id: string
): Promise<PublicVendingMachineDTO | null> {
  const machine = await machineRepo.findById(id)
  if (!machine) return null
  return PublicVendingMachineDTO.parse(machine)
}

export async function getMachineWithSlots(
  machineRepo: VendingMachineRepository,
  slotRepo: SlotRepository,
  locationRepo: LocationRepository,
  machineId: string
): Promise<MachineWithSlotsDTO | null> {
  const machine = await machineRepo.findById(machineId)
  if (!machine) return null

  const slots = await slotRepo.getSlotsWithProducts(machineId)
  const location = await locationRepo.findById(machine.locationId)
  const locationName = location?.name || undefined

  const hasSlots = slots.length > 0
  const hasCardReader = !!machine.cardReaderId
  const setupStatus = hasSlots && hasCardReader ? "complete" : "incomplete"
  const setupPercentage = ((hasSlots ? 1 : 0) + (hasCardReader ? 1 : 0)) * 50

  return {
    id: machine.id,
    type: machine.type,
    locationId: machine.locationId,
    locationName,
    model: machine.model,
    notes: machine.notes,
    status: machine.status,
    organizationId: machine.organizationId,
    cardReaderId: machine.cardReaderId,
    slots,
    createdAt: machine.createdAt,
    updatedAt: machine.updatedAt,
    setup: { status: setupStatus, percentage: setupPercentage },
    lastRestocked: undefined,
    lastMaintenance: undefined,
  }
}

export async function createMachine(
  machineRepo: VendingMachineRepository,
  data: CreateVendingMachineRequestDTO
): Promise<VendingMachine> {
  const machine = VendingMachine.create(data)
  return await machineRepo.create(machine)
}

export async function updateMachineStatus(
  machineRepo: VendingMachineRepository,
  id: string,
  data: UpdateVendingMachineStatusRequestDTO
): Promise<PublicVendingMachineDTO> {
  const existing = await machineRepo.findById(id)
  if (!existing) throw new Error("Vending machine not found")
  const updated = existing.updateStatus(data.status)
  // Note: status update doesn't persist via update() due to current repo - return DTO directly
  return updated.toPublicDTO()
}

export async function updateMachineCardReader(
  machineRepo: VendingMachineRepository,
  slotRepo: SlotRepository,
  machineId: string,
  cardReaderId: string,
  userId: string
): Promise<PublicVendingMachineDTO> {
  const machine = await machineRepo.findById(machineId)
  if (!machine) throw new Error("Machine not found")

  const updated = machine.update({ cardReaderId })
  const saved = await machineRepo.update(updated)

  const slots = await slotRepo.findByMachineId(machineId)
  for (const slot of slots) {
    const updatedSlot = Slot.create({ ...slot.toJSON(), cardReaderId, updatedBy: userId })
    await slotRepo.update(updatedSlot)
  }

  return saved.toPublicDTO()
}

export async function updateMachineInfo(
  machineRepo: VendingMachineRepository,
  id: string,
  updateData: UpdateVendingMachineInfoRequestDTO
): Promise<PublicVendingMachineDTO> {
  const existing = await machineRepo.findById(id)
  if (!existing) throw new Error(`Vending machine with id ${id} not found`)
  const updated = await machineRepo.updateInfo(id, updateData)
  return updated.toPublicDTO()
}

export async function deleteMachine(
  machineRepo: VendingMachineRepository,
  id: string
): Promise<void> {
  const existing = await machineRepo.findById(id)
  if (!existing) throw new Error("Vending machine not found")
  await machineRepo.delete(id)
}

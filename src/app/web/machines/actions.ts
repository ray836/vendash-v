"use server"

import { db } from "@/infrastructure/database"
import { VendingMachineRepository } from "@/infrastructure/repositories/VendingMachineRepository"
import { LocationRepository } from "@/infrastructure/repositories/LocationRepository"
import * as VendingMachineService from "@/domains/VendingMachine/VendingMachineService"
import { MachineStatus, MachineType } from "@/domains/VendingMachine/entities/VendingMachine"
import { auth } from "@/lib/auth"

export async function createMachine(machine: {
  type: MachineType
  locationId: string
  model: string
  notes?: string
  cardReaderId?: string
}) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const machineRepo = new VendingMachineRepository(db)
  const result = await VendingMachineService.createMachine(machineRepo, {
    type: machine.type,
    locationId: machine.locationId,
    model: machine.model,
    notes: machine.notes,
    organizationId,
    cardReaderId: machine.cardReaderId,
  })
  return JSON.stringify(result)
}

export async function getMachines() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const machineRepo = new VendingMachineRepository(db)
    const locationRepo = new LocationRepository(db)
    const machines = await VendingMachineService.getMachines(machineRepo, locationRepo, organizationId)
    return JSON.stringify(machines)
  } catch (error) {
    console.error("Failed to fetch machines:", error)
    throw new Error("Failed to fetch machines")
  }
}

export async function updateMachineStatus(id: string, status: MachineStatus) {
  try {
    const machineRepo = new VendingMachineRepository(db)
    const result = await VendingMachineService.updateMachineStatus(machineRepo, id, { status })
    return JSON.stringify({ success: true, data: result })
  } catch (error) {
    return JSON.stringify({ success: false, error: error instanceof Error ? error.message : "An unknown error occurred", data: null })
  }
}

export async function deleteMachine(id: string) {
  const machineRepo = new VendingMachineRepository(db)
  await VendingMachineService.deleteMachine(machineRepo, id)
}

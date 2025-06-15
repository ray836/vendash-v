"use server"

import { CreateVendingMachineUseCase } from "@/domains/VendingMachine/use-cases/CreateVendingMachineUseCase"
import { DeleteVendingMachineUseCase } from "@/domains/VendingMachine/use-cases/DeleteVendingMachineUseCase"
import { GetVendingMachinesUseCase } from "@/domains/VendingMachine/use-cases/GetVendingMachinesUseCase"
import { UpdateVendingMachineStatusUseCase } from "@/domains/VendingMachine/use-cases/UpdateVendingMachineStatusUseCase"
import { db } from "@/infrastructure/database"
import { DrizzleVendingMachineRepository } from "@/infrastructure/repositories/DrizzleVendingMachineRepository"
import {
  MachineStatus,
  MachineType,
} from "@/domains/VendingMachine/entities/VendingMachine"

const organizationId = "1"

// Cache the repository instance
const repository = new DrizzleVendingMachineRepository(db)

export async function createMachine(machine: {
  type: MachineType
  locationId: string
  model: string
  notes?: string
  cardReaderId?: string
}) {
  const createVendingMachineUseCase = new CreateVendingMachineUseCase(
    repository
  )
  const result = await createVendingMachineUseCase.execute({
    type: machine.type,
    locationId: machine.locationId,
    model: machine.model,
    notes: machine.notes,
    organizationId: organizationId,
    cardReaderId: machine.cardReaderId,
  })
  return JSON.stringify(result)
}

export async function getMachines() {
  try {
    const getVendingMachinesUseCase = new GetVendingMachinesUseCase(repository)
    const machines = await getVendingMachinesUseCase.execute(organizationId)
    return JSON.stringify(machines)
  } catch (error) {
    console.error("Failed to fetch machines:", error)
    throw new Error("Failed to fetch machines")
  }
}

export async function updateMachineStatus(id: string, status: MachineStatus) {
  try {
    const updateVendingMachineStatusUseCase =
      new UpdateVendingMachineStatusUseCase(repository)
    const result = await updateVendingMachineStatusUseCase.execute(id, {
      status,
    })
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

export async function deleteMachine(id: string) {
  const deleteVendingMachineUseCase = new DeleteVendingMachineUseCase(
    repository
  )
  await deleteVendingMachineUseCase.execute(id)
}

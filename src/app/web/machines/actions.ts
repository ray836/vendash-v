"use server"

import { DrizzleVendingMachineRepository } from "@/infrastructure/repositories/drizzle-VendingMachineRepo"
import { VendingMachineUseCase } from "@/core/use-cases/VendingMachine/VendingMachineUseCase"
import { db } from "@/infrastructure/database"
import { CreateVendingMachineRequestDTO } from "@/core/domain/DTOs/vendingMachineDTOs"
const organizationId = "1"

export async function createMachine(machine: CreateVendingMachineRequestDTO) {
  const drizzleVendingMachineRepository = new DrizzleVendingMachineRepository(
    db
  )
  const vendingMachineUseCase = new VendingMachineUseCase(
    drizzleVendingMachineRepository
  )
  const userId = "1" // TODO: Get user id from session
  const result = await vendingMachineUseCase.createVendingMachine(
    machine,
    userId
  )
  return JSON.stringify(result)
}

export async function getMachines() {
  try {
    const vendingMachineRepo = new DrizzleVendingMachineRepository(db)
    const vendingMachineUseCase = new VendingMachineUseCase(vendingMachineRepo)
    const machines = await vendingMachineUseCase.getVendingMachines(
      organizationId
    )
    console.log(machines)
    return JSON.stringify(machines)
  } catch (error) {
    console.error("Failed to fetch machines:", error)
    throw new Error("Failed to fetch machines")
  }
}

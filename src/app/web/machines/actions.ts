"use server"

import { DrizzleVendingMachineRepository } from "@/infrastructure/repositories/drizzle-VendingMachineRepo"
import { VendingMachineUseCase } from "@/core/use-cases/VendingMachine/VendingMachineUseCase"
import { CreateVendingMachineDTO } from "@/core/use-cases/VendingMachine/dtos/CreateVendingMachineDTO"
import { db } from "@/infrastructure/database"
const organizationId = "1"

export async function createMachine(machine: CreateVendingMachineDTO) {
  const drizzleVendingMachineRepository = new DrizzleVendingMachineRepository(
    db
  )
  const vendingMachineUseCase = new VendingMachineUseCase(
    drizzleVendingMachineRepository
  )
  const result = await vendingMachineUseCase.createVendingMachine(machine)
  return JSON.stringify(result)
}

export async function getMachines() {
  const drizzleVendingMachineRepository = new DrizzleVendingMachineRepository(
    db
  )
  const vendingMachineUseCase = new VendingMachineUseCase(
    drizzleVendingMachineRepository
  )
  return await vendingMachineUseCase.getVendingMachines(organizationId)
}

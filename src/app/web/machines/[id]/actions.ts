"use server"
import {
  GetMachineWithSlotsUseCase,
  MachineWithSlotsDTO,
} from "@/core/use-cases/VendingMachine/GetMachineWithSlotsUseCase"
import { DrizzleVendingMachineRepository } from "@/infrastructure/repositories/drizzle-VendingMachineRepo"
import { DrizzleSlotRepository } from "@/infrastructure/repositories/drizzle-SlotRepo"
import { db } from "@/infrastructure/database"

export async function getMachineWithSlots(machineId: string) {
  const machineRepo = new DrizzleVendingMachineRepository(db)
  const slotRepo = new DrizzleSlotRepository(db)
  const getMachineWithSlotsUseCase = new GetMachineWithSlotsUseCase(
    machineRepo,
    slotRepo
  )

  try {
    const result: MachineWithSlotsDTO | null =
      await getMachineWithSlotsUseCase.execute(machineId)
    if (!result) {
      throw new Error("Machine not found")
    }
    console.log(result)
    console.log("%%%%%")
    return result
  } catch (error) {
    console.error("Failed to get machine with slots:", error)
    throw new Error("Failed to get machine configuration")
  }
}

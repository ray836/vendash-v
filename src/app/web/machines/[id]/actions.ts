"use server"
import { GetMachineWithSlotsUseCase } from "@/domains/VendingMachine/use-cases/GetMachineWithSlotsUseCase"
import { DrizzleVendingMachineRepository } from "@/infrastructure/repositories/DrizzleVendingMachineRepository"
import { DrizzleSlotRepository } from "@/infrastructure/repositories/DrizzleSlotRepository"
import { db } from "@/infrastructure/database"
import { DrizzlePreKitRepository } from "@/infrastructure/repositories/DrizzlePreKitRepository"
import { CreatePreKitUseCase } from "@/domains/PreKit/use-cases/CreatePreKitUseCase"
import { GetMachinePreKitUseCase } from "@/domains/PreKit/use-cases/GetMachinePreKitUseCase"
import { DrizzleProductRepository } from "@/infrastructure/repositories/DrizzleProductRepository"
import { UpdatePreKitItemsUseCase } from "@/domains/PreKit/use-cases/UpdatePreKitItemsUseCase"
import { CreatePreKitItemRequest } from "@/domains/PreKit/schemas/CreatePreKitSchemas"
import { CreatePreKitRequest } from "@/domains/PreKit/schemas/CreatePreKitSchemas"
import { GetMachinePreKitRequest } from "@/domains/PreKit/schemas/GetMachinePreKitUseCase"
import {
  UpdatePreKitItemRequest,
  UpdatePreKitRequest,
} from "@/domains/PreKit/schemas/UpdatePreKitSchemas"
import {
  MachineWithSlotsDTO,
  MachineDetailDataDTO,
} from "@/domains/VendingMachine/schemas/vendingMachineDTOs"
import { GetTransactionsForMachineUseCase } from "@/domains/Transaction/use-cases/GetTransactionsForMachineUseCase"
import { DrizzleTransactionRepository } from "@/infrastructure/repositories/DrizzleTransactionRepository"

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

    // Wrap the result in an object with a machine property
    return {
      machine: result,
      slots: result.slots,
      revenue: {
        daily: 0, // TODO: Implement revenue tracking
        weekly: 0,
        monthly: 0,
      },
      setup: result.setup,
      lastRestocked: result.lastRestocked,
      lastMaintenance: result.lastMaintenance,
      alerts: [], // TODO: Implement alerts tracking
    } as MachineDetailDataDTO
  } catch (error) {
    console.error("Failed to get machine with slots:", error)
    throw new Error("Failed to get machine configuration")
  }
}

export async function createPreKit(
  machineId: string,
  items: CreatePreKitItemRequest[]
) {
  try {
    const preKitRepository = new DrizzlePreKitRepository(db)
    const createPreKitUseCase = new CreatePreKitUseCase(preKitRepository)

    const request: CreatePreKitRequest = {
      machineId,
      userId: "1", // TODO: Get actual user ID from session
      items: items.map((item) => ({
        ...item,
        preKitId: "", // This will be set by the use case
      })),
    }

    const result = await createPreKitUseCase.execute(request)
    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to create pre-kit:", error)
    return { success: false, error: "Failed to create pre-kit" }
  }
}

export async function getMachinePreKit(machineId: string) {
  try {
    const productRepository = new DrizzleProductRepository(db)
    const preKitRepository = new DrizzlePreKitRepository(db)
    const getMachinePreKitUseCase = new GetMachinePreKitUseCase(
      preKitRepository,
      productRepository
    )
    const request: GetMachinePreKitRequest = {
      machineId,
    }

    const result = await getMachinePreKitUseCase.execute(request)
    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to get machine pre-kit:", error)
    return { success: false, error: "Failed to get machine pre-kit" }
  }
}

export async function updatePreKitItems(
  preKitId: string,
  items: UpdatePreKitItemRequest[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const preKitRepository = new DrizzlePreKitRepository(db)
    const updatePreKitItemsUseCase = new UpdatePreKitItemsUseCase(
      preKitRepository
    )

    const request: UpdatePreKitRequest = {
      id: preKitId,
      userId: "1", // TODO: Get actual user ID from session
      items,
    }

    await updatePreKitItemsUseCase.execute(request)
    return { success: true }
  } catch (error) {
    console.error("Failed to update pre-kit items:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function getMachineTransactions(
  machineId: string,
  startDate: Date,
  endDate: Date
) {
  console.log("startDate", startDate)
  console.log("endDate", endDate)
  const transactionRepository = new DrizzleTransactionRepository(db)
  const getTransactionsForMachineUseCase = new GetTransactionsForMachineUseCase(
    transactionRepository
  )

  try {
    const result = await getTransactionsForMachineUseCase.execute(
      machineId,
      startDate,
      endDate
    )
    console.log("result", result)
    console.log("99999999999  ")
    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching machine transactions:", error)
    return { success: false, error: "Failed to fetch transactions" }
  }
}

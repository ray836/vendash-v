"use server"
import {
  GetMachineWithSlotsUseCase,
  MachineWithSlotsDTO,
} from "@/core/use-cases/VendingMachine/GetMachineWithSlotsUseCase"
import { DrizzleVendingMachineRepository } from "@/infrastructure/repositories/drizzle-VendingMachineRepo"
import { DrizzleSlotRepository } from "@/infrastructure/repositories/drizzle-SlotRepo"
import { db } from "@/infrastructure/database"
import { PreKitRepository } from "@/infrastructure/repositories/PreKitRepository"
import {
  PreKitCreateRequestDTO,
  PreKitItemCreateRequestDTO,
} from "@/core/domain/DTOs/prekitDTOs"
import { CreatePreKitUseCase } from "@/core/use-cases/PreKit/CreatePreKitUseCase"
import { GetMachinePreKitUseCase } from "@/core/use-cases/PreKit/GetMachinePreKitUseCase"
import { DrizzleProductRepository } from "@/infrastructure/repositories/drizzle-ProductRepo"
import { UpdatePreKitItemsUseCase } from "@/core/use-cases/PreKit/UpdatePreKitItemsUseCase"
import {
  UpdatePreKitItemsRequestDTO,
  PreKitItemUpdateRequestDTO,
} from "@/core/domain/DTOs/prekitDTOs"

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

export async function createPreKit(
  machineId: string,
  items: PreKitItemCreateRequestDTO[]
) {
  try {
    const preKitRepository = new PreKitRepository()
    const createPreKitUseCase = new CreatePreKitUseCase(preKitRepository)

    const request: PreKitCreateRequestDTO = {
      machineId,
      items: items.map((item) => ({
        ...item,
        preKitId: "", // This will be set by the use case
      })),
    }

    const result = await createPreKitUseCase.execute(request, "1") // TODO: Get actual user ID from session
    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to create pre-kit:", error)
    return { success: false, error: "Failed to create pre-kit" }
  }
}

export async function getMachinePreKit(machineId: string) {
  try {
    const preKitRepository = new PreKitRepository()
    const productRepository = new DrizzleProductRepository(db)
    const getMachinePreKitUseCase = new GetMachinePreKitUseCase(
      preKitRepository,
      productRepository
    )

    const result = await getMachinePreKitUseCase.execute(machineId)
    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to get machine pre-kit:", error)
    return { success: false, error: "Failed to get machine pre-kit" }
  }
}

export async function updatePreKitItems(
  preKitId: string,
  items: PreKitItemUpdateRequestDTO[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const preKitRepository = new PreKitRepository()
    const updatePreKitItemsUseCase = new UpdatePreKitItemsUseCase(
      preKitRepository
    )

    const request: UpdatePreKitItemsRequestDTO = {
      preKitId,
      items,
    }

    await updatePreKitItemsUseCase.execute(request, "1")
    return { success: true }
  } catch (error) {
    console.error("Failed to update pre-kit items:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

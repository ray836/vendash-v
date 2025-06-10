"use server"

import { GetOrgPreKitsUseCase } from "@/domains/PreKit/use-cases/GetOrgPreKitsUseCase"
import { DrizzlePreKitRepository } from "@/infrastructure/repositories/DrizzlePreKitRepository"
import { db } from "@/infrastructure/database"
import { PickPreKitUseCase } from "@/domains/PreKit/use-cases/PickPreKitUseCase"
import { StockPreKitUseCase } from "@/domains/Stocking/use-cases/StockPreKitUseCase"
import { DrizzleInventoryRepository } from "@/infrastructure/repositories/DrizzleInventoryRepository"
import { DrizzleSlotRepository } from "@/infrastructure/repositories/DrizzleSlotRepository"

export async function getOrgPreKits(orgId: string) {
  const preKitRepository = new DrizzlePreKitRepository(db)
  const getOrgPreKitsUseCase = new GetOrgPreKitsUseCase(preKitRepository)

  try {
    const preKits = await getOrgPreKitsUseCase.execute(orgId)
    return { success: true, data: preKits }
  } catch (error) {
    console.error("Error fetching organization pre-kits:", error)
    return { success: false, error: "Failed to fetch pre-kits" }
  }
}

export async function pickPreKit(preKitId: string) {
  try {
    const preKitRepository = new DrizzlePreKitRepository(db)
    const pickPreKitUseCase = new PickPreKitUseCase(preKitRepository)

    await pickPreKitUseCase.execute(preKitId, "1") // TODO: Get actual user ID from session
    return { success: true }
  } catch (error) {
    console.error("Failed to pick pre-kit:", error)
    return { success: false, error: "Failed to pick pre-kit" }
  }
}

export async function stockPreKit(preKitId: string) {
  try {
    const preKitRepository = new DrizzlePreKitRepository(db)
    const slotRepository = new DrizzleSlotRepository(db)
    const inventoryRepository = new DrizzleInventoryRepository(db)

    const stockPreKitUseCase = new StockPreKitUseCase({
      preKitRepository,
      slotRepository,
      inventoryRepository,
    })

    const result = await stockPreKitUseCase.execute(preKitId, "1") // TODO: Pass actual user ID
    console.log(result)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true }
  } catch (error) {
    console.error("Error stocking pre-kit:", error)
    return { success: false, error: "Failed to stock pre-kit" }
  }
}

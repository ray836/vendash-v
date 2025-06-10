"use server"

import { GetTransactionGraphDataUseCase } from "@/domains/Transaction/use-cases/GetTransactionGraphDataUseCase"
import { DrizzleTransactionRepository } from "@/infrastructure/repositories/DrizzleTransactionRepository"
import { db } from "@/infrastructure/database"
import { GroupByType } from "@/domains/Transaction/schemas/GetTransactionGraphDataSchemas"
export async function getTransactionGraphData(groupedBy: string) {
  const transactionRepository = new DrizzleTransactionRepository(db)
  const getTransactionGraphDataUseCase = new GetTransactionGraphDataUseCase(
    transactionRepository
  )
  try {
    const start =
      groupedBy === "day" ? new Date("2024-12-01") : new Date("2025-01-01")
    const result = await getTransactionGraphDataUseCase.execute({
      organizationId: "1",
      groupedBy: groupedBy as GroupByType,
      startDate: start,
      endDate: new Date(),
    })
    console.log("result", result)
    console.log("&&&&&&")
    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

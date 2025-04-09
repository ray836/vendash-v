"use server"
import { GetOrgTransactionsUseCase } from "@/core/use-cases/Transaction/getOrgTransactionsUseCase"
import { DrizzleTransactionRepo } from "@/infrastructure/repositories/drizzle-TransactionRepo"
import { db } from "@/infrastructure/database"
import { PublicTransactionDataDTO } from "@/core/domain/DTOs/transactionDTOs"
export async function getOrgTransactions(): Promise<
  PublicTransactionDataDTO[]
> {
  const organizationId = "1"
  const transactions = await new GetOrgTransactionsUseCase(
    new DrizzleTransactionRepo(db)
  ).execute(organizationId)
  return transactions
}

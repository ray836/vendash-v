"use server"
import { GetOrgTransactionsUseCase } from "@/domains/Transaction/use-cases/GetOrgTransactionsUseCase"
import { DrizzleTransactionRepository } from "@/infrastructure/repositories/DrizzleTransactionRepository"
import { db } from "@/infrastructure/database"
import { PublicTransactionWithItemsAndProductDTO } from "@/domains/Transaction/schemas/TransactionSchemas"

export async function getOrgTransactions(): Promise<
  PublicTransactionWithItemsAndProductDTO[]
> {
  const organizationId = "1"
  const transactions = await new GetOrgTransactionsUseCase(
    new DrizzleTransactionRepository(db)
  ).execute(organizationId)
  return transactions
}

"use server"

import { db } from "@/infrastructure/database"
import { TransactionRepository } from "@/infrastructure/repositories/TransactionRepository"
import * as TransactionService from "@/domains/Transaction/TransactionService"
import { PublicTransactionWithItemsAndProductDTO } from "@/domains/Transaction/schemas/TransactionSchemas"
import { GroupByType } from "@/domains/Transaction/schemas/GetTransactionGraphDataSchemas"
import { auth } from "@/lib/auth"

export async function getOrgTransactions(): Promise<PublicTransactionWithItemsAndProductDTO[]> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const repo = new TransactionRepository(db)
  return TransactionService.getOrgTransactions(repo, organizationId)
}

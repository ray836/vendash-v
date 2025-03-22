import {
  BaseTransactionDTO,
  TransactionItemDTOType,
} from "@/core/domain/DTOs/transactionDTOs"
import { Transaction } from "@/core/domain/entities/Transaction"
import { TransactionRepository } from "@/core/domain/interfaces/TransactionRepository"
import { db } from "@/infrastructure/database"
import { transactions } from "@/infrastructure/database/schema"
import { eq } from "drizzle-orm"

export class DrizzleTransactionRepo implements TransactionRepository {
  constructor(private readonly database: typeof db) {}
  async findByOrganizationId(organizationId: string): Promise<Transaction[]> {
    const transactionData = await this.database.query.transactions.findMany({
      where: eq(transactions.organizationId, organizationId),
      with: {
        transactionItems: true,
      },
    })
    console.log("transactionData", transactionData)
    console.log("-----------")
    return transactionData.map((transaction) => {
      return new Transaction({
        id: transaction.id,
        createdAt: transaction.createdAt,
        organizationId: transaction.organizationId,
        transactionType: transaction.transactionType,
        total: Number(transaction.total),
        last4CardDigits: transaction.last4CardDigits,
        items: (
          transaction.transactionItems as {
            id: string
            productId: string
            transactionId: string
            quantity: number
            salePrice: string
          }[]
        ).map((item) => {
          return {
            productId: item.productId,
            quantity: item.quantity,
            salePrice: Number(item.salePrice),
          } as TransactionItemDTOType
        }),
      } as BaseTransactionDTO)
    })
  }
}

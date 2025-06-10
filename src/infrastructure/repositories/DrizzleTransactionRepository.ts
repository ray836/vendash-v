import { and, eq, gte, lte, desc } from "drizzle-orm"
import {
  transactions,
  vendingMachines,
  transactionItems,
  products,
} from "@/infrastructure/database/schema"
import { Transaction } from "@/domains/Transaction/entities/Transaction"
import { ITransactionRepository } from "@/domains/Transaction/repositories/ITransactionRepository"
import { db } from "@/infrastructure/database"
import {
  BaseTransactionDTO,
  PublicTransactionWithItemsAndProductDTO,
} from "@/domains/Transaction/schemas/TransactionSchemas"
import { BaseTransactionItemDTO } from "@/domains/Transaction/schemas/TransactionItemSchemas"
import { BaseProductDTO } from "@/domains/Product/DTOs/productDTOs"

export class DrizzleTransactionRepository implements ITransactionRepository {
  constructor(private readonly database: typeof db) {}
  async findByOrganizationId(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    const results = await this.database.query.transactions.findMany({
      where: and(
        eq(transactions.organizationId, organizationId),
        gte(transactions.createdAt, startDate),
        lte(transactions.createdAt, endDate)
      ),
      with: {
        transactionItems: true,
      },
    })
    return results.map(this.toEntity)
  }

  async findByOrganizationIdWithItems(
    organizationId: string
  ): Promise<PublicTransactionWithItemsAndProductDTO[]> {
    const results = await this.database
      .select()
      .from(transactions)
      .where(eq(transactions.organizationId, organizationId))
      .leftJoin(
        transactionItems,
        eq(transactions.id, transactionItems.transactionId)
      )
      .leftJoin(products, eq(transactionItems.productId, products.id))
      .leftJoin(
        vendingMachines,
        eq(transactions.cardReaderId, vendingMachines.cardReaderId)
      )

    return transformToNestedTransactionList(
      results as unknown as TransactionRow[]
    )
  }

  async findByMachineId(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    const machine = await this.database.query.vendingMachines.findFirst({
      where: eq(vendingMachines.id, machineId),
      columns: {
        id: true,
        cardReaderId: true,
      },
    })

    if (!machine) {
      console.error(`Machine with ID ${machineId} not found`)
      return []
    }

    if (!machine.cardReaderId) {
      console.error(
        `Machine with ID ${machineId} has no card reader ID configured`
      )
      return []
    }

    console.log("machine.cardReaderId: ", machine.cardReaderId)
    console.log("startDate: ", startDate)
    console.log("endDate: ", endDate)

    const rows = await this.database
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.cardReaderId, machine.cardReaderId),
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, endDate)
        )
      )
      .orderBy(desc(transactions.createdAt))

    return rows.map((row) => this.toEntity(row))
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(transactions).where(eq(transactions.id, id))
  }

  private toEntity(data: typeof transactions.$inferSelect): Transaction {
    return new Transaction({
      id: data.id,
      organizationId: data.organizationId,
      createdAt: data.createdAt,
      transactionType: data.transactionType,
      total: Number(data.total),
      last4CardDigits: data.last4CardDigits,
      cardReaderId: data.cardReaderId,
    })
  }
}

// Define the row type using the Base types
type TransactionRow = {
  transactions: BaseTransactionDTO | null
  transaction_items: BaseTransactionItemDTO | null
  products: BaseProductDTO | null
  vending_machines: { id: string } | null
}

export function transformToNestedTransactionList(
  rows: TransactionRow[]
): PublicTransactionWithItemsAndProductDTO[] {
  const map = new Map<string, PublicTransactionWithItemsAndProductDTO>()

  for (const row of rows) {
    const tx = row.transactions
    const item = row.transaction_items
    const product = row.products
    const vendingMachine = row.vending_machines

    // Skip if transaction is null
    if (!tx) continue

    // If we haven't created the transaction entry yet, do it now
    if (!map.has(tx.id)) {
      map.set(tx.id, {
        id: tx.id,
        organizationId: tx.organizationId,
        transactionType: tx.transactionType,
        createdAt: tx.createdAt,
        total: typeof tx.total === "string" ? parseFloat(tx.total) : tx.total,
        last4CardDigits: tx.last4CardDigits,
        cardReaderId: tx.cardReaderId,
        vendingMachineId: vendingMachine?.id,
        items: [],
      })
    }

    // If the item and product exist, append it to the transaction's items
    if (item && product) {
      const transaction = map.get(tx.id)
      if (transaction) {
        transaction.items.push({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          salePrice:
            typeof item.salePrice === "string"
              ? parseFloat(item.salePrice)
              : item.salePrice,
          slotCode: item.slotCode,
          product: {
            id: product.id,
            name: product.name,
            image: product.image,
            // Add required fields with default values
            organizationId: product.organizationId,
            recommendedPrice:
              typeof product.recommendedPrice === "string"
                ? parseFloat(product.recommendedPrice)
                : product.recommendedPrice,
            category: product.category,
            vendorLink: product.vendorLink,
            caseCost:
              typeof product.caseCost === "string"
                ? parseFloat(product.caseCost)
                : product.caseCost,
            caseSize:
              typeof product.caseSize === "string"
                ? parseFloat(product.caseSize)
                : product.caseSize,
            shippingAvailable: product.shippingAvailable,
            shippingTimeInDays: product.shippingTimeInDays,
          },
        })
      }
    }
  }

  return Array.from(map.values())
}

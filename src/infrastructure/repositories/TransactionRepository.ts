import { and, eq, gte, lte, desc } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import {
  transactions,
  vendingMachines,
  transactionItems,
  products,
} from "@/infrastructure/database/schema"
import { Transaction } from "@/domains/Transaction/entities/Transaction"
import { db } from "@/infrastructure/database"
import {
  BaseTransactionDTO,
  PublicTransactionWithItemsAndProductDTO,
} from "@/domains/Transaction/schemas/TransactionSchemas"
import { BaseTransactionItemDTO } from "@/domains/Transaction/schemas/TransactionItemSchemas"
import { BaseProductDTO } from "@/domains/Product/DTOs/productDTOs"

export class TransactionRepository {
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
      with: { transactionItems: true },
    })
    return results.map(this.toEntity)
  }

  async findByOrganizationIdWithItems(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PublicTransactionWithItemsAndProductDTO[]> {
    const conditions = [eq(transactions.organizationId, organizationId)]
    if (startDate) conditions.push(gte(transactions.createdAt, startDate))
    if (endDate) conditions.push(lte(transactions.createdAt, endDate))

    const results = await this.database
      .select()
      .from(transactions)
      .where(and(...conditions))
      .leftJoin(transactionItems, eq(transactions.id, transactionItems.transactionId))
      .leftJoin(products, eq(transactionItems.productId, products.id))
      .leftJoin(vendingMachines, eq(transactions.cardReaderId, vendingMachines.cardReaderId))

    return transformToNestedTransactionList(results as unknown as TransactionRow[])
  }

  async findByMachineIdWithItems(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PublicTransactionWithItemsAndProductDTO[]> {
    const machine = await this.database.query.vendingMachines.findFirst({
      where: eq(vendingMachines.id, machineId),
      columns: { id: true, cardReaderId: true },
    })
    if (!machine?.cardReaderId) return []

    const results = await this.database
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.cardReaderId, machine.cardReaderId),
        gte(transactions.createdAt, startDate),
        lte(transactions.createdAt, endDate)
      ))
      .leftJoin(transactionItems, eq(transactions.id, transactionItems.transactionId))
      .leftJoin(products, eq(transactionItems.productId, products.id))
      .leftJoin(vendingMachines, eq(transactions.cardReaderId, vendingMachines.cardReaderId))

    return transformToNestedTransactionList(results as unknown as TransactionRow[])
  }

  async findByMachineId(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    const machine = await this.database.query.vendingMachines.findFirst({
      where: eq(vendingMachines.id, machineId),
      columns: { id: true, cardReaderId: true },
    })

    if (!machine || !machine.cardReaderId) return []

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

  async findByProductId(
    productId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ date: Date; quantity: number; salePrice: number }[]> {
    const rows = await this.database
      .select({
        date: transactions.createdAt,
        quantity: transactionItems.quantity,
        salePrice: transactionItems.salePrice,
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(
        and(
          eq(transactionItems.productId, productId),
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, endDate)
        )
      )
      .orderBy(desc(transactions.createdAt))

    return rows.map((r) => ({
      date: r.date,
      quantity: r.quantity,
      salePrice: typeof r.salePrice === "string" ? parseFloat(r.salePrice) : Number(r.salePrice),
    }))
  }

  /** Most recent transaction timestamp for a card reader, or null if none. */
  async findLatestByCardReader(cardReaderId: string): Promise<Date | null> {
    const [row] = await this.database
      .select({ createdAt: transactions.createdAt })
      .from(transactions)
      .where(eq(transactions.cardReaderId, cardReaderId))
      .orderBy(desc(transactions.createdAt))
      .limit(1)
    return row?.createdAt ?? null
  }

  /** Insert one transaction plus its line items (used for manual reconciliation sales). */
  async createSale(
    tx: {
      organizationId: string
      cardReaderId: string
      createdAt: Date
      transactionType: string
      total: number
      last4CardDigits: string
      data?: Record<string, unknown>
    },
    items: { productId: string; quantity: number; salePrice: number; slotCode: string }[]
  ): Promise<void> {
    const transactionId = randomUUID()
    await this.database.insert(transactions).values({
      id: transactionId,
      organizationId: tx.organizationId,
      createdAt: tx.createdAt,
      transactionType: tx.transactionType,
      total: tx.total.toFixed(2),
      last4CardDigits: tx.last4CardDigits,
      cardReaderId: tx.cardReaderId,
      data: tx.data ?? {},
    })
    if (items.length > 0) {
      await this.database.insert(transactionItems).values(
        items.map((item) => ({
          id: randomUUID(),
          transactionId,
          productId: item.productId,
          quantity: item.quantity,
          salePrice: item.salePrice.toFixed(2),
          slotCode: item.slotCode,
        }))
      )
    }
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

    if (!tx) continue

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

    if (item && product) {
      const transaction = map.get(tx.id)
      if (transaction) {
        transaction.items.push({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          salePrice: typeof item.salePrice === "string" ? parseFloat(item.salePrice) : item.salePrice,
          slotCode: item.slotCode,
          product: {
            id: product.id,
            name: product.name,
            image: product.image,
            organizationId: product.organizationId,
            recommendedPrice: typeof product.recommendedPrice === "string" ? parseFloat(product.recommendedPrice) : product.recommendedPrice,
            category: product.category,
            vendorLink: product.vendorLink,
            caseCost: typeof product.caseCost === "string" ? parseFloat(product.caseCost) : product.caseCost,
            caseSize: typeof product.caseSize === "string" ? parseFloat(product.caseSize) : product.caseSize,
            shippingAvailable: product.shippingAvailable,
            shippingTimeInDays: product.shippingTimeInDays,
            aliases: product.aliases ?? [],
          },
        })
      }
    }
  }

  return Array.from(map.values())
}

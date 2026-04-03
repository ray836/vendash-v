import { db } from "@/infrastructure/database"
import { inventoryTransactions } from "@/infrastructure/database/schema"
import { eq, and, between, desc } from "drizzle-orm"
import { InventoryTransaction, TransactionType } from "@/domains/Inventory/entities/InventoryTransaction"

export class InventoryTransactionRepository {
  constructor(private readonly database: typeof db) {}

  async create(transaction: InventoryTransaction): Promise<InventoryTransaction> {
    const [result] = await this.database
      .insert(inventoryTransactions)
      .values({
        id: transaction.id,
        productId: transaction.productId,
        organizationId: transaction.organizationId,
        transactionType: transaction.transactionType,
        quantity: transaction.quantity,
        locationFrom: transaction.locationFrom,
        locationTo: transaction.locationTo,
        referenceType: transaction.referenceType,
        referenceId: transaction.referenceId,
        notes: transaction.notes,
        createdBy: transaction.createdBy,
        createdAt: transaction.createdAt,
        metadata: transaction.metadata,
      })
      .returning()

    return this.mapToEntity(result)
  }

  async findById(id: string): Promise<InventoryTransaction | null> {
    const result = await this.database.query.inventoryTransactions.findFirst({
      where: eq(inventoryTransactions.id, id),
    })
    return result ? this.mapToEntity(result) : null
  }

  async findByProductId(productId: string, limit = 100): Promise<InventoryTransaction[]> {
    const results = await this.database.query.inventoryTransactions.findMany({
      where: eq(inventoryTransactions.productId, productId),
      orderBy: desc(inventoryTransactions.createdAt),
      limit,
    })
    return results.map(this.mapToEntity)
  }

  async findByOrganizationId(organizationId: string, limit = 100): Promise<InventoryTransaction[]> {
    const results = await this.database.query.inventoryTransactions.findMany({
      where: eq(inventoryTransactions.organizationId, organizationId),
      orderBy: desc(inventoryTransactions.createdAt),
      limit,
    })
    return results.map(this.mapToEntity)
  }

  async findByReferenceId(referenceType: string, referenceId: string): Promise<InventoryTransaction[]> {
    const results = await this.database.query.inventoryTransactions.findMany({
      where: and(
        eq(inventoryTransactions.referenceType, referenceType),
        eq(inventoryTransactions.referenceId, referenceId)
      ),
      orderBy: desc(inventoryTransactions.createdAt),
    })
    return results.map(this.mapToEntity)
  }

  async findByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    productId?: string
  ): Promise<InventoryTransaction[]> {
    const conditions = [
      eq(inventoryTransactions.organizationId, organizationId),
      between(inventoryTransactions.createdAt, startDate, endDate),
    ]

    if (productId) {
      conditions.push(eq(inventoryTransactions.productId, productId))
    }

    const results = await this.database.query.inventoryTransactions.findMany({
      where: and(...conditions),
      orderBy: desc(inventoryTransactions.createdAt),
    })

    return results.map(this.mapToEntity)
  }

  private mapToEntity(row: any): InventoryTransaction {
    return new InventoryTransaction(
      row.id,
      row.productId,
      row.organizationId,
      row.transactionType as TransactionType,
      row.quantity,
      row.locationFrom,
      row.locationTo,
      row.referenceType,
      row.referenceId,
      row.notes,
      row.createdBy,
      row.createdAt,
      row.metadata
    )
  }
}

export type TransactionType = "receive" | "stock" | "sale" | "adjustment" | "transfer" | "waste" | "return"

export interface InventoryTransactionMetadata {
  [key: string]: any
}

export class InventoryTransaction {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly organizationId: string,
    public readonly transactionType: TransactionType,
    public readonly quantity: number,
    public readonly locationFrom: string | null,
    public readonly locationTo: string | null,
    public readonly referenceType: string | null,
    public readonly referenceId: string | null,
    public readonly notes: string | null,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly metadata: InventoryTransactionMetadata = {}
  ) {}

  static create(params: {
    productId: string
    organizationId: string
    transactionType: TransactionType
    quantity: number
    locationFrom?: string | null
    locationTo?: string | null
    referenceType?: string | null
    referenceId?: string | null
    notes?: string | null
    createdBy: string
    metadata?: InventoryTransactionMetadata
  }): InventoryTransaction {
    return new InventoryTransaction(
      crypto.randomUUID(),
      params.productId,
      params.organizationId,
      params.transactionType,
      params.quantity,
      params.locationFrom ?? null,
      params.locationTo ?? null,
      params.referenceType ?? null,
      params.referenceId ?? null,
      params.notes ?? null,
      params.createdBy,
      new Date(),
      params.metadata ?? {}
    )
  }
}
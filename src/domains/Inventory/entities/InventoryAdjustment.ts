export type AdjustmentType = "damage" | "theft" | "expiry" | "count_correction" | "other"

export class InventoryAdjustment {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly organizationId: string,
    public readonly adjustmentType: AdjustmentType,
    public readonly quantityBefore: number,
    public readonly quantityAfter: number,
    public readonly reason: string,
    public readonly approvedBy: string | null,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly inventoryTransactionId: string
  ) {}

  static create(params: {
    productId: string
    organizationId: string
    adjustmentType: AdjustmentType
    quantityBefore: number
    quantityAfter: number
    reason: string
    approvedBy?: string | null
    createdBy: string
    inventoryTransactionId: string
  }): InventoryAdjustment {
    return new InventoryAdjustment(
      crypto.randomUUID(),
      params.productId,
      params.organizationId,
      params.adjustmentType,
      params.quantityBefore,
      params.quantityAfter,
      params.reason,
      params.approvedBy ?? null,
      params.createdBy,
      new Date(),
      params.inventoryTransactionId
    )
  }

  get quantityChange(): number {
    return this.quantityAfter - this.quantityBefore
  }

  get requiresApproval(): boolean {
    return Math.abs(this.quantityChange) > 10 && !this.approvedBy
  }
}
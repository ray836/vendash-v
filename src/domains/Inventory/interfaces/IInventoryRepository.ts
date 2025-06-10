export interface IInventoryRepository {
  updateInventoryQuantity(
    productId: string,
    quantityChange: number
  ): Promise<void>
}

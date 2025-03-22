import { OrderInventoryItemDTO } from "../DTOs/inventoryDTOs"
import { Transaction } from "./Transaction"
import { Inventory } from "./Inventory"
import { Product } from "./Product"
export class ProductMetrics {
  constructor(
    public readonly product: Product,
    public readonly inventory: Inventory,
    public readonly transactionsLast30Days: Transaction[],
    public readonly nextOrderInventory: OrderInventoryItemDTO[]
  ) {}
  get averageDailyUnitSales(): number {
    return Number(
      (
        this.transactionsLast30Days.reduce(
          (acc, t) =>
            acc +
            t.items
              .filter((i) => i.productId === this.product.id)
              .reduce((acc, cur) => acc + cur.quantity, 0),
          0
        ) / 30
      ).toFixed(2)
    )
  }
  get salesVelocity(): number {
    return Number(this.averageDailyUnitSales.toFixed(2))
  }
  get daysToSellOut(): number {
    return this.averageDailyUnitSales > 0
      ? Number((this.inventory.total / this.averageDailyUnitSales).toFixed(0))
      : 0
  }
  get shouldOrder(): boolean {
    return (
      this.daysToSellOut < 7 &&
      this.nextOrderInventory.reduce((acc, i) => acc + i.total, 0) < 3
    )
  }
  get isOnNextOrder(): boolean {
    return this.nextOrderInventory.reduce((acc, i) => acc + i.total, 0) > 0
  }

  get trend(): number {
    const date30DaysAgo = new Date(
      new Date().setDate(new Date().getDate() - 30)
    )
    const today = new Date()
    const middleDate = new Date(
      date30DaysAgo.getTime() + (today.getTime() - date30DaysAgo.getTime()) / 2
    )
    const firstHalf = this.transactionsLast30Days.filter(
      (t) => t.createdAt < middleDate
    )
    const secondHalf = this.transactionsLast30Days.filter(
      (t) => t.createdAt > middleDate
    )
    const firstHalfAverage =
      firstHalf.length === 0
        ? 0
        : firstHalf.reduce(
            (acc, t) =>
              acc +
              (t.items
                .filter((i) => i.productId === this.product.id)
                .reduce((acc, i) => acc + i.quantity, 0) ?? 0),
            0
          ) / firstHalf.length
    const secondHalfAverage =
      secondHalf.length === 0
        ? 0
        : secondHalf.reduce(
            (acc, t) =>
              acc +
              (t.items
                .filter((i) => i.productId === this.product.id)
                .reduce((acc, i) => acc + i.quantity, 0) ?? 0),
            0
          ) / secondHalf.length
    const trend = secondHalfAverage - firstHalfAverage
    return Number(trend.toFixed(2))
  }
}

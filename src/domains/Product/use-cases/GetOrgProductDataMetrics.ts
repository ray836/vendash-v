import { IProductRepository } from "../repositories/IProductRepository"
import { PublicProductWithInventorySalesOrderDataDTO } from "../schemas/ProductSchemas"

interface Transaction {
  id: string
  productId: string
  transactionId: string
  quantity: number
  salePrice: number
  slotCode: string
}

export class GetOrgProductDataMetrics {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(
    organizationId: string
  ): Promise<PublicProductWithInventorySalesOrderDataDTO[]> {
    try {
      const salesStartDate = new Date("2025-01-01")
      const salesEndDate = new Date("2025-12-31")
      const products =
        await this.productRepository.findByOrganizationIdWithInventorySalesOrderData(
          organizationId,
          salesStartDate,
          salesEndDate
        )

      return products.map((product) => {
        // Calculate sales data from transactions
        const totalSales = product.transactions.length
        const totalRevenue = product.transactions.reduce(
          (sum, t) => sum + t.quantity * t.salePrice,
          0
        )
        const totalUnitsSold = product.transactions.reduce(
          (sum, t) => sum + t.quantity,
          0
        )

        // Calculate average daily sales (assuming 30 days)
        const averageDailySales = totalUnitsSold / 30

        // Calculate sales velocity (units per day)
        const salesVelocity = averageDailySales

        // Calculate days to sell out (current inventory / average daily sales)
        const currentInventory =
          (product.inventory.storage || 0) + (product.inventory.machines || 0)
        const daysToSellOut =
          currentInventory > 0 && averageDailySales > 0
            ? currentInventory / averageDailySales
            : 0

        // Calculate trend (simple linear regression slope)
        const trend = this.calculateTrend(product.transactions)

        return {
          product: {
            id: product.product.id,
            name: product.product.name,
            recommendedPrice: product.product.recommendedPrice,
            category: product.product.category,
            image: product.product.image,
            vendorLink: product.product.vendorLink,
            caseCost: product.product.caseCost,
            caseSize: product.product.caseSize,
            shippingAvailable: product.product.shippingAvailable,
            shippingTimeInDays: product.product.shippingTimeInDays,
            organizationId: product.product.organizationId,
          },
          inventory: {
            productId: product.inventory.productId,
            total:
              (product.inventory.storage || 0) +
              (product.inventory.machines || 0),
            storage: product.inventory.storage || 0,
            machines: product.inventory.machines || 0,
            organizationId: product.inventory.organizationId,
          },
          salesData: {
            totalSales,
            totalRevenue,
            totalUnitsSold,
            averageDailySales,
            salesVelocity,
            daysToSellOut,
            trend,
          },
          orderStatus: {
            shouldOrder: this.shouldOrder(currentInventory, averageDailySales),
            isOnNextOrder: product.OnNextOrder,
          },
        }
      })
    } catch (error) {
      console.error("Error getting product data metrics:", error)
      throw error
    }
  }

  private calculateTrend(transactions: Transaction[]): number {
    if (transactions.length < 2) return 0

    // Calculate total revenue for each transaction
    const transactionTotals = transactions.map((t) => t.quantity * t.salePrice)

    // Calculate linear regression slope
    const n = transactionTotals.length
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumXX = 0

    transactionTotals.forEach((total, index) => {
      sumX += index
      sumY += total
      sumXY += index * total
      sumXX += index * index
    })

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    return slope
  }

  private shouldOrder(
    currentInventory: number,
    averageDailySales: number
  ): boolean {
    const daysOfInventory = currentInventory / averageDailySales
    return daysOfInventory < 7
  }
}

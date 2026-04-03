import { Product } from "./entities/Product"
import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import { PublicProductDTO, PublicProductWithInventorySalesOrderDataDTO } from "./schemas/ProductSchemas"

export async function getOrgProducts(
  repo: ProductRepository,
  organizationId: string
): Promise<PublicProductDTO[]> {
  const products = await repo.findByOrganizationId(organizationId)
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    recommendedPrice: product.recommendedPrice,
    category: product.category,
    image: product.image,
    vendorLink: product.vendorLink,
    caseCost: product.caseCost,
    caseSize: product.caseSize,
    shippingAvailable: product.shippingAvailable,
    shippingTimeInDays: product.shippingTimeInDays,
    aliases: product.aliases ?? [],
    organizationId: product.organizationId,
  }))
}

export async function getOrgProductDataMetrics(
  repo: ProductRepository,
  organizationId: string
): Promise<PublicProductWithInventorySalesOrderDataDTO[]> {
  const salesEndDate = new Date()
  const salesStartDate = new Date(salesEndDate.getFullYear() - 1, salesEndDate.getMonth(), salesEndDate.getDate())
  const products = await repo.findByOrganizationIdWithInventorySalesOrderData(
    organizationId,
    salesStartDate,
    salesEndDate
  )

  return products.map((product) => {
    const totalSales = product.transactions.length
    const totalRevenue = product.transactions.reduce(
      (sum, t) => sum + t.quantity * t.salePrice,
      0
    )
    const totalUnitsSold = product.transactions.reduce(
      (sum, t) => sum + t.quantity,
      0
    )
    const averageDailySales = totalUnitsSold / 30
    const salesVelocity = averageDailySales
    const currentInventory =
      (product.inventory.storage || 0) + (product.inventory.machines || 0)
    const daysToSellOut =
      currentInventory > 0 && averageDailySales > 0
        ? currentInventory / averageDailySales
        : 0
    const trend = calculateTrend(product.transactions)

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
        aliases: product.product.aliases ?? [],
        organizationId: product.product.organizationId,
      },
      inventory: {
        productId: product.inventory.productId,
        total:
          (product.inventory.storage || 0) + (product.inventory.machines || 0),
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
        shouldOrder: shouldOrder(currentInventory, averageDailySales),
        isOnNextOrder: product.OnNextOrder,
      },
    }
  })
}

export async function createProduct(
  repo: ProductRepository,
  product: Product
): Promise<Product> {
  return await repo.create(product)
}

export async function getProductById(
  repo: ProductRepository,
  id: string
): Promise<Product | null> {
  return await repo.findById(id)
}

export async function updateProduct(
  repo: ProductRepository,
  product: Product
): Promise<Product> {
  return await repo.update(product)
}

export async function deleteProduct(
  repo: ProductRepository,
  id: string
): Promise<void> {
  await repo.delete(id)
}

function calculateTrend(
  transactions: Array<{ quantity: number; salePrice: number }>
): number {
  if (transactions.length < 2) return 0
  const totals = transactions.map((t) => t.quantity * t.salePrice)
  const n = totals.length
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
  totals.forEach((total, index) => {
    sumX += index
    sumY += total
    sumXY += index * total
    sumXX += index * index
  })
  return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
}

function shouldOrder(currentInventory: number, averageDailySales: number): boolean {
  const daysOfInventory = currentInventory / averageDailySales
  return daysOfInventory < 7
}

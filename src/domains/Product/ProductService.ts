import { Product } from "./entities/Product"
import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import { PublicProductDTO, PublicProductWithInventorySalesOrderDataDTO } from "./schemas/ProductSchemas"
import { weightedAvgDailySales } from "@/domains/Inventory/inventoryForecast"

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
    const { totalSales, totalUnitsSold, totalRevenue, unitsSold7, unitsSold35 } = product.salesAgg
    // Same weighted velocity the ordering logic uses, so "Days Left" matches reorder alerts
    const averageDailySales = weightedAvgDailySales(unitsSold7, unitsSold35)
    const salesVelocity = averageDailySales
    const currentInventory =
      (product.inventory.storage || 0) + (product.inventory.machines || 0)
    const daysToSellOut =
      currentInventory > 0 && averageDailySales > 0
        ? currentInventory / averageDailySales
        : 0

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
        trend: 0,
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


function shouldOrder(currentInventory: number, averageDailySales: number): boolean {
  const daysOfInventory = currentInventory / averageDailySales
  // 7-day lead time: order when stock won't last until an order could arrive
  return daysOfInventory < 14
}

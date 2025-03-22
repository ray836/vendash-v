import { ProductRepository } from "@/core/domain/interfaces/ProductRepository"
import { ProductDataMetricsDTO } from "@/core/domain/DTOs/productDataMetricsDTOs"
import { InventoryRepository } from "@/core/domain/interfaces/InventoryRepository"
import { TransactionRepository } from "@/core/domain/interfaces/TransactionRepository"
import { Inventory } from "@/core/domain/entities/Inventory"
import { Transaction } from "@/core/domain/entities/Transaction"
import { PublicInventoryDTO } from "@/core/domain/DTOs/inventoryDTOs"
import { ProductMetrics } from "@/core/domain/entities/ProductMetrics"
import { toPublicProductDTO } from "@/core/domain/DTOs/productDTOs"
export class GetOrgProductDataMetrics {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly transactionRepository: TransactionRepository
  ) {}

  async execute(organizationId: string): Promise<ProductDataMetricsDTO[]> {
    const products = await this.productRepository.findByOrganizationId(
      organizationId
    )
    const inventory = await this.inventoryRepository.findByOrganizationId(
      organizationId
    )
    const transactions = await this.transactionRepository.findByOrganizationId(
      organizationId
    )
    const productDataMetrics = products.map((product) => {
      const productInventoryData =
        inventory.find((i) => i.productId === product.id) ??
        new Inventory({
          productId: product.id,
          storage: 0,
          machines: 0,
          organizationId: organizationId,
        })
      const productInventory = new Inventory({
        storage: productInventoryData.storage,
        machines: productInventoryData.machines,
        productId: productInventoryData.productId,
        organizationId: productInventoryData.organizationId,
      })
      const productTransactions = transactions.filter((t) =>
        t.items.some((i) => i.productId === product.id)
      ) as Transaction[]
      const productMetrics = new ProductMetrics(
        product,
        productInventory,
        productTransactions,
        [] // TODO: add next order inventory
      )

      return ProductDataMetricsDTO.parse({
        product: toPublicProductDTO(product.props),
        inventory: productInventory,
        averageDailySales: productMetrics.averageDailyUnitSales, // round to 2 decimal places
        salesVelocity: productMetrics.salesVelocity, // round to 2 decimal places
        daysToSellOut: productMetrics.daysToSellOut, // round to 2 decimal places
        shouldOrder: productMetrics.shouldOrder,
        isOnNextOrder: productMetrics.isOnNextOrder,
        trend: productMetrics.trend,
      })
    })
    return productDataMetrics
  }
}

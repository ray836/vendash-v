import { ProductRepository } from "@/core/domain/interfaces/ProductRepository"
import { InventoryRepository } from "@/core/domain/interfaces/InventoryRepository"
import { TransactionRepository } from "@/core/domain/interfaces/TransactionRepository"
import { Product } from "@/core/domain/entities/Product"
import { Transaction } from "@/core/domain/entities/Transaction"
import { ProductMetrics } from "@/core/domain/entities/ProductMetrics"
import { toPublicProductDTO } from "@/core/domain/DTOs/productDTOs"
import { Inventory } from "@/core/domain/entities/Inventory"
import { ProductDataMetricsDTO } from "@/core/domain/DTOs/productDataMetricsDTOs"
import { SlotRepository } from "@/core/domain/interfaces/SlotRepository"
export class GetOrgProductDataMetrics {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly slotRepository: SlotRepository
  ) {}

  async execute(organizationId: string): Promise<ProductDataMetricsDTO[]> {
    try {
      const products = await this.productRepository.findByOrganizationId(
        organizationId
      )

      const productInventoryData =
        await this.inventoryRepository.findByOrganizationId(organizationId)

      const slots = await this.slotRepository.findByOrganizationId(
        organizationId
      )
      const productQuantityInSlots = slots.reduce((acc, slot) => {
        const productId = slot.productId
        const quantity = slot.currentQuantity || 0
        acc[productId] = (acc[productId] || 0) + quantity
        return acc
      }, {} as Record<string, number>)

      const transactions =
        await this.transactionRepository.findByOrganizationId(organizationId)

      const productMetricsData = products.map((product) => {
        // Convert raw product data to Product entity
        const productEntity = new Product({
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
          organizationId: product.organizationId,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        })

        const productInventory =
          productInventoryData.find((inv) => inv.productId === product.id) ||
          new Inventory({
            productId: product.id,
            storage: 0,
            machines: 0,
            organizationId: product.organizationId,
          })

        // Convert raw transactions to Transaction entities
        const productTransactions = transactions
          .filter((t) => t.items.some((i) => i.product.id === product.id))
          .map((t) => {
            // Map transaction items to correct format
            const mappedItems = t.items.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              salePrice: item.salePrice,
            }))

            return new Transaction({
              id: t.id,
              organizationId: t.organizationId,
              createdAt: t.createdAt,
              items: mappedItems,
              total: t.total,
              transactionType: t.transactionType,
              last4CardDigits: t.last4CardDigits,
              cardReaderId: t.cardReaderId,
            })
          })

        const productMetrics = new ProductMetrics(
          productEntity,
          productInventory,
          productTransactions,
          [] // TODO: add next order inventory
        )

        return {
          product: toPublicProductDTO(productEntity.props),
          inventory: {
            organizationId: productInventory.organizationId,
            productId: productInventory.productId,
            storage: productInventory.storage,
            machines: productQuantityInSlots[product.id] || 0,
            total:
              productInventory.storage + productQuantityInSlots[product.id] ||
              0,
          },
          averageDailySales: productMetrics.averageDailyUnitSales,
          salesVelocity: productMetrics.salesVelocity,
          daysToSellOut: productMetrics.daysToSellOut,
          shouldOrder: productMetrics.shouldOrder,
          isOnNextOrder: productMetrics.isOnNextOrder,
          trend: productMetrics.trend,
        }
      })

      return productMetricsData
    } catch (error) {
      console.error("Failed to get product metrics:", error)
      throw new Error("Failed to get product metrics")
    }
  }
}

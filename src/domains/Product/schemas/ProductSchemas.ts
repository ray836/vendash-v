import {
  BaseInventoryDTO,
  PublicInventoryDTO,
} from "@/domains/Inventory/DTOs/inventoryDTOs"
import { z } from "zod"
import { TransactionItemSchemas } from "@/domains/Transaction/schemas/TransactionItemSchemas"
const base = z.object({
  id: z.string(),
  name: z.string(),
  recommendedPrice: z.number(),
  category: z.string(),
  image: z.string(),
  vendorLink: z.string(),
  caseCost: z.number(),
  caseSize: z.number(),
  shippingAvailable: z.boolean(),
  shippingTimeInDays: z.number(),
  organizationId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

const publicProduct = base.pick({
  id: true,
  name: true,
  recommendedPrice: true,
  category: true,
  image: true,
  vendorLink: true,
  caseCost: true,
  caseSize: true,
  shippingAvailable: true,
  shippingTimeInDays: true,
  organizationId: true,
})

const productSalesData = z.object({
  totalSales: z.number(),
  totalRevenue: z.number(),
  totalUnitsSold: z.number(),
  averageDailySales: z.number(),
  salesVelocity: z.number(),
  daysToSellOut: z.number(),
  trend: z.number(),
})

const productOrderStatus = z.object({
  shouldOrder: z.boolean(),
  isOnNextOrder: z.boolean(),
})

const publicProductWithInventorySalesOrderData = z.object({
  product: publicProduct,
  inventory: PublicInventoryDTO,
  salesData: productSalesData,
  orderStatus: productOrderStatus,
})

const productWithInventorySalesOrderData = z.object({
  product: base,
  inventory: BaseInventoryDTO,
  transactions: z.array(TransactionItemSchemas.base),
  OnNextOrder: z.boolean(),
})

export const ProductSchemas = {
  base: base,
  public: publicProduct,
  publicWithInventorySalesOrderData: publicProductWithInventorySalesOrderData,
  productWithInventorySalesOrderData: productWithInventorySalesOrderData,
}

export type BaseProductDTO = z.infer<typeof ProductSchemas.base>
export type PublicProductDTO = z.infer<typeof ProductSchemas.public>
export type PublicProductWithInventorySalesOrderDataDTO = z.infer<
  typeof ProductSchemas.publicWithInventorySalesOrderData
>
export type ProductWithInventorySalesOrderDataDTO = z.infer<
  typeof ProductSchemas.productWithInventorySalesOrderData
>

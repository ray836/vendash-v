import { z } from "zod"
import { PublicInventoryDTO } from "@/domains/Inventory/DTOs/inventoryDTOs"
import { PublicProductDTO } from "./productDTOs"

export const ProductDataMetricsDTO = z.object({
  product: PublicProductDTO,
  inventory: PublicInventoryDTO,
  averageDailySales: z.number(),
  salesVelocity: z.number(),
  daysToSellOut: z.number(),
  shouldOrder: z.boolean(),
  isOnNextOrder: z.boolean(),
  trend: z.number(),
})
export type ProductDataMetricsDTO = z.infer<typeof ProductDataMetricsDTO>

export const MachineProductDataMetricsDTO = z.object({
  product: PublicProductDTO,
  inventory: PublicInventoryDTO,
  averageDailySales: z.number(),
  salesVelocity: z.number(),
  daysToSellOut: z.number(),
  shouldRestock: z.boolean(),
})
export type MachineProductDataMetricsDTO = z.infer<
  typeof MachineProductDataMetricsDTO
>

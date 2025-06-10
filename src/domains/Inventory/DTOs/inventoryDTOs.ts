import { z } from "zod"

export const BaseInventoryDTO = z.object({
  productId: z.string(),
  storage: z.number(),
  machines: z.number(),
  organizationId: z.string(),
})
export type BaseInventoryDTO = z.infer<typeof BaseInventoryDTO>

export const PublicInventoryDTO = BaseInventoryDTO.extend({
  productId: z.string(),
  total: z.number(),
  storage: z.number(),
  machines: z.number(),
  organizationId: z.string(),
})
export type PublicInventoryDTO = z.infer<typeof PublicInventoryDTO>

export const OrderInventoryItemDTO = z.object({
  productId: z.string(),
  total: z.number(),
})
export type OrderInventoryItemDTO = z.infer<typeof OrderInventoryItemDTO>

export function toPublicInventoryDTO(
  inventory: BaseInventoryDTO
): PublicInventoryDTO {
  return PublicInventoryDTO.parse(inventory)
}

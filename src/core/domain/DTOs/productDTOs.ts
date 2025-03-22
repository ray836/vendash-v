import { z } from "zod"

export const BaseProductDTO = z.object({
  id: z.string(),
  name: z.string(),
  recommendedPrice: z.number(),
  category: z.string(),
  image: z.string(),
  vendorLink: z.string(),
  caseCost: z.number(),
  caseSize: z.string(),
  shippingAvailable: z.boolean(),
  shippingTimeInDays: z.number(),
  organizationId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type BaseProductDTO = z.infer<typeof BaseProductDTO>

export const PublicProductDTO = BaseProductDTO.extend({
  id: z.string(),
  name: z.string(),
  recommendedPrice: z.number(),
  category: z.string(),
  image: z.string(),
  vendorLink: z.string(),
  caseCost: z.number(),
  caseSize: z.string(),
  shippingAvailable: z.boolean(),
  shippingTimeInDays: z.number(),
  organizationId: z.string(),
})
export type PublicProductDTO = z.infer<typeof PublicProductDTO>

export function toPublicProductDTO(product: BaseProductDTO): PublicProductDTO {
  return PublicProductDTO.parse(product)
}

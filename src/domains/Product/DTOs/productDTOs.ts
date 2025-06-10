import { z } from "zod"

export const BaseProductDTO = z.object({
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
export type BaseProductDTO = z.infer<typeof BaseProductDTO>

export const PublicProductDTO = BaseProductDTO.pick({
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
export type PublicProductDTO = z.infer<typeof PublicProductDTO>

export function toPublicProductDTO(product: BaseProductDTO): PublicProductDTO {
  return PublicProductDTO.parse(product)
}

export function ProductDTOToPublicProductDTO(
  product: BaseProductDTO
): PublicProductDTO {
  return PublicProductDTO.parse({
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
  })
}

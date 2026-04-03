import { z } from "zod"

export const BaseProductDTO = z.object({
  id: z.string(),
  name: z.string(),
  recommendedPrice: z.number(),
  category: z.string(),
  image: z.string(),
  vendorLink: z.string(),
  vendorSku: z.string().optional(), // Sam's Club item number from receipt (e.g., "990000730")
  barcode: z.string().optional(), // Product GTIN-13 barcode (e.g., "038000263446")
  urlIdentifier: z.string().optional(), // URL identifier (e.g., "13626865899")
  caseCost: z.number(),
  caseSize: z.number(),
  shippingAvailable: z.boolean(),
  shippingTimeInDays: z.number(),
  reorderPoint: z.number().optional(),
  aliases: z.string().array().optional().default([]),
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
  vendorSku: true,
  barcode: true,
  urlIdentifier: true,
  caseCost: true,
  caseSize: true,
  shippingAvailable: true,
  shippingTimeInDays: true,
  aliases: true,
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
    vendorSku: product.vendorSku,
    barcode: product.barcode,
    urlIdentifier: product.urlIdentifier,
    caseCost: product.caseCost,
    caseSize: product.caseSize,
    shippingAvailable: product.shippingAvailable,
    shippingTimeInDays: product.shippingTimeInDays,
    aliases: product.aliases ?? [],
    organizationId: product.organizationId,
  })
}

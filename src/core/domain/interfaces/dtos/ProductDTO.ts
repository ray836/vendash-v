export interface ProductDTO {
  id: string
  name: string
  recommendedPrice: number
  category: string
  image: string
  vendorLink: string
  caseCost: number
  caseSize: string
  shippingAvailable: boolean
  shippingTimeInDays: number
  organizationId: string
}

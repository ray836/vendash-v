import { PublicProductDTO } from "@/domains/Product/schemas/ProductSchemas"
import { IProductRepository } from "@/domains/Product/repositories/IProductRepository"
export class GetOrgProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(organizationId: string): Promise<PublicProductDTO[]> {
    const products = await this.productRepository.findByOrganizationId(
      organizationId
    )
    return products.map(
      (product) =>
        ({
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
        } as PublicProductDTO)
    )
  }
}

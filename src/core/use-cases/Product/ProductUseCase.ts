import { ProductRepository } from "@/core/domain/interfaces/ProductRepository"
import { Product } from "@/core/domain/entities/Product"
import { PublicProductDTO } from "@/core/domain/DTOs/productDTOs"

export class ProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async create(product: Product): Promise<Product> {
    return this.productRepository.create(product)
  }

  async findById(id: string): Promise<Product | null> {
    return this.productRepository.findById(id)
  }

  async findAll(): Promise<PublicProductDTO[]> {
    return this.productRepository.findAll()
  }

  async findByOrganizationId(
    organizationId: string
  ): Promise<PublicProductDTO[]> {
    return this.productRepository.findByOrganizationId(organizationId)
  }

  async update(product: Product): Promise<Product> {
    return this.productRepository.update(product)
  }

  async delete(id: string): Promise<void> {
    return this.productRepository.delete(id)
  }
}

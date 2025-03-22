import { ProductRepository } from "@/core/domain/interfaces/ProductRepository"
import { Product } from "@/core/domain/entities/Product"
import { ProductDTO } from "@/core/domain/interfaces/dtos/ProductDTO"

export class ProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async create(product: ProductDTO): Promise<Product> {
    return this.productRepository.create(product)
  }

  async findById(id: string): Promise<Product | null> {
    return this.productRepository.findById(id)
  }

  async findAll(): Promise<ProductDTO[]> {
    return this.productRepository.findAll()
  }

  async findByOrganizationId(organizationId: string): Promise<Product[]> {
    return this.productRepository.findByOrganizationId(organizationId)
  }

  async update(product: ProductDTO): Promise<Product> {
    return this.productRepository.update(product)
  }

  async delete(id: string): Promise<void> {
    return this.productRepository.delete(id)
  }
}

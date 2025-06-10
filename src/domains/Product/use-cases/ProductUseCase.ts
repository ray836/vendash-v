import { IProductRepository } from "../repositories/IProductRepository"
import { Product } from "../entities/Product"
import { PublicProductDTO } from "../DTOs/productDTOs"

export class ProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async create(product: Product): Promise<PublicProductDTO> {
    return this.productRepository.create(product)
  }
}

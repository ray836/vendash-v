import { Product } from "../entities/Product"
import { PublicProductDTO } from "../DTOs/productDTOs"
export interface ProductRepository {
  create(product: Product): Promise<PublicProductDTO>
  findById(id: string): Promise<Product | null>
  findAll(): Promise<PublicProductDTO[]>
  findByOrganizationId(organizationId: string): Promise<PublicProductDTO[]>
  update(product: Product): Promise<Product>
  delete(id: string): Promise<void>
}

import { Product } from "../entities/Product"
import { ProductDTO } from "./dtos/ProductDTO"
export interface ProductRepository {
  create(product: ProductDTO): Promise<Product>
  findById(id: string): Promise<Product | null>
  findAll(): Promise<ProductDTO[]>
  findByOrganizationId(organizationId: string): Promise<Product[]>
  update(product: ProductDTO): Promise<Product>
  delete(id: string): Promise<void>
}

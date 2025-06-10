import { Product } from "../entities/Product"
import { ProductWithInventorySalesOrderDataDTO } from "../schemas/ProductSchemas"

export interface IProductRepository {
  findByOrganizationIdWithInventorySalesOrderData(
    organizationId: string,
    salesStartDate: Date,
    salesEndDate: Date
  ): Promise<ProductWithInventorySalesOrderDataDTO[]>
  create(product: Product): Promise<Product>
  findByOrganizationId(organizationId: string): Promise<Product[]>
  findById(id: string): Promise<Product | null>
}

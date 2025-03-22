import { Inventory } from "../entities/Inventory"

export interface InventoryRepository {
  findByOrganizationId(organizationId: string): Promise<Inventory[]>
}

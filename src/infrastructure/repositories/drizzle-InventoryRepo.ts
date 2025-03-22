import { InventoryRepository } from "@/core/domain/interfaces/InventoryRepository"
import { db } from "@/infrastructure/database"
import { Inventory } from "@/core/domain/entities/Inventory"
import { inventory } from "@/infrastructure/database/schema"
import { eq } from "drizzle-orm"
import { BaseInventoryDTO } from "@/core/domain/DTOs/inventoryDTOs"
export class DrizzleInventoryRepository implements InventoryRepository {
  constructor(private readonly database: typeof db) {}

  async findByOrganizationId(organizationId: string): Promise<Inventory[]> {
    const inventoryData = await this.database.query.inventory.findMany({
      where: eq(inventory.organizationId, organizationId),
    })
    return inventoryData.map((inventoryItem) => {
      return new Inventory({
        productId: inventoryItem.productId,
        storage: inventoryItem.storage,
        machines: inventoryItem.machines,
        organizationId: inventoryItem.organizationId,
      } as BaseInventoryDTO)
    })
  }
}

import { db } from "@/infrastructure/database"
import { Inventory } from "@/domains/Inventory/entities/Inventory"
import { inventory } from "@/infrastructure/database/schema"
import { eq, sql } from "drizzle-orm"
import { BaseInventoryDTO } from "@/domains/Inventory/DTOs/inventoryDTOs"
import { IInventoryRepository } from "@/domains/Inventory/interfaces/IInventoryRepository"

export class DrizzleInventoryRepository implements IInventoryRepository {
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

  async updateInventoryQuantity(
    productId: string,
    quantityChange: number
  ): Promise<void> {
    await this.database
      .update(inventory)
      .set({
        storage: sql`${inventory.storage} + ${quantityChange}`,
      })
      .where(eq(inventory.productId, productId))
  }
}

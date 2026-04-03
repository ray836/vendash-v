import { db } from "@/infrastructure/database"
import { Inventory } from "@/domains/Inventory/entities/Inventory"
import { inventory } from "@/infrastructure/database/schema"
import { eq, sql } from "drizzle-orm"
import { BaseInventoryDTO } from "@/domains/Inventory/DTOs/inventoryDTOs"

export class InventoryRepository {
  constructor(private readonly database: typeof db) {}

  async findByOrganizationId(organizationId: string): Promise<Inventory[]> {
    const inventoryData = await this.database.query.inventory.findMany({
      where: eq(inventory.organizationId, organizationId),
    })
    return inventoryData.map(
      (item) =>
        new Inventory({
          productId: item.productId,
          storage: item.storage,
          machines: item.machines,
          organizationId: item.organizationId,
        } as BaseInventoryDTO)
    )
  }

  async updateInventoryQuantity(productId: string, quantityChange: number, organizationId: string): Promise<void> {
    const existingInventory = await this.database.query.inventory.findFirst({
      where: eq(inventory.productId, productId),
    })

    if (!existingInventory) {
      await this.database.insert(inventory).values({
        productId,
        storage: quantityChange,
        machines: 0,
        organizationId,
      })
    } else {
      await this.database
        .update(inventory)
        .set({ storage: sql`${inventory.storage} + ${quantityChange}` })
        .where(eq(inventory.productId, productId))
    }
  }

  async transferStorageToMachines(productId: string, quantity: number, organizationId: string): Promise<void> {
    const existingInventory = await this.database.query.inventory.findFirst({
      where: eq(inventory.productId, productId),
    })

    if (!existingInventory) {
      await this.database.insert(inventory).values({
        productId,
        storage: 0,
        machines: quantity,
        organizationId,
      })
    } else {
      await this.database
        .update(inventory)
        .set({
          storage: sql`${inventory.storage} - ${quantity}`,
          machines: sql`${inventory.machines} + ${quantity}`,
        })
        .where(eq(inventory.productId, productId))
    }
  }
}

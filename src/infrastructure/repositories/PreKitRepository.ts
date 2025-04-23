import { IPreKitRepository } from "@/core/domain/interfaces/IPreKitRepository"
import {
  BasePreKitItemDTO,
  PreKitStatus,
} from "../../core/domain/DTOs/prekitDTOs"
import { db } from "../database"
import { preKits, preKitItems } from "../database/schema"
import { eq, and } from "drizzle-orm"
import { PreKit, PreKitItem } from "@/core/domain/entities/PreKit"

export class PreKitRepository implements IPreKitRepository {
  async create(
    preKit: PreKit,
    items: PreKitItem[],
    userId: string
  ): Promise<PreKit> {
    // Insert pre-kit
    console.log("preKit", preKit)
    console.log("createdBy", userId)
    await db.insert(preKits).values({
      id: preKit.id,
      machineId: preKit.machineId,
      status: PreKitStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      updatedBy: userId,
    })

    // Insert pre-kit items
    await db.insert(preKitItems).values(
      items.map((item) => ({
        id: crypto.randomUUID(),
        preKitId: preKit.id,
        productId: item.productId,
        quantity: item.quantity,
        slotId: item.slotId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
      }))
    )

    return preKit
  }

  async getByMachineId(machineId: string): Promise<PreKit | null> {
    const result = await db.query.preKits.findFirst({
      where: and(
        eq(preKits.machineId, machineId),
        eq(preKits.status, PreKitStatus.OPEN)
      ),
    })

    if (!result) return null

    return new PreKit({
      id: result.id,
      machineId: result.machineId,
      status: result.status as PreKitStatus,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      createdBy: result.createdBy ?? "system",
      updatedBy: result.updatedBy ?? "system",
    })
  }

  async delete(id: string): Promise<void> {
    // Delete pre-kit items first (due to foreign key constraint)
    await db.delete(preKitItems).where(eq(preKitItems.preKitId, id))

    // Delete pre-kit
    await db.delete(preKits).where(eq(preKits.id, id))
  }

  // Helper method for internal use
  private async getPreKitItems(preKitId: string): Promise<BasePreKitItemDTO[]> {
    const items = await db.query.preKitItems.findMany({
      where: eq(preKitItems.preKitId, preKitId),
    })

    return items.map((item) => ({
      id: item.id,
      preKitId: item.preKitId,
      productId: item.productId,
      quantity: item.quantity,
      slotId: item.slotId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
    }))
  }

  async getItems(preKitId: string): Promise<PreKitItem[]> {
    const items = await db.query.preKitItems.findMany({
      where: eq(preKitItems.preKitId, preKitId),
    })

    return items.map((item) => {
      return new PreKitItem({
        id: item.id,
        preKitId: item.preKitId,
        productId: item.productId,
        quantity: item.quantity,
        slotId: item.slotId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        createdBy: item.createdBy,
        updatedBy: item.updatedBy,
      })
    })
  }

  async updateItems(
    preKitId: string,
    items: PreKitItem[],
    userId: string
  ): Promise<void> {
    // Delete existing items
    await db.delete(preKitItems).where(eq(preKitItems.preKitId, preKitId))
    console.log("userId", userId)
    // Insert new items
    await db.insert(preKitItems).values(
      items.map((item) => ({
        id: item.id,
        preKitId: preKitId,
        productId: item.productId,
        quantity: item.quantity,
        slotId: item.slotId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
      }))
    )
  }
}

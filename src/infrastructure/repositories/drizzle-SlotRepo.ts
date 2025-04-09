import { SlotRepository } from "@/core/domain/interfaces/SlotRepository"
import { db } from "@/infrastructure/database"
import { products, slots } from "@/infrastructure/database/schema"
import { eq } from "drizzle-orm"
import { Slot } from "@/core/domain/entities/Slot"
import {
  PublicSlotDTO,
  PublicSlotWithProductDTO,
} from "@/core/domain/DTOs/slotDTOs"

export class DrizzleSlotRepository implements SlotRepository {
  constructor(private readonly database: typeof db) {}

  async saveSlots(machineId: string, newSlots: Slot[]): Promise<void> {
    // Delete existing slots for this machine
    await this.database.delete(slots).where(eq(slots.machineId, machineId))

    // Insert new slots if any exist
    if (newSlots.length > 0) {
      await this.database.insert(slots).values(
        newSlots.map((slot) => ({
          id: slot.props.id,
          machineId: machineId,
          productId: slot.props.productId,
          labelCode: slot.props.labelCode,
          ccReaderCode: slot.props.ccReaderCode,
          cardReaderId: slot.props.cardReaderId,
          price: slot.props.price.toString(),
          capacity: slot.props.capacity,
          currentQuantity: slot.props.currentQuantity,
          createdAt: new Date(slot.props.createdAt),
          updatedAt: new Date(slot.props.updatedAt),
          createdBy: slot.props.createdBy,
          updatedBy: slot.props.updatedBy,
          sequenceNumber: slot.props.sequenceNumber,
        }))
      )
    }
  }

  async getSlots(machineId: string): Promise<PublicSlotDTO[]> {
    const result = await this.database
      .select()
      .from(slots)
      .where(eq(slots.machineId, machineId))

    return result.map((slot) => {
      // Parse row and column from labelCode (e.g., "A-1" -> row: "A", column: 0)
      const [row, colStr] = slot.labelCode.split("-")
      const column = parseInt(colStr) - 1 // Convert to 0-based index

      return {
        id: slot.id,
        machineId: slot.machineId,
        productId: slot.productId || "",
        labelCode: slot.labelCode,
        ccReaderCode: slot.ccReaderCode || "",
        price: slot.price ? parseFloat(slot.price.toString()) : 0,
        capacity: slot.capacity || 10,
        currentQuantity: slot.currentQuantity || 0,
        row,
        column,
      }
    })
  }

  async getSlotsWithProducts(
    machineId: string
  ): Promise<PublicSlotWithProductDTO[]> {
    const result = await this.database
      .select()
      .from(slots)
      .where(eq(slots.machineId, machineId))
      .leftJoin(products, eq(slots.productId, products.id))

    return result.map((row) => {
      // Parse row and column from labelCode (e.g., "A-1" -> row: "A", column: 0)
      const [rowLabel, colStr] = row.slots.labelCode.split("-")
      const column = parseInt(colStr) - 1 // Convert to 0-based index

      return {
        id: row.slots.id,
        machineId: row.slots.machineId,
        productId: row.slots.productId || "",
        labelCode: row.slots.labelCode,
        ccReaderCode: row.slots.ccReaderCode || "",
        price: row.slots.price ? parseFloat(row.slots.price.toString()) : 0,
        capacity: row.slots.capacity || 10,
        currentQuantity: row.slots.currentQuantity || 0,
        row: rowLabel,
        column,
        productName: row.products?.name || "",
        productImage: row.products?.image || "",
      }
    })
  }
}

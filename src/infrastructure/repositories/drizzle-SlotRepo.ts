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

  async getSlots(machineId: string): Promise<Slot[]> {
    const result = await this.database
      .select()
      .from(slots)
      .where(eq(slots.machineId, machineId))

    return result.map((slot) => {
      return new Slot({
        id: slot.id,
        machineId: slot.machineId,
        productId: slot.productId || "",
        labelCode: slot.labelCode,
        ccReaderCode: slot.ccReaderCode || "",
        price: slot.price ? parseFloat(slot.price.toString()) : 0,
        capacity: slot.capacity || 10,
        currentQuantity: slot.currentQuantity || 0,
        organizationId: slot.organizationId,
        cardReaderId: slot.cardReaderId || "",
        createdAt: slot.createdAt.toISOString(),
        updatedAt: slot.updatedAt.toISOString(),
        createdBy: slot.createdBy,
        updatedBy: slot.updatedBy,
        sequenceNumber: slot.sequenceNumber,
      })
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

  async updateSlot(slot: Slot, userId: string): Promise<void> {
    console.log("slot", slot)
    await this.database
      .update(slots)
      .set({
        cardReaderId: slot.props.cardReaderId,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(slots.id, slot.props.id))
    console.log("updated slot")
  }

  async findByOrganizationId(organizationId: string): Promise<Slot[]> {
    type SlotRow = typeof slots.$inferSelect

    const slotRows = await this.database
      .select()
      .from(slots)
      .where(eq(slots.organizationId, organizationId))

    const slotEntities = slotRows.map((slotRow: SlotRow) => {
      return new Slot({
        id: slotRow.id,
        createdAt: slotRow.createdAt.toISOString(),
        cardReaderId: slotRow.cardReaderId || "",
        createdBy: slotRow.createdBy,
        updatedAt: slotRow.updatedAt.toISOString(),
        updatedBy: slotRow.updatedBy,
        machineId: slotRow.machineId,
        organizationId: slotRow.organizationId,
        labelCode: slotRow.labelCode,
        ccReaderCode: slotRow.ccReaderCode || "",
        price: parseFloat(slotRow.price.toString()),
        capacity: slotRow.capacity || 10,
        currentQuantity: slotRow.currentQuantity || 0,
        productId: slotRow.productId,
        sequenceNumber: slotRow.sequenceNumber,
      })
    })

    console.log("Slots:", slotEntities)
    return slotEntities
  }
}

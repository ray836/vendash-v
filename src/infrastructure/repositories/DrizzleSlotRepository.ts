import { ISlotRepository } from "@/domains/Slot/interfaces/ISlotRepository"
import { Slot } from "@/domains/Slot/entities/Slot"
import { db } from "@/infrastructure/database"
import { slots } from "@/infrastructure/database/schema"
import { eq, sql } from "drizzle-orm"
import { products } from "@/infrastructure/database/schema"
import { randomUUID } from "node:crypto"
import { PublicSlotWithProductDTO } from "@/domains/Slot/schemas/SlotSchemas"
import { SaveSlot } from "@/domains/Slot/schemas/SaveSlotsSchemas"

export class DrizzleSlotRepository implements ISlotRepository {
  constructor(private readonly database: typeof db) {}

  async findById(slotId: string): Promise<Slot | null> {
    const slot = await this.database.query.slots.findFirst({
      where: eq(slots.id, slotId),
    })

    if (!slot) return null

    return Slot.create({
      id: slot.id,
      machineId: slot.machineId,
      productId: slot.productId,
      organizationId: slot.organizationId,
      labelCode: slot.labelCode,
      ccReaderCode: slot.ccReaderCode || undefined,
      cardReaderId: slot.cardReaderId || undefined,
      price: Number(slot.price),
      capacity: slot.capacity ?? 10,
      currentQuantity: slot.currentQuantity ?? 0,
      sequenceNumber: slot.sequenceNumber,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
      createdBy: slot.createdBy,
      updatedBy: slot.updatedBy,
    })
  }

  async updateSlotQuantity(slotId: string, newQuantity: number): Promise<void> {
    await this.database
      .update(slots)
      .set({
        currentQuantity: sql`${slots.currentQuantity} + ${newQuantity}`,
      })
      .where(eq(slots.id, slotId))
  }

  async findByMachineId(machineId: string): Promise<Slot[]> {
    const result = await this.database
      .select()
      .from(slots)
      .where(eq(slots.machineId, machineId))

    return result.map((slot) => this.toEntity(slot))
  }

  async findByOrganizationId(organizationId: string): Promise<Slot[]> {
    const result = await this.database
      .select()
      .from(slots)
      .where(eq(slots.organizationId, organizationId))

    return result.map((slot) => this.toEntity(slot))
  }

  async create(slot: Slot): Promise<Slot> {
    const result = await this.database
      .insert(slots)
      .values({
        id: slot.id,
        machineId: slot.machineId,
        productId: slot.productId,
        labelCode: slot.labelCode,
        ccReaderCode: slot.ccReaderCode || "",
        cardReaderId: slot.cardReaderId || "",
        price: slot.price.toString(),
        capacity: slot.capacity,
        currentQuantity: slot.currentQuantity,
        organizationId: slot.organizationId,
        sequenceNumber: slot.sequenceNumber,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
        createdBy: slot.createdBy,
        updatedBy: slot.updatedBy,
      })
      .returning()

    if (result.length === 0) {
      throw new Error("Failed to create slot")
    }

    return this.toEntity(result[0])
  }

  async update(slot: Slot): Promise<Slot> {
    const result = await this.database
      .update(slots)
      .set({
        machineId: slot.machineId,
        productId: slot.productId,
        labelCode: slot.labelCode,
        ccReaderCode: slot.ccReaderCode || "",
        cardReaderId: slot.cardReaderId || "",
        price: slot.price.toString(),
        capacity: slot.capacity,
        currentQuantity: slot.currentQuantity,
        organizationId: slot.organizationId,
        sequenceNumber: slot.sequenceNumber,
        updatedAt: slot.updatedAt,
        updatedBy: slot.updatedBy,
      })
      .where(eq(slots.id, slot.id))
      .returning()

    if (result.length === 0) {
      throw new Error("Failed to update slot")
    }

    return this.toEntity(result[0])
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(slots).where(eq(slots.id, id))
  }

  async saveSlots(
    machineId: string,
    userId: string,
    updatedSlotsForMachine: SaveSlot[]
  ): Promise<void> {
    // First, get all existing slots for this machine
    const existingSlots = await this.findByMachineId(machineId)
    const existingSlotIds = new Set(existingSlots.map((slot) => slot.id))

    // Separate slots into existing and new
    const existingSlotsToUpdate = updatedSlotsForMachine.filter(
      (slot) => slot.id && existingSlotIds.has(slot.id)
    )
    const newSlotsToCreate = updatedSlotsForMachine.filter(
      (slot) => !slot.id || !existingSlotIds.has(slot.id)
    )

    // Start a transaction to ensure all operations succeed or fail together
    await this.database.transaction(async (tx) => {
      // Update existing slots
      for (let i = 0; i < existingSlotsToUpdate.length; i++) {
        const saveSlot = existingSlotsToUpdate[i]
        if (!saveSlot.id) continue // Skip if no ID (shouldn't happen due to filter)

        // Find the original slot to preserve createdBy and createdAt
        const originalSlot = existingSlots.find(
          (slot) => slot.id === saveSlot.id
        )

        await tx
          .update(slots)
          .set({
            machineId: machineId,
            productId: saveSlot.productId,
            labelCode: saveSlot.labelCode,
            ccReaderCode: saveSlot.ccReaderCode || "",
            cardReaderId: saveSlot.cardReaderId || "",
            price: saveSlot.price.toString(),
            capacity: saveSlot.capacity,
            currentQuantity: saveSlot.currentQuantity,
            organizationId: originalSlot?.organizationId || "",
            sequenceNumber: i, // Set sequence number based on order in updatedSlotsForMachine
            updatedAt: new Date(),
            updatedBy: userId,
          })
          .where(eq(slots.id, saveSlot.id))
      }

      // Create new slots
      if (newSlotsToCreate.length > 0) {
        await tx.insert(slots).values(
          newSlotsToCreate.map((saveSlot, index) => ({
            id: saveSlot.id || randomUUID(),
            machineId: machineId,
            productId: saveSlot.productId,
            labelCode: saveSlot.labelCode,
            ccReaderCode: saveSlot.ccReaderCode || "",
            cardReaderId: saveSlot.cardReaderId || "",
            price: saveSlot.price.toString(),
            capacity: saveSlot.capacity,
            currentQuantity: saveSlot.currentQuantity,
            organizationId: "", // This should be set to the correct organization ID
            sequenceNumber: existingSlotsToUpdate.length + index, // Set sequence number continuing from existing slots
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userId,
            updatedBy: userId,
          }))
        )
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
        organizationId: row.slots.organizationId,
        machineId: row.slots.machineId,
        productId: row.slots.productId || "",
        labelCode: row.slots.labelCode,
        ccReaderCode: row.slots.ccReaderCode || "",
        cardReaderId: row.slots.cardReaderId || "",
        price: row.slots.price ? parseFloat(row.slots.price.toString()) : 0,
        sequenceNumber: row.slots.sequenceNumber,
        capacity: row.slots.capacity || 10,
        currentQuantity: row.slots.currentQuantity || 0,
        row: rowLabel,
        column,
        createdAt: row.slots.createdAt,
        updatedAt: row.slots.updatedAt,
        productName: row.products?.name || "",
        productImage: row.products?.image || "",
      }
    })
  }

  private toEntity(data: typeof slots.$inferSelect): Slot {
    return Slot.create({
      id: data.id,
      machineId: data.machineId,
      productId: data.productId,
      organizationId: data.organizationId,
      labelCode: data.labelCode,
      ccReaderCode: data.ccReaderCode || undefined,
      cardReaderId: data.cardReaderId || undefined,
      price: Number(data.price),
      capacity: data.capacity ?? 10,
      currentQuantity: data.currentQuantity ?? 0,
      sequenceNumber: data.sequenceNumber,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
    })
  }
}

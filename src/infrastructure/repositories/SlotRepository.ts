import { Slot } from "@/domains/Slot/entities/Slot"
import { db } from "@/infrastructure/database"
import { slots, products, vendingMachines } from "@/infrastructure/database/schema"
import { eq, sql } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import { PublicSlotWithProductDTO } from "@/domains/Slot/schemas/SlotSchemas"
import { SaveSlot } from "@/domains/Slot/schemas/SaveSlotsSchemas"

export class SlotRepository {
  constructor(private readonly database: typeof db) {}

  async findById(slotId: string): Promise<Slot | null> {
    const slot = await this.database.query.slots.findFirst({
      where: eq(slots.id, slotId),
    })
    if (!slot) return null
    return this.toEntity(slot)
  }

  async updateSlotQuantity(slotId: string, newQuantity: number): Promise<void> {
    await this.database
      .update(slots)
      .set({ currentQuantity: sql`${slots.currentQuantity} + ${newQuantity}` })
      .where(eq(slots.id, slotId))
  }

  async findByMachineId(machineId: string): Promise<Slot[]> {
    const result = await this.database.select().from(slots).where(eq(slots.machineId, machineId))
    return result.map((slot) => this.toEntity(slot))
  }

  async findByOrganizationId(organizationId: string): Promise<Slot[]> {
    const result = await this.database.select().from(slots).where(eq(slots.organizationId, organizationId))
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

    if (result.length === 0) throw new Error("Failed to create slot")
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

    if (result.length === 0) throw new Error("Failed to update slot")
    return this.toEntity(result[0])
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(slots).where(eq(slots.id, id))
  }

  async saveSlots(machineId: string, userId: string, updatedSlotsForMachine: SaveSlot[]): Promise<void> {
    const machine = await this.database
      .select()
      .from(vendingMachines)
      .where(eq(vendingMachines.id, machineId))
      .limit(1)

    if (machine.length === 0) throw new Error("Machine not found")
    const organizationId = machine[0].organizationId

    const existingSlots = await this.findByMachineId(machineId)
    const existingSlotIds = new Set(existingSlots.map((slot) => slot.id))

    const existingSlotsToUpdate = updatedSlotsForMachine.filter((slot) => slot.id && existingSlotIds.has(slot.id))
    const newSlotsToCreate = updatedSlotsForMachine.filter((slot) => !slot.id || !existingSlotIds.has(slot.id))

    await this.database.transaction(async (tx) => {
      for (let i = 0; i < existingSlotsToUpdate.length; i++) {
        const saveSlot = existingSlotsToUpdate[i]
        if (!saveSlot.id) continue
        await tx
          .update(slots)
          .set({
            machineId,
            productId: saveSlot.productId,
            labelCode: saveSlot.labelCode,
            rowKey: saveSlot.rowKey ?? undefined,
            colIndex: saveSlot.colIndex ?? undefined,
            ccReaderCode: saveSlot.ccReaderCode || "",
            cardReaderId: saveSlot.cardReaderId || "",
            price: saveSlot.price.toString(),
            capacity: saveSlot.capacity,
            currentQuantity: saveSlot.currentQuantity,
            organizationId,
            sequenceNumber: i,
            updatedAt: new Date(),
            updatedBy: userId,
          })
          .where(eq(slots.id, saveSlot.id))
      }

      if (newSlotsToCreate.length > 0) {
        await tx.insert(slots).values(
          newSlotsToCreate.map((saveSlot, index) => ({
            id: saveSlot.id || randomUUID(),
            machineId,
            productId: saveSlot.productId,
            labelCode: saveSlot.labelCode,
            rowKey: saveSlot.rowKey ?? undefined,
            colIndex: saveSlot.colIndex ?? undefined,
            ccReaderCode: saveSlot.ccReaderCode || "",
            cardReaderId: saveSlot.cardReaderId || "",
            price: saveSlot.price.toString(),
            capacity: saveSlot.capacity,
            currentQuantity: saveSlot.currentQuantity,
            organizationId,
            sequenceNumber: existingSlotsToUpdate.length + index,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userId,
            updatedBy: userId,
          }))
        )
      }
    })
  }

  async getSlotsWithProducts(machineId: string): Promise<PublicSlotWithProductDTO[]> {
    const result = await this.database
      .select({ slot: slots, product: products })
      .from(slots)
      .leftJoin(products, eq(slots.productId, products.id))
      .where(eq(slots.machineId, machineId))
      .orderBy(slots.sequenceNumber)

    return result.map((row) => ({
      id: row.slot.id,
      organizationId: row.slot.organizationId,
      machineId: row.slot.machineId,
      productId: row.slot.productId,
      labelCode: row.slot.labelCode,
      rowKey: row.slot.rowKey ?? undefined,
      colIndex: row.slot.colIndex ?? undefined,
      price: Number(row.slot.price),
      sequenceNumber: row.slot.sequenceNumber,
      capacity: row.slot.capacity ?? 10,
      currentQuantity: row.slot.currentQuantity ?? 0,
      productName: row.product?.name || "",
      ccReaderCode: row.slot.ccReaderCode || undefined,
      cardReaderId: row.slot.cardReaderId || undefined,
      productImage: row.product?.image || undefined,
    }))
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

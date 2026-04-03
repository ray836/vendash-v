import {
  VendingMachine,
  MachineStatus,
  MachineType,
} from "@/domains/VendingMachine/entities/VendingMachine"
import { UpdateVendingMachineInfoRequestDTO } from "@/domains/VendingMachine/schemas/UpdateVendingMachineInfoSchemas"
import { db } from "../database"
import { vendingMachines } from "../database/schema"
import { eq } from "drizzle-orm"

export class VendingMachineRepository {
  constructor(private readonly database: typeof db) {}

  async findById(id: string): Promise<VendingMachine | null> {
    const machine = await this.database.query.vendingMachines.findFirst({
      where: eq(vendingMachines.id, id),
    })
    if (!machine) return null
    return this.toEntity(machine)
  }

  async findByOrganizationId(organizationId: string): Promise<VendingMachine[]> {
    const machines = await this.database.query.vendingMachines.findMany({
      where: eq(vendingMachines.organizationId, organizationId),
    })
    return machines.map(this.toEntity)
  }

  async create(vendingMachine: VendingMachine): Promise<VendingMachine> {
    const [machine] = await this.database
      .insert(vendingMachines)
      .values({
        id: vendingMachine.id,
        type: vendingMachine.type,
        locationId: vendingMachine.locationId,
        model: vendingMachine.model,
        notes: vendingMachine.notes,
        status: vendingMachine.status,
        organizationId: vendingMachine.organizationId,
        cardReaderId: vendingMachine.cardReaderId,
        createdAt: vendingMachine.createdAt,
        updatedAt: vendingMachine.updatedAt,
        createdBy: vendingMachine.createdBy,
        updatedBy: vendingMachine.updatedBy,
      })
      .returning()
    return this.toEntity(machine)
  }

  async update(vendingMachine: VendingMachine): Promise<VendingMachine> {
    const [machine] = await this.database
      .update(vendingMachines)
      .set({
        type: vendingMachine.type,
        locationId: vendingMachine.locationId,
        model: vendingMachine.model,
        notes: vendingMachine.notes,
        status: vendingMachine.status,
        cardReaderId: vendingMachine.cardReaderId,
        updatedAt: vendingMachine.updatedAt,
        updatedBy: vendingMachine.updatedBy,
      })
      .where(eq(vendingMachines.id, vendingMachine.id))
      .returning()
    return this.toEntity(machine)
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(vendingMachines).where(eq(vendingMachines.id, id))
  }

  async updateInfo(id: string, updateData: UpdateVendingMachineInfoRequestDTO): Promise<VendingMachine> {
    const updateFields: {
      model?: string
      notes?: string
      locationId?: string
      updatedAt: Date
      updatedBy: string
    } = { updatedAt: new Date(), updatedBy: "1" }

    if (updateData.model !== undefined) updateFields.model = updateData.model
    if (updateData.notes !== undefined) updateFields.notes = updateData.notes
    if (updateData.locationId !== undefined) updateFields.locationId = updateData.locationId

    const [machine] = await this.database
      .update(vendingMachines)
      .set(updateFields)
      .where(eq(vendingMachines.id, id))
      .returning()
    return this.toEntity(machine)
  }

  private toEntity(machine: typeof vendingMachines.$inferSelect): VendingMachine {
    return new VendingMachine({
      id: machine.id,
      type: machine.type.toUpperCase() as MachineType,
      locationId: machine.locationId,
      model: machine.model,
      notes: machine.notes ?? undefined,
      status: machine.status.toUpperCase() as MachineStatus,
      organizationId: machine.organizationId,
      cardReaderId: machine.cardReaderId ?? undefined,
      createdAt: machine.createdAt,
      updatedAt: machine.updatedAt,
      createdBy: machine.createdBy,
      updatedBy: machine.updatedBy,
    })
  }
}

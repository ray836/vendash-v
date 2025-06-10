import {
  VendingMachine,
  MachineStatus,
  MachineType,
} from "@/domains/VendingMachine/entities/VendingMachine"
import { IVendingMachineRepository } from "@/domains/VendingMachine/interfaces/IVendingMachineRepository"
import { db } from "../database"
import { vendingMachines } from "../database/schema"
import { eq } from "drizzle-orm"

export class DrizzleVendingMachineRepository
  implements IVendingMachineRepository
{
  constructor(private readonly database: typeof db) {}

  async findById(id: string): Promise<VendingMachine | null> {
    const machine = await this.database.query.vendingMachines.findFirst({
      where: eq(vendingMachines.id, id),
    })

    if (!machine) return null

    return new VendingMachine({
      id: machine.id,
      type: machine.type as MachineType,
      locationId: machine.locationId,
      model: machine.model,
      notes: machine.notes ?? undefined,
      status: machine.status as MachineStatus,
      organizationId: machine.organizationId,
      cardReaderId: machine.cardReaderId ?? undefined,
      createdAt: machine.createdAt,
      updatedAt: machine.updatedAt,
      createdBy: machine.createdBy,
      updatedBy: machine.updatedBy,
    })
  }

  async findByOrganizationId(
    organizationId: string
  ): Promise<VendingMachine[]> {
    const machines = await this.database.query.vendingMachines.findMany({
      where: eq(vendingMachines.organizationId, organizationId),
    })

    return machines.map(
      (machine) =>
        new VendingMachine({
          id: machine.id,
          type: machine.type as MachineType,
          locationId: machine.locationId,
          model: machine.model,
          notes: machine.notes ?? undefined,
          status: machine.status as MachineStatus,
          organizationId: machine.organizationId,
          cardReaderId: machine.cardReaderId ?? undefined,
          createdAt: machine.createdAt,
          updatedAt: machine.updatedAt,
          createdBy: machine.createdBy,
          updatedBy: machine.updatedBy,
        })
    )
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

    return new VendingMachine({
      id: machine.id,
      type: machine.type as MachineType,
      locationId: machine.locationId,
      model: machine.model,
      notes: machine.notes ?? undefined,
      status: machine.status as MachineStatus,
      organizationId: machine.organizationId,
      cardReaderId: machine.cardReaderId ?? undefined,
      createdAt: machine.createdAt,
      updatedAt: machine.updatedAt,
      createdBy: machine.createdBy,
      updatedBy: machine.updatedBy,
    })
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

    return new VendingMachine({
      id: machine.id,
      type: machine.type as MachineType,
      locationId: machine.locationId,
      model: machine.model,
      notes: machine.notes ?? undefined,
      status: machine.status as MachineStatus,
      organizationId: machine.organizationId,
      cardReaderId: machine.cardReaderId ?? undefined,
      createdAt: machine.createdAt,
      updatedAt: machine.updatedAt,
      createdBy: machine.createdBy,
      updatedBy: machine.updatedBy,
    })
  }

  async delete(id: string): Promise<void> {
    await this.database
      .delete(vendingMachines)
      .where(eq(vendingMachines.id, id))
  }
}

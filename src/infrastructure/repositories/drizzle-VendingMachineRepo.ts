import { VendingMachineRepository } from "@/core/domain/interfaces/VendingMachineRepository"
import {
  MachineType,
  VendingMachine,
} from "@/core/domain/entities/VendingMachine"
import { db } from "../database"
import { vendingMachines } from "../database/schema"
import { eq } from "drizzle-orm"
import { VendingMachineDTO } from "../../core/domain/interfaces/dtos/VendingMachineDTO"
import { CreateVendingMachineDTO } from "@/core/use-cases/VendingMachine/dtos/CreateVendingMachineDTO"
import { randomUUID } from "node:crypto"

export class DrizzleVendingMachineRepository
  implements VendingMachineRepository
{
  constructor(private readonly database: typeof db) {}
  async getVendingMachines(
    organizationId: string
  ): Promise<VendingMachineDTO[]> {
    const result = await this.database
      .select()
      .from(vendingMachines)
      .where(eq(vendingMachines.organizationId, organizationId))

    return result.map(
      (machine) =>
        new VendingMachineDTO(
          machine.id,
          machine.type,
          machine.locationId,
          machine.organizationId,
          machine.notes ?? undefined,
          machine.model ?? undefined
        )
    )
  }

  async createVendingMachine(
    machine: CreateVendingMachineDTO
  ): Promise<VendingMachine> {
    const result = await this.database
      .insert(vendingMachines)
      .values({
        id: randomUUID(),
        type: machine.type,
        locationId: machine.locationId,
        notes: machine.notes,
        model: machine.model,
        organizationId: machine.organizationId,
        createdBy: machine.creator,
        updatedBy: machine.creator,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
    const [newMachine] = result
    return new VendingMachine(
      newMachine.id as MachineType,
      newMachine.type,
      newMachine.locationId,
      newMachine.organizationId,
      newMachine.notes ?? "",
      newMachine.model
    )
  }

  async getVendingMachine(id: string): Promise<VendingMachineDTO | null> {
    const result = await this.database
      .select()
      .from(vendingMachines)
      .where(eq(vendingMachines.id, id))
      .limit(1)

    if (!result.length) return null
    const machine = result[0]
    return new VendingMachineDTO(
      machine.id,
      machine.type,
      machine.locationId,
      machine.organizationId,
      machine.notes ?? undefined,
      machine.model ?? undefined
    )
  }

  async updateVendingMachine(
    machine: VendingMachine,
    userId: string
  ): Promise<VendingMachineDTO> {
    const result = (
      await this.database
        .update(vendingMachines)
        .set({
          type: machine.type,
          locationId: machine.locationId,
          notes: machine.notes,
          model: machine.model,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(vendingMachines.id, machine.id))
        .returning({
          id: vendingMachines.id,
          type: vendingMachines.type,
          locationId: vendingMachines.locationId,
          organizationId: vendingMachines.organizationId,
          createdBy: vendingMachines.createdBy,
          createdAt: vendingMachines.createdAt,
          notes: vendingMachines.notes,
          model: vendingMachines.model,
        })
    )[0]
    return new VendingMachineDTO(
      result.id,
      result.type,
      result.locationId,
      result.organizationId,
      result.notes ?? undefined,
      result.model ?? undefined
    )
  }

  async deleteVendingMachine(id: string): Promise<void> {
    await this.database
      .delete(vendingMachines)
      .where(eq(vendingMachines.id, id))
  }
}

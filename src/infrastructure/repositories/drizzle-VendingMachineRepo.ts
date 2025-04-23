import { VendingMachineRepository } from "@/core/domain/interfaces/VendingMachineRepository"
import {
  MachineStatus,
  MachineType,
  VendingMachine,
} from "@/core/domain/entities/VendingMachine"
import { db } from "../database"
import { vendingMachines } from "../database/schema"
import { eq } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import {
  PublicVendingMachineDTO,
  UpdateVendingMachineRequestDTO,
} from "@/core/domain/DTOs/vendingMachineDTOs"
import { BaseVendingMachineDTOToPublicVendingMachineDTO } from "@/core/domain/DTOs/vendingMachineDTOs"
export class DrizzleVendingMachineRepository
  implements VendingMachineRepository
{
  constructor(private readonly database: typeof db) {}
  async getVendingMachines(organizationId: string): Promise<VendingMachine[]> {
    const result = await this.database
      .select()
      .from(vendingMachines)
      .where(eq(vendingMachines.organizationId, organizationId))

    return result.map(
      (machine) =>
        new VendingMachine({
          id: machine.id,
          type: machine.type as MachineType,
          locationId: machine.locationId,
          organizationId: machine.organizationId,
          notes: machine.notes ?? "",
          model: machine.model ?? "",
          createdAt: machine.createdAt,
          updatedAt: machine.updatedAt,
          createdBy: machine.createdBy,
          updatedBy: machine.updatedBy,
          cardReaderId: machine.cardReaderId ?? "",
          status: machine.status as MachineStatus,
        })
    )
  }

  async createVendingMachine(machine: VendingMachine): Promise<VendingMachine> {
    const result = await this.database
      .insert(vendingMachines)
      .values({
        id: machine.props.id || randomUUID(),
        type: machine.props.type,
        locationId: machine.props.locationId,
        notes: machine.props.notes,
        model: machine.props.model,
        organizationId: machine.props.organizationId,
        createdBy: machine.props.createdBy,
        updatedBy: machine.props.updatedBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: machine.props.status,
      })
      .returning()
    const [newMachine] = result
    return new VendingMachine({
      id: newMachine.id,
      type: newMachine.type as MachineType,
      locationId: newMachine.locationId,
      organizationId: newMachine.organizationId,
      notes: newMachine.notes ?? "",
      model: newMachine.model ?? "",
      createdAt: newMachine.createdAt,
      updatedAt: newMachine.updatedAt,
      createdBy: newMachine.createdBy,
      updatedBy: newMachine.updatedBy,
      cardReaderId: newMachine.cardReaderId ?? "",
      status: newMachine.status as MachineStatus,
    })
  }

  async getVendingMachine(id: string): Promise<VendingMachine | null> {
    const result = await this.database
      .select()
      .from(vendingMachines)
      .where(eq(vendingMachines.id, id))
      .limit(1)

    if (!result.length) return null
    const dbMachine = result[0]

    // First transform to BaseVendingMachineDTO with correct types
    const baseDTO = {
      id: dbMachine.id,
      type: dbMachine.type as MachineType,
      locationId: dbMachine.locationId,
      organizationId: dbMachine.organizationId,
      notes: dbMachine.notes ?? "",
      model: dbMachine.model ?? "",
      createdAt: dbMachine.createdAt.toISOString(),
      updatedAt: dbMachine.updatedAt.toISOString(),
      createdBy: dbMachine.createdBy,
      updatedBy: dbMachine.updatedBy,
      cardReaderId: dbMachine.cardReaderId ?? "",
      status: dbMachine.status as MachineStatus,
    }

    return new VendingMachine({
      id: baseDTO.id,
      type: baseDTO.type,
      locationId: baseDTO.locationId,
      organizationId: baseDTO.organizationId,
      notes: baseDTO.notes,
      model: baseDTO.model,
      createdAt: new Date(baseDTO.createdAt),
      updatedAt: new Date(baseDTO.updatedAt),
      createdBy: baseDTO.createdBy,
      updatedBy: baseDTO.updatedBy,
      cardReaderId: baseDTO.cardReaderId,
      status: baseDTO.status,
    })
  }

  async updateVendingMachine(
    updates: UpdateVendingMachineRequestDTO,
    userId: string,
    machineId: string
  ): Promise<VendingMachine> {
    const result = (
      await this.database
        .update(vendingMachines)
        .set({
          ...updates,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(vendingMachines.id, machineId))
        .returning()
    )[0]

    if (!result) {
      throw new Error("Failed to update vending machine")
    }

    return new VendingMachine({
      id: result.id,
      type: result.type as MachineType,
      locationId: result.locationId,
      organizationId: result.organizationId,
      notes: result.notes ?? "",
      model: result.model ?? "",
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      createdBy: result.createdBy,
      updatedBy: result.updatedBy,
      cardReaderId: result.cardReaderId ?? "",
      status: result.status as MachineStatus,
    })
  }

  async deleteVendingMachine(id: string): Promise<void> {
    await this.database
      .delete(vendingMachines)
      .where(eq(vendingMachines.id, id))
  }
}

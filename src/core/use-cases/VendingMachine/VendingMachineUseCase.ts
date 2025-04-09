import { VendingMachineRepository } from "@/core/domain/interfaces/VendingMachineRepository"
import {
  VendingMachine,
  MachineStatus,
} from "@/core/domain/entities/VendingMachine"
import {
  BaseVendingMachineDTOToPublicVendingMachineDTO,
  CreateVendingMachineRequestDTO,
  PublicVendingMachineDTO,
  UpdateVendingMachineRequestDTO,
} from "@/core/domain/DTOs/vendingMachineDTOs"
import { randomUUID } from "node:crypto"
export class VendingMachineUseCase {
  constructor(private vendingMachineRepository: VendingMachineRepository) {}

  createVendingMachine(
    vendingMachineRequest: CreateVendingMachineRequestDTO,
    userId: string
  ) {
    const org = "1" //await this.organizationRepository.getOrganization(vendingMachineRequest.organizationId)
    // TODO: validate vending machine request
    const vendingMachine = new VendingMachine({
      id: vendingMachineRequest.id || randomUUID(),
      type: vendingMachineRequest.type,
      locationId: vendingMachineRequest.locationId,
      organizationId: org,
      notes: vendingMachineRequest.notes,
      model: vendingMachineRequest.model,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cardReaderId: vendingMachineRequest.cardReaderId,
      status: MachineStatus.ONLINE,
    })
    return this.vendingMachineRepository.createVendingMachine(vendingMachine)
  }

  async getVendingMachine(id: string): Promise<PublicVendingMachineDTO | null> {
    const machine = await this.vendingMachineRepository.getVendingMachine(id)
    if (!machine) {
      return null
    }
    return BaseVendingMachineDTOToPublicVendingMachineDTO(machine.props)
  }

  getVendingMachines(organizationId: string) {
    return this.vendingMachineRepository
      .getVendingMachines(organizationId)
      .then((machines) =>
        machines.map((machine) =>
          BaseVendingMachineDTOToPublicVendingMachineDTO(machine.props)
        )
      )
  }

  async updateVendingMachine(
    vendingMachineRequest: UpdateVendingMachineRequestDTO,
    userId: string,
    vendingMachineId: string
  ) {
    const currentVendingMachine =
      await this.vendingMachineRepository.getVendingMachine(vendingMachineId)
    if (!currentVendingMachine) {
      throw new Error("Vending machine not found")
    }

    // const newVendingMachine = new VendingMachine({
    //   ...currentVendingMachine.props,
    //   ...vendingMachineRequest,
    //   updatedBy: userId,
    //   updatedAt: new Date().toISOString(),
    // })

    return this.vendingMachineRepository.updateVendingMachine(
      vendingMachineRequest,
      userId,
      vendingMachineId
    )
  }

  deleteVendingMachine(id: string) {
    return this.vendingMachineRepository.deleteVendingMachine(id)
  }
}

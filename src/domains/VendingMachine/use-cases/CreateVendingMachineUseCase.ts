import { VendingMachine } from "../entities/VendingMachine"
import { IVendingMachineRepository } from "../interfaces/IVendingMachineRepository"
import {
  CreateVendingMachineRequestDTO,
  CreateVendingMachineResponseDTO,
} from "../schemas/CreateVendingMachineSchemas"

export class CreateVendingMachineUseCase {
  constructor(
    private readonly vendingMachineRepository: IVendingMachineRepository
  ) {}

  async execute(
    data: CreateVendingMachineRequestDTO
  ): Promise<CreateVendingMachineResponseDTO> {
    const vendingMachine = VendingMachine.create({
      type: data.type,
      locationId: data.locationId,
      model: data.model,
      notes: data.notes,
      organizationId: data.organizationId,
      cardReaderId: data.cardReaderId,
    })

    return await this.vendingMachineRepository.create(vendingMachine)
  }
}

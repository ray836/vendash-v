import { IVendingMachineRepository } from "../interfaces/IVendingMachineRepository"
import {
  UpdateVendingMachineStatusRequestDTO,
  UpdateVendingMachineStatusResponseDTO,
} from "../schemas/UpdateVendingMachineStatusSchemas"

export class UpdateVendingMachineStatusUseCase {
  constructor(
    private readonly vendingMachineRepository: IVendingMachineRepository
  ) {}

  async execute(
    id: string,
    data: UpdateVendingMachineStatusRequestDTO
  ): Promise<UpdateVendingMachineStatusResponseDTO> {
    const existingVendingMachine = await this.vendingMachineRepository.findById(
      id
    )
    if (!existingVendingMachine) {
      throw new Error("Vending machine not found")
    }

    const updatedVendingMachine = existingVendingMachine.updateStatus(
      data.status
    )

    const publicDTO: UpdateVendingMachineStatusResponseDTO =
      updatedVendingMachine.toPublicDTO()

    return publicDTO
  }
}

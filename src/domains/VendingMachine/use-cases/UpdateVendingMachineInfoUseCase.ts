import { IVendingMachineRepository } from "../interfaces/IVendingMachineRepository"
import {
  UpdateVendingMachineInfoRequestDTO,
  UpdateVendingMachineInfoResponseDTO,
} from "../schemas/UpdateVendingMachineInfoSchemas"

export class UpdateVendingMachineInfoUseCase {
  constructor(
    private readonly vendingMachineRepository: IVendingMachineRepository
  ) {}

  async execute(
    machineId: string,
    updateData: UpdateVendingMachineInfoRequestDTO
  ): Promise<UpdateVendingMachineInfoResponseDTO> {
    // Find the existing vending machine
    const existingMachine = await this.vendingMachineRepository.findById(
      machineId
    )

    if (!existingMachine) {
      throw new Error(`Vending machine with id ${machineId} not found`)
    }

    // Update the vending machine info
    const updatedMachine = await this.vendingMachineRepository.updateInfo(
      machineId,
      updateData
    )

    // Return the updated machine as DTO
    return updatedMachine.toPublicDTO()
  }
}

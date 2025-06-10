import { IVendingMachineRepository } from "../interfaces/IVendingMachineRepository"
import { PublicVendingMachineDTO } from "../schemas/vendingMachineDTOs"

export class GetVendingMachineUseCase {
  constructor(
    private readonly vendingMachineRepository: IVendingMachineRepository
  ) {}

  async execute(id: string): Promise<PublicVendingMachineDTO | null> {
    const machine = await this.vendingMachineRepository.findById(id)
    if (!machine) {
      return null
    }
    return PublicVendingMachineDTO.parse(machine)
  }
}

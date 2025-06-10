import { IVendingMachineRepository } from "../interfaces/IVendingMachineRepository"

export class DeleteVendingMachineUseCase {
  constructor(
    private readonly vendingMachineRepository: IVendingMachineRepository
  ) {}

  async execute(id: string): Promise<void> {
    const existingVendingMachine = await this.vendingMachineRepository.findById(
      id
    )
    if (!existingVendingMachine) {
      throw new Error("Vending machine not found")
    }

    await this.vendingMachineRepository.delete(id)
  }
}

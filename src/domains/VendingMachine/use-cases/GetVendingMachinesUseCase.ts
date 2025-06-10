import { IVendingMachineRepository } from "../interfaces/IVendingMachineRepository"
import { PublicVendingMachineDTO } from "../schemas/vendingMachineDTOs"

export class GetVendingMachinesUseCase {
  constructor(
    private readonly vendingMachineRepository: IVendingMachineRepository
  ) {}

  async execute(organizationId: string): Promise<PublicVendingMachineDTO[]> {
    const vendingMachines =
      await this.vendingMachineRepository.findByOrganizationId(organizationId)
    return vendingMachines.map((vendingMachine) => ({
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
    }))
  }
}

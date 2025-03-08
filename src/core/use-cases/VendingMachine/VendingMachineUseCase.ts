import { VendingMachineRepository } from "@/core/domain/interfaces/VendingMachineRepository"
import { VendingMachine } from "@/core/domain/entities/VendingMachine"
import { CreateVendingMachineDTO } from "./dtos/CreateVendingMachineDTO"
export class VendingMachineUseCase {
  constructor(private vendingMachineRepository: VendingMachineRepository) {}

  createVendingMachine(vendingMachine: CreateVendingMachineDTO) {
    return this.vendingMachineRepository.createVendingMachine(vendingMachine)
  }

  getVendingMachine(id: string) {
    return this.vendingMachineRepository.getVendingMachine(id)
  }

  getVendingMachines(organizationId: string) {
    return this.vendingMachineRepository.getVendingMachines(organizationId)
  }

  updateVendingMachine(vendingMachine: VendingMachine, userId: string) {
    return this.vendingMachineRepository.updateVendingMachine(
      vendingMachine,
      userId
    )
  }

  deleteVendingMachine(id: string) {
    return this.vendingMachineRepository.deleteVendingMachine(id)
  }
}

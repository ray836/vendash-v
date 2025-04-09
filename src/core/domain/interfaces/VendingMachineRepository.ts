import { VendingMachine } from "../entities/VendingMachine"
import { UpdateVendingMachineRequestDTO } from "../DTOs/vendingMachineDTOs"
export interface VendingMachineRepository {
  createVendingMachine(vendingMachine: VendingMachine): Promise<VendingMachine>
  getVendingMachine(id: string): Promise<VendingMachine | null>
  updateVendingMachine(
    vendingMachine: UpdateVendingMachineRequestDTO,
    userId: string,
    machineId: string
  ): Promise<VendingMachine>
  deleteVendingMachine(id: string): Promise<void>
  getVendingMachines(organizationId: string): Promise<VendingMachine[]>
}

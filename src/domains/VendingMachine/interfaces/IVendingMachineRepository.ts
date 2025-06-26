import { VendingMachine } from "../entities/VendingMachine"
import { UpdateVendingMachineInfoRequestDTO } from "../schemas/UpdateVendingMachineInfoSchemas"

export interface IVendingMachineRepository {
  findById(id: string): Promise<VendingMachine | null>
  findByOrganizationId(organizationId: string): Promise<VendingMachine[]>
  create(vendingMachine: VendingMachine): Promise<VendingMachine>
  update(vendingMachine: VendingMachine): Promise<VendingMachine>
  updateInfo(
    id: string,
    updateData: UpdateVendingMachineInfoRequestDTO
  ): Promise<VendingMachine>
  delete(id: string): Promise<void>
}

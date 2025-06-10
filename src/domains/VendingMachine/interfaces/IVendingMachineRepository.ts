import { VendingMachine } from "../entities/VendingMachine"

export interface IVendingMachineRepository {
  findById(id: string): Promise<VendingMachine | null>
  findByOrganizationId(organizationId: string): Promise<VendingMachine[]>
  create(vendingMachine: VendingMachine): Promise<VendingMachine>
  update(vendingMachine: VendingMachine): Promise<VendingMachine>
  delete(id: string): Promise<void>
}

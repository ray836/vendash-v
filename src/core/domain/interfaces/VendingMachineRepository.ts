import { CreateVendingMachineDTO } from "@/core/use-cases/VendingMachine/dtos/CreateVendingMachineDTO"
import { VendingMachine } from "../entities/VendingMachine"
import { VendingMachineDTO } from "@/core/domain/interfaces/dtos/VendingMachineDTO"
export interface VendingMachineRepository {
  createVendingMachine(
    vendingMachine: CreateVendingMachineDTO
  ): Promise<VendingMachineDTO>
  getVendingMachine(id: string): Promise<VendingMachineDTO | null>
  updateVendingMachine(
    vendingMachine: VendingMachine,
    userId: string
  ): Promise<VendingMachineDTO>
  deleteVendingMachine(id: string): Promise<void>
  getVendingMachines(organizationId: string): Promise<VendingMachineDTO[]>
}

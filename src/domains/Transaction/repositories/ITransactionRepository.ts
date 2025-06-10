import { Transaction } from "../entities/Transaction"
import { PublicTransactionWithItemsAndProductDTO } from "../schemas/TransactionSchemas"
export interface ITransactionRepository {
  findByOrganizationId(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]>
  findByOrganizationIdWithItems(
    organizationId: string
  ): Promise<PublicTransactionWithItemsAndProductDTO[]>
  findByMachineId(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]>
}

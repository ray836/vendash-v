import { Transaction } from "../entities/Transaction"

export interface TransactionRepository {
  findByOrganizationId(organizationId: string): Promise<Transaction[]>
}

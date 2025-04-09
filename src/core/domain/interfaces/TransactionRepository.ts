import { PublicTransactionDataDTO } from "../DTOs/transactionDTOs"

export interface TransactionRepository {
  findByOrganizationId(
    organizationId: string
  ): Promise<PublicTransactionDataDTO[]>
}

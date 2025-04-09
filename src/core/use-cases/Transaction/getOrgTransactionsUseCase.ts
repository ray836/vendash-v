import { TransactionRepository } from "@/core/domain/interfaces/TransactionRepository"
import { PublicTransactionDataDTO } from "@/core/domain/DTOs/transactionDTOs"

export class GetOrgTransactionsUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(organizationId: string): Promise<PublicTransactionDataDTO[]> {
    return this.transactionRepository.findByOrganizationId(organizationId)
  }
}

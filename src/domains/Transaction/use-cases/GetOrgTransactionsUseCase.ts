import { ITransactionRepository } from "@/domains/Transaction/repositories/ITransactionRepository"
import { PublicTransactionWithItemsAndProductDTO } from "../schemas/TransactionSchemas"
export class GetOrgTransactionsUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(
    organizationId: string
  ): Promise<PublicTransactionWithItemsAndProductDTO[]> {
    const transactionsWithItemsAndProducts =
      await this.transactionRepository.findByOrganizationIdWithItems(
        organizationId
      )
    return transactionsWithItemsAndProducts
  }
}

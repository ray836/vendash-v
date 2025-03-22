import { BaseTransactionDTO } from "../DTOs/transactionDTOs"

export class Transaction {
  constructor(public props: BaseTransactionDTO) {}
  public get id() {
    return this.props.id
  }
  public get organizationId() {
    return this.props.organizationId
  }
  public get items() {
    return this.props.items
  }
  public get createdAt() {
    return this.props.createdAt
  }
  public get transactionType() {
    return this.props.transactionType
  }
  public get total() {
    return this.props.total
  }
}

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
  public get last4CardDigits() {
    return this.props.last4CardDigits
  }
  public get cardReaderId() {
    return this.props.cardReaderId
  }

  public validate() {
    // check that the transaction has a machine
    // check that the transaction has a slot
    // check that the transaction items are sold for the slot price
    return BaseTransactionDTO.parse(this.props)
  }
}

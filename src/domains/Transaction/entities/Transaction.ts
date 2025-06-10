import { BaseTransactionDTO } from "../schemas/TransactionSchemas"

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum PaymentMethod {
  CASH = "cash",
  CARD = "card",
  MOBILE = "mobile",
}

export class Transaction {
  constructor(public props: BaseTransactionDTO) {}

  public get id() {
    return this.props.id
  }

  public get organizationId() {
    return this.props.organizationId
  }

  public get createdAt() {
    return this.props.createdAt
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

  public get data() {
    return this.props.data
  }

  public get transactionType() {
    return this.props.transactionType
  }
}

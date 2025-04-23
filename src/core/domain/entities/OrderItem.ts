import { OrderItemDTO } from "../DTOs/OrderDTOs"

export class OrderItem {
  constructor(public props: OrderItemDTO) {}
  get id() {
    return this.props.id
  }
  get orderId() {
    return this.props.orderId
  }
  get productId() {
    return this.props.productId
  }
  get quantity() {
    return this.props.quantity
  }
  get unitPrice() {
    return this.props.unitPrice
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }
  get createdBy() {
    return this.props.createdBy
  }
  get updatedBy() {
    return this.props.updatedBy
  }
  set quantity(quantity: number) {
    this.props.quantity = quantity
  }
  set unitPrice(unitPrice: number) {
    this.props.unitPrice = unitPrice
  }
  set createdBy(createdBy: string) {
    this.props.createdBy = createdBy
  }
  set updatedBy(updatedBy: string) {
    this.props.updatedBy = updatedBy
  }
  set updatedAt(updatedAt: Date) {
    this.props.updatedAt = updatedAt
  }
}

import { OrderItemDTO } from "../schemas/orderDTOs"

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

  get totalPrice() {
    return this.props.unitPrice * this.props.quantity
  }

  get createdBy() {
    return this.props.createdBy
  }

  get updatedBy() {
    return this.props.updatedBy
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }
}

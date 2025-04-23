import { BaseOrderDTO } from "../DTOs/OrderDTOs"
export class Order {
  constructor(public props: BaseOrderDTO) {}
  get id() {
    return this.props.id
  }
  get organizationId() {
    return this.props.organizationId
  }
  get status() {
    return this.props.status
  }
  get scheduledOrderDate() {
    return this.props.scheduledOrderDate
  }
  get orderPlacedDate() {
    return this.props.orderPlacedDate
  }
  get taxPaid() {
    return this.props.taxPaid
  }
  get shippingCost() {
    return this.props.shippingCost
  }
  get totalAmount() {
    return this.props.totalAmount
  }
  get placedBy() {
    return this.props.placedBy
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

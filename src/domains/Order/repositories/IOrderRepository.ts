import { Order } from "../entities/Order"
import { OrderItem } from "../entities/OrderItem"

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>
  findByOrganizationId(organizationId: string): Promise<Order[]>
  findDraftOrderByOrganizationId(organizationId: string): Promise<Order | null>
  create(order: Order): Promise<Order>
  update(order: Order): Promise<Order>
  delete(id: string): Promise<void>
  findOrderItems(orderId: string): Promise<OrderItem[]>
  createOrderItem(orderItem: OrderItem): Promise<OrderItem>
  updateOrderItem(orderItem: OrderItem): Promise<OrderItem>
  deleteOrderItem(id: string): Promise<void>
}

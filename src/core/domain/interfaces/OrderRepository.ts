import { Order } from "../entities/Order"
import { OrderItem } from "../entities/OrderItem"

export interface OrderRepository {
  create(order: Order): Promise<Order>
  findById(id: string): Promise<Order | null>
  findDraftOrderByOrganizationId(organizationId: string): Promise<Order | null>
  addItemToOrder(orderItem: OrderItem): Promise<OrderItem>
  updateOrder(order: Order): Promise<Order>
  getOrderItems(orderId: string): Promise<OrderItem[]>
  findOrderItemById(orderItemId: string): Promise<OrderItem | null>
  updateOrderItem(orderItem: OrderItem): Promise<OrderItem>
  deleteOrderItem(orderItemId: string): Promise<void>
}

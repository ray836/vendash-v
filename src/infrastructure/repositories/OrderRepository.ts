import { eq, and } from "drizzle-orm"
import { db } from "../database"
import { orders, orderItems } from "../database/schema"
import { Order } from "@/domains/Order/entities/Order"
import { OrderItem } from "@/domains/Order/entities/OrderItem"

export class OrderRepository {
  constructor(private readonly database: typeof db) {}

  async findById(id: string): Promise<Order | null> {
    const result = await this.database.select().from(orders).where(eq(orders.id, id))
    const order = result[0]
    if (!order) return null
    return this.toOrderEntity(order)
  }

  async findByOrganizationId(organizationId: string): Promise<Order[]> {
    const result = await this.database.select().from(orders).where(eq(orders.organizationId, organizationId))
    return result.map(this.toOrderEntity)
  }

  async findDraftOrderByOrganizationId(organizationId: string): Promise<Order | null> {
    const result = await this.database
      .select()
      .from(orders)
      .where(and(eq(orders.organizationId, organizationId), eq(orders.status, "draft")))
    const order = result[0]
    if (!order) return null
    return this.toOrderEntity(order)
  }

  async create(order: Order): Promise<Order> {
    const [created] = await this.database
      .insert(orders)
      .values({
        id: order.id,
        organizationId: order.organizationId,
        status: order.status,
        scheduledOrderDate: order.scheduledOrderDate,
        orderPlacedDate: order.orderPlacedDate,
        taxPaid: order.taxPaid?.toString(),
        shippingCost: order.shippingCost?.toString(),
        totalAmount: order.totalAmount.toString(),
        placedBy: order.placedBy,
        updatedBy: order.updatedBy,
      })
      .returning()
    if (!created) throw new Error("Order not created")
    return this.toOrderEntity(created)
  }

  async update(order: Order): Promise<Order> {
    const [updated] = await this.database
      .update(orders)
      .set({
        status: order.status,
        scheduledOrderDate: order.scheduledOrderDate,
        orderPlacedDate: order.orderPlacedDate,
        taxPaid: order.taxPaid?.toString(),
        shippingCost: order.shippingCost?.toString(),
        totalAmount: order.totalAmount.toString(),
        updatedBy: order.updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id))
      .returning()
    if (!updated) throw new Error("Order not found")
    return this.toOrderEntity(updated)
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(orders).where(eq(orders.id, id))
  }

  async findOrderItems(orderId: string): Promise<OrderItem[]> {
    const result = await this.database.select().from(orderItems).where(eq(orderItems.orderId, orderId))
    return result.map(this.toOrderItemEntity)
  }

  async findOrderItemById(orderItemId: string): Promise<OrderItem | null> {
    const result = await this.database.select().from(orderItems).where(eq(orderItems.id, orderItemId))
    const item = result[0]
    if (!item) return null
    return this.toOrderItemEntity(item)
  }

  async createOrderItem(orderItem: OrderItem): Promise<OrderItem> {
    const [created] = await this.database
      .insert(orderItems)
      .values({
        id: orderItem.id,
        orderId: orderItem.orderId,
        productId: orderItem.productId,
        quantity: orderItem.quantity,
        unitPrice: orderItem.unitPrice.toString(),
        createdBy: orderItem.createdBy,
        updatedBy: orderItem.updatedBy,
        createdAt: orderItem.createdAt,
        updatedAt: orderItem.updatedAt,
      })
      .returning()
    if (!created) throw new Error("Order item not created")
    return this.toOrderItemEntity(created)
  }

  async updateOrderItem(orderItem: OrderItem): Promise<OrderItem> {
    const [updated] = await this.database
      .update(orderItems)
      .set({
        quantity: orderItem.quantity,
        unitPrice: orderItem.unitPrice.toString(),
        updatedBy: orderItem.updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(orderItems.id, orderItem.id))
      .returning()
    if (!updated) throw new Error("Order item not found")
    return this.toOrderItemEntity(updated)
  }

  async deleteOrderItem(orderItemId: string): Promise<void> {
    await this.database.delete(orderItems).where(eq(orderItems.id, orderItemId))
  }

  private toOrderEntity(order: typeof orders.$inferSelect): Order {
    return new Order({
      id: order.id,
      organizationId: order.organizationId,
      status: order.status,
      scheduledOrderDate: order.scheduledOrderDate ?? new Date(),
      orderPlacedDate: order.orderPlacedDate ?? new Date(),
      taxPaid: order.taxPaid ? parseFloat(order.taxPaid) : 0,
      shippingCost: order.shippingCost ? parseFloat(order.shippingCost) : 0,
      totalAmount: parseFloat(order.totalAmount),
      placedBy: order.placedBy,
      updatedBy: order.updatedBy,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    })
  }

  private toOrderItemEntity(item: typeof orderItems.$inferSelect): OrderItem {
    return new OrderItem({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
    })
  }
}

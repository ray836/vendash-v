import { OrderRepository } from "@/core/domain/interfaces/OrderRepository"
import { Order } from "@/core/domain/entities/Order"
import { OrderItem } from "@/core/domain/entities/OrderItem"
import { orders, orderItems } from "@/infrastructure/database/schema"
import { db } from "../database"
import { eq, and } from "drizzle-orm"

export class DrizzleOrderRepository implements OrderRepository {
  constructor(private readonly database: typeof db) {}

  async findOrderItemById(orderItemId: string): Promise<OrderItem | null> {
    const result = await this.database
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, orderItemId))
    const orderItem = result[0]
    if (!orderItem) {
      return null
    }
    return new OrderItem({
      ...orderItem,
      unitPrice: parseFloat(orderItem.unitPrice),
    })
  }

  async updateOrderItem(orderItem: OrderItem): Promise<OrderItem> {
    const result = await this.database
      .update(orderItems)
      .set({
        quantity: orderItem.quantity,
      })
      .where(eq(orderItems.id, orderItem.id))
      .returning()
    const updatedItem = result[0]
    if (!updatedItem) {
      throw new Error("Order item not updated")
    }
    return new OrderItem({
      ...updatedItem,
      unitPrice: parseFloat(updatedItem.unitPrice),
    })
  }

  async create(order: Order): Promise<Order> {
    const result = await this.database
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

    const createdOrder = result[0]
    if (!createdOrder) {
      throw new Error("Order not created")
    }

    return new Order({
      ...createdOrder,
      taxPaid: createdOrder.taxPaid ? parseFloat(createdOrder.taxPaid) : 0,
      shippingCost: createdOrder.shippingCost
        ? parseFloat(createdOrder.shippingCost)
        : 0,
      totalAmount: parseFloat(createdOrder.totalAmount),
      scheduledOrderDate: createdOrder.scheduledOrderDate ?? new Date(),
      orderPlacedDate: createdOrder.orderPlacedDate ?? new Date(),
    })
  }

  async findById(id: string): Promise<Order | null> {
    const result = await this.database
      .select()
      .from(orders)
      .where(eq(orders.id, id))

    const order = result[0]
    if (!order) {
      return null
    }

    return new Order({
      ...order,
      taxPaid: order.taxPaid ? parseFloat(order.taxPaid) : 0,
      shippingCost: order.shippingCost ? parseFloat(order.shippingCost) : 0,
      totalAmount: parseFloat(order.totalAmount),
      scheduledOrderDate: order.scheduledOrderDate ?? new Date(),
      orderPlacedDate: order.orderPlacedDate ?? new Date(),
    })
  }

  async findDraftOrderByOrganizationId(
    organizationId: string
  ): Promise<Order | null> {
    const result = await this.database
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.organizationId, organizationId),
          eq(orders.status, "draft")
        )
      )

    const order = result[0]
    if (!order) {
      return null
    }

    return new Order({
      ...order,
      taxPaid: order.taxPaid ? parseFloat(order.taxPaid) : 0,
      shippingCost: order.shippingCost ? parseFloat(order.shippingCost) : 0,
      totalAmount: parseFloat(order.totalAmount),
      scheduledOrderDate: order.scheduledOrderDate ?? new Date(),
      orderPlacedDate: order.orderPlacedDate ?? new Date(),
    })
  }

  async addItemToOrder(orderItem: OrderItem): Promise<OrderItem> {
    const result = await this.database
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

    const createdItem = result[0]
    if (!createdItem) {
      throw new Error("Order item not created")
    }

    return new OrderItem({
      ...createdItem,
      unitPrice: parseFloat(createdItem.unitPrice),
    })
  }

  async updateOrder(order: Order): Promise<Order> {
    const result = await this.database
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

    const updatedOrder = result[0]
    if (!updatedOrder) {
      throw new Error("Order not found")
    }
    return new Order({
      ...updatedOrder,
      scheduledOrderDate: updatedOrder.scheduledOrderDate || new Date(),
      orderPlacedDate: updatedOrder.orderPlacedDate || new Date(),
      taxPaid: updatedOrder.taxPaid ? parseFloat(updatedOrder.taxPaid) : 0,
      shippingCost: updatedOrder.shippingCost
        ? parseFloat(updatedOrder.shippingCost)
        : 0,
      totalAmount: parseFloat(updatedOrder.totalAmount),
    })
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const result = await this.database
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))

    return result.map(
      (item) =>
        new OrderItem({
          ...item,
          unitPrice: parseFloat(item.unitPrice),
        })
    )
  }

  async deleteOrderItem(orderItemId: string): Promise<void> {
    await this.database.delete(orderItems).where(eq(orderItems.id, orderItemId))
  }
}

import { eq, and } from "drizzle-orm"
import { db } from "../database"
import { orders, orderItems } from "../database/schema"
import { Order } from "@/domains/Order/entities/Order"
import { OrderItem } from "@/domains/Order/entities/OrderItem"
import { IOrderRepository } from "@/domains/Order/repositories/IOrderRepository"

export class DrizzleOrderRepository implements IOrderRepository {
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
      id: orderItem.id,
      orderId: orderItem.orderId,
      productId: orderItem.productId,
      quantity: orderItem.quantity,
      unitPrice: parseFloat(orderItem.unitPrice),
      createdAt: orderItem.createdAt,
      updatedAt: orderItem.updatedAt,
      createdBy: orderItem.createdBy,
      updatedBy: orderItem.updatedBy,
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
      id: createdOrder.id,
      organizationId: createdOrder.organizationId,
      status: createdOrder.status,
      scheduledOrderDate: createdOrder.scheduledOrderDate ?? new Date(),
      orderPlacedDate: createdOrder.orderPlacedDate ?? new Date(),
      taxPaid: createdOrder.taxPaid ? parseFloat(createdOrder.taxPaid) : 0,
      shippingCost: createdOrder.shippingCost
        ? parseFloat(createdOrder.shippingCost)
        : 0,
      totalAmount: parseFloat(createdOrder.totalAmount),
      placedBy: createdOrder.placedBy,
      updatedBy: createdOrder.updatedBy,
      createdAt: createdOrder.createdAt,
      updatedAt: createdOrder.updatedAt,
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

  async findByOrganizationId(organizationId: string): Promise<Order[]> {
    const result = await this.database
      .select()
      .from(orders)
      .where(eq(orders.organizationId, organizationId))

    return result.map(
      (order) =>
        new Order({
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
    )
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

  async createOrderItem(orderItem: OrderItem): Promise<OrderItem> {
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
      id: createdItem.id,
      orderId: createdItem.orderId,
      productId: createdItem.productId,
      quantity: createdItem.quantity,
      unitPrice: parseFloat(createdItem.unitPrice),
      createdAt: createdItem.createdAt,
      updatedAt: createdItem.updatedAt,
      createdBy: createdItem.createdBy,
      updatedBy: createdItem.updatedBy,
    })
  }

  async update(order: Order): Promise<Order> {
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
      id: updatedOrder.id,
      organizationId: updatedOrder.organizationId,
      status: updatedOrder.status,
      scheduledOrderDate: updatedOrder.scheduledOrderDate ?? new Date(),
      orderPlacedDate: updatedOrder.orderPlacedDate ?? new Date(),
      taxPaid: updatedOrder.taxPaid ? parseFloat(updatedOrder.taxPaid) : 0,
      shippingCost: updatedOrder.shippingCost
        ? parseFloat(updatedOrder.shippingCost)
        : 0,
      totalAmount: parseFloat(updatedOrder.totalAmount),
      placedBy: updatedOrder.placedBy,
      updatedBy: updatedOrder.updatedBy,
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
    })
  }

  async findOrderItems(orderId: string): Promise<OrderItem[]> {
    const result = await this.database
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))

    return result.map(
      (item) =>
        new OrderItem({
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
    )
  }

  async updateOrderItem(orderItem: OrderItem): Promise<OrderItem> {
    const result = await this.database
      .update(orderItems)
      .set({
        quantity: orderItem.quantity,
        unitPrice: orderItem.unitPrice.toString(),
        updatedBy: orderItem.updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(orderItems.id, orderItem.id))
      .returning()

    const updatedItem = result[0]
    if (!updatedItem) {
      throw new Error("Order item not found")
    }

    return new OrderItem({
      id: updatedItem.id,
      orderId: updatedItem.orderId,
      productId: updatedItem.productId,
      quantity: updatedItem.quantity,
      unitPrice: parseFloat(updatedItem.unitPrice),
      createdAt: updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt,
      createdBy: updatedItem.createdBy,
      updatedBy: updatedItem.updatedBy,
    })
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(orders).where(eq(orders.id, id))
  }

  async deleteOrderItem(orderItemId: string): Promise<void> {
    await this.database.delete(orderItems).where(eq(orderItems.id, orderItemId))
  }
}

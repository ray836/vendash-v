"use server"

import { db } from "@/infrastructure/database"
import { OrderRepository } from "@/infrastructure/repositories/OrderRepository"
import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import { InventoryRepository } from "@/infrastructure/repositories/InventoryRepository"
import { InventoryTransactionRepository } from "@/infrastructure/repositories/InventoryTransactionRepository"
import * as OrderService from "@/domains/Order/OrderService"
import { PlaceCurrentOrderRequestDTO } from "@/domains/Order/schemas/orderDTOs"
import { auth } from "@/lib/auth"

export async function testAddItemToOrder() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const orderRepo = new OrderRepository(db)
    const productRepo = new ProductRepository(db)
    const result = await OrderService.addItemToCurrentOrder(orderRepo, productRepo, {
      organizationId,
      productId: "1",
      quantity: 1,
      userId: session.user.id,
    })
    return { success: true, data: result }
  } catch (error) {
    console.error("Error adding test item to order:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to add test item" }
  }
}

export async function addProductToNextOrder(productId: string, quantity = 1) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const orderRepo = new OrderRepository(db)
    const productRepo = new ProductRepository(db)
    const result = await OrderService.addItemToCurrentOrder(orderRepo, productRepo, {
      organizationId,
      productId,
      quantity,
      userId: session.user.id,
    })
    return { success: true, data: result }
  } catch (error) {
    console.error("Error adding product to order:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to add product to order" }
  }
}

export async function getCurrentOrder() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const orderRepo = new OrderRepository(db)
    const productRepo = new ProductRepository(db)
    const result = await OrderService.getCurrentOrder(orderRepo, productRepo, organizationId)
    return { success: true, order: result }
  } catch (error) {
    console.error("Error getting current order:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to get current order" }
  }
}

export async function updateOrderItemQuantity(orderItemId: string, orderId: string, quantity: number) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const orderRepo = new OrderRepository(db)
    const result = await OrderService.updateOrderItemQuantity(orderRepo, { orderItemId, orderId, quantity, userId: session.user.id })
    return { success: true, data: result }
  } catch (error) {
    console.error("Error updating order item quantity:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to update quantity" }
  }
}

export async function removeOrderItem(orderItemId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const orderRepo = new OrderRepository(db)
    await OrderService.removeOrderItem(orderRepo, { orderItemId, userId: session.user.id })
    return { success: true }
  } catch (error) {
    console.error("Error removing order item:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to remove item" }
  }
}

export async function placeCurrentOrder(request: PlaceCurrentOrderRequestDTO) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const orderRepo = new OrderRepository(db)
    const productRepo = new ProductRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const inventoryTransactionRepo = new InventoryTransactionRepository(db)
    const order = await OrderService.placeCurrentOrder(orderRepo, productRepo, inventoryRepo, inventoryTransactionRepo, request)
    return { success: true, order }
  } catch (error) {
    console.error("Error placing order:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to place order" }
  }
}

export async function getOrderHistory() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const orderRepo = new OrderRepository(db)
    const allOrders = await orderRepo.findByOrganizationId(organizationId)
    const placedOrders = allOrders.filter((o) => o.status !== "draft")

    const result = await Promise.all(
      placedOrders.map(async (order) => {
        const items = await orderRepo.findOrderItems(order.id)
        return {
          id: order.id,
          date: order.orderPlacedDate
            ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(order.orderPlacedDate)
            : new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(order.createdAt),
          status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
          items: items.length,
          total: order.totalAmount,
        }
      })
    )

    // Most recent first
    result.sort((a, b) => b.id.localeCompare(a.id))
    return { success: true, orders: result }
  } catch (error) {
    console.error("Error fetching order history:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch order history", orders: [] }
  }
}

export async function getOrderById(orderId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const orderRepo = new OrderRepository(db)
    const productRepo = new ProductRepository(db)

    const order = await orderRepo.findById(orderId)
    if (!order) return { success: false, error: "Order not found", order: null }

    const items = await orderRepo.findOrderItems(orderId)

    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await productRepo.findById(item.productId)
        return {
          id: item.id,
          productId: item.productId,
          name: product?.name ?? "Unknown Product",
          image: product?.image ?? "",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          caseSize: product?.caseSize ?? 1,
        }
      })
    )

    const subtotal = itemsWithProducts.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: `ORD-${order.id.slice(0, 8).toUpperCase()}`,
        date: order.orderPlacedDate
          ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(order.orderPlacedDate)
          : new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(order.createdAt),
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
        items: itemsWithProducts,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: order.taxPaid ?? 0,
        shipping: order.shippingCost ?? 0,
        total: order.totalAmount,
      },
    }
  } catch (error) {
    console.error("Error fetching order:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch order", order: null }
  }
}

export async function getAllProducts() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const productRepo = new ProductRepository(db)
    const products = await productRepo.findByOrganizationId(organizationId)
    return {
      success: true,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        image: p.image,
        caseCost: p.caseCost,
        caseSize: p.caseSize,
        category: p.category,
        recommendedPrice: p.recommendedPrice,
      })),
    }
  } catch (error) {
    console.error("Error getting products:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to get products", products: [] }
  }
}

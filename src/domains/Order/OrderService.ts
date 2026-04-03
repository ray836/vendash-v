import { randomUUID } from "crypto"
import { Order } from "./entities/Order"
import { OrderItem } from "./entities/OrderItem"
import {
  PublicOrderDTO,
  PublicOrderItemResponseDTO,
  PlaceCurrentOrderRequestDTO,
  OrderDTOToPublicOrderDTO,
  OrderItemDTOToPublicOrderItemResponseDTO,
} from "./schemas/orderDTOs"
import { OrderRepository } from "@/infrastructure/repositories/OrderRepository"
import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import { InventoryRepository } from "@/infrastructure/repositories/InventoryRepository"
import { InventoryTransactionRepository } from "@/infrastructure/repositories/InventoryTransactionRepository"
import { InventoryTransaction } from "@/domains/Inventory/entities/InventoryTransaction"

export interface AddItemToCurrentOrderRequest {
  organizationId: string
  productId: string
  quantity: number
  userId: string
  orderId?: string
}

export interface UpdateOrderItemQuantityRequest {
  orderItemId: string
  orderId: string
  quantity: number
  userId: string
}

export interface RemoveOrderItemRequest {
  orderItemId: string
  userId: string
}

export async function getCurrentOrder(
  orderRepo: OrderRepository,
  productRepo: ProductRepository,
  organizationId: string
): Promise<PublicOrderDTO | null> {
  const order = await orderRepo.findDraftOrderByOrganizationId(organizationId)
  if (!order) return null

  const items = await orderRepo.findOrderItems(order.id)
  const itemsWithProducts = await Promise.all(
    items.map(async (item) => {
      const product = await productRepo.findById(item.productId)
      if (!product) throw new Error(`Product not found for order item ${item.id}`)
      return OrderItemDTOToPublicOrderItemResponseDTO(item, product)
    })
  )

  return OrderDTOToPublicOrderDTO(order, itemsWithProducts)
}

export async function addItemToCurrentOrder(
  orderRepo: OrderRepository,
  productRepo: ProductRepository,
  request: AddItemToCurrentOrderRequest
): Promise<PublicOrderItemResponseDTO> {
  let currentOrder: Order | null = null

  if (request.orderId) {
    currentOrder = await orderRepo.findById(request.orderId)
    if (!currentOrder) throw new Error("Order not found")
    if (currentOrder.organizationId !== request.organizationId) {
      throw new Error("Order does not belong to this organization")
    }
  } else {
    currentOrder = await orderRepo.findDraftOrderByOrganizationId(request.organizationId)
  }

  const product = await productRepo.findById(request.productId)
  if (!product) throw new Error("Product not found")

  if (!currentOrder && !request.orderId) {
    currentOrder = await orderRepo.create(
      new Order({
        id: randomUUID(),
        organizationId: request.organizationId,
        status: "draft",
        scheduledOrderDate: new Date(),
        orderPlacedDate: new Date(),
        taxPaid: 0,
        shippingCost: 0,
        totalAmount: 0,
        placedBy: request.userId,
        updatedBy: request.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )
  }

  if (!currentOrder) throw new Error("Order not found")

  const existingItems = await orderRepo.findOrderItems(currentOrder.id)
  const existingItem = existingItems.find((item) => item.productId === request.productId)

  let orderItem: OrderItem

  if (existingItem) {
    orderItem = await orderRepo.updateOrderItem(
      new OrderItem({
        ...existingItem.props,
        quantity: existingItem.quantity + request.quantity,
        updatedAt: new Date(),
        updatedBy: request.userId,
      })
    )
  } else {
    orderItem = await orderRepo.createOrderItem(
      new OrderItem({
        id: randomUUID(),
        orderId: currentOrder.id,
        productId: request.productId,
        quantity: request.quantity,
        unitPrice: product.caseCost,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: request.userId,
        updatedBy: request.userId,
      })
    )
  }

  const allItems = await orderRepo.findOrderItems(currentOrder.id)
  const newTotal = allItems.reduce((acc: number, item: OrderItem) => acc + item.totalPrice, 0)
  await orderRepo.update(new Order({ ...currentOrder.props, totalAmount: newTotal, updatedAt: new Date(), updatedBy: request.userId }))

  return OrderItemDTOToPublicOrderItemResponseDTO(orderItem, product)
}

export async function updateOrderItemQuantity(
  orderRepo: OrderRepository,
  request: UpdateOrderItemQuantityRequest
): Promise<boolean> {
  const items = await orderRepo.findOrderItems(request.orderId)
  const orderItem = items.find((item) => item.id === request.orderItemId)
  if (!orderItem) throw new Error("Order item not found")

  orderItem.props.quantity = request.quantity
  orderItem.props.updatedBy = request.userId
  orderItem.props.updatedAt = new Date()

  await orderRepo.updateOrderItem(orderItem)
  return true
}

export async function removeOrderItem(
  orderRepo: OrderRepository,
  request: RemoveOrderItemRequest
): Promise<void> {
  await orderRepo.deleteOrderItem(request.orderItemId)
}

export async function placeCurrentOrder(
  orderRepo: OrderRepository,
  productRepo: ProductRepository,
  inventoryRepo: InventoryRepository,
  inventoryTransactionRepo: InventoryTransactionRepository,
  request: PlaceCurrentOrderRequestDTO
): Promise<PublicOrderDTO> {
  const existingOrder = await orderRepo.findById(request.id)
  if (!existingOrder) throw new Error("Order not found")

  const currentOrderItems = await orderRepo.findOrderItems(request.id)
  const requestItemIds = new Set(request.orderItems.map((item) => item.id))
  const itemsToDelete = currentOrderItems.filter((item) => !requestItemIds.has(item.id))

  await Promise.all(itemsToDelete.map((item) => orderRepo.deleteOrderItem(item.id)))

  await Promise.all(
    request.orderItems.map(async (item) => {
      const product = await productRepo.findById(item.productId)
      if (!product) throw new Error(`Product not found for ID: ${item.productId}`)

      const totalQuantity = item.quantity * product.caseSize

      const transaction = InventoryTransaction.create({
        productId: item.productId,
        organizationId: request.organizationId,
        transactionType: "receive",
        quantity: totalQuantity,
        locationFrom: "supplier",
        locationTo: "storage",
        referenceType: "order",
        referenceId: request.id,
        notes: `Received ${item.quantity} cases (${totalQuantity} units) from supplier`,
        createdBy: request.placedBy,
        metadata: {
          orderId: request.id,
          orderItemId: item.id,
          casesReceived: item.quantity,
          caseSize: product.caseSize,
          unitPrice: item.unitPrice,
        },
      })

      await inventoryTransactionRepo.create(transaction)
      await inventoryRepo.updateInventoryQuantity(item.productId, totalQuantity, request.organizationId)
    })
  )

  const updatedOrder = new Order({
    id: existingOrder.id,
    organizationId: existingOrder.organizationId,
    status: "placed",
    scheduledOrderDate: request.scheduledOrderDate,
    orderPlacedDate: request.orderPlacedDate,
    taxPaid: request.taxPaid,
    shippingCost: request.shippingCost,
    totalAmount: request.totalAmount,
    placedBy: request.placedBy,
    updatedBy: request.placedBy,
    createdAt: existingOrder.createdAt,
    updatedAt: new Date(),
  })

  const savedOrder = await orderRepo.update(updatedOrder)

  const orderItems = await orderRepo.findOrderItems(savedOrder.id)
  const orderItemsWithProducts = await Promise.all(
    orderItems.map(async (item) => {
      const product = await productRepo.findById(item.productId)
      if (!product) throw new Error(`Product not found for ID: ${item.productId}`)
      return OrderItemDTOToPublicOrderItemResponseDTO(item, product)
    })
  )

  return {
    id: savedOrder.id,
    organizationId: savedOrder.organizationId,
    status: savedOrder.status,
    scheduledOrderDate: savedOrder.scheduledOrderDate,
    orderPlacedDate: savedOrder.orderPlacedDate,
    taxPaid: savedOrder.taxPaid,
    shippingCost: savedOrder.shippingCost,
    totalAmount: savedOrder.totalAmount,
    orderItems: orderItemsWithProducts,
  }
}

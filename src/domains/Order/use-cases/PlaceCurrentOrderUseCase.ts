import { IOrderRepository } from "@/domains/Order/repositories/IOrderRepository"
import {
  PlaceCurrentOrderRequestDTO,
  PublicOrderDTO,
  OrderItemDTOToPublicOrderItemResponseDTO,
} from "../schemas/orderDTOs"
import { Order } from "../entities/Order"
import { IProductRepository } from "@/domains/Product/repositories/IProductRepository"
import { IInventoryRepository } from "@/domains/Inventory/interfaces/IInventoryRepository"

export class PlaceCurrentOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductRepository,
    private readonly inventoryRepository: IInventoryRepository
  ) {}

  async execute(request: PlaceCurrentOrderRequestDTO): Promise<PublicOrderDTO> {
    // Get the current draft order
    const existingOrder = await this.orderRepository.findById(request.id)
    if (!existingOrder) {
      throw new Error("Order not found")
    }

    // Get all current order items
    const currentOrderItems = await this.orderRepository.findOrderItems(
      request.id
    )

    // Find items that are not in the request (items that were unselected)
    const requestItemIds = new Set(request.orderItems.map((item) => item.id))
    const itemsToDelete = currentOrderItems.filter(
      (item) => !requestItemIds.has(item.id)
    )

    // Delete the unselected items
    await Promise.all(
      itemsToDelete.map((item) => this.orderRepository.deleteOrderItem(item.id))
    )

    // Update inventory for each item in the order
    await Promise.all(
      request.orderItems.map(async (item) => {
        // Get the product to find its case size
        const product = await this.productRepository.findById(item.productId)
        if (!product) {
          throw new Error(`Product not found for ID: ${item.productId}`)
        }
        // Calculate total quantity (quantity * case size)
        const totalQuantity = item.quantity * product.caseSize
        // Update inventory
        await this.inventoryRepository.updateInventoryQuantity(
          item.productId,
          totalQuantity
        )
      })
    )

    // Update the order status and dates
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

    // Save the updated order
    const savedOrder = await this.orderRepository.update(updatedOrder)

    // Get all order items with their product data
    const orderItems = await this.orderRepository.findOrderItems(savedOrder.id)
    const orderItemsWithProducts = await Promise.all(
      orderItems.map(async (item) => {
        const product = await this.productRepository.findById(item.productId)
        if (!product) {
          throw new Error(`Product not found for ID: ${item.productId}`)
        }
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
}

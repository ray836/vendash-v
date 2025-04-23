import { OrderRepository } from "@/core/domain/interfaces/OrderRepository"
import { ProductRepository } from "@/core/domain/interfaces/ProductRepository"
import {
  PlaceCurrentOrderRequestDTO,
  PublicOrderDTO,
  OrderDTOToPublicOrderDTO,
  OrderItemDTOToPublicOrderItemResponseDTO,
} from "@/core/domain/DTOs/OrderDTOs"
import { Order } from "@/core/domain/entities/Order"

export class PlaceCurrentOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private productRepository: ProductRepository
  ) {}

  async execute(request: PlaceCurrentOrderRequestDTO): Promise<PublicOrderDTO> {
    // Get the current draft order
    const existingOrder = await this.orderRepository.findById(request.id)
    if (!existingOrder) {
      throw new Error("Order not found")
    }

    // Get all current order items
    const currentOrderItems = await this.orderRepository.getOrderItems(
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

    // Update the order status and dates
    const updatedOrder = new Order({
      ...existingOrder.props,
      status: "placed",
      orderPlacedDate: new Date(),
      updatedAt: new Date(),
      placedBy: request.placedBy,
      taxPaid: request.taxPaid,
      shippingCost: request.shippingCost,
      totalAmount: request.totalAmount,
    })

    // Save the updated order
    const savedOrder = await this.orderRepository.updateOrder(updatedOrder)

    // Get all products for the remaining order items (no updates needed)
    const orderItemsWithProducts = await Promise.all(
      request.orderItems.map(async (item) => {
        const product = await this.productRepository.findById(item.productId)
        if (!product) {
          throw new Error(`Product not found for ID: ${item.productId}`)
        }

        // Get the existing order item
        const orderItem = await this.orderRepository.findOrderItemById(item.id)
        if (!orderItem) {
          throw new Error(`Order item not found for ID: ${item.id}`)
        }

        // Convert to DTO
        return OrderItemDTOToPublicOrderItemResponseDTO(orderItem, product)
      })
    )

    // Convert to PublicOrderDTO and return
    return OrderDTOToPublicOrderDTO(savedOrder, orderItemsWithProducts)
  }
}

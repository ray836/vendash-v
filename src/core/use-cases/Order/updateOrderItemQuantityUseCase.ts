import { OrderRepository } from "@/core/domain/interfaces/OrderRepository"

interface UpdateOrderItemQuantityRequest {
  orderItemId: string
  quantity: number
  userId: string
}

export class UpdateOrderItemQuantityUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(request: UpdateOrderItemQuantityRequest): Promise<boolean> {
    const { orderItemId, quantity, userId } = request

    // Get the order item
    const orderItem = await this.orderRepository.findOrderItemById(orderItemId)
    if (!orderItem) {
      return false
    }

    // Update the quantity
    orderItem.quantity = quantity
    orderItem.updatedBy = userId
    orderItem.updatedAt = new Date()

    // Save the updated order item
    await this.orderRepository.updateOrderItem(orderItem)

    return true
  }
}

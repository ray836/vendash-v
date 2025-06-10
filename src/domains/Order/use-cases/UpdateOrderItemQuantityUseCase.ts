import { IOrderRepository } from "@/domains/Order/repositories/IOrderRepository"
import { OrderItem } from "../entities/OrderItem"

interface UpdateOrderItemQuantityRequest {
  orderItemId: string
  quantity: number
  userId: string
}

export class UpdateOrderItemQuantityUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(request: UpdateOrderItemQuantityRequest): Promise<boolean> {
    try {
      // Get all order items and find the one we want to update
      const orderItems = await this.orderRepository.findOrderItems(
        request.orderItemId
      )
      const orderItem = orderItems.find(
        (item) => item.id === request.orderItemId
      )
      if (!orderItem) {
        throw new Error("Order item not found")
      }

      // Update the quantity
      orderItem.props.quantity = request.quantity
      orderItem.props.updatedBy = request.userId
      orderItem.props.updatedAt = new Date()

      await this.orderRepository.updateOrderItem(orderItem)

      return true
    } catch (error) {
      console.error("Error in UpdateOrderItemQuantityUseCase:", error)
      throw error
    }
  }
}

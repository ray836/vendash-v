import { IOrderRepository } from "@/domains/Order/repositories/IOrderRepository"
import { Order } from "../entities/Order"
import { OrderItem } from "../entities/OrderItem"
import { randomUUID } from "crypto"
import {
  PublicOrderItemResponseDTO,
  OrderItemDTOToPublicOrderItemResponseDTO,
} from "../schemas/orderDTOs"
import { IProductRepository } from "@/domains/Product/repositories/IProductRepository"

interface AddItemToCurrentOrderRequest {
  organizationId: string
  productId: string
  quantity: number
  userId: string
  orderId?: string // Optional order ID
}

export class AddItemToCurrentOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(
    request: AddItemToCurrentOrderRequest
  ): Promise<PublicOrderItemResponseDTO> {
    try {
      let currentOrder: Order | null = null

      // If orderId is provided, find that specific order
      if (request.orderId) {
        currentOrder = await this.orderRepository.findById(request.orderId)
        if (!currentOrder) {
          throw new Error("Order not found")
        }
        // Verify the order belongs to the correct organization
        if (currentOrder.organizationId !== request.organizationId) {
          throw new Error("Order does not belong to this organization")
        }
      } else {
        // Find existing draft order if no orderId provided
        currentOrder =
          await this.orderRepository.findDraftOrderByOrganizationId(
            request.organizationId
          )
      }

      // Get product to get the price
      const product = await this.productRepository.findById(request.productId)
      if (!product) {
        throw new Error("Product not found")
      }

      // If no order exists and no orderId was provided, create one
      if (!currentOrder && !request.orderId) {
        currentOrder = await this.orderRepository.create(
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

      if (!currentOrder) {
        throw new Error("Order not found")
      }

      // Create new order item
      const newOrderItem = await this.orderRepository.createOrderItem(
        new OrderItem({
          id: randomUUID(),
          orderId: currentOrder.id,
          productId: request.productId,
          quantity: request.quantity,
          unitPrice: product.recommendedPrice,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: request.userId,
          updatedBy: request.userId,
        })
      )

      // Update the order total
      const orderItems = await this.orderRepository.findOrderItems(
        currentOrder.id
      )
      const newTotal = orderItems.reduce(
        (acc: number, item: OrderItem) => acc + item.totalPrice,
        0
      )

      await this.orderRepository.update(
        new Order({
          ...currentOrder.props,
          totalAmount: newTotal,
          updatedAt: new Date(),
          updatedBy: request.userId,
        })
      )

      return OrderItemDTOToPublicOrderItemResponseDTO(newOrderItem, product)
    } catch (error) {
      console.error("Error in AddItemToCurrentOrderUseCase:", error)
      throw error
    }
  }
}

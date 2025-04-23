import { OrderRepository } from "@/core/domain/interfaces/OrderRepository"
import { ProductRepository } from "@/core/domain/interfaces/ProductRepository"
import { Order } from "@/core/domain/entities/Order"
import { OrderItem } from "@/core/domain/entities/OrderItem"
import {
  PublicOrderItemResponseDTO,
  OrderItemDTOToPublicOrderItemResponseDTO,
} from "@/core/domain/DTOs/OrderDTOs"
import { generateId } from "@/core/domain/utils/generateId"

interface AddItemToCurrentOrderRequest {
  organizationId: string
  productId: string
  quantity: number
  userId: string
  orderId?: string // Optional order ID
}

export class AddItemToCurrentOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository
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
            id: generateId(),
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
      } else if (!currentOrder) {
        throw new Error("Order not found")
      }

      // Create new order item
      const newOrderItem = await this.orderRepository.addItemToOrder(
        new OrderItem({
          id: generateId(),
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

      // get product data for order item
      const productData = await this.productRepository.findById(
        newOrderItem.productId
      )

      if (!productData) {
        throw new Error("Product not found")
      }

      const publicOrderItem = OrderItemDTOToPublicOrderItemResponseDTO(
        newOrderItem.props,
        productData.props
      )

      // Update order total
      await this.orderRepository.updateOrder(
        new Order({
          ...currentOrder.props,
          totalAmount:
            currentOrder.totalAmount +
            newOrderItem.unitPrice * newOrderItem.quantity,
          updatedBy: request.userId,
          updatedAt: new Date(),
        })
      )

      return publicOrderItem
    } catch (error) {
      console.error("Failed to add item to current order:", error)
      throw new Error("Failed to add item to current order")
    }
  }
}

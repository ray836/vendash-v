import { IOrderRepository } from "@/domains/Order/repositories/IOrderRepository"
import {
  PublicOrderDTO,
  OrderDTOToPublicOrderDTO,
  OrderItemDTOToPublicOrderItemResponseDTO,
} from "../schemas/orderDTOs"
import { IProductRepository } from "@/domains/Product/repositories/IProductRepository"

export class GetCurrentOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(organizationId: string): Promise<PublicOrderDTO | null> {
    const order = await this.orderRepository.findDraftOrderByOrganizationId(
      organizationId
    )
    if (!order) {
      return null
    }

    const orderItems = await this.orderRepository.findOrderItems(order.id)
    const orderItemsWithProducts = await Promise.all(
      orderItems.map(async (item) => {
        const product = await this.productRepository.findById(item.productId)
        if (!product) {
          throw new Error(`Product not found for order item ${item.id}`)
        }
        return OrderItemDTOToPublicOrderItemResponseDTO(item, product)
      })
    )

    return OrderDTOToPublicOrderDTO(order, orderItemsWithProducts)
  }
}

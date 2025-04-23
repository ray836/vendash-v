import { OrderRepository } from "@/core/domain/interfaces/OrderRepository"
import { ProductRepository } from "@/core/domain/interfaces/ProductRepository"
import {
  PublicOrderDTO,
  OrderDTOToPublicOrderDTO,
  OrderItemDTOToPublicOrderItemResponseDTO,
} from "@/core/domain/DTOs/OrderDTOs"
import { ProductDTOToPublicProductDTO } from "@/core/domain/DTOs/productDTOs"

export class GetCurrentOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private productRepository: ProductRepository
  ) {}

  async execute(organizationId: string): Promise<PublicOrderDTO | null> {
    // Get the draft order
    console.log("here1")
    const order = await this.orderRepository.findDraftOrderByOrganizationId(
      organizationId
    )
    if (!order) {
      return null
    }

    console.log("here2")
    const orderItems = await this.orderRepository.getOrderItems(order.id)

    // If no draft order exists, return null
    if (!order) {
      return null
    }

    console.log("here3")
    // For each order item, get the product details and convert to PublicOrderItemResponseDTO
    const orderItemsWithProducts = await Promise.all(
      orderItems.map(async (item) => {
        console.log("here4")
        const product = await this.productRepository.findById(item.productId)
        if (!product) {
          throw new Error(`Product not found for ID: ${item.productId}`)
        }
        console.log("here5")
        console.log(product)
        console.log("^^^^")
        const publicProduct = ProductDTOToPublicProductDTO(product.props)
        console.log(item)
        console.log("&&&&&")
        console.log(publicProduct)
        return OrderItemDTOToPublicOrderItemResponseDTO(item, publicProduct)
      })
    )

    // Convert the order to PublicOrderDTO
    return OrderDTOToPublicOrderDTO(order, orderItemsWithProducts)
  }
}

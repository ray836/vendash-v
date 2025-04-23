import { z } from "zod"
import { PublicProductDTO } from "./productDTOs"

export const OrderItemDTO = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
})

export type OrderItemDTO = z.infer<typeof OrderItemDTO>

export const PublicOrderItemResponseDTO = OrderItemDTO.pick({
  id: true,
  orderId: true,
  quantity: true,
  unitPrice: true,
}).extend({
  product: PublicProductDTO,
})

export type PublicOrderItemResponseDTO = z.infer<
  typeof PublicOrderItemResponseDTO
>

export const PublicOrderItemRequestDTO = OrderItemDTO.pick({
  id: true,
  orderId: true,
  quantity: true,
  unitPrice: true,
  productId: true,
})
export type PublicOrderItemRequestDTO = z.infer<
  typeof PublicOrderItemRequestDTO
>

export const OrderItemDTOToPublicOrderItemResponseDTO = (
  orderItem: OrderItemDTO,
  product: PublicProductDTO
): PublicOrderItemResponseDTO => {
  console.log("OrderItem:", orderItem)
  console.log("Product:", product)
  return PublicOrderItemResponseDTO.parse({
    id: orderItem.id,
    orderId: orderItem.orderId,
    quantity: orderItem.quantity,
    unitPrice: orderItem.unitPrice,
    product: product,
  })
}

export const BaseOrderDTO = z.object({
  // TODO: should this map directly to the database schema?
  id: z.string(),
  organizationId: z.string(),
  status: z.string(),
  scheduledOrderDate: z.date(),
  orderPlacedDate: z.date(),
  taxPaid: z.number(),
  shippingCost: z.number(),
  totalAmount: z.number(),
  placedBy: z.string(),
  updatedBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type BaseOrderDTO = z.infer<typeof BaseOrderDTO>

export const PublicOrderDTO = BaseOrderDTO.pick({
  id: true,
  organizationId: true,
  status: true,
  scheduledOrderDate: true,
  orderPlacedDate: true,
  taxPaid: true,
  shippingCost: true,
  totalAmount: true,
}).extend({
  orderItems: z.array(PublicOrderItemResponseDTO),
})

export type PublicOrderDTO = z.infer<typeof PublicOrderDTO>

export const PlaceCurrentOrderRequestDTO = z.object({
  id: z.string(),
  organizationId: z.string(),
  status: z.string(),
  scheduledOrderDate: z.date(),
  orderPlacedDate: z.date(),
  taxPaid: z.number(),
  shippingCost: z.number(),
  totalAmount: z.number(),
  placedBy: z.string(),
  orderItems: z.array(PublicOrderItemRequestDTO),
})

export type PlaceCurrentOrderRequestDTO = z.infer<
  typeof PlaceCurrentOrderRequestDTO
>

export const OrderDTOToPublicOrderDTO = (
  order: BaseOrderDTO,
  orderItems: PublicOrderItemResponseDTO[]
): PublicOrderDTO => {
  return PublicOrderDTO.parse({
    id: order.id,
    organizationId: order.organizationId,
    status: order.status,
    scheduledOrderDate: order.scheduledOrderDate,
    orderPlacedDate: order.orderPlacedDate,
    taxPaid: order.taxPaid,
    shippingCost: order.shippingCost,
    totalAmount: order.totalAmount,
    orderItems: orderItems,
  })
}

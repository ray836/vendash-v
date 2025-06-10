import { PublicProductDTO } from "@/domains/Product/DTOs/productDTOs"
import { z } from "zod"

export const OrderItemDTO = z.object({
  id: z.string({
    message: "id is required",
  }),
  orderId: z.string({
    message: "orderId is required",
  }),
  productId: z.string({
    message: "productId is required",
  }),
  quantity: z.number({
    message: "quantity is required",
  }),
  unitPrice: z.number({
    message: "unitPrice is required",
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
})

export const PublicOrderItemResponseDTO = OrderItemDTO.pick({
  id: true,
  orderId: true,
  quantity: true,
  unitPrice: true,
}).extend({
  product: PublicProductDTO,
})

export const PublicOrderItemRequestDTO = OrderItemDTO.pick({
  id: true,
  orderId: true,
  quantity: true,
  unitPrice: true,
  productId: true,
})

export const BaseOrderDTO = z.object({
  id: z.string({
    message: "id is required",
  }),
  organizationId: z.string({
    message: "organizationId is required",
  }),
  status: z.string({
    message: "status is required",
  }),
  scheduledOrderDate: z.date(),
  orderPlacedDate: z.date(),
  taxPaid: z.number({
    message: "taxPaid is required",
  }),
  shippingCost: z.number({
    message: "shippingCost is required",
  }),
  totalAmount: z.number({
    message: "totalAmount is required",
  }),
  placedBy: z.string(),
  updatedBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

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

export const PlaceCurrentOrderRequestDTO = z.object({
  id: z.string({
    message: "id is required",
  }),
  organizationId: z.string({
    message: "organizationId is required",
  }),
  status: z.string({
    message: "status is required",
  }),
  scheduledOrderDate: z.date(),
  orderPlacedDate: z.date(),
  taxPaid: z.number({
    message: "taxPaid is required",
  }),
  shippingCost: z.number({
    message: "shippingCost is required",
  }),
  totalAmount: z.number({
    message: "totalAmount is required",
  }),
  placedBy: z.string(),
  orderItems: z.array(PublicOrderItemRequestDTO),
})

export type OrderItemDTO = z.infer<typeof OrderItemDTO>
export type PublicOrderItemResponseDTO = z.infer<
  typeof PublicOrderItemResponseDTO
>
export type PublicOrderItemRequestDTO = z.infer<
  typeof PublicOrderItemRequestDTO
>
export type BaseOrderDTO = z.infer<typeof BaseOrderDTO>
export type PublicOrderDTO = z.infer<typeof PublicOrderDTO>
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

export const OrderItemDTOToPublicOrderItemResponseDTO = (
  orderItem: OrderItemDTO,
  product: PublicProductDTO
): PublicOrderItemResponseDTO => {
  return PublicOrderItemResponseDTO.parse({
    id: orderItem.id,
    orderId: orderItem.orderId,
    quantity: orderItem.quantity,
    unitPrice: orderItem.unitPrice,
    product,
  })
}

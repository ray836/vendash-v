import { z } from "zod"

export const BaseSlotDTO = z.object({
  id: z.string({
    required_error: "id is required",
  }),
  machineId: z.string({
    required_error: "machineId is required",
  }),
  productId: z.string({
    required_error: "productId is required",
  }),
  labelCode: z.string({
    required_error: "labelCode is required",
  }),
  ccReaderCode: z.string(),
  cardReaderId: z.string(),
  price: z.number({
    required_error: "price is required",
  }),
  sequenceNumber: z.number(),
  capacity: z.number(),
  currentQuantity: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  updatedBy: z.string(),
})

export type BaseSlotDTO = z.infer<typeof BaseSlotDTO>

export const PublicSlotDTO = BaseSlotDTO.pick({
  machineId: true,
  productId: true,
  labelCode: true,
  ccReaderCode: true,
  price: true,
  capacity: true,
  currentQuantity: true,
}).extend({
  id: z.string().optional(),
  row: z.string(),
  column: z.number(),
})

export const PUblicSlotWithProductDTO = PublicSlotDTO.extend({
  productName: z.string(),
  productImage: z.string(),
})

export type PublicSlotDTO = z.infer<typeof PublicSlotDTO>
export type PublicSlotWithProductDTO = z.infer<typeof PUblicSlotWithProductDTO>

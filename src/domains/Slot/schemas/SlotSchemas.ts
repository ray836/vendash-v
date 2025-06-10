import { z } from "zod"
const base = z.object({
  id: z.string().uuid({
    message: "id is required",
  }),
  organizationId: z.string().uuid({
    message: "organizationId is required",
  }),
  machineId: z.string().uuid({
    message: "machineId is required",
  }),
  productId: z.string().uuid({
    message: "productId is required",
  }),
  labelCode: z.string().min(1, {
    message: "labelCode is required",
  }),
  ccReaderCode: z.string().optional(),
  cardReaderId: z.string().optional(),
  price: z.number().min(0, {
    message: "price is required",
  }),
  sequenceNumber: z.number().min(1),
  capacity: z.number().min(0),
  currentQuantity: z.number().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
})

const publicSlot = base.pick({
  id: true,
  organizationId: true,
  machineId: true,
  productId: true,
  labelCode: true,
  ccReaderCode: true,
  cardReaderId: true,
  price: true,
  sequenceNumber: true,
  capacity: true,
  currentQuantity: true,
})

const publicSlotWithProduct = publicSlot.extend({
  productName: z.string(),
  productImage: z.string().optional(),
})
// TODO: check if we must include row and column
export const SlotSchemas = {
  base: base,
  public: publicSlot,
  publicWithProduct: publicSlotWithProduct,
}

export type BaseSlotDTO = z.infer<typeof SlotSchemas.base>
export type PublicSlotDTO = z.infer<typeof SlotSchemas.public>
export type PublicSlotWithProductDTO = z.infer<
  typeof SlotSchemas.publicWithProduct
>

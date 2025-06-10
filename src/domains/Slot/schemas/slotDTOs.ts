// import { z } from "zod"

// export const BaseSlotDTO = z.object({
//   id: z.string().uuid({
//     message: "id is required",
//   }),
//   organizationId: z.string().uuid({
//     message: "organizationId is required",
//   }),
//   machineId: z.string().uuid({
//     message: "machineId is required",
//   }),
//   productId: z.string().uuid({
//     message: "productId is required",
//   }),
//   labelCode: z.string().min(1, {
//     message: "labelCode is required",
//   }),
//   ccReaderCode: z.string().optional(),
//   cardReaderId: z.string().optional(),
//   price: z.number().min(0, {
//     message: "price is required",
//   }),
//   sequenceNumber: z.number().min(1),
//   capacity: z.number().min(0),
//   currentQuantity: z.number().min(0),
//   row: z.string().optional(),
//   column: z.number().optional(),
//   createdAt: z.date(),
//   updatedAt: z.date(),
//   createdBy: z.string(),
//   updatedBy: z.string(),
// })

// export const PublicSlotDTO = BaseSlotDTO.omit({
//   createdBy: true,
//   updatedBy: true,
// })

// export const CreateSlotRequestDTO = z.object({
//   machineId: z.string().uuid(),
//   productId: z.string().uuid(),
//   labelCode: z.string().min(1),
//   ccReaderCode: z.string().optional(),
//   cardReaderId: z.string().optional(),
//   price: z.number().min(0),
//   capacity: z.number().min(0),
//   currentQuantity: z.number().min(0),
//   row: z.string().optional(),
//   column: z.number().optional(),
//   organizationId: z.string().uuid(),
// })

// export const UpdateSlotRequestDTO = CreateSlotRequestDTO.partial()

// export const PublicSlotWithProductDTO = PublicSlotDTO.extend({
//   productName: z.string(),
//   productImage: z.string().optional(),
// })

// export type BaseSlotDTO = z.infer<typeof BaseSlotDTO>
// export type PublicSlotDTO = z.infer<typeof PublicSlotDTO>
// export type CreateSlotRequestDTO = z.infer<typeof CreateSlotRequestDTO>
// export type UpdateSlotRequestDTO = z.infer<typeof UpdateSlotRequestDTO>
// export type PublicSlotWithProductDTO = z.infer<typeof PublicSlotWithProductDTO>

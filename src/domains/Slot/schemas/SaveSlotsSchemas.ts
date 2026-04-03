import { SlotSchemas } from "./SlotSchemas"
import { z } from "zod"

const saveSlot = SlotSchemas.base
  .pick({
    machineId: true,
    labelCode: true,
    price: true,
    capacity: true,
    ccReaderCode: true,
    cardReaderId: true,
    currentQuantity: true,
  })
  .extend({
    id: z.string().optional(),
    productId: z.string().uuid().nullable().optional(),
    rowKey: z.string().nullable().optional(),
    colIndex: z.number().int().nullable().optional(),
  })

export const SaveSlotsSchemas = {
  saveSlot: saveSlot,
  request: z.object({
    slots: saveSlot.array(),
    machineId: z.string(),
    organizationId: z.string(),
    userId: z.string(),
    ccReaderId: z.string().optional(),
  }),
}

export type SaveSlotRequest = z.infer<typeof SaveSlotsSchemas.request>
export type SaveSlot = z.infer<typeof SaveSlotsSchemas.saveSlot>

import { z } from "zod"

export enum PreKitStatus {
  OPEN = "OPEN",
  PICKED = "PICKED",
  STOCKED = "STOCKED",
}
const basePreKit = z.object({
  id: z.string(),
  machineId: z.string(),
  status: z.nativeEnum(PreKitStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
})

const basePreKitItem = z.object({
  id: z.string(),
  preKitId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  slotId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
})

const publicPreKitItem = basePreKitItem
  .pick({
    id: true,
    preKitId: true,
    productId: true,
    quantity: true,
    slotId: true,
  })
  .extend({
    productImage: z.string(),
    productName: z.string(),
    currentQuantity: z.number(),
    capacity: z.number(),
    slotCode: z.string(),
  })

const publicPreKitWithItems = basePreKit
  .pick({
    id: true,
    machineId: true,
    status: true,
  })
  .extend({
    items: z.array(publicPreKitItem),
  })

export const PreKitSchemas = {
  basePreKit,
  basePreKitItem,
  publicPreKitItem,
  publicPreKitWithItems,
}

export type BasePreKit = z.infer<typeof PreKitSchemas.basePreKit>
export type BasePreKitItem = z.infer<typeof PreKitSchemas.basePreKitItem>
export type PublicPreKitItem = z.infer<typeof PreKitSchemas.publicPreKitItem>
export type PublicPreKit = z.infer<typeof PreKitSchemas.publicPreKitWithItems>

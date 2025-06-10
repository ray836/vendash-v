import { z } from "zod"
import { PreKitSchemas } from "./PrekitSchemas"

const createPreKitItemRequest = z.object({
  productId: z.string(),
  quantity: z.number(),
  slotId: z.string(),
})

const createPreKitRequest = z.object({
  machineId: z.string(),
  userId: z.string(),
  items: z.array(createPreKitItemRequest),
})

export const CreatePreKitSchemas = {
  createPreKitRequest,
  createPreKitResponse: PreKitSchemas.publicPreKitWithItems,
  createPreKitItemRequest,
}

export type CreatePreKitRequest = z.infer<
  typeof CreatePreKitSchemas.createPreKitRequest
>

export type CreatePreKitResponse = z.infer<
  typeof CreatePreKitSchemas.createPreKitResponse
>

export type CreatePreKitItemRequest = z.infer<
  typeof CreatePreKitSchemas.createPreKitItemRequest
>

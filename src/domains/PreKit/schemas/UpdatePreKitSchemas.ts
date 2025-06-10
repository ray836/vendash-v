import { z } from "zod"
import { PreKitSchemas } from "./PrekitSchemas"

const updatePreKitItemRequest = PreKitSchemas.basePreKitItem.pick({
  id: true,
  slotId: true,
  quantity: true,
  productId: true,
})

const request = z.object({
  id: z.string(),
  userId: z.string(),
  items: z.array(updatePreKitItemRequest),
})

export const UpdatePreKitSchemas = {
  request,
  updatePreKitItemRequest,
}

export type UpdatePreKitRequest = z.infer<typeof UpdatePreKitSchemas.request>
export type UpdatePreKitItemRequest = z.infer<
  typeof UpdatePreKitSchemas.updatePreKitItemRequest
>

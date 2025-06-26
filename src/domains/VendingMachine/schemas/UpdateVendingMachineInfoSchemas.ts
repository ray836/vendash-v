import { z } from "zod"
import { PublicVendingMachineDTO } from "./vendingMachineDTOs"
export const UpdateVendingMachineInfoSchemas = {
  request: z.object({
    model: z.string().optional(),
    notes: z.string().optional(),
    locationId: z.string().optional(),
  }),
  response: PublicVendingMachineDTO,
}

export type UpdateVendingMachineInfoRequestDTO = z.infer<
  typeof UpdateVendingMachineInfoSchemas.request
>
export type UpdateVendingMachineInfoResponseDTO = z.infer<
  typeof UpdateVendingMachineInfoSchemas.response
>

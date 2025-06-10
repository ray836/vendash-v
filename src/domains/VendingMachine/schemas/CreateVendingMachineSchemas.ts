import { z } from "zod"
import {
  BaseVendingMachineDTO,
  PublicVendingMachineDTO,
} from "./vendingMachineDTOs"

export const CreateVendingMachineSchemas = {
  request: BaseVendingMachineDTO.pick({
    type: true,
    locationId: true,
    model: true,
    organizationId: true,
  }).extend({
    notes: z.string().optional(),
    cardReaderId: z.string().optional(),
  }),
  response: PublicVendingMachineDTO,
}

export type CreateVendingMachineRequestDTO = z.infer<
  typeof CreateVendingMachineSchemas.request
>
export type CreateVendingMachineResponseDTO = z.infer<
  typeof CreateVendingMachineSchemas.response
>

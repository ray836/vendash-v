import { z } from "zod"
import { MachineStatus } from "../entities/VendingMachine"
import { PublicVendingMachineDTO } from "./vendingMachineDTOs"
export const UpdateVendingMachineStatusSchemas = {
  request: z.object({
    status: z.enum([
      MachineStatus.ONLINE,
      MachineStatus.OFFLINE,
      MachineStatus.MAINTENANCE,
      MachineStatus.LOW_STOCK,
    ]),
  }),
  response: PublicVendingMachineDTO,
}

export type UpdateVendingMachineStatusRequestDTO = z.infer<
  typeof UpdateVendingMachineStatusSchemas.request
>
export type UpdateVendingMachineStatusResponseDTO = z.infer<
  typeof UpdateVendingMachineStatusSchemas.response
>

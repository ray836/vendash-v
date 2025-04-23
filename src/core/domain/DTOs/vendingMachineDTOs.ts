import { z } from "zod"
import { MachineStatus, MachineType } from "../entities/VendingMachine"
export const BaseVendingMachineDTO = z.object({
  id: z.string({
    required_error: "id is required",
  }),
  locationId: z.string({
    required_error: "locationId is required",
  }),
  cardReaderId: z.string(),
  model: z.string(),
  notes: z.string(),
  organizationId: z.string({
    required_error: "organizationId is required",
  }),
  type: z.enum([MachineType.DRINK, MachineType.SNACK], {
    required_error: "type is required",
  }),
  status: z.enum(
    [
      MachineStatus.ONLINE,
      MachineStatus.OFFLINE,
      MachineStatus.MAINTENANCE,
      MachineStatus.LOW_STOCK,
    ],
    {
      required_error: "status is required",
    }
  ),
  createdBy: z.string({
    required_error: "createdBy is required",
  }),
  updatedBy: z.string(),
  createdAt: z.date({
    required_error: "createdAt is required",
  }),
  updatedAt: z.date(),
})
export type BaseVendingMachineDTO = z.infer<typeof BaseVendingMachineDTO>

export const PublicVendingMachineDTO = BaseVendingMachineDTO.pick({
  id: true,
  locationId: true,
  cardReaderId: true,
  model: true,
  notes: true,
  type: true,
  status: true,
  organizationId: true,
})
export type PublicVendingMachineDTO = z.infer<typeof PublicVendingMachineDTO>

export const BaseVendingMachineDTOToPublicVendingMachineDTO = (
  machine: BaseVendingMachineDTO
): PublicVendingMachineDTO => {
  return PublicVendingMachineDTO.parse({
    id: machine.id,
    locationId: machine.locationId,
    cardReaderId: machine.cardReaderId,
    model: machine.model,
    notes: machine.notes,
    type: machine.type,
    status: machine.status,
    organizationId: machine.organizationId,
  })
}

export const CreateVendingMachineRequestDTO = BaseVendingMachineDTO.pick({
  locationId: true,
  cardReaderId: true,
  model: true,
  type: true,
  notes: true,
  organizationId: true,
}).extend({
  id: z.string().optional(),
})
export type CreateVendingMachineRequestDTO = z.infer<
  typeof CreateVendingMachineRequestDTO
>

export const CreateVendingMachineResponseDTO = BaseVendingMachineDTO.pick({
  id: true,
})
export type CreateVendingMachineResponseDTO = z.infer<
  typeof CreateVendingMachineResponseDTO
>

export const UpdateVendingMachineRequestDTO = BaseVendingMachineDTO.pick({
  type: true,
  locationId: true,
  notes: true,
  model: true,
  cardReaderId: true,
}).partial()

export type UpdateVendingMachineRequestDTO = z.infer<
  typeof UpdateVendingMachineRequestDTO
>

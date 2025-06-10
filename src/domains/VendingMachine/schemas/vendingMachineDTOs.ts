import { z } from "zod"
import { MachineStatus, MachineType } from "../entities/VendingMachine"
import { SlotSchemas } from "@/domains/Slot/schemas/SlotSchemas"
export const BaseVendingMachineDTO = z.object({
  id: z.string(),
  type: z.enum([MachineType.DRINK, MachineType.SNACK]),
  locationId: z.string(),
  model: z.string().min(1),
  notes: z.string().optional(),
  status: z.enum([
    MachineStatus.ONLINE,
    MachineStatus.OFFLINE,
    MachineStatus.MAINTENANCE,
    MachineStatus.LOW_STOCK,
  ]),
  organizationId: z.string(),
  cardReaderId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
})

export const PublicVendingMachineDTO = BaseVendingMachineDTO.omit({
  createdBy: true,
  updatedBy: true,
})

export const CreateVendingMachineRequestDTO = z.object({
  type: z.enum([MachineType.DRINK, MachineType.SNACK]),
  locationId: z.string(),
  model: z.string().min(1),
  notes: z.string().optional(),
  organizationId: z.string(),
  cardReaderId: z.string().optional(),
})

export const MachineWithSlotsDTO = PublicVendingMachineDTO.extend({
  slots: z.array(SlotSchemas.publicWithProduct),
  setup: z.object({
    status: z.enum(["complete", "incomplete"]),
    percentage: z.number(),
  }),
  lastRestocked: z.date().optional(),
  lastMaintenance: z.date().optional(),
})

export const MachineDetailDataDTO = z.object({
  machine: MachineWithSlotsDTO,
  slots: z.array(SlotSchemas.publicWithProduct),
  revenue: z.object({
    daily: z.number(),
    weekly: z.number(),
    monthly: z.number(),
  }),
  setup: z.object({
    status: z.enum(["complete", "incomplete"]),
    percentage: z.number(),
  }),
  lastRestocked: z.date().optional(),
  lastMaintenance: z.date().optional(),
  alerts: z.array(z.string()),
})

export const UpdateVendingMachineRequestDTO =
  CreateVendingMachineRequestDTO.partial()

export const UpdateVendingMachineStatusRequestDTO = z.object({
  status: z.enum([
    MachineStatus.ONLINE,
    MachineStatus.OFFLINE,
    MachineStatus.MAINTENANCE,
    MachineStatus.LOW_STOCK,
  ]),
})

export type BaseVendingMachineDTO = z.infer<typeof BaseVendingMachineDTO>
export type PublicVendingMachineDTO = z.infer<typeof PublicVendingMachineDTO>
export type CreateVendingMachineRequestDTO = z.infer<
  typeof CreateVendingMachineRequestDTO
>
export type UpdateVendingMachineRequestDTO = z.infer<
  typeof UpdateVendingMachineRequestDTO
>
export type UpdateVendingMachineStatusRequestDTO = z.infer<
  typeof UpdateVendingMachineStatusRequestDTO
>
export type MachineWithSlotsDTO = z.infer<typeof MachineWithSlotsDTO>
export type MachineDetailDataDTO = z.infer<typeof MachineDetailDataDTO>

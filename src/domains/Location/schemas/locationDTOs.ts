import { z } from "zod"

export const BaseLocationDTO = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().min(1),
  organizationId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
})

export const PublicLocationDTO = BaseLocationDTO.omit({
  createdBy: true,
  updatedBy: true,
})

export const CreateLocationRequestDTO = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  organizationId: z.string().uuid(),
})

export const UpdateLocationRequestDTO = CreateLocationRequestDTO.partial()

export type BaseLocationDTO = z.infer<typeof BaseLocationDTO>
export type PublicLocationDTO = z.infer<typeof PublicLocationDTO>
export type CreateLocationRequestDTO = z.infer<typeof CreateLocationRequestDTO>
export type UpdateLocationRequestDTO = z.infer<typeof UpdateLocationRequestDTO>

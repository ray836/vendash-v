import { z } from "zod"
import { UserRole } from "../entities/User"

export const BaseUserDTO = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  organizationId: z.string(),
  role: z.nativeEnum(UserRole),
  password: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
})

export type BaseUserDTO = z.infer<typeof BaseUserDTO>

export const PublicUserDTO = BaseUserDTO.pick({
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  organizationId: true,
  role: true,
})

export type PublicUserDTO = z.infer<typeof PublicUserDTO>

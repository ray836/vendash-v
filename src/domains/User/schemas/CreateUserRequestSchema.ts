import { BaseUserDTO, PublicUserDTO } from "./UserSchemas"
import { z } from "zod"

export const CreateUserSchemas = {
  request: BaseUserDTO.pick({
    firstName: true,
    lastName: true,
    email: true,
    organizationId: true,
    role: true,
    password: true,
  }),
  response: PublicUserDTO,
}

export type CreateUserRequestDTO = z.infer<typeof CreateUserSchemas.request>
export type CreateUserResponseDTO = z.infer<typeof CreateUserSchemas.response>

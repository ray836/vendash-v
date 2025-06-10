import { BaseUserDTO, PublicUserDTO } from "./UserSchemas"
import { z } from "zod"

export const UpdateUserSchemas = {
  request: BaseUserDTO.partial(),
  response: PublicUserDTO,
}

export type UpdateUserRequestDTO = z.infer<typeof UpdateUserSchemas.request>
export type UpdateUserResponseDTO = z.infer<typeof UpdateUserSchemas.response>

import { z } from "zod"
import { PreKitSchemas } from "./PrekitSchemas"

const getMachinePreKitRequest = z.object({
  machineId: z.string(),
})

const getMachinePreKitResponse = PreKitSchemas.publicPreKitWithItems

export const GetMachinePreKitUseCaseSchemas = {
  getMachinePreKitRequest,
  getMachinePreKitResponse,
}

export type GetMachinePreKitRequest = z.infer<
  typeof GetMachinePreKitUseCaseSchemas.getMachinePreKitRequest
>

export type GetMachinePreKitResponse = z.infer<
  typeof GetMachinePreKitUseCaseSchemas.getMachinePreKitResponse
>

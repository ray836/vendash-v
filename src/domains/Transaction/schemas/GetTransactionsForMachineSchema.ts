import { z } from "zod"
import { TransactionSchemas } from "./TransactionSchemas"

const response = z.object({
  transactions: z.array(TransactionSchemas.public),
  dailyAverage: z.number(),
  daily: z.array(TransactionSchemas.public),
  weeklyAverage: z.number(),
  weekly: z.array(TransactionSchemas.public),
  monthlyAverage: z.number(),
  monthly: z.array(TransactionSchemas.public),
})

export const GetTransactionsForMachineSchema = {
  request: z.object({
    machineId: z.string(),
    startDate: z.date(),
    endDate: z.date(),
  }),
  response: response,
}

export type GetTransactionsForMachineRequestDTO = z.infer<
  typeof GetTransactionsForMachineSchema.request
>
export type GetTransactionsForMachineResponseDTO = z.infer<
  typeof GetTransactionsForMachineSchema.response
>

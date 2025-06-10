import { z } from "zod"

export enum GroupByType {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
}

const response = z.object({
  totalSales: z.number(),
  totalTransactions: z.number(),
  averageSales: z.number(),
  averageTransactions: z.number(),
  groupedBy: z.nativeEnum(GroupByType),
  groupedData: z.array(
    z.object({
      date: z.string(),
      totalSales: z.number(),
      totalTransactions: z.number(),
    })
  ),
})

const request = z.object({
  organizationId: z.string(),
  groupedBy: z.nativeEnum(GroupByType),
  startDate: z.date(),
  endDate: z.date(),
})

export const GetTransactionGraphDataSchemas = {
  response: response,
  request: request,
}

export type GetTransactionGraphDataResponseDTO = z.infer<
  typeof GetTransactionGraphDataSchemas.response
>
export type GetTransactionGraphDataRequestDTO = z.infer<
  typeof GetTransactionGraphDataSchemas.request
>

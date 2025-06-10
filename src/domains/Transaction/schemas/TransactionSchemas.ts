import { z } from "zod"
import { TransactionItemSchemas } from "./TransactionItemSchemas"
const base = z.object({
  id: z.string(),
  organizationId: z.string(),
  transactionType: z.string(),
  createdAt: z.date(),
  total: z.number(),
  last4CardDigits: z.string(),
  cardReaderId: z.string(),
  data: z.any(),
})

const publicTransaction = base
  .pick({
    id: true,
    organizationId: true,
    transactionType: true,
    createdAt: true,
    total: true,
    cardReaderId: true,
    last4CardDigits: true,
  })
  .extend({
    vendingMachineId: z.string().optional(),
  })

const publicTransactionWithItemsAndProduct = publicTransaction.extend({
  items: z.array(TransactionItemSchemas.public),
})

export const TransactionSchemas = {
  base: base,
  public: publicTransaction,
  publicWithItemsAndProduct: publicTransactionWithItemsAndProduct,
}

export type BaseTransactionDTO = z.infer<typeof TransactionSchemas.base>
export type PublicTransactionDTO = z.infer<typeof TransactionSchemas.public>
export type PublicTransactionWithItemsAndProductDTO = z.infer<
  typeof TransactionSchemas.publicWithItemsAndProduct
>

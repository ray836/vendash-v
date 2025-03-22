import { z } from "zod"

export const TransactionItemDTO = z.object({
  productId: z.string(),
  quantity: z.number(),
  salePrice: z.number(),
})
export type TransactionItemDTOType = z.infer<typeof TransactionItemDTO>

export const BaseTransactionDTO = z.object({
  id: z.string(),
  organizationId: z.string(),
  items: z.array(TransactionItemDTO),
  createdAt: z.date(),
  transactionType: z.enum(["card", "cash"]),
  total: z.number(),
  last4CardDigits: z.string(), // 🔴 Sensitive
})
export type BaseTransactionDTO = z.infer<typeof BaseTransactionDTO>

export const PublicTransactionDTO = BaseTransactionDTO.extend({
  id: z.string(),
  organizationId: z.string(),
  items: z.array(TransactionItemDTO),
  createdAt: z.date(),
  transactionType: z.enum(["card", "cash"]),
  total: z.number(),
})
export type PublicTransactionDTO = z.infer<typeof PublicTransactionDTO>

export function toPublicTransactionDTO(
  transaction: BaseTransactionDTO
): PublicTransactionDTO {
  return PublicTransactionDTO.parse(transaction)
}

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
  cardReaderId: z.string(),
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

// New DTO for transaction item with product data
export const TransactionItemDataDTO = z.object({
  quantity: z.number(),
  salePrice: z.number(),
  slotCode: z.string().optional(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().optional(),
    recommendedPrice: z.number(),
  }),
})
export type TransactionItemDataDTO = z.infer<typeof TransactionItemDataDTO>

// Create new DTO based on PublicTransactionDTO but with different items type
export const PublicTransactionDataDTO = PublicTransactionDTO.omit({
  items: true,
}).extend({
  items: z.array(TransactionItemDataDTO),
  vendingMachineId: z.string().optional(),
})
export type PublicTransactionDataDTO = z.infer<typeof PublicTransactionDataDTO>

// Helper function to convert
export function toPublicTransactionDataDTO(
  transaction: PublicTransactionDTO,
  products: Record<
    string,
    { name: string; image?: string; recommendedPrice: number }
  >,
  vendingMachineId: string | undefined
): PublicTransactionDataDTO {
  return PublicTransactionDataDTO.parse({
    ...transaction,
    vendingMachineId: vendingMachineId,
    items: transaction.items.map((item) => ({
      ...item,
      product: {
        id: item.productId,
        ...products[item.productId],
      },
    })),
  })
}

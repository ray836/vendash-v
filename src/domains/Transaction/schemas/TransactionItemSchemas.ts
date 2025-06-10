import { z } from "zod"
import { PublicProductDTO } from "../../Product/DTOs/productDTOs"
const base = z.object({
  id: z.string(),
  transactionId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  salePrice: z.number(),
  slotCode: z.string(),
})

const publicTransactionItem = base
  .pick({
    id: true,
    productId: true,
    quantity: true,
    salePrice: true,
    slotCode: true,
  })
  .extend({
    product: PublicProductDTO,
  })

export const TransactionItemSchemas = {
  base: base,
  public: publicTransactionItem,
}

export type BaseTransactionItemDTO = z.infer<typeof TransactionItemSchemas.base>
export type PublicTransactionItemDTO = z.infer<
  typeof TransactionItemSchemas.public
>

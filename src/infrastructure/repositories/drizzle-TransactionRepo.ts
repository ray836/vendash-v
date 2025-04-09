import {
  PublicTransactionDataDTO,
  PublicTransactionDTO,
  toPublicTransactionDataDTO,
} from "@/core/domain/DTOs/transactionDTOs"
import { TransactionRepository } from "@/core/domain/interfaces/TransactionRepository"
import { db } from "@/infrastructure/database"
import {
  transactions,
  products as productsTable,
  vendingMachines,
} from "@/infrastructure/database/schema"
import { eq, inArray } from "drizzle-orm"

interface ProductData {
  id: string
  name: string
  image: string
  recommendedPrice: number
}

// First, define the database product type
interface DbProduct {
  id: string
  name: string
  image: string
  recommendedPrice: string // From database it's a string
}

// Add this helper function at the top of the file
function convertTransactionType(dbType: string): "card" | "cash" {
  return dbType === "R" ? "card" : "cash"
}

export class DrizzleTransactionRepo implements TransactionRepository {
  constructor(private readonly database: typeof db) {}
  async findByOrganizationId(
    organizationId: string
  ): Promise<PublicTransactionDataDTO[]> {
    // Get transactions with their items
    const transactionData = await this.database.query.transactions.findMany({
      where: eq(transactions.organizationId, organizationId),
      with: {
        transactionItems: true,
      },
    })

    // Get all card reader IDs from transactions
    const cardReaderIds = new Set(transactionData.map((t) => t.cardReaderId))

    // Fetch vending machines with matching card readers
    const vmData = await this.database.query.vendingMachines.findMany({
      where: inArray(vendingMachines.cardReaderId, Array.from(cardReaderIds)),
      columns: {
        id: true,
        cardReaderId: true,
      },
    })

    // Create card reader to vending machine lookup
    const vmByCardReader = vmData.reduce(
      (acc, vm) => ({
        ...acc,
        [vm.cardReaderId]: vm.id,
      }),
      {} as Record<string, string>
    )

    // Get all unique product IDs from all transactions
    const productIds = new Set(
      transactionData.flatMap((t) =>
        t.transactionItems.map((item) => item.productId)
      )
    )

    // Fetch all required products in one query
    const dbProducts = await this.database.query.products.findMany({
      where: inArray(productsTable.id, Array.from(productIds)),
      columns: {
        id: true,
        name: true,
        image: true,
        recommendedPrice: true,
      },
    })

    // Convert database products to ProductData
    const products: ProductData[] = dbProducts.map((product) => ({
      id: product.id,
      name: product.name,
      image: product.image,
      recommendedPrice: Number(product.recommendedPrice),
    }))

    // Create product lookup map
    const productMap = products.reduce(
      (acc: Record<string, Omit<ProductData, "id">>, product) => ({
        ...acc,
        [product.id]: {
          name: product.name,
          image: product.image,
          recommendedPrice: Number(product.recommendedPrice),
        },
      }),
      {}
    )

    // Transform transactions into PublicTransactionDataDTO format
    return transactionData.map((transaction) => {
      const baseTransaction: PublicTransactionDTO = {
        id: transaction.id,
        organizationId: transaction.organizationId,
        createdAt: transaction.createdAt,
        transactionType: convertTransactionType(transaction.transactionType),
        total: Number(transaction.total),
        cardReaderId: transaction.cardReaderId,
        last4CardDigits: transaction.last4CardDigits,
        items: transaction.transactionItems.map((item) => ({
          productId: item.productId,
          slotCode: item.slotCode,
          quantity: item.quantity,
          salePrice: Number(item.salePrice),
        })),
      }

      // Convert to PublicTransactionDataDTO with product data and vending machine ID
      return toPublicTransactionDataDTO(
        baseTransaction,
        productMap,
        vmByCardReader[transaction.cardReaderId]
      )
    })
  }
}

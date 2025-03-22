"use server"

import { db } from "@/infrastructure/database"
import { DrizzleProductRepository } from "@/infrastructure/repositories/drizzle-ProductRepo"
import { DrizzleInventoryRepository } from "@/infrastructure/repositories/drizzle-InventoryRepo"
import { DrizzleTransactionRepo } from "@/infrastructure/repositories/drizzle-TransactionRepo"
import { GetOrgProductDataMetrics } from "@/core/use-cases/Product/getOrgProductDataMetrics"
export async function getProducts() {
  try {
    const productRepo = new DrizzleProductRepository(db)
    const products = await productRepo.findAll()
    console.log("products", products)

    return JSON.stringify(products)
  } catch (error) {
    console.error("Failed to fetch products:", error)
    throw new Error("Failed to fetch products")
  }
}

export async function getOrgProductDataMetrics(organizationId: string) {
  try {
    const productRepo = new DrizzleProductRepository(db)
    const inventoryRepo = new DrizzleInventoryRepository(db)
    const transactionRepo = new DrizzleTransactionRepo(db)
    const getOrgProductDataMetrics = new GetOrgProductDataMetrics(
      productRepo,
      inventoryRepo,
      transactionRepo
    )
    const productDataMetrics = await getOrgProductDataMetrics.execute(
      organizationId
    )
    return JSON.stringify(productDataMetrics)
  } catch (error) {
    console.error("Failed to fetch product data metrics:", error)
    console.log("error", error)
    throw new Error("Failed to fetch product data metrics")
  }
}

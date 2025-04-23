"use server"

import { db } from "@/infrastructure/database"
import { DrizzleProductRepository } from "@/infrastructure/repositories/drizzle-ProductRepo"
import { DrizzleInventoryRepository } from "@/infrastructure/repositories/drizzle-InventoryRepo"
import { DrizzleTransactionRepo } from "@/infrastructure/repositories/drizzle-TransactionRepo"
import { GetOrgProductDataMetrics } from "@/core/use-cases/Product/getOrgProductDataMetrics"
import { DrizzleSlotRepository } from "@/infrastructure/repositories/drizzle-SlotRepo"
import { ProductUseCase } from "@/core/use-cases/Product/ProductUseCase"
import { Product } from "@/core/domain/entities/Product"

export async function getProducts() {
  try {
    const productRepo = new DrizzleProductRepository(db)
    return await productRepo.findAll()
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
    const slotRepo = new DrizzleSlotRepository(db)

    const getOrgProductDataMetrics = new GetOrgProductDataMetrics(
      productRepo,
      inventoryRepo,
      transactionRepo,
      slotRepo
    )

    return await getOrgProductDataMetrics.execute(organizationId)
  } catch (error) {
    console.error("Failed to fetch product data metrics:", error)
    throw new Error("Failed to fetch product data metrics")
  }
}

export async function createProduct(formData: {
  name: string
  recommendedPrice: number
  category: string
  image: string
  vendorLink: string
  caseCost: number
  caseSize: number
  shippingAvailable: boolean
}) {
  try {
    const productRepo = new DrizzleProductRepository(db)
    const productUseCase = new ProductUseCase(productRepo)

    const newProduct = new Product({
      id: crypto.randomUUID(), // Generate a new UUID
      name: formData.name,
      recommendedPrice: formData.recommendedPrice,
      category: formData.category,
      image: formData.image,
      vendorLink: formData.vendorLink,
      caseCost: formData.caseCost,
      caseSize: formData.caseSize,
      shippingAvailable: formData.shippingAvailable,
      organizationId: "1", // TODO: Get from session/context
      createdAt: new Date(),
      updatedAt: new Date(),
      shippingTimeInDays: 0, // Add default value or add to form
    })

    const createdProduct = await productUseCase.create(newProduct)
    return createdProduct
  } catch (error) {
    console.error("Failed to create product:", error)
    throw new Error("Failed to create product")
  }
}

"use server"

import { db } from "@/infrastructure/database"
import { GetOrgProductDataMetrics } from "@/domains/Product/use-cases/GetOrgProductDataMetrics"
import { ProductUseCase } from "@/domains/Product/use-cases/ProductUseCase"
import { Product } from "@/domains/Product/entities/Product"
import { DrizzleProductRepository } from "@/infrastructure/repositories/DrizzleProductRepository"

export async function getOrgProductDataMetrics(organizationId: string) {
  try {
    const productRepo = new DrizzleProductRepository(db)
    const getOrgProductDataMetrics = new GetOrgProductDataMetrics(productRepo)

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

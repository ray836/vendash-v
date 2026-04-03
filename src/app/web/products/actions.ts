"use server"

import { db } from "@/infrastructure/database"
import { Product } from "@/domains/Product/entities/Product"
import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import * as ProductService from "@/domains/Product/ProductService"
import { generateProductAliases } from "@/lib/generateProductAliases"
import { auth } from "@/lib/auth"

export async function getOrgProductDataMetrics() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const repo = new ProductRepository(db)
    return await ProductService.getOrgProductDataMetrics(repo, organizationId)
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
  vendorSku?: string
  caseCost: number
  caseSize: number
  shippingAvailable: boolean
}) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const repo = new ProductRepository(db)
    const aliases = await generateProductAliases(formData.name)
    const product = new Product({
      id: crypto.randomUUID(),
      name: formData.name,
      recommendedPrice: formData.recommendedPrice,
      category: formData.category,
      image: formData.image,
      vendorLink: formData.vendorLink,
      vendorSku: formData.vendorSku,
      caseCost: formData.caseCost,
      caseSize: formData.caseSize,
      shippingAvailable: formData.shippingAvailable,
      aliases,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      shippingTimeInDays: 0,
    })
    return await ProductService.createProduct(repo, product)
  } catch (error) {
    console.error("Failed to create product:", error)
    throw new Error("Failed to create product")
  }
}

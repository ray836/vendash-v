"use server"

import { db } from "@/infrastructure/database"
import { Product } from "@/domains/Product/entities/Product"
import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import { StandardProductRepository } from "@/infrastructure/repositories/StandardProductRepository"
import { SlotRepository } from "@/infrastructure/repositories/SlotRepository"
import * as ProductService from "@/domains/Product/ProductService"
import { StandardCatalogEntryDTO } from "@/domains/Product/DTOs/standardProductDTOs"
import { generateProductAliases } from "@/lib/generateProductAliases"
import { auth } from "@/lib/auth"

export async function getOrgProductDataMetrics() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const repo = new ProductRepository(db)
    const slotRepo = new SlotRepository(db)
    const slots = await slotRepo.findByOrganizationId(organizationId)
    return await ProductService.getOrgProductDataMetrics(
      repo,
      organizationId,
      slots.map((s) => ({ id: s.id, productId: s.productId, currentQuantity: s.currentQuantity, lastCountedAt: s.lastCountedAt }))
    )
  } catch (error) {
    console.error("Failed to fetch product data metrics:", error)
    throw new Error("Failed to fetch product data metrics")
  }
}

/**
 * The shared catalog for the current org's setup grid: every standard product,
 * each flagged with whether this org has already cloned it.
 */
export async function getStandardCatalog(): Promise<StandardCatalogEntryDTO[]> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  try {
    const standardRepo = new StandardProductRepository(db)
    const productRepo = new ProductRepository(db)

    const [catalog, orgProducts] = await Promise.all([
      standardRepo.findAll(),
      productRepo.findByOrganizationId(organizationId),
    ])

    const addedStandardIds = new Set(
      orgProducts
        .map((p) => p.sourceStandardId)
        .filter((id): id is string => !!id)
    )

    return catalog.map((entry) => ({
      ...entry,
      alreadyAdded: addedStandardIds.has(entry.id),
    }))
  } catch (error) {
    console.error("Failed to fetch standard catalog:", error)
    throw new Error("Failed to fetch standard catalog")
  }
}

/**
 * Clone the given catalog products into the current org as editable, org-scoped
 * products (linked back via sourceStandardId). Products already cloned for this
 * org are skipped, so calling this repeatedly is safe. Returns how many were added.
 */
export async function pickStandardProducts(standardIds: string[]): Promise<{ added: number }> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  if (standardIds.length === 0) return { added: 0 }

  try {
    const standardRepo = new StandardProductRepository(db)
    const productRepo = new ProductRepository(db)

    const [standards, orgProducts] = await Promise.all([
      standardRepo.findByIds(standardIds),
      productRepo.findByOrganizationId(organizationId),
    ])

    const alreadyAdded = new Set(
      orgProducts
        .map((p) => p.sourceStandardId)
        .filter((id): id is string => !!id)
    )
    const toClone = standards.filter((s) => !alreadyAdded.has(s.id))

    for (const standard of toClone) {
      const aliases = await generateProductAliases(standard.name)
      const product = new Product({
        id: crypto.randomUUID(),
        name: standard.name,
        recommendedPrice: standard.recommendedPrice,
        category: standard.category,
        image: standard.image,
        vendorLink: standard.vendorLink ?? "",
        vendorSku: standard.vendorSku,
        barcode: standard.barcode,
        caseCost: standard.caseCost,
        caseSize: standard.caseSize,
        shippingAvailable: true,
        shippingTimeInDays: 0,
        shelfLifeDays: standard.shelfLifeDays,
        aliases,
        sourceStandardId: standard.id,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await ProductService.createProduct(productRepo, product)
    }

    return { added: toClone.length }
  } catch (error) {
    console.error("Failed to add catalog products:", error)
    throw new Error("Failed to add catalog products")
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
  shelfLifeDays?: number
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
      shelfLifeDays: formData.shelfLifeDays,
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

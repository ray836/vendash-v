import { Product } from "./entities/Product"
import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import { StandardProductRepository } from "@/infrastructure/repositories/StandardProductRepository"
import { StandardCatalogEntryDTO } from "./DTOs/standardProductDTOs"
import { generateProductAliases } from "@/lib/generateProductAliases"

/**
 * The shared catalog for an org's picker: every standard product, each flagged
 * with whether this org has already cloned it. Org-parameterized so both the web
 * server action and the mobile API route can call it.
 */
export async function getStandardCatalog(
  standardRepo: StandardProductRepository,
  productRepo: ProductRepository,
  organizationId: string
): Promise<StandardCatalogEntryDTO[]> {
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
}

/**
 * Clone the given catalog products into the org as editable, org-scoped products
 * (linked via sourceStandardId). Products already cloned for this org are skipped,
 * so calling repeatedly is safe. Returns how many were added.
 */
export async function pickStandardProducts(
  standardRepo: StandardProductRepository,
  productRepo: ProductRepository,
  organizationId: string,
  standardIds: string[]
): Promise<{ added: number }> {
  if (standardIds.length === 0) return { added: 0 }

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
    await productRepo.create(product)
  }

  return { added: toClone.length }
}

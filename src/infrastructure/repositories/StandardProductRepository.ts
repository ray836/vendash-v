import { StandardProductDTO } from "@/domains/Product/DTOs/standardProductDTOs"
import { standardProducts } from "@/infrastructure/database/schema"
import { db } from "@/infrastructure/database"
import { inArray } from "drizzle-orm"

export class StandardProductRepository {
  constructor(private readonly database: typeof db) {}

  // Region filtering is not wired up yet (org.region exists but is ignored);
  // every owner sees the full catalog for now.
  async findAll(): Promise<StandardProductDTO[]> {
    const rows = await this.database.select().from(standardProducts)
    return rows.map((row) => this.toDTO(row))
  }

  async findByIds(ids: string[]): Promise<StandardProductDTO[]> {
    if (ids.length === 0) return []
    const rows = await this.database
      .select()
      .from(standardProducts)
      .where(inArray(standardProducts.id, ids))
    return rows.map((row) => this.toDTO(row))
  }

  private toDTO(row: typeof standardProducts.$inferSelect): StandardProductDTO {
    return {
      id: row.id,
      name: row.name,
      recommendedPrice: parseFloat(row.recommendedPrice.toString()),
      category: row.category,
      image: row.image,
      vendorLink: row.vendorLink ?? undefined,
      vendorSku: row.vendorSku ?? undefined,
      barcode: row.barcode ?? undefined,
      caseCost: parseFloat(row.caseCost.toString()),
      caseSize: parseFloat(row.caseSize.toString()),
      shelfLifeDays: row.shelfLifeDays ?? undefined,
      region: row.region ?? undefined,
    }
  }
}

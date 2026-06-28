import { Product } from "@/domains/Product/entities/Product"
import { ProductWithInventorySalesOrderDataDTO } from "@/domains/Product/schemas/ProductSchemas"
import {
  products,
  inventory,
  transactionItems,
  orders,
  orderItems,
  transactions,
} from "@/infrastructure/database/schema"
import { db } from "@/infrastructure/database"
import { eq, sql, and, gte, lte, isNotNull } from "drizzle-orm"
import { randomUUID } from "node:crypto"

export class ProductRepository {
  constructor(private readonly database: typeof db) {}

  async findByOrganizationIdWithInventorySalesOrderData(
    organizationId: string,
    salesStartDate: Date,
    salesEndDate: Date
  ): Promise<ProductWithInventorySalesOrderDataDTO[]> {
    // Recent windows for weighted velocity (computed inside the same aggregate)
    const start7Days = new Date(salesEndDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    const start35Days = new Date(salesEndDate.getTime() - 35 * 24 * 60 * 60 * 1000)

    // Aggregate all transaction data in SQL — returns 1 row per product instead of 1 row per sale
    const salesAgg = this.database
      .select({
        productId: transactionItems.productId,
        totalSales: sql<number>`cast(count(*) as int)`.as('total_sales'),
        totalUnitsSold: sql<number>`cast(coalesce(sum(${transactionItems.quantity}), 0) as int)`.as('total_units_sold'),
        totalRevenue: sql<number>`coalesce(sum(${transactionItems.quantity} * cast(${transactionItems.salePrice} as numeric)), 0)`.as('total_revenue'),
        unitsSold7: sql<number>`cast(coalesce(sum(${transactionItems.quantity}) filter (where ${transactions.createdAt} >= ${start7Days}), 0) as int)`.as('units_sold_7'),
        unitsSold35: sql<number>`cast(coalesce(sum(${transactionItems.quantity}) filter (where ${transactions.createdAt} >= ${start35Days}), 0) as int)`.as('units_sold_35'),
      })
      .from(transactionItems)
      .innerJoin(
        transactions,
        and(
          eq(transactionItems.transactionId, transactions.id),
          eq(transactions.organizationId, organizationId),
          gte(transactions.createdAt, salesStartDate),
          lte(transactions.createdAt, salesEndDate)
        )
      )
      .where(isNotNull(transactionItems.productId))
      .groupBy(transactionItems.productId)
      .as('sales_agg')

    const rows = await this.database
      .select({
        product: products,
        inventory: inventory,
        totalSales: salesAgg.totalSales,
        totalUnitsSold: salesAgg.totalUnitsSold,
        totalRevenue: salesAgg.totalRevenue,
        unitsSold7: salesAgg.unitsSold7,
        unitsSold35: salesAgg.unitsSold35,
        isOnNextOrder: sql<boolean>`exists (
          select 1 from ${orders} o
          join ${orderItems} oi on o.id = oi.order_id
          where oi.product_id = ${products.id}
          and o.status = 'draft'
        )`,
      })
      .from(products)
      .leftJoin(inventory, and(eq(products.id, inventory.productId), eq(inventory.organizationId, organizationId)))
      .leftJoin(salesAgg, eq(products.id, salesAgg.productId))
      .where(eq(products.organizationId, organizationId))

    return rows.map((row) => ({
      product: {
        id: row.product.id,
        name: row.product.name,
        recommendedPrice: parseFloat(row.product.recommendedPrice.toString()),
        category: row.product.category,
        image: row.product.image,
        vendorLink: row.product.vendorLink,
        caseCost: parseFloat(row.product.caseCost.toString()),
        caseSize: parseFloat(row.product.caseSize.toString()),
        shippingAvailable: row.product.shippingAvailable,
        shippingTimeInDays: row.product.shippingTimeInDays,
        shelfLifeDays: row.product.shelfLifeDays ?? undefined,
        aliases: row.product.aliases ?? [],
        organizationId: row.product.organizationId,
        createdAt: row.product.createdAt,
        updatedAt: row.product.updatedAt,
      },
      inventory: row.inventory
        ? {
            productId: row.inventory.productId,
            storage: row.inventory.storage,
            machines: row.inventory.machines,
            organizationId: row.inventory.organizationId,
          }
        : { productId: row.product.id, storage: 0, machines: 0, organizationId },
      salesAgg: {
        totalSales: row.totalSales ?? 0,
        totalUnitsSold: row.totalUnitsSold ?? 0,
        totalRevenue: parseFloat(String(row.totalRevenue ?? '0')),
        unitsSold7: row.unitsSold7 ?? 0,
        unitsSold35: row.unitsSold35 ?? 0,
      },
      OnNextOrder: row.isOnNextOrder,
    }))
  }

  async findByOrganizationId(organizationId: string): Promise<Product[]> {
    const result = await this.database
      .select()
      .from(products)
      .where(eq(products.organizationId, organizationId))
    return result.map((row) => this.toEntity(row))
  }

  async findById(id: string): Promise<Product | null> {
    const result = await this.database
      .select()
      .from(products)
      .where(eq(products.id, id))
    if (result.length === 0) return null
    return this.toEntity(result[0])
  }

  async findByVendorSku(vendorSku: string, organizationId: string): Promise<Product | null> {
    const result = await this.database
      .select()
      .from(products)
      .where(and(eq(products.vendorSku, vendorSku), eq(products.organizationId, organizationId)))
    if (result.length === 0) return null
    return this.toEntity(result[0])
  }

  async create(product: Product): Promise<Product> {
    const result = await this.database
      .insert(products)
      .values({
        id: product.id || randomUUID(),
        name: product.name,
        recommendedPrice: product.recommendedPrice.toString(),
        category: product.category,
        image: product.image,
        vendorLink: product.vendorLink,
        vendorSku: product.vendorSku,
        barcode: product.barcode,
        urlIdentifier: product.urlIdentifier,
        caseCost: product.caseCost.toString(),
        caseSize: product.caseSize.toString(),
        shippingAvailable: product.shippingAvailable,
        shippingTimeInDays: product.shippingTimeInDays,
        reorderPoint: product.reorderPoint ?? null,
        shelfLifeDays: product.shelfLifeDays ?? null,
        aliases: product.aliases ?? [],
        sourceStandardId: product.sourceStandardId ?? null,
        organizationId: product.organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    if (!result[0]) throw new Error("Failed to create product")
    return this.toEntity(result[0])
  }

  async update(product: Product): Promise<Product> {
    const result = await this.database
      .update(products)
      .set({
        name: product.name,
        recommendedPrice: product.recommendedPrice.toString(),
        category: product.category,
        image: product.image,
        vendorLink: product.vendorLink,
        vendorSku: product.vendorSku,
        barcode: product.barcode,
        urlIdentifier: product.urlIdentifier,
        caseCost: product.caseCost.toString(),
        caseSize: product.caseSize.toString(),
        shippingAvailable: product.shippingAvailable,
        shippingTimeInDays: product.shippingTimeInDays,
        reorderPoint: product.reorderPoint ?? null,
        shelfLifeDays: product.shelfLifeDays ?? null,
        aliases: product.aliases ?? [],
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id))
      .returning()

    if (!result[0]) throw new Error("Failed to update product")
    return this.toEntity(result[0])
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(products).where(eq(products.id, id))
  }

  private toEntity(row: typeof products.$inferSelect): Product {
    return new Product({
      id: row.id,
      name: row.name,
      recommendedPrice: parseFloat(row.recommendedPrice.toString()),
      category: row.category,
      image: row.image,
      vendorLink: row.vendorLink,
      vendorSku: row.vendorSku || undefined,
      barcode: row.barcode || undefined,
      urlIdentifier: row.urlIdentifier || undefined,
      caseCost: parseFloat(row.caseCost.toString()),
      caseSize: parseFloat(row.caseSize.toString()),
      shippingAvailable: row.shippingAvailable,
      shippingTimeInDays: row.shippingTimeInDays,
      reorderPoint: row.reorderPoint ?? undefined,
      shelfLifeDays: row.shelfLifeDays ?? undefined,
      aliases: row.aliases ?? [],
      sourceStandardId: row.sourceStandardId ?? undefined,
      organizationId: row.organizationId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }
}

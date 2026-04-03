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
import { eq, sql, and, gte, lte } from "drizzle-orm"
import { randomUUID } from "node:crypto"

export class ProductRepository {
  constructor(private readonly database: typeof db) {}

  async findByOrganizationIdWithInventorySalesOrderData(
    organizationId: string,
    salesStartDate: Date,
    salesEndDate: Date
  ): Promise<ProductWithInventorySalesOrderDataDTO[]> {
    const productsResult = await this.database
      .select({
        product: products,
        inventory: inventory,
        transactionItem: transactionItems,
        transaction: transactions,
        isOnNextOrder: sql<boolean>`exists (
          select 1 from ${orders} o
          join ${orderItems} oi on o.id = oi.order_id
          where oi.product_id = ${products.id}
          and o.status = 'draft'
        )`,
      })
      .from(products)
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .leftJoin(transactionItems, eq(products.id, transactionItems.productId))
      .leftJoin(
        transactions,
        and(
          eq(transactionItems.transactionId, transactions.id),
          gte(transactions.createdAt, salesStartDate),
          lte(transactions.createdAt, salesEndDate)
        )
      )
      .where(eq(products.organizationId, organizationId))

    const productMap = new Map<string, ProductWithInventorySalesOrderDataDTO>()

    for (const row of productsResult) {
      const productId = row.product.id

      if (!productMap.has(productId)) {
        productMap.set(productId, {
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
            : {
                productId,
                storage: 0,
                machines: 0,
                organizationId,
              },
          transactions: [],
          OnNextOrder: row.isOnNextOrder,
        } as ProductWithInventorySalesOrderDataDTO)
      }

      if (row.transactionItem && row.transaction) {
        const productData = productMap.get(productId)!
        productData.transactions.push({
          id: row.transactionItem.id,
          transactionId: row.transactionItem.transactionId,
          productId: row.transactionItem.productId ?? '',
          quantity: row.transactionItem.quantity,
          salePrice: parseFloat(row.transactionItem.salePrice.toString()),
          slotCode: row.transactionItem.slotCode,
        })
      }
    }

    return Array.from(productMap.values())
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
        aliases: product.aliases ?? [],
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
      aliases: row.aliases ?? [],
      organizationId: row.organizationId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }
}

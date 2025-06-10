import { IProductRepository } from "@/domains/Product/repositories/IProductRepository"
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
import { eq, sql, and } from "drizzle-orm"
import { randomUUID } from "node:crypto"

export class DrizzleProductRepository implements IProductRepository {
  constructor(private readonly database: typeof db) {}

  async findByOrganizationIdWithInventorySalesOrderData(
    organizationId: string,
    salesStartDate: Date,
    salesEndDate: Date
  ): Promise<ProductWithInventorySalesOrderDataDTO[]> {
    // Get all products for the organization with a single query
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
        eq(transactionItems.transactionId, transactions.id)
      )
      .where(
        and(
          eq(products.organizationId, organizationId),
          // Only include transactions within the date range
          sql`(${transactions.id} is null or (${transactions.createdAt} >= ${salesStartDate} and ${transactions.createdAt} <= ${salesEndDate}))`
        )
      )

    // Group the results by product ID
    const productMap = new Map<string, ProductWithInventorySalesOrderDataDTO>()

    for (const row of productsResult) {
      const productId = row.product.id

      if (!productMap.has(productId)) {
        // Initialize the product data
        productMap.set(productId, {
          product: {
            id: row.product.id,
            name: row.product.name,
            recommendedPrice: parseFloat(
              row.product.recommendedPrice.toString()
            ),
            category: row.product.category,
            image: row.product.image,
            vendorLink: row.product.vendorLink,
            caseCost: parseFloat(row.product.caseCost.toString()),
            caseSize: parseFloat(row.product.caseSize.toString()),
            shippingAvailable: row.product.shippingAvailable,
            shippingTimeInDays: row.product.shippingTimeInDays,
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
                productId: productId,
                storage: 0,
                machines: 0,
                organizationId: organizationId,
              },
          transactions: [],
          OnNextOrder: row.isOnNextOrder,
        } as ProductWithInventorySalesOrderDataDTO)
      }

      // Add transaction item if it exists and is within the date range
      if (row.transactionItem && row.transaction) {
        const productData = productMap.get(productId)!
        productData.transactions.push({
          id: row.transactionItem.id,
          transactionId: row.transactionItem.transactionId,
          productId: row.transactionItem.productId,
          quantity: row.transactionItem.quantity,
          salePrice: parseFloat(row.transactionItem.salePrice.toString()),
          slotCode: row.transactionItem.slotCode,
        })
      }
    }

    // Convert the map to an array
    return Array.from(productMap.values())
  }

  async findByOrganizationId(organizationId: string): Promise<Product[]> {
    const result = await this.database
      .select()
      .from(products)
      .where(eq(products.organizationId, organizationId))
    return result.map(
      (row) =>
        new Product({
          id: row.id,
          name: row.name,
          recommendedPrice: parseFloat(row.recommendedPrice.toString()),
          category: row.category,
          image: row.image,
          vendorLink: row.vendorLink,
          caseCost: parseFloat(row.caseCost.toString()),
          caseSize: parseFloat(row.caseSize.toString()),
          shippingAvailable: row.shippingAvailable,
          shippingTimeInDays: row.shippingTimeInDays,
          organizationId: row.organizationId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        })
    )
  }

  async findById(id: string): Promise<Product | null> {
    const result = await this.database
      .select()
      .from(products)
      .where(eq(products.id, id))
    if (result.length === 0) return null
    const row = result[0]
    return new Product({
      id: row.id,
      name: row.name,
      recommendedPrice: parseFloat(row.recommendedPrice.toString()),
      category: row.category,
      image: row.image,
      vendorLink: row.vendorLink,
      caseCost: parseFloat(row.caseCost.toString()),
      caseSize: parseFloat(row.caseSize.toString()),
      shippingAvailable: row.shippingAvailable,
      shippingTimeInDays: row.shippingTimeInDays,
      organizationId: row.organizationId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
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
        caseCost: product.caseCost.toString(),
        caseSize: product.caseSize.toString(),
        shippingAvailable: product.shippingAvailable,
        shippingTimeInDays: product.shippingTimeInDays,
        organizationId: product.organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    const createdProduct = result[0]
    if (!createdProduct) {
      throw new Error("Failed to create product")
    }

    // Return a new Product entity
    return new Product({
      id: createdProduct.id,
      name: createdProduct.name,
      recommendedPrice: parseFloat(createdProduct.recommendedPrice.toString()),
      category: createdProduct.category,
      image: createdProduct.image,
      vendorLink: createdProduct.vendorLink,
      caseCost: parseFloat(createdProduct.caseCost.toString()),
      caseSize: parseFloat(createdProduct.caseSize.toString()),
      shippingAvailable: createdProduct.shippingAvailable,
      shippingTimeInDays: createdProduct.shippingTimeInDays,
      organizationId: createdProduct.organizationId,
      createdAt: createdProduct.createdAt,
      updatedAt: createdProduct.updatedAt,
    })
  }
}

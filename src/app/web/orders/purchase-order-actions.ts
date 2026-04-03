"use server"

import { db } from "@/infrastructure/database"
import { purchaseOrders, purchaseOrderItems, products } from "@/infrastructure/database/schema"
import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"

interface ParsedReceiptItem {
  vendorSku: string
  quantity: number
  productName?: string
  unitPrice?: number
  totalPrice?: number
}

/**
 * Find products in catalog by vendor SKU
 */
export async function findProductsBySkus(skus: string[]) {
  try {
    const matchedProducts = await db
      .select({
        id: products.id,
        name: products.name,
        vendorSku: products.vendorSku,
        caseCost: products.caseCost,
        image: products.image,
      })
      .from(products)
      .where(
        // Match any of the provided SKUs
        skus.length > 0
          ? eq(products.vendorSku, skus[0]) // This will be extended with OR logic
          : eq(products.id, "impossible-id") // No match if empty
      )

    return {
      success: true,
      data: matchedProducts,
    }
  } catch (error) {
    console.error("Error finding products by SKUs:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to find products",
    }
  }
}

/**
 * Create a new purchase order from receipt data
 */
export async function createPurchaseOrder(data: {
  organizationId: string
  receiptImageUrl?: string
  parsedItems: ParsedReceiptItem[]
  totalAmount?: number
  notes?: string
  userId: string
}) {
  try {
    const { organizationId, receiptImageUrl, parsedItems, totalAmount, notes, userId } = data

    // Create the purchase order record
    const purchaseOrderId = randomUUID()

    await db.insert(purchaseOrders).values({
      id: purchaseOrderId,
      organizationId,
      receiptImageUrl: receiptImageUrl || null,
      totalAmount: totalAmount?.toString() || null,
      status: "recorded",
      notes: notes || null,
      uploadedAt: new Date(),
      createdBy: userId,
      createdAt: new Date(),
    })

    // For each item, try to match to product in catalog
    const itemsToInsert = []

    for (const item of parsedItems) {
      // Try to find matching product by vendor SKU
      let matchedProductId: string | null = null

      if (item.vendorSku) {
        const matchedProducts = await db
          .select({ id: products.id })
          .from(products)
          .where(eq(products.vendorSku, item.vendorSku))
          .limit(1)

        if (matchedProducts.length > 0) {
          matchedProductId = matchedProducts[0].id
        }
      }

      itemsToInsert.push({
        id: randomUUID(),
        purchaseOrderId,
        productId: matchedProductId,
        vendorSku: item.vendorSku,
        quantity: item.quantity,
        unitPrice: item.unitPrice?.toString() || null,
        totalPrice: item.totalPrice?.toString() || null,
        productName: item.productName || null,
        createdAt: new Date(),
      })
    }

    // Insert all items
    if (itemsToInsert.length > 0) {
      await db.insert(purchaseOrderItems).values(itemsToInsert)
    }

    return {
      success: true,
      data: {
        purchaseOrderId,
        itemsCreated: itemsToInsert.length,
        itemsMatched: itemsToInsert.filter(i => i.productId !== null).length,
      },
    }
  } catch (error) {
    console.error("Error creating purchase order:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create purchase order",
    }
  }
}

/**
 * Get all purchase orders for an organization
 */
export async function getPurchaseOrders(organizationId: string) {
  try {
    const orders = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.organizationId, organizationId))
      .orderBy(purchaseOrders.createdAt)

    return {
      success: true,
      data: orders,
    }
  } catch (error) {
    console.error("Error fetching purchase orders:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch purchase orders",
    }
  }
}

/**
 * Get purchase order details with items
 */
export async function getPurchaseOrderDetails(purchaseOrderId: string) {
  try {
    const order = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, purchaseOrderId))
      .limit(1)

    if (order.length === 0) {
      return {
        success: false,
        error: "Purchase order not found",
      }
    }

    const items = await db
      .select({
        id: purchaseOrderItems.id,
        vendorSku: purchaseOrderItems.vendorSku,
        quantity: purchaseOrderItems.quantity,
        unitPrice: purchaseOrderItems.unitPrice,
        totalPrice: purchaseOrderItems.totalPrice,
        productName: purchaseOrderItems.productName,
        product: {
          id: products.id,
          name: products.name,
          image: products.image,
        },
      })
      .from(purchaseOrderItems)
      .leftJoin(products, eq(purchaseOrderItems.productId, products.id))
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId))

    return {
      success: true,
      data: {
        order: order[0],
        items,
      },
    }
  } catch (error) {
    console.error("Error fetching purchase order details:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch purchase order details",
    }
  }
}

"use server"

import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import { InventoryRepository } from "@/infrastructure/repositories/InventoryRepository"
import { TransactionRepository } from "@/infrastructure/repositories/TransactionRepository"
import { OrderRepository } from "@/infrastructure/repositories/OrderRepository"
import { db } from "@/infrastructure/database"
import { Product } from "@/domains/Product/entities/Product"
import * as ProductService from "@/domains/Product/ProductService"
import { auth } from "@/lib/auth"

export interface ProductDetailData {
  id: string
  name: string
  aliases: string[]
  image: string
  price: number
  costPrice: number
  caseCost: number
  profitMargin: number
  sku: string
  barcode: string
  supplier: string
  vendorUrl: string
  leadTime: number
  shippingAvailable: boolean
  caseQuantity: number
  minOrderQuantity: number
  category: string
  inventory: {
    total: number
    storage: number
    machines: number
  }
  reorderPoint: number
  reorderStatus: "critical" | "warning" | "ok"
  daysUntilStockout: number
  sales: {
    daily: number
    weekly: number
    trend: "up" | "down" | "stable"
    velocity: "high" | "medium" | "low"
    velocityRank: number
  }
  lastOrdered: string
  salesHistory: Array<{ date: string; quantity: number }>
  weeklySales: Array<{ week: string; quantity: number; revenue: number }>
  monthlySales: Array<{ month: string; quantity: number; sales: number }>
  machineDistribution: Array<{
    machineId: string
    location: string
    quantity: number
    lastRestocked: string
  }>
  reorderHistory: Array<{
    orderId: string
    date: string
    quantity: number
    cases: number
    status: string
    totalCost: number
  }>
}

export async function getProductById(
  productId: string
): Promise<ProductDetailData | null> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const repo = new ProductRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const txRepo = new TransactionRepository(db)
    const orderRepo = new OrderRepository(db)

    const endDate = new Date()
    const startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate())

    const [product, inventoryList, txRows, allOrders] = await Promise.all([
      ProductService.getProductById(repo, productId),
      inventoryRepo.findByOrganizationId(organizationId),
      txRepo.findByProductId(productId, startDate, endDate),
      orderRepo.findByOrganizationId(organizationId),
    ])

    if (!product) return null

    const inv = inventoryList.find((i) => i.productId === productId)
    const storage = inv?.storage ?? 0
    const machines = inv?.machines ?? 0

    const caseSize = Math.round(product.caseSize)
    const recommendedPrice = product.recommendedPrice
    const caseCost = product.caseCost
    const costPerUnit = caseCost / caseSize
    const profitMargin = ((recommendedPrice - costPerUnit) / recommendedPrice) * 100

    // Compute sales metrics from real transaction data
    const last30 = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentRows = txRows.filter((r) => r.date >= last30)
    const totalUnitsLast30 = recentRows.reduce((s, r) => s + r.quantity, 0)
    const dailySales = Math.round((totalUnitsLast30 / 30) * 10) / 10
    const weeklySalesAvg = Math.round((totalUnitsLast30 / 30) * 7 * 10) / 10

    // Daily sales history (last 30 days)
    const dailyMap = new Map<string, number>()
    recentRows.forEach((r) => {
      const day = r.date.toISOString().split("T")[0]
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + r.quantity)
    })
    const salesHistory = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, quantity]) => ({ date, quantity }))

    // Weekly sales (last 12 weeks)
    const weeklyMap = new Map<string, { quantity: number; revenue: number }>()
    txRows.forEach((r) => {
      const d = new Date(Date.UTC(r.date.getFullYear(), r.date.getMonth(), r.date.getDate()))
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
      const key = `${d.getUTCFullYear()}-W${weekNo}`
      const prev = weeklyMap.get(key) ?? { quantity: 0, revenue: 0 }
      weeklyMap.set(key, { quantity: prev.quantity + r.quantity, revenue: prev.revenue + r.quantity * r.salePrice })
    })
    const weeklySales = Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, v]) => ({ week, quantity: v.quantity, revenue: Math.round(v.revenue * 100) / 100 }))

    // Monthly sales
    const monthlyMap = new Map<string, { quantity: number; sales: number }>()
    txRows.forEach((r) => {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`
      const prev = monthlyMap.get(key) ?? { quantity: 0, sales: 0 }
      monthlyMap.set(key, { quantity: prev.quantity + r.quantity, sales: prev.sales + r.quantity * r.salePrice })
    })
    const monthlySales = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, quantity: v.quantity, sales: Math.round(v.sales * 100) / 100 }))

    const velocity: "high" | "medium" | "low" = dailySales >= 5 ? "high" : dailySales >= 1 ? "medium" : "low"
    const totalInventory = storage + machines
    const daysUntilStockout = dailySales > 0 ? Math.round(totalInventory / dailySales) : 0

    return {
      id: product.id,
      name: product.name,
      aliases: product.aliases ?? [],
      image: product.image,
      price: recommendedPrice,
      costPrice: costPerUnit,
      caseCost,
      profitMargin: Math.round(profitMargin),
      sku: product.vendorSku || `SKU-${product.id.slice(0, 8)}`,
      barcode: product.barcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      supplier: "Sam's Club",
      vendorUrl: product.vendorLink,
      leadTime: product.shippingAvailable ? (product.shippingTimeInDays || 5) : 0,
      shippingAvailable: product.shippingAvailable,
      caseQuantity: caseSize,
      minOrderQuantity: caseSize,
      category: product.category,
      inventory: { total: totalInventory, storage, machines },
      reorderPoint: product.reorderPoint ?? caseSize * 3,
      reorderStatus: totalInventory === 0 ? "critical" : totalInventory < caseSize ? "warning" : "ok",
      daysUntilStockout,
      sales: { daily: dailySales, weekly: weeklySalesAvg, trend: "stable", velocity, velocityRank: 1 },
      lastOrdered: new Date().toISOString().split("T")[0],
      salesHistory,
      weeklySales,
      monthlySales,
      machineDistribution: [],
      reorderHistory: await (async () => {
        const placedOrders = allOrders.filter((o) => o.status !== "draft")
        const rows: Array<{ orderId: string; date: string; quantity: number; cases: number; status: string; totalCost: number }> = []
        for (const order of placedOrders) {
          const items = await orderRepo.findOrderItems(order.id)
          const item = items.find((i) => i.productId === productId)
          if (!item) continue
          rows.push({
            orderId: order.id,
            date: (order.orderPlacedDate ?? order.createdAt).toISOString().split("T")[0],
            quantity: item.quantity * caseSize,
            cases: item.quantity,
            status: order.status,
            totalCost: Math.round(item.quantity * item.unitPrice * 100) / 100,
          })
        }
        return rows.sort((a, b) => b.date.localeCompare(a.date))
      })(),
    }
  } catch (error) {
    console.error("Error fetching product:", error)
    return null
  }
}

export async function updateProduct(productData: {
  id: string
  name: string
  recommendedPrice: number
  category: string
  image: string
  vendorLink: string
  caseCost: number
  caseSize: number
  shippingAvailable: boolean
  shippingTimeInDays: number
  reorderPoint?: number
  aliases?: string[]
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const repo = new ProductRepository(db)
    const product = new Product({
      ...productData,
      organizationId: session.user.organizationId,
      aliases: productData.aliases ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await ProductService.updateProduct(repo, product)
    return { success: true }
  } catch (error) {
    console.error("Error updating product:", error)
    return { success: false, error: "Failed to update product" }
  }
}

export async function deleteProduct(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const repo = new ProductRepository(db)
    await ProductService.deleteProduct(repo, productId)
    return { success: true }
  } catch (error) {
    console.error("Error deleting product:", error)
    return { success: false, error: "Failed to delete product" }
  }
}

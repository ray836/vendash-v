"use server"

import { db } from "@/infrastructure/database"
import { TransactionRepository } from "@/infrastructure/repositories/TransactionRepository"
import { VendingMachineRepository } from "@/infrastructure/repositories/VendingMachineRepository"
import { LocationRepository } from "@/infrastructure/repositories/LocationRepository"
import * as TransactionService from "@/domains/Transaction/TransactionService"
import * as VendingMachineService from "@/domains/VendingMachine/VendingMachineService"
import * as ProductService from "@/domains/Product/ProductService"
import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import { GroupByType } from "@/domains/Transaction/schemas/GetTransactionGraphDataSchemas"
import { auth } from "@/lib/auth"

export async function getDashboardData() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const txRepo = new TransactionRepository(db)
  const machineRepo = new VendingMachineRepository(db)
  const locationRepo = new LocationRepository(db)
  const productRepo = new ProductRepository(db)

  const [machines, productMetrics, transactions] = await Promise.all([
    VendingMachineService.getMachines(machineRepo, locationRepo, organizationId),
    ProductService.getOrgProductDataMetrics(productRepo, organizationId),
    TransactionService.getOrgTransactions(txRepo, organizationId),
  ])

  // Machine stats
  const totalMachines = machines.length
  const activeMachines = machines.filter((m) => m.status === "ONLINE").length

  // Inventory stats
  const lowStockProducts = productMetrics.filter(
    (p) => p.salesData.daysToSellOut < 7 && p.inventory.total > 0
  )
  const outOfStockProducts = productMetrics.filter((p) => p.inventory.total === 0)
  // Use daysToSellOut capped at 30 days as a proxy for "fullness"
  const totalInventoryPct =
    productMetrics.length > 0
      ? Math.round(
          productMetrics.reduce((sum, p) => {
            const fill = Math.min(p.salesData.daysToSellOut / 30, 1)
            return sum + fill
          }, 0) /
            productMetrics.length *
            100
        )
      : 0

  // Monthly sales count (transactions in current calendar month)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlySalesCount = transactions.filter(
    (t) => new Date(t.createdAt) >= startOfMonth
  ).length

  // Today's revenue and % change vs yesterday
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfToday.getDate() - 1)

  const todayRevenue = transactions
    .filter((t) => new Date(t.createdAt) >= startOfToday)
    .reduce((sum, t) => sum + t.total, 0)

  const yesterdayRevenue = transactions
    .filter((t) => {
      const d = new Date(t.createdAt)
      return d >= startOfYesterday && d < startOfToday
    })
    .reduce((sum, t) => sum + t.total, 0)

  const todayVsYesterdayPct = yesterdayRevenue === 0
    ? null
    : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100

  // Recent activity: last 5 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Machines with per-machine revenue (all-time, matched by cardReaderId)
  const machinesWithRevenue = machines.map((m) => {
    const revenue = m.cardReaderId
      ? transactions
          .filter((t) => t.cardReaderId === m.cardReaderId)
          .reduce((sum, t) => sum + t.total, 0)
      : null // null = no card reader configured
    return { ...m, revenue }
  })

  // Top selling products by revenue (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentTransactions30d = transactions.filter(
    (t) => new Date(t.createdAt) >= thirtyDaysAgo
  )
  const productRevenueMap = new Map<string, { name: string; revenue: number; unitsSold: number; image?: string }>()
  for (const tx of recentTransactions30d) {
    for (const item of tx.items ?? []) {
      const key = item.productId
      const existing = productRevenueMap.get(key)
      const lineRevenue = item.salePrice * item.quantity
      if (existing) {
        existing.revenue += lineRevenue
        existing.unitsSold += item.quantity
      } else {
        productRevenueMap.set(key, {
          name: item.product?.name ?? "Unknown",
          revenue: lineRevenue,
          unitsSold: item.quantity,
          image: item.product?.image,
        })
      }
    }
  }
  const topProducts = [...productRevenueMap.entries()]
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Products needing attention — only include products that actually have sales history
  // (daysToSellOut=0 with no sales means "never sold", not "critical")
  const attentionProducts = productMetrics
    .filter((p) =>
      p.inventory.total === 0 ||
      (p.salesData.averageDailySales > 0 && p.salesData.daysToSellOut < 14)
    )
    .sort((a, b) => {
      // Out of stock first, then by days remaining ascending
      if (a.inventory.total === 0 && b.inventory.total > 0) return -1
      if (b.inventory.total === 0 && a.inventory.total > 0) return 1
      return a.salesData.daysToSellOut - b.salesData.daysToSellOut
    })
    .slice(0, 8)

  // Unattributed transactions — sales with no matching machine card reader
  const knownCardReaderIds = new Set(
    machines.map((m) => m.cardReaderId).filter(Boolean)
  )
  const unattributedTransactions = transactions.filter(
    (t) => !t.cardReaderId || !knownCardReaderIds.has(t.cardReaderId)
  )
  const unattributedRevenue = unattributedTransactions.reduce(
    (sum, t) => sum + t.total, 0
  )
  const unknownCardReaderIds = [
    ...new Set(
      unattributedTransactions
        .map((t) => t.cardReaderId)
        .filter(Boolean) as string[]
    ),
  ]

  return {
    machines: machinesWithRevenue,
    totalMachines,
    activeMachines,
    lowStockCount: lowStockProducts.length,
    outOfStockCount: outOfStockProducts.length,
    inventoryPct: totalInventoryPct,
    monthlySalesCount,
    todayRevenue,
    yesterdayRevenue,
    todayVsYesterdayPct,
    recentTransactions,
    topProducts,
    attentionProducts,
    unattributedRevenue,
    unattributedCount: unattributedTransactions.length,
    unknownCardReaderIds,
    alertCounts: {
      critical: outOfStockProducts.length + lowStockProducts.filter((p) => p.salesData.daysToSellOut < 3 && p.salesData.averageDailySales > 0).length,
      warning: lowStockProducts.filter((p) => p.salesData.daysToSellOut >= 3 && p.salesData.averageDailySales > 0).length,
      maintenance: machines.filter((m) => m.status === "MAINTENANCE").length,
    },
  }
}

export async function getTransactionGraphData(groupedBy: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const repo = new TransactionRepository(db)
  try {
    const now = new Date()
    let start: Date
    if (groupedBy === "day") {
      start = new Date(now)
      start.setDate(now.getDate() - 30)
    } else if (groupedBy === "week") {
      start = new Date(now)
      start.setDate(now.getDate() - 84) // 12 weeks
    } else {
      start = new Date(now)
      start.setMonth(now.getMonth() - 12)
    }
    const result = await TransactionService.getTransactionGraphData(repo, {
      organizationId,
      groupedBy: groupedBy as GroupByType,
      startDate: start,
      endDate: now,
    })
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function updateCurrentUserName(firstName: string, lastName: string) {
  const { auth } = await import("@/lib/auth")
  const { users } = await import("@/infrastructure/database/schema")
  const { eq } = await import("drizzle-orm")

  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  await db.update(users).set({ firstName, lastName }).where(eq(users.id, session.user.id))
  return { success: true }
}

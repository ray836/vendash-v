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

  const now = new Date()
  // Furthest back we need: start of prev month (for monthly comparison chart)
  const dashboardStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [machines, productMetrics, transactions] = await Promise.all([
    VendingMachineService.getMachines(machineRepo, locationRepo, organizationId),
    ProductService.getOrgProductDataMetrics(productRepo, organizationId),
    TransactionService.getOrgTransactions(txRepo, organizationId, dashboardStart, now),
  ])

  // Machine stats
  const totalMachines = machines.length
  const activeMachines = machines.filter((m) => m.status === "ONLINE").length

  // Inventory stats
  const lowStockProducts = productMetrics.filter(
    (p) => p.salesData.daysToSellOut < 14 && p.inventory.total > 0
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
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlySalesCount = transactions.filter(
    (t) => new Date(t.createdAt) >= startOfMonth
  ).length

  // Today's revenue and % change vs yesterday
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfToday.getDate() - 1)

  // Start of current week (Monday)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() - ((startOfToday.getDay() + 6) % 7))
  const DAY_MS = 86_400_000
  const startOfLastWeek = new Date(startOfWeek.getTime() - 7 * DAY_MS)
  const startOfPrevMonth = startOfMonth.getMonth() === 0
    ? new Date(startOfMonth.getFullYear() - 1, 11, 1)
    : new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() - 1, 1)

  const todayRevenue = transactions
    .filter((t) => new Date(t.createdAt) >= startOfToday)
    .reduce((sum, t) => sum + t.total, 0)

  const weekRevenue = transactions
    .filter((t) => new Date(t.createdAt) >= startOfWeek)
    .reduce((sum, t) => sum + t.total, 0)

  const monthRevenue = transactions
    .filter((t) => new Date(t.createdAt) >= startOfMonth)
    .reduce((sum, t) => sum + t.total, 0)

  const yesterdayRevenue = transactions
    .filter((t) => {
      const d = new Date(t.createdAt)
      return d >= startOfYesterday && d < startOfToday
    })
    .reduce((sum, t) => sum + t.total, 0)

  // Same-time comparison: yesterday up to the equivalent moment, not yesterday's full-day total
  const sameTimeYesterday = new Date(startOfYesterday.getTime() + (now.getTime() - startOfToday.getTime()))
  const yesterdaySameTimeRevenue = transactions
    .filter((t) => {
      const d = new Date(t.createdAt)
      return d >= startOfYesterday && d < sameTimeYesterday
    })
    .reduce((sum, t) => sum + t.total, 0)

  const todayVsYesterdayPct = yesterdaySameTimeRevenue === 0
    ? null
    : ((todayRevenue - yesterdaySameTimeRevenue) / yesterdaySameTimeRevenue) * 100

  // Recent activity: last 5 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Per-machine stats: revenue, COGS, profit, margin, tx count, top product
  type PeriodStats = {
    revenue: number
    profit: number | null
    margin: number | null
    txCount: number
    topProduct: string | null
  }

  function computePeriodStats(
    txs: typeof transactions,
    since: Date,
    until?: Date
  ): PeriodStats {
    const periodTxs = txs.filter((t) => {
      const d = new Date(t.createdAt)
      return d >= since && (!until || d < until)
    })
    let revenue = 0
    let cogs = 0
    const productRev = new Map<string, { name: string; rev: number }>()
    for (const tx of periodTxs) {
      revenue += tx.total
      for (const item of tx.items ?? []) {
        const cost = Number(item.product?.caseCost ?? 0)
        const size = Number(item.product?.caseSize ?? 0)
        if (cost > 0 && size > 0) cogs += (cost / size) * (item.quantity ?? 1)
        if (item.productId && item.product?.name) {
          const r = (item.salePrice ?? 0) * (item.quantity ?? 1)
          const cur = productRev.get(item.productId)
          cur ? (cur.rev += r) : productRev.set(item.productId, { name: item.product.name, rev: r })
        }
      }
    }
    const profit = cogs > 0 ? Math.round((revenue - cogs) * 100) / 100 : null
    const margin = revenue > 0 && profit !== null ? Math.round((profit / revenue) * 100) : null
    const topProduct =
      [...productRev.entries()].sort((a, b) => b[1].rev - a[1].rev)[0]?.[1].name ?? null
    return { revenue: Math.round(revenue * 100) / 100, profit, margin, txCount: periodTxs.length, topProduct }
  }

  const machinesWithRevenue = machines.map((m) => {
    if (!m.cardReaderId) return {
      ...m,
      revenueToday: null, revenueWeek: null, revenueMonth: null,
      statsToday: null as PeriodStats | null,
      statsWeek: null as PeriodStats | null,
      statsMonth: null as PeriodStats | null,
      statsPrevDay: null as PeriodStats | null,
      statsPrevWeek: null as PeriodStats | null,
      statsPrevMonth: null as PeriodStats | null,
    }
    const machineTxs = transactions.filter((t) => t.cardReaderId === m.cardReaderId)
    const statsToday    = computePeriodStats(machineTxs, startOfToday)
    const statsWeek     = computePeriodStats(machineTxs, startOfWeek)
    const statsMonth    = computePeriodStats(machineTxs, startOfMonth)
    const statsPrevDay  = computePeriodStats(machineTxs, startOfYesterday, startOfToday)
    const statsPrevWeek = computePeriodStats(machineTxs, startOfLastWeek, startOfWeek)
    const statsPrevMonth = computePeriodStats(machineTxs, startOfPrevMonth, startOfMonth)
    return {
      ...m,
      revenueToday: statsToday.revenue,
      revenueWeek:  statsWeek.revenue,
      revenueMonth: statsMonth.revenue,
      statsToday,
      statsWeek,
      statsMonth,
      statsPrevDay,
      statsPrevWeek,
      statsPrevMonth,
    }
  })

  // Org-level monthly profit for the stat card
  let monthCogs = 0
  for (const tx of transactions.filter((t) => new Date(t.createdAt) >= startOfMonth)) {
    for (const item of tx.items ?? []) {
      const cost = Number(item.product?.caseCost ?? 0)
      const size = Number(item.product?.caseSize ?? 0)
      if (cost > 0 && size > 0) monthCogs += (cost / size) * (item.quantity ?? 1)
    }
  }
  const monthProfit = monthCogs > 0 ? Math.round((monthRevenue - monthCogs) * 100) / 100 : null
  const hasCostData = monthCogs > 0

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

  // --- Comparison chart data ---
  // Bucket transactions into fixed-size time windows and compute cumulative revenue.
  const HOUR_MS = 3_600_000

  function bucketRevenue(
    txs: typeof transactions,
    periodStart: Date,
    bucketMs: number,
    bucketCount: number
  ): number[] {
    const result = new Array<number>(bucketCount).fill(0)
    const origin = periodStart.getTime()
    for (const tx of txs) {
      const idx = Math.floor((new Date(tx.createdAt).getTime() - origin) / bucketMs)
      if (idx >= 0 && idx < bucketCount) result[idx] += tx.total
    }
    return result
  }

  function cumulative(arr: number[]): number[] {
    let sum = 0
    return arr.map((v) => (sum += v))
  }

  const currentHour = now.getHours()
  const todayWeekday = (now.getDay() + 6) % 7 // 0=Mon … 6=Sun
  const monthNum = now.getMonth()
  const monthYear = now.getFullYear()
  const todayDate = now.getDate()
  const prevMonthNum = monthNum === 0 ? 11 : monthNum - 1
  const prevMonthYear = monthNum === 0 ? monthYear - 1 : monthYear
  const daysInCurrentMonth = new Date(monthYear, monthNum + 1, 0).getDate()
  const daysInPrevMonth = new Date(prevMonthYear, prevMonthNum + 1, 0).getDate()
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const WEEKDAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const hourLabel = (h: number) =>
    h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`

  // Day: hourly buckets, today vs yesterday
  const todayCum    = cumulative(bucketRevenue(transactions, startOfToday,     HOUR_MS, 24))
  const yesterdayCum = cumulative(bucketRevenue(transactions, startOfYesterday, HOUR_MS, 24))
  const dayComparison = {
    currentLabel: 'Today',
    previousLabel: 'Yesterday',
    data: Array.from({ length: 24 }, (_, h) => ({
      label: hourLabel(h),
      current:  h <= currentHour ? todayCum[h]    : null,
      previous: yesterdayCum[h],
    })),
  }

  // Week: daily buckets (Mon–Sun), this week vs last week
  const thisWeekCum = cumulative(bucketRevenue(transactions, startOfWeek,     DAY_MS, 7))
  const lastWeekCum = cumulative(bucketRevenue(transactions, startOfLastWeek, DAY_MS, 7))
  const weekComparison = {
    currentLabel: 'This Week',
    previousLabel: 'Last Week',
    data: Array.from({ length: 7 }, (_, d) => ({
      label: WEEKDAY_LABELS[d],
      current:  d <= todayWeekday ? thisWeekCum[d] : null,
      previous: lastWeekCum[d],
    })),
  }

  // Month: daily buckets (1–N), this month vs last month
  const maxDays = Math.max(daysInCurrentMonth, daysInPrevMonth)
  const thisMonthCum = cumulative(bucketRevenue(transactions, new Date(monthYear, monthNum, 1), DAY_MS, daysInCurrentMonth))
  const prevMonthCum = cumulative(bucketRevenue(transactions, startOfPrevMonth, DAY_MS, daysInPrevMonth))
  const monthComparison = {
    currentLabel: MONTH_NAMES[monthNum],
    previousLabel: MONTH_NAMES[prevMonthNum],
    data: Array.from({ length: maxDays }, (_, i) => {
      const day = i + 1
      return {
        label: String(day),
        current:  day <= todayDate && day <= daysInCurrentMonth ? thisMonthCum[i] : null,
        previous: day <= daysInPrevMonth ? prevMonthCum[i] : null,
      }
    }),
  }

  // Products missing caseCost — can't compute profitability without it
  const missingCostProducts = productMetrics
    .filter((p) => {
      const cost = Number(p.product.caseCost)
      return isNaN(cost) || cost <= 0
    })
    .map((p) => ({ id: p.product.id, name: p.product.name }))

  // Period KPIs for the global Today/Week/Month dashboard control.
  // Reuses computePeriodStats org-wide; prev-period revenue drives the delta.
  const dayStats = computePeriodStats(transactions, startOfToday)
  const weekStats = computePeriodStats(transactions, startOfWeek)
  const monthStats = computePeriodStats(transactions, startOfMonth)
  const prevWeekRevenue = computePeriodStats(transactions, startOfLastWeek, startOfWeek).revenue
  const prevMonthRevenue = computePeriodStats(transactions, startOfPrevMonth, startOfMonth).revenue
  const pctDelta = (cur: number, prev: number) =>
    prev === 0 ? null : ((cur - prev) / prev) * 100

  const periodKpis = {
    day: {
      revenue: dayStats.revenue,
      profit: dayStats.profit,
      margin: dayStats.margin,
      deltaPct: todayVsYesterdayPct,
      hasCostData: dayStats.profit !== null,
    },
    week: {
      revenue: weekStats.revenue,
      profit: weekStats.profit,
      margin: weekStats.margin,
      deltaPct: pctDelta(weekStats.revenue, prevWeekRevenue),
      hasCostData: weekStats.profit !== null,
    },
    month: {
      revenue: monthStats.revenue,
      profit: monthStats.profit,
      margin: monthStats.margin,
      deltaPct: pctDelta(monthStats.revenue, prevMonthRevenue),
      hasCostData: monthStats.profit !== null,
    },
  }

  return {
    machines: machinesWithRevenue,
    periodKpis,
    totalMachines,
    activeMachines,
    lowStockCount: lowStockProducts.length,
    outOfStockCount: outOfStockProducts.length,
    inventoryPct: totalInventoryPct,
    monthlySalesCount,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    yesterdayRevenue,
    todayVsYesterdayPct,
    recentTransactions,
    topProducts,
    attentionProducts,
    unattributedRevenue,
    unattributedCount: unattributedTransactions.length,
    unknownCardReaderIds,
    missingCostProducts,
    monthProfit,
    hasCostData,
    alertCounts: {
      critical: outOfStockProducts.length + lowStockProducts.filter((p) => p.salesData.daysToSellOut < 7 && p.salesData.averageDailySales > 0).length,
      warning: lowStockProducts.filter((p) => p.salesData.daysToSellOut >= 7 && p.salesData.averageDailySales > 0).length,
      maintenance: machines.filter((m) => m.status === "MAINTENANCE").length,
      missingCost: missingCostProducts.length,
    },
    comparisonData: { day: dayComparison, week: weekComparison, month: monthComparison },
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

    const transactions = await TransactionService.getOrgTransactions(repo, organizationId, start, now)

    function bucketKey(date: Date): string {
      if (groupedBy === "day") return date.toISOString().slice(0, 10)
      if (groupedBy === "week") {
        const d = new Date(date)
        d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
        return d.toISOString().slice(0, 10)
      }
      return date.toISOString().slice(0, 7)
    }

    // Bucket sales + COGS in one pass
    const bucketMap = new Map<string, { totalSales: number; totalTransactions: number; totalCost: number }>()
    for (const tx of transactions) {
      const key = bucketKey(new Date(tx.createdAt))
      const entry = bucketMap.get(key) ?? { totalSales: 0, totalTransactions: 0, totalCost: 0 }
      entry.totalSales += tx.total
      entry.totalTransactions += 1
      for (const item of tx.items ?? []) {
        const cost = Number(item.product?.caseCost ?? 0)
        const size = Number(item.product?.caseSize ?? 0)
        if (cost > 0 && size > 0) entry.totalCost += (cost / size) * (item.quantity ?? 1)
      }
      bucketMap.set(key, entry)
    }

    const DAY_MS = 86_400_000
    // Normalise start to UTC midnight so fill keys are always clean date strings
    const startUTC = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))

    // For daily view, produce exactly 30 bars (one per calendar day, gaps filled with $0)
    let groupedData: { date: string; totalSales: number; totalTransactions: number; totalCost: number }[]
    if (groupedBy === "day") {
      groupedData = Array.from({ length: 30 }, (_, i) => {
        const key = new Date(startUTC.getTime() + i * DAY_MS).toISOString().slice(0, 10)
        const b = bucketMap.get(key)
        return {
          date: key,
          totalSales:        Math.round((b?.totalSales        ?? 0) * 100) / 100,
          totalTransactions: b?.totalTransactions ?? 0,
          totalCost:         Math.round((b?.totalCost          ?? 0) * 100) / 100,
        }
      })
    } else {
      groupedData = Array.from(bucketMap.entries())
        .map(([date, b]) => ({
          date,
          totalSales:        Math.round(b.totalSales        * 100) / 100,
          totalTransactions: b.totalTransactions,
          totalCost:         Math.round(b.totalCost         * 100) / 100,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    const totalSales = Math.round(groupedData.reduce((s, d) => s + d.totalSales, 0) * 100) / 100
    const totalTransactions = groupedData.reduce((s, d) => s + d.totalTransactions, 0)
    const averageSales = groupedData.length > 0 ? Math.round((totalSales / groupedData.length) * 100) / 100 : 0
    const averageTransactions = groupedData.length > 0 ? Math.round((totalTransactions / groupedData.length) * 100) / 100 : 0

    return {
      success: true,
      data: {
        groupedBy: groupedBy as GroupByType,
        totalSales, totalTransactions, averageSales, averageTransactions,
        groupedData,
      },
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function getTopProductsTimeSeries(period: "30days" | "60days") {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  const txRepo = new TransactionRepository(db)

  const now = new Date()
  const DAY_MS = 86_400_000
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const days = period === "60days" ? 60 : 30
  const startDate = new Date(startOfToday.getTime() - (days - 1) * DAY_MS)

  const transactions = await TransactionService.getOrgTransactions(txRepo, organizationId, startDate, now)
  const bucketCount = days
  const labels = Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate.getTime() + i * DAY_MS)
    return `${d.getMonth() + 1}/${d.getDate()}`
  })

  const origin = startDate.getTime()
  const periodTxs = transactions.filter((tx) => new Date(tx.createdAt) >= startDate)

  // Find top 5 products by revenue in this period
  const revMap = new Map<string, { name: string; revenue: number }>()
  for (const tx of periodTxs) {
    for (const item of tx.items ?? []) {
      if (!item.productId) continue
      const rev = (item.salePrice ?? 0) * (item.quantity ?? 1)
      const cur = revMap.get(item.productId)
      if (cur) cur.revenue += rev
      else revMap.set(item.productId, { name: item.product?.name ?? "Unknown", revenue: rev })
    }
  }
  const topIds = [...revMap.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([id, { name }]) => ({ id, name }))

  // Bucket daily revenue per product
  const products = topIds.map(({ id, name }) => {
    const buckets = new Array<number>(bucketCount).fill(0)
    for (const tx of periodTxs) {
      const idx = Math.floor((new Date(tx.createdAt).getTime() - origin) / DAY_MS)
      if (idx < 0 || idx >= bucketCount) continue
      for (const item of tx.items ?? []) {
        if (item.productId === id) {
          buckets[idx] += (item.salePrice ?? 0) * (item.quantity ?? 1)
        }
      }
    }
    return { id, name, data: buckets }
  })

  return { labels, products }
}

export async function getMonthComparisonData(monthA: string, monthB: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const txRepo = new TransactionRepository(db)

  const [yearA, mA] = monthA.split('-').map(Number)
  const [yearB, mB] = monthB.split('-').map(Number)
  const idxA = mA - 1
  const idxB = mB - 1

  const startA = new Date(yearA, idxA, 1)
  const startB = new Date(yearB, idxB, 1)
  const daysA = new Date(yearA, idxA + 1, 0).getDate()
  const daysB = new Date(yearB, idxB + 1, 0).getDate()

  const rangeStart = startA < startB ? startA : startB
  const endA = new Date(yearA, idxA + 1, 0, 23, 59, 59, 999)
  const endB = new Date(yearB, idxB + 1, 0, 23, 59, 59, 999)
  const rangeEnd = endA > endB ? endA : endB

  const transactions = await TransactionService.getOrgTransactions(txRepo, organizationId, rangeStart, rangeEnd)
  const maxDays = Math.max(daysA, daysB)

  const DAY_MS = 86_400_000
  const now = new Date()
  const isCurrentMonth = yearA === now.getFullYear() && idxA === now.getMonth()
  const cutoffDay = isCurrentMonth ? now.getDate() : daysA

  function bucket(txs: typeof transactions, start: Date, ms: number, count: number): number[] {
    const r = new Array<number>(count).fill(0)
    const origin = start.getTime()
    for (const tx of txs) {
      const i = Math.floor((new Date(tx.createdAt).getTime() - origin) / ms)
      if (i >= 0 && i < count) r[i] += tx.total
    }
    return r
  }
  function cum(arr: number[]): number[] {
    let s = 0
    return arr.map((v) => (s += v))
  }

  const aCum = cum(bucket(transactions, startA, DAY_MS, daysA))
  const bCum = cum(bucket(transactions, startB, DAY_MS, daysB))

  const NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return {
    currentLabel: `${NAMES[idxA]} ${yearA}`,
    previousLabel: `${NAMES[idxB]} ${yearB}`,
    data: Array.from({ length: maxDays }, (_, i) => {
      const day = i + 1
      return {
        label: String(day),
        current: day <= cutoffDay && day <= daysA ? aCum[i] : null,
        previous: day <= daysB ? bCum[i] : null,
      }
    }),
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

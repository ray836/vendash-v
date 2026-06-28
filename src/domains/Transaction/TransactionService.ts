import { TransactionRepository } from "@/infrastructure/repositories/TransactionRepository"
import { PublicTransactionWithItemsAndProductDTO } from "./schemas/TransactionSchemas"
import {
  GetTransactionGraphDataRequestDTO,
  GetTransactionGraphDataResponseDTO,
  GroupByType,
} from "./schemas/GetTransactionGraphDataSchemas"
import { GetTransactionsForMachineResponseDTO } from "./schemas/GetTransactionsForMachineSchema"

export async function getOrgTransactions(
  repo: TransactionRepository,
  organizationId: string,
  startDate?: Date,
  endDate?: Date
): Promise<PublicTransactionWithItemsAndProductDTO[]> {
  return repo.findByOrganizationIdWithItems(organizationId, startDate, endDate)
}

export async function getTransactionGraphData(
  repo: TransactionRepository,
  request: GetTransactionGraphDataRequestDTO
): Promise<GetTransactionGraphDataResponseDTO> {
  const transactions = await repo.findByOrganizationId(
    request.organizationId,
    request.startDate,
    request.endDate
  )

  function getGroupKey(date: Date, groupedBy: GroupByType): string {
    if (groupedBy === GroupByType.DAY) return date.toISOString().split("T")[0]
    if (groupedBy === GroupByType.WEEK) {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
      return `${d.getUTCFullYear()}-W${weekNo}`
    }
    if (groupedBy === GroupByType.MONTH) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    }
    return ""
  }

  const groupedMap = transactions.reduce(
    (acc, transaction) => {
      const key = getGroupKey(transaction.createdAt, request.groupedBy)
      if (!acc[key]) acc[key] = { date: key, totalSales: 0, totalTransactions: 0 }
      acc[key].totalSales += transaction.total
      acc[key].totalTransactions += 1
      return acc
    },
    {} as Record<string, { date: string; totalSales: number; totalTransactions: number }>
  )

  const groupedData = Object.values(groupedMap)
    .map((group) => ({ ...group, totalSales: Math.round(group.totalSales * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const totalSales = Math.round(groupedData.reduce((acc, g) => acc + g.totalSales, 0) * 100) / 100
  const totalTransactions = groupedData.reduce((acc, g) => acc + g.totalTransactions, 0)
  const averageSales = groupedData.length > 0 ? Math.round((totalSales / groupedData.length) * 100) / 100 : 0
  const averageTransactions = groupedData.length > 0 ? Math.round((totalTransactions / groupedData.length) * 100) / 100 : 0

  return { totalSales, totalTransactions, averageSales, averageTransactions, groupedBy: request.groupedBy, groupedData }
}

export async function getTransactionsForMachine(
  repo: TransactionRepository,
  machineId: string,
  startDate: Date,
  endDate: Date
): Promise<GetTransactionsForMachineResponseDTO> {
  const [transactions, transactionsWithItems] = await Promise.all([
    repo.findByMachineId(machineId, startDate, endDate),
    repo.findByMachineIdWithItems(machineId, startDate, endDate),
  ])

  const publicTransactions = transactions.map((transaction) => ({
    id: transaction.id,
    organizationId: transaction.organizationId,
    transactionType: transaction.transactionType,
    createdAt: transaction.createdAt,
    total: transaction.total,
    last4CardDigits: transaction.last4CardDigits,
    cardReaderId: transaction.cardReaderId,
    vendingMachineId: machineId,
  }))

  const dailyMap = new Map<string, typeof publicTransactions>()
  publicTransactions.forEach((tx) => {
    const day = tx.createdAt.toISOString().split("T")[0]
    if (!dailyMap.has(day)) dailyMap.set(day, [])
    dailyMap.get(day)!.push(tx)
  })
  const daily = Array.from(dailyMap.values()).flat()
  const dailyAverage = dailyMap.size
    ? Array.from(dailyMap.values()).reduce((sum, txs) => sum + txs.reduce((s, t) => s + t.total, 0), 0) / dailyMap.size
    : 0

  function getWeek(date: Date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return `${d.getUTCFullYear()}-W${weekNo}`
  }

  const weeklyMap = new Map<string, typeof publicTransactions>()
  publicTransactions.forEach((tx) => {
    const week = getWeek(tx.createdAt)
    if (!weeklyMap.has(week)) weeklyMap.set(week, [])
    weeklyMap.get(week)!.push(tx)
  })
  const weekly = Array.from(weeklyMap.values()).flat()
  const weeklyAverage = weeklyMap.size
    ? Array.from(weeklyMap.values()).reduce((sum, txs) => sum + txs.reduce((s, t) => s + t.total, 0), 0) / weeklyMap.size
    : 0

  const monthlyMap = new Map<string, typeof publicTransactions>()
  publicTransactions.forEach((tx) => {
    const month = `${tx.createdAt.getFullYear()}-${String(tx.createdAt.getMonth() + 1).padStart(2, "0")}`
    if (!monthlyMap.has(month)) monthlyMap.set(month, [])
    monthlyMap.get(month)!.push(tx)
  })
  const monthly = Array.from(monthlyMap.values()).flat()
  const monthlyAverage = monthlyMap.size
    ? Array.from(monthlyMap.values()).reduce((sum, txs) => sum + txs.reduce((s, t) => s + t.total, 0), 0) / monthlyMap.size
    : 0

  // Build COGS maps keyed by the same period strings used in chart data
  const cogsDailyMap = new Map<string, number>()
  const cogsWeeklyMap = new Map<string, number>()
  const cogsMonthlyMap = new Map<string, number>()

  for (const tx of transactionsWithItems) {
    for (const item of tx.items ?? []) {
      const cost = Number(item.product?.caseCost ?? 0)
      const size = Number(item.product?.caseSize ?? 0)
      if (cost <= 0 || size <= 0) continue
      const unitCost = (cost / size) * (item.quantity ?? 1)
      const d = new Date(tx.createdAt)
      const dayKey = d.toISOString().split("T")[0]
      const weekKey = getWeek(d)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      cogsDailyMap.set(dayKey,  (cogsDailyMap.get(dayKey)  ?? 0) + unitCost)
      cogsWeeklyMap.set(weekKey, (cogsWeeklyMap.get(weekKey) ?? 0) + unitCost)
      cogsMonthlyMap.set(monthKey, (cogsMonthlyMap.get(monthKey) ?? 0) + unitCost)
    }
  }

  const hasCost = cogsDailyMap.size > 0 || cogsWeeklyMap.size > 0 || cogsMonthlyMap.size > 0

  // Pre-compute chart-ready data server-side (avoids client-side Date serialization issues)
  const toChartData = (
    map: Map<string, typeof publicTransactions>,
    cogsMap: Map<string, number>
  ) =>
    Array.from(map.entries())
      .map(([period, txs]) => {
        const sales = Math.round(txs.reduce((s, t) => s + t.total, 0) * 100) / 100
        const cost  = hasCost ? Math.round((cogsMap.get(period) ?? 0) * 100) / 100 : undefined
        return { period, sales, ...(cost !== undefined ? { cost } : {}) }
      })
      .sort((a, b) => a.period.localeCompare(b.period))

  // Product performance rollup (reuses already-fetched transactionsWithItems)
  type PerfAccum = { productName: string; unitsSold: number; revenue: number; cost: number; hasCost: boolean }
  const perfMap = new Map<string, PerfAccum>()
  for (const tx of transactionsWithItems) {
    for (const item of tx.items ?? []) {
      const id = item.productId
      const qty = item.quantity ?? 1
      const rev = Number(item.salePrice) * qty
      const caseCost = Number(item.product?.caseCost ?? 0)
      const caseSize = Number(item.product?.caseSize ?? 0)
      const unitCost = caseCost > 0 && caseSize > 0 ? (caseCost / caseSize) * qty : null
      const acc = perfMap.get(id) ?? { productName: item.product?.name ?? "Unknown", unitsSold: 0, revenue: 0, cost: 0, hasCost: false }
      acc.unitsSold += qty
      acc.revenue += rev
      if (unitCost !== null) { acc.cost += unitCost; acc.hasCost = true }
      perfMap.set(id, acc)
    }
  }
  const productPerformance = Array.from(perfMap.entries())
    .map(([productId, p]) => {
      const rev = Math.round(p.revenue * 100) / 100
      const profit = p.hasCost ? Math.round((p.revenue - p.cost) * 100) / 100 : null
      const margin = profit !== null && rev > 0 ? Math.round((profit / rev) * 100) : null
      return {
        productId,
        productName: p.productName,
        unitsSold: p.unitsSold,
        revenue: rev,
        cost: p.hasCost ? Math.round(p.cost * 100) / 100 : null,
        profit,
        margin,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)

  return {
    transactions: publicTransactions,
    daily, dailyAverage,
    weekly, weeklyAverage,
    monthly, monthlyAverage,
    dailyChartData: toChartData(dailyMap, cogsDailyMap),
    weeklyChartData: toChartData(weeklyMap, cogsWeeklyMap),
    monthlyChartData: toChartData(monthlyMap, cogsMonthlyMap),
    productPerformance,
  }
}

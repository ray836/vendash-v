"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  ShoppingCart,
  Settings,
  Clock,
  ArrowRight,
  RefreshCw,
  Truck,
  DollarSign,
  Activity,
  Maximize2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getTransactionGraphData, getDashboardData, updateCurrentUserName, getMonthComparisonData, getTopProductsTimeSeries } from "./actions"
import { TopProductsLineChart } from "@/components/TopProductsLineChart"
import { GroupByType } from "@/domains/Transaction/schemas/GetTransactionGraphDataSchemas"
import { formatDateLabel, formatWeekRangeLabel } from "@/utils/date"
import { useRouter } from "next/navigation"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ComparisonLineChart } from "@/components/ComparisonLineChart"
import { Skeleton } from "@/components/ui/skeleton"
import { NextOrderPreview } from "./next-order-preview"

function BarChartSkeleton() {
  const heights = [55, 80, 40, 90, 65, 75, 50, 85, 45, 70, 60, 35]
  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5" style={{ height: 180 }}>
        <div className="flex flex-col justify-between h-full pr-2 w-10 shrink-0">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-2 w-full rounded" />
          ))}
        </div>
        {heights.map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="flex gap-1.5 ml-12 mt-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-2 flex-1 rounded" />
        ))}
      </div>
    </div>
  )
}

function LineChartSkeleton({ taller = false }: { taller?: boolean }) {
  const chartH = taller ? 400 : 155
  return (
    <div className="w-full">
      <div className="flex gap-4 mb-3">
        <Skeleton className="h-2 w-20 rounded" />
        <Skeleton className="h-2 w-20 rounded" />
      </div>
      <div className="flex gap-2" style={{ height: chartH }}>
        <div className="flex flex-col justify-between w-10 shrink-0 pr-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-2 w-full rounded" />
          ))}
        </div>
        <Skeleton className="flex-1 rounded-md" />
      </div>
      <div className="flex gap-2 ml-12 mt-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-2 flex-1 rounded" />
        ))}
      </div>
    </div>
  )
}

function TopProductsListSkeleton() {
  return (
    <div className="space-y-4">
      {[100, 82, 64, 48, 30].map((barW, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-3 h-3 rounded shrink-0" />
          <Skeleton className="w-8 h-8 rounded shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between gap-3">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
            <Skeleton className="h-1.5 rounded-full" style={{ width: `${barW}%` }} />
            <Skeleton className="h-2 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Online" || status === "ONLINE") {
    return <Badge className="bg-green-600">Online</Badge>
  } else if (status === "Maintenance" || status === "MAINTENANCE") {
    return <Badge variant="destructive">Maintenance</Badge>
  } else if (status === "Offline" || status === "OFFLINE") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Offline
      </Badge>
    )
  } else if (status === "LOW_STOCK") {
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Low Stock</Badge>
  } else if (status === "critical") {
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200"
      >
        Critical
      </Badge>
    )
  } else if (status === "warning") {
    return (
      <Badge
        variant="outline"
        className="bg-yellow-50 text-yellow-700 border-yellow-200"
      >
        Low
      </Badge>
    )
  } else {
    return <Badge variant="secondary">{status}</Badge>
  }
}

// First, define proper types for the sales data
type SalesData = {
  date: string
  totalSales: number
  totalTransactions: number
  totalCost?: number
}

// Update the component to properly type check
function labelInterval(n: number): number {
  if (n <= 12) return 1
  if (n <= 31) return 7
  if (n <= 90) return 14
  return 30
}

function SalesChart({
  data,
  period,
}: {
  data: SalesData[]
  period: GroupByType
}) {
  const maxSales = Math.max(...data.map((item) => item.totalSales), 1)
  const interval = labelInterval(data.length)
  const hasCostData = data.some((item) => (item.totalCost ?? 0) > 0)

  return (
    <div className="w-full overflow-hidden">
      {hasCostData && (
        <div className="flex gap-4 mb-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
            <span className="text-muted-foreground">Profit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-orange-400" />
            <span className="text-muted-foreground">Cost</span>
          </div>
        </div>
      )}
      <div className="flex items-end gap-[2px]" style={{ height: 220 }}>
      {data.map((item, i) => {
        const totalHeight = (item.totalSales / maxSales) * 180
        const cost = Math.min(item.totalCost ?? 0, item.totalSales)
        const profit = item.totalSales - cost
        const costHeight = (cost / maxSales) * 180
        const profitHeight = (profit / maxSales) * 180
        const date = new Date(item.date)
        const dayOfWeek = date.toLocaleString("default", { weekday: "short", timeZone: "UTC" })
        const showLabel = i % interval === 0 || i === data.length - 1

        return (
          <div
            key={i}
            className="flex-1 flex flex-col justify-end items-center min-w-0"
            style={{ height: 220 }}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="w-full flex flex-col cursor-pointer"
                    style={{ height: `${totalHeight}px` }}
                  >
                    {/* Profit section — top, green */}
                    <div
                      className="w-full bg-green-500 hover:bg-green-400 transition-colors rounded-t-sm"
                      style={{ height: `${profitHeight}px` }}
                    />
                    {/* Cost section — bottom, orange */}
                    {costHeight > 0 && (
                      <div
                        className="w-full bg-orange-400 hover:bg-orange-300 transition-colors"
                        style={{ height: `${costHeight}px` }}
                      />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {formatDateLabel(item.date, period)} ({dayOfWeek})
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-bold">${item.totalSales.toFixed(2)}</span>
                    </div>
                    {hasCostData && (
                      <>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Cost</span>
                          <span className="font-bold text-orange-400">${cost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-4 border-t pt-1">
                          <span className="text-muted-foreground">Profit</span>
                          <span className={`font-bold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                            ${profit.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Transactions</span>
                      <span className="font-bold">{item.totalTransactions}</span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="h-[20px] flex flex-col items-center justify-start mt-1 w-full">
              {showLabel && (
                <span className="text-[9px] text-muted-foreground leading-none text-center whitespace-nowrap">
                  {period === GroupByType.WEEK
                    ? formatWeekRangeLabel(item.date)
                    : formatDateLabel(item.date, period)}
                </span>
              )}
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "sale":
      return <ShoppingCart className="h-4 w-4 text-green-600" />
    case "restock":
      return <Package className="h-4 w-4 text-blue-600" />
    case "maintenance":
      return <Settings className="h-4 w-4 text-amber-600" />
    case "alert":
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />
  }
}

type DashboardStats = Awaited<ReturnType<typeof getDashboardData>>

export function Dashboard({ isFirstLogin = false }: { isFirstLogin?: boolean }) {
  const router = useRouter()
  const [salesPeriod, setSalesPeriod] = useState<GroupByType>(GroupByType.DAY)
  const [chartMode, setChartMode] = useState<"bar" | "compare">("bar")
  const [compareMonthA, setCompareMonthA] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })
  const [compareMonthB, setCompareMonthB] = useState(() => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })
  const [customMonthData, setCustomMonthData] = useState<Awaited<ReturnType<typeof getMonthComparisonData>> | null>(null)
  const [monthDataLoading, setMonthDataLoading] = useState(false)
  const [comparisonExpanded, setComparisonExpanded] = useState(false)
  const [topProductsView, setTopProductsView] = useState<"list" | "graph">("list")
  const [topProductsExpanded, setTopProductsExpanded] = useState(false)
  const [topProductsPeriod, setTopProductsPeriod] = useState<"30days" | "60days">("30days")
  const [topProductsData, setTopProductsData] = useState<Awaited<ReturnType<typeof getTopProductsTimeSeries>> | null>(null)
  const [topProductsLoading, setTopProductsLoading] = useState(false)
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(false)
  const [totalSales, setTotalSales] = useState(0)
  const [averageSales, setAverageSales] = useState(0)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(isFirstLogin)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isSavingName, setIsSavingName] = useState(false)

  const loadStats = () => {
    setStatsLoading(true)
    getDashboardData()
      .then(setStats)
      .finally(() => setStatsLoading(false))
  }

  const loadChart = (period: GroupByType) => {
    setLoading(true)
    getTransactionGraphData(period)
      .then((res) => {
        if (res.success && res.data) {
          setSalesData(res.data.groupedData)
          setTotalSales(res.data.totalSales)
          setAverageSales(res.data.averageSales)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadStats() }, [])

  useEffect(() => { loadChart(salesPeriod) }, [salesPeriod])

  useEffect(() => {
    if (chartMode !== "compare" || salesPeriod !== GroupByType.MONTH) return
    setMonthDataLoading(true)
    getMonthComparisonData(compareMonthA, compareMonthB)
      .then(setCustomMonthData)
      .catch(() => {})
      .finally(() => setMonthDataLoading(false))
  }, [chartMode, salesPeriod, compareMonthA, compareMonthB])

  useEffect(() => {
    if (topProductsView !== "graph") return
    setTopProductsLoading(true)
    getTopProductsTimeSeries(topProductsPeriod)
      .then(setTopProductsData)
      .catch(() => {})
      .finally(() => setTopProductsLoading(false))
  }, [topProductsView, topProductsPeriod])

  const handleWelcomeSubmit = async () => {
    if (!firstName.trim()) return
    setIsSavingName(true)
    try {
      await updateCurrentUserName(firstName.trim(), lastName.trim())
      router.replace("/web/dashboard") // strip ?welcome=1
    } finally {
      setIsSavingName(false)
      setShowWelcome(false)
    }
  }

  return (
    <div className="space-y-6">
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to VendorPro!</DialogTitle>
            <DialogDescription>
              You&apos;ve been added to the team. Let&apos;s quickly set up your profile so your teammates know who you are.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">First name <span className="text-destructive">*</span></label>
              <Input
                placeholder="Kyle"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleWelcomeSubmit()}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Last name</label>
              <Input
                placeholder="Johnson"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleWelcomeSubmit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWelcome(false)}>Skip</Button>
            <Button onClick={handleWelcomeSubmit} disabled={!firstName.trim() || isSavingName}>
              {isSavingName ? "Saving…" : "Get started"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back — here&apos;s how your machines are doing
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Global period control — drives KPIs, chart, and machine blocks */}
          <div className="flex rounded-md border overflow-hidden text-sm">
            {[
              { v: GroupByType.DAY, l: "Today" },
              { v: GroupByType.WEEK, l: "This Week" },
              { v: GroupByType.MONTH, l: "This Month" },
            ].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setSalesPeriod(opt.v)}
                className={`px-3 py-1.5 transition-colors ${
                  salesPeriod === opt.v
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { loadStats(); loadChart(salesPeriod) }}
            disabled={statsLoading || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading || loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* First-run nudge: no machines set up yet */}
      {!statsLoading && stats && (stats.totalMachines ?? 0) === 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4">
          <div>
            <p className="font-semibold">Finish setting up your machine</p>
            <p className="text-sm text-muted-foreground">
              Add your machine, products, and slot layout so VendorPro can start tracking sales.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/web/setup">
              Continue setup
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}

      {/* Today's Actions */}
      {!statsLoading && stats && (() => {
        const stockAlerts = (stats.outOfStockCount ?? 0) + (stats.lowStockCount ?? 0)
        const machineIssues = (stats.totalMachines ?? 0) - (stats.activeMachines ?? 0)
        if (stockAlerts === 0 && machineIssues === 0) return null
        return (
          <div className="rounded-lg border divide-y text-sm">
            {stockAlerts > 0 && (
              <Link href="/web/restock" className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors group">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="font-medium">
                    {stockAlerts} product{stockAlerts !== 1 ? "s" : ""} need restocking
                  </span>
                </div>
                <span className="text-muted-foreground group-hover:text-foreground flex items-center gap-1 transition-colors whitespace-nowrap">
                  Go to Restock <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            )}
            {machineIssues > 0 && (
              <Link href="/web/machines?attention=1" className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors group">
                <div className="flex items-center gap-3">
                  <Truck className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span className="font-medium">
                    {machineIssues} machine{machineIssues !== 1 ? "s" : ""} {machineIssues === 1 ? "is" : "are"} offline or in maintenance
                  </span>
                </div>
                <span className="text-muted-foreground group-hover:text-foreground flex items-center gap-1 transition-colors whitespace-nowrap">
                  View Machines <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            )}
          </div>
        )
      })()}

      {/* Summary Cards */}
      {(() => {
        const hasMachineIssues = !statsLoading && (stats?.totalMachines ?? 0) - (stats?.activeMachines ?? 0) > 0
        const cols = hasMachineIssues ? "lg:grid-cols-4" : "lg:grid-cols-3"
        const pk = stats?.periodKpis?.[salesPeriod]
        const periodLabel = salesPeriod === GroupByType.DAY ? "today" : salesPeriod === GroupByType.WEEK ? "this week" : "this month"
        const prevLabel = salesPeriod === GroupByType.DAY ? "yesterday" : salesPeriod === GroupByType.WEEK ? "last week" : "last month"
        return (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${cols} gap-4`}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium capitalize">Revenue {periodLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-2xl font-bold">
                {statsLoading
                  ? "—"
                  : `$${(pk?.revenue ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {!statsLoading && pk?.deltaPct != null ? (
                <>
                  {pk.deltaPct >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <p className={`text-xs font-medium ${pk.deltaPct >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {pk.deltaPct >= 0 ? "+" : ""}{pk.deltaPct.toFixed(0)}% vs {prevLabel}
                    {salesPeriod === GroupByType.DAY ? ` at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : ""}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">&nbsp;</p>
              )}
            </div>
          </CardContent>
        </Card>

        {hasMachineIssues && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Machines Need Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Truck className="h-5 w-5 mr-2 text-yellow-600" />
                <span className="text-2xl font-bold">
                  {(stats?.totalMachines ?? 0) - (stats?.activeMachines ?? 0)}/{stats?.totalMachines ?? 0}
                </span>
              </div>
              <Link
                href="/web/machines?attention=1"
                className="text-xs text-yellow-700 hover:text-yellow-900 hover:underline mt-1 block font-medium"
              >
                View machines →
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Est. Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {statsLoading
                ? "—"
                : pk?.hasCostData
                ? `$${(pk?.profit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—"}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              {pk?.hasCostData
                ? `after costs · ${pk?.margin ?? 0}% margin`
                : "add product costs to see profit"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <span className="text-2xl font-bold">—</span>
            ) : (stats?.outOfStockCount ?? 0) === 0 && (stats?.lowStockCount ?? 0) === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">All products stocked</span>
              </div>
            ) : (
              <Link href="/web/products" className="block space-y-2 group">
                {(stats?.outOfStockCount ?? 0) > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <span className="text-xl font-bold text-red-600">{stats!.outOfStockCount}</span>
                      <span className="text-sm text-muted-foreground ml-1.5">out of stock</span>
                    </div>
                  </div>
                )}
                {(stats?.lowStockCount ?? 0) > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <span className="text-xl font-bold text-yellow-600">{stats!.lowStockCount}</span>
                      <span className="text-sm text-muted-foreground ml-1.5">running low</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground group-hover:underline pt-0.5">View products →</p>
              </Link>
            )}
          </CardContent>
        </Card>
        </div>
        )
      })()}

      {/* Main Content */}
      {/* Full-width Sales Chart */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center gap-3">
              <CardTitle>Revenue Overview</CardTitle>
              <div className="flex items-center gap-2">
                {/* Chart mode toggle */}
                <div className="flex rounded-md border overflow-hidden text-xs">
                  <button
                    className={`px-2.5 py-1 transition-colors ${chartMode === "bar" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted"}`}
                    onClick={() => setChartMode("bar")}
                  >
                    Bar
                  </button>
                  <button
                    className={`px-2.5 py-1 transition-colors ${chartMode === "compare" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted"}`}
                    onClick={() => setChartMode("compare")}
                  >
                    Compare
                  </button>
                </div>
                {chartMode === "compare" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setComparisonExpanded(true)}
                    title="Expand chart"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <CardDescription className="mb-4">
              {chartMode === "compare"
                ? salesPeriod === GroupByType.DAY
                  ? "Today vs yesterday — cumulative revenue by hour"
                  : salesPeriod === GroupByType.WEEK
                  ? "This week vs last week — cumulative revenue by day"
                  : null
                : salesPeriod === GroupByType.DAY
                ? "Daily revenue — last 30 days"
                : salesPeriod === GroupByType.WEEK
                ? "Weekly revenue — last 12 weeks"
                : "Monthly revenue — last 12 months"}
              {chartMode === "compare" && salesPeriod === GroupByType.MONTH && (() => {
                const monthOptions = Array.from({ length: 24 }, (_, i) => {
                  const d = new Date()
                  d.setDate(1)
                  d.setMonth(d.getMonth() - i)
                  const y = d.getFullYear()
                  const m = d.getMonth()
                  const NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                  return { value: `${y}-${String(m + 1).padStart(2, "0")}`, label: `${NAMES[m]} ${y}` }
                })
                return (
                  <div className="flex items-center gap-2 mt-2">
                    <Select value={compareMonthA} onValueChange={setCompareMonthA}>
                      <SelectTrigger className="h-7 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <Select value={compareMonthB} onValueChange={setCompareMonthB}>
                      <SelectTrigger className="h-7 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartMode === "compare" ? (
              (statsLoading || (salesPeriod === GroupByType.MONTH && monthDataLoading)) ? (
                <LineChartSkeleton />
              ) : (() => {
                const cmp = salesPeriod === GroupByType.DAY
                  ? stats?.comparisonData?.day
                  : salesPeriod === GroupByType.WEEK
                  ? stats?.comparisonData?.week
                  : (customMonthData ?? stats?.comparisonData?.month)
                if (!cmp) return <div className="text-sm text-muted-foreground">No data</div>
                return (
                  <ComparisonLineChart
                    data={cmp.data}
                    currentLabel={cmp.currentLabel}
                    previousLabel={cmp.previousLabel}
                  />
                )
              })()
            ) : loading ? (
              <BarChartSkeleton />
            ) : (
              <SalesChart data={salesData} period={salesPeriod} />
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <div>
              <p className="text-sm font-medium">
                Avg{" "}
                {salesPeriod === GroupByType.DAY
                  ? "Daily Revenue"
                  : salesPeriod === GroupByType.WEEK
                  ? "Weekly Revenue"
                  : "Monthly Revenue"}
              </p>
              <p className="text-2xl font-bold">
                {loading
                  ? "$0.00"
                  : `$${averageSales.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </p>
            </div>
            <Link href="/web/sales">
              <Button variant="outline" size="sm">
                View Detailed Report
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Comparison chart expanded dialog */}
        <Dialog open={comparisonExpanded} onOpenChange={setComparisonExpanded}>
          <DialogContent className="max-w-[92vw] w-[92vw]">
            <DialogHeader>
              <DialogTitle>Revenue Overview — Compare</DialogTitle>
              <DialogDescription>
                {salesPeriod === GroupByType.DAY
                  ? "Today vs yesterday — cumulative revenue by hour"
                  : salesPeriod === GroupByType.WEEK
                  ? "This week vs last week — cumulative revenue by day"
                  : null}
                {salesPeriod === GroupByType.MONTH && (() => {
                  const NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                  const [yA, mA] = compareMonthA.split('-').map(Number)
                  const [yB, mB] = compareMonthB.split('-').map(Number)
                  return `${NAMES[mA-1]} ${yA} vs ${NAMES[mB-1]} ${yB} — cumulative revenue by day`
                })()}
              </DialogDescription>
            </DialogHeader>
            {(() => {
              const cmp = salesPeriod === GroupByType.DAY
                ? stats?.comparisonData?.day
                : salesPeriod === GroupByType.WEEK
                ? stats?.comparisonData?.week
                : (customMonthData ?? stats?.comparisonData?.month)
              if (!cmp) return <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
              return (
                <ComparisonLineChart
                  data={cmp.data}
                  currentLabel={cmp.currentLabel}
                  previousLabel={cmp.previousLabel}
                  viewWidth={1400}
                  viewHeight={420}
                />
              )
            })()}
          </DialogContent>
        </Dialog>

      {/* Tabs Section */}
      <Tabs defaultValue="machines">
        <TabsList>
          <TabsTrigger value="machines">My Machines</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Machines Tab */}
        <TabsContent value="machines" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>My Machines</CardTitle>
                <Link href="/web/machines">
                  <Button size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-24 rounded" />
                          <Skeleton className="h-2.5 w-32 rounded" />
                        </div>
                        <Skeleton className="h-5 w-14 rounded-full" />
                      </div>
                      <div className="grid grid-cols-3 divide-x border rounded-md">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className="px-3 py-2 space-y-1.5">
                            <Skeleton className="h-2 w-10 rounded" />
                            <Skeleton className="h-4 w-14 rounded" />
                          </div>
                        ))}
                      </div>
                      <Skeleton className="h-3 w-40 rounded" />
                      <Skeleton className="h-8 w-full rounded" />
                    </div>
                  ))
                ) : (stats?.machines ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground col-span-4">No machines found</p>
                ) : (
                  (stats?.machines ?? []).map((machine) => {
                    const periodStats = salesPeriod === GroupByType.DAY
                      ? machine.statsToday
                      : salesPeriod === GroupByType.WEEK
                      ? machine.statsWeek
                      : machine.statsMonth
                    const prevStats = salesPeriod === GroupByType.DAY
                      ? machine.statsPrevDay
                      : salesPeriod === GroupByType.WEEK
                      ? machine.statsPrevWeek
                      : machine.statsPrevMonth
                    const periodLabel = salesPeriod === GroupByType.DAY ? "today" : salesPeriod === GroupByType.WEEK ? "this week" : "this month"
                    const marginColor = periodStats?.margin == null
                      ? ""
                      : periodStats.margin >= 30 ? "text-green-600" : periodStats.margin >= 15 ? "text-yellow-600" : "text-red-500"

                    // % change for revenue and profit; absolute pt change for margin
                    function pctChange(cur: number | null, prev: number | null): number | null {
                      if (cur === null || prev === null || prev === 0) return null
                      return Math.round(((cur - prev) / prev) * 100)
                    }
                    function ptsChange(cur: number | null, prev: number | null): number | null {
                      if (cur === null || prev === null) return null
                      return Math.round(cur - prev)
                    }
                    function ChangeChip({ val, suffix = "%" }: { val: number | null; suffix?: string }) {
                      if (val === null) return null
                      const pos = val > 0
                      const neu = val === 0
                      return (
                        <span className={`text-[10px] font-medium ${neu ? "text-muted-foreground" : pos ? "text-green-600" : "text-red-500"}`}>
                          {pos ? "↑+" : neu ? "" : "↓"}{val}{suffix}
                        </span>
                      )
                    }

                    const revChange  = pctChange(periodStats?.revenue ?? null, prevStats?.revenue ?? null)
                    const profChange = pctChange(periodStats?.profit ?? null,  prevStats?.profit ?? null)
                    const marChange  = ptsChange(periodStats?.margin ?? null,  prevStats?.margin ?? null)

                    return (
                      <div key={machine.id} className="border rounded-lg p-4 flex flex-col gap-3">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                          <div className="min-w-0">
                            <p className="font-medium text-sm leading-tight">{machine.model}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{machine.locationName ?? machine.locationId}</p>
                          </div>
                          <StatusBadge status={machine.status} />
                        </div>

                        {/* Stats grid or no-card-reader notice */}
                        {machine.revenueToday === null ? (
                          <p className="text-xs text-muted-foreground italic border-t pt-3">No card reader configured</p>
                        ) : (
                          <>
                            <div className="grid grid-cols-3 divide-x border rounded-md text-center">
                              <div className="px-2 py-2">
                                <p className="text-[10px] text-muted-foreground leading-tight mb-1">Revenue</p>
                                <p className="text-sm font-semibold">${(periodStats?.revenue ?? 0).toFixed(2)}</p>
                                <ChangeChip val={revChange} />
                              </div>
                              <div className="px-2 py-2">
                                <p className="text-[10px] text-muted-foreground leading-tight mb-1">Est. Profit</p>
                                {periodStats?.profit != null
                                  ? <p className="text-sm font-semibold text-green-600">${periodStats.profit.toFixed(2)}</p>
                                  : <p className="text-sm text-muted-foreground">—</p>
                                }
                                <ChangeChip val={profChange} />
                              </div>
                              <div className="px-2 py-2">
                                <p className="text-[10px] text-muted-foreground leading-tight mb-1">Margin</p>
                                {periodStats?.margin != null
                                  ? <p className={`text-sm font-semibold ${marginColor}`}>{periodStats.margin}%</p>
                                  : <p className="text-sm text-muted-foreground">—</p>
                                }
                                <ChangeChip val={marChange} suffix="pts" />
                              </div>
                            </div>

                            {/* Secondary info */}
                            <p className="text-xs text-muted-foreground leading-tight">
                              {periodStats?.txCount ?? 0} sales {periodLabel}
                              {periodStats?.topProduct ? (
                                <> · <span>Top: {periodStats.topProduct.length > 20 ? periodStats.topProduct.slice(0, 20) + "…" : periodStats.topProduct}</span></>
                              ) : null}
                            </p>
                          </>
                        )}

                        {/* Action */}
                        <Link href={`/web/machines/${machine.id}?tab=sales`}>
                          <Button variant="outline" size="sm" className="w-full">View Details →</Button>
                        </Link>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Needs Attention */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Needs Attention</CardTitle>
                    <CardDescription>Running low based on sales velocity</CardDescription>
                  </div>
                  <Link href="/web/products">
                    <Button size="sm" variant="outline">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : (stats?.attentionProducts ?? []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-sm font-medium">All products well stocked</p>
                    <p className="text-xs text-muted-foreground mt-1">No products need reordering right now</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(stats?.attentionProducts ?? []).map((p) => {
                      const daysLeft = Math.round(p.salesData.daysToSellOut)
                      const isOutOfStock = p.inventory.total === 0
                      const isCritical = isOutOfStock || daysLeft < 3
                      return (
                        <div key={p.product.id} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`h-2 w-2 rounded-full shrink-0 ${isCritical ? "bg-red-500" : "bg-yellow-500"}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{p.product.name}</p>
                              <p className="text-xs text-muted-foreground">{p.inventory.total} units</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs font-medium ${isCritical ? "text-red-600" : "text-yellow-600"}`}>
                              {isOutOfStock ? "Out of stock" : `~${daysLeft}d`}
                            </span>
                            <Link href={`/web/products/${p.product.id}`}>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">View</Button>
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
              {(stats?.lowStockCount ?? 0) > 0 && (
                <CardFooter className="border-t pt-4">
                  <p className="text-xs text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 inline mr-1 text-yellow-600" />
                    {stats?.lowStockCount ?? 0} products under 7 days of stock
                  </p>
                </CardFooter>
              )}
            </Card>

            {/* Top Selling */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Top Selling</CardTitle>
                    <CardDescription>
                      {topProductsView === "list"
                        ? "By revenue — last 30 days"
                        : topProductsPeriod === "60days" ? "Daily revenue — last 60 days"
                        : "Daily revenue — last 30 days"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {topProductsView === "graph" && (
                      <div className="flex rounded-md border overflow-hidden text-xs">
                        {(["30days", "60days"] as const).map((p) => (
                          <button
                            key={p}
                            className={`px-2 py-1 transition-colors ${topProductsPeriod === p ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted"}`}
                            onClick={() => setTopProductsPeriod(p)}
                          >
                            {p === "30days" ? "30d" : "60d"}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex rounded-md border overflow-hidden text-xs">
                      <button
                        className={`px-2.5 py-1 transition-colors ${topProductsView === "list" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted"}`}
                        onClick={() => setTopProductsView("list")}
                      >
                        List
                      </button>
                      <button
                        className={`px-2.5 py-1 transition-colors ${topProductsView === "graph" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted"}`}
                        onClick={() => setTopProductsView("graph")}
                      >
                        Graph
                      </button>
                    </div>
                    {topProductsView === "graph" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => setTopProductsExpanded(true)}
                        title="Expand chart"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Expanded chart dialog */}
              <Dialog open={topProductsExpanded} onOpenChange={setTopProductsExpanded}>
                <DialogContent className="max-w-[92vw] w-[92vw]">
                  <DialogHeader>
                    <DialogTitle>Top Selling Products</DialogTitle>
                    <DialogDescription>
                      {topProductsPeriod === "60days" ? "Daily revenue — last 60 days" : "Daily revenue — last 30 days"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex rounded-md border overflow-hidden text-xs">
                      {(["30days", "60days"] as const).map((p) => (
                        <button
                          key={p}
                          className={`px-3 py-1.5 transition-colors ${topProductsPeriod === p ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted"}`}
                          onClick={() => setTopProductsPeriod(p)}
                        >
                          {p === "30days" ? "Last 30 days" : "Last 60 days"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {topProductsLoading ? (
                    <LineChartSkeleton taller />
                  ) : !topProductsData || topProductsData.products.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No sales in this period</p>
                  ) : (
                    <TopProductsLineChart
                      labels={topProductsData.labels}
                      products={topProductsData.products}
                      viewWidth={1400}
                      viewHeight={420}
                    />
                  )}
                </DialogContent>
              </Dialog>
              <CardContent>
                {topProductsView === "graph" ? (
                  topProductsLoading ? (
                    <LineChartSkeleton />
                  ) : !topProductsData || topProductsData.products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sales in this period</p>
                  ) : (
                    <TopProductsLineChart
                      labels={topProductsData.labels}
                      products={topProductsData.products}
                    />
                  )
                ) : statsLoading ? (
                  <TopProductsListSkeleton />
                ) : (stats?.topProducts ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sales in the last 30 days</p>
                ) : (
                  (() => {
                    const top = stats!.topProducts
                    const maxRevenue = top[0]?.revenue ?? 1
                    return (
                      <div className="space-y-3">
                        {top.map((p, i) => (
                          <div key={p.id} className="flex items-center gap-3">
                            <span className="text-sm font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                            {p.image && (
                              <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium truncate pr-3">{p.name}</p>
                                <p className="text-sm font-semibold shrink-0">${p.revenue.toFixed(2)}</p>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${(p.revenue / maxRevenue) * 100}%` }} />
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{p.unitsSold} units sold</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Issues that need your attention</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
              <div className="space-y-4">
                {(stats?.alertCounts.critical ?? 0) > 0 && (
                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      <h3 className="font-medium">
                        Critical Alerts ({stats!.alertCounts.critical})
                      </h3>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      {stats!.alertCounts.critical} products are at critical inventory levels and need immediate attention.
                    </p>
                    <Link href="/web/products">
                      <Button size="sm" className="mt-2 bg-red-600 hover:bg-red-700">View Critical Items</Button>
                    </Link>
                  </div>
                )}

                {(stats?.alertCounts.warning ?? 0) > 0 && (
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <AlertTriangle className="h-5 w-5" />
                      <h3 className="font-medium">Warnings ({stats!.alertCounts.warning})</h3>
                    </div>
                    <p className="text-sm text-yellow-600 mt-1">
                      {stats!.alertCounts.warning} products are running low and should be reordered soon.
                    </p>
                    <Link href="/web/products">
                      <Button size="sm" variant="outline" className="mt-2 border-yellow-600 text-yellow-700 hover:bg-yellow-100">View Low Stock Items</Button>
                    </Link>
                  </div>
                )}

                {(stats?.alertCounts.maintenance ?? 0) > 0 && (
                  <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Settings className="h-5 w-5" />
                      <h3 className="font-medium">Maintenance ({stats!.alertCounts.maintenance})</h3>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      {stats!.alertCounts.maintenance} machines require maintenance or service.
                    </p>
                    <Link href="/web/machines">
                      <Button size="sm" variant="outline" className="mt-2 border-blue-600 text-blue-700 hover:bg-blue-100">View Machines</Button>
                    </Link>
                  </div>
                )}

                {(stats?.missingCostProducts ?? []).length > 0 && (
                  <div className="p-4 border border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                      <DollarSign className="h-5 w-5 shrink-0" />
                      <h3 className="font-medium">
                        Missing Cost Data ({stats!.missingCostProducts.length} product{stats!.missingCostProducts.length !== 1 ? "s" : ""})
                      </h3>
                    </div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-1 mb-3">
                      These products are missing a case cost, so profit and margin can&apos;t be calculated for them. Add the wholesale case cost to enable profitability tracking.
                    </p>
                    <div className="space-y-1.5">
                      {stats!.missingCostProducts.slice(0, 6).map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-3">
                          <span className="text-sm text-purple-800 dark:text-purple-300 truncate">{p.name}</span>
                          <Link href={`/web/products/${p.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs shrink-0 border-purple-400 text-purple-700 hover:bg-purple-100 dark:text-purple-300 dark:border-purple-700 dark:hover:bg-purple-900">
                              Edit
                            </Button>
                          </Link>
                        </div>
                      ))}
                      {stats!.missingCostProducts.length > 6 && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 pt-1">
                          + {stats!.missingCostProducts.length - 6} more — <Link href="/web/products" className="underline hover:text-purple-800">view all products</Link>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {(stats?.unattributedRevenue ?? 0) > 0 && (
                  <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-700">
                      <DollarSign className="h-5 w-5" />
                      <h3 className="font-medium">
                        Unattributed Revenue — ${(stats!.unattributedRevenue).toFixed(2)}
                      </h3>
                    </div>
                    <p className="text-sm text-orange-600 mt-1">
                      {stats!.unattributedCount} transaction{stats!.unattributedCount !== 1 ? "s" : ""} ({((stats!.unattributedRevenue / (totalSales || 1)) * 100).toFixed(0)}% of revenue) can't be linked to a machine because the card reader ID isn't registered in VendorPro.
                    </p>
                    {stats!.unknownCardReaderIds.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-orange-700 mb-1">Unknown card reader IDs — add these to a machine to fix:</p>
                        <div className="flex flex-wrap gap-1">
                          {stats!.unknownCardReaderIds.map((id) => (
                            <code key={id} className="text-xs bg-orange-100 border border-orange-300 rounded px-1.5 py-0.5 font-mono text-orange-800">{id}</code>
                          ))}
                        </div>
                      </div>
                    )}
                    <Link href="/web/machines">
                      <Button size="sm" variant="outline" className="mt-3 border-orange-600 text-orange-700 hover:bg-orange-100">
                        Set Up Card Readers
                      </Button>
                    </Link>
                  </div>
                )}

                {(stats?.alertCounts.critical ?? 0) === 0 &&
                  (stats?.alertCounts.warning ?? 0) === 0 &&
                  (stats?.alertCounts.maintenance ?? 0) === 0 &&
                  (stats?.unattributedRevenue ?? 0) === 0 &&
                  (stats?.missingCostProducts ?? []).length === 0 && (
                    <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <div className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <h3 className="font-medium">All Systems Operational</h3>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        There are no alerts or warnings that need your attention at this time.
                      </p>
                    </div>
                  )}
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest transactions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : (stats?.recentTransactions ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent transactions</p>
                ) : (
                  (stats?.recentTransactions ?? []).map((tx, index) => {
                    const firstItem = tx.items?.[0]
                    const productName = firstItem?.product?.name ?? "Unknown product"
                    const machineLabel = tx.vendingMachineId ?? tx.cardReaderId ?? "Unknown machine"
                    const timeAgo = formatTimeAgo(new Date(tx.createdAt))
                    return (
                      <div key={tx.id ?? index} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <ShoppingCart className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">
                            Sale: {productName}{tx.items?.length > 1 ? ` +${tx.items.length - 1} more` : ""} — {machineLabel}
                          </p>
                          <div className="flex justify-between">
                            <p className="text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {timeAgo}
                            </p>
                            <p className="text-xs font-medium">${tx.total.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="w-full">
                View All Activity
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <hr className="my-6 border-border" />
      <NextOrderPreview />
    </div>
  )
}

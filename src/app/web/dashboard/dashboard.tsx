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
} from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { getTransactionGraphData, getDashboardData } from "./actions"
import { GroupByType } from "@/domains/Transaction/schemas/GetTransactionGraphDataSchemas"
import { formatDateLabel, formatWeekRangeLabel } from "@/utils/date"
import { useRole } from "@/lib/role-context"
import { UserRole } from "@/domains/User/entities/User"
import { useRouter } from "next/navigation"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


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
  const maxSales = Math.max(...data.map((item) => item.totalSales))
  const interval = labelInterval(data.length)

  return (
    <div className="w-full overflow-hidden">
      <div className="flex items-end gap-[2px]" style={{ height: 220 }}>
      {data.map((item, i) => {
        const height = (item.totalSales / maxSales) * 180
        const date = new Date(item.date)
        const dayOfWeek = date.toLocaleString("default", { weekday: "short" })
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
                    className="w-full bg-green-500 hover:bg-primary rounded-t-sm transition-colors cursor-pointer"
                    style={{ height: `${height}px` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <div className="font-semibold">
                      {formatDateLabel(item.date, period)} ({dayOfWeek})
                    </div>
                    <div>
                      Sales:{" "}
                      <span className="font-bold">${item.totalSales}</span>
                    </div>
                    <div>
                      Transactions:{" "}
                      <span className="font-bold">
                        {item.totalTransactions}
                      </span>
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

export function Dashboard() {
  const { role } = useRole()
  const router = useRouter()
  const [salesPeriod, setSalesPeriod] = useState<GroupByType>(GroupByType.DAY)
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(false)
  const [totalSales, setTotalSales] = useState(0)
  const [averageSales, setAverageSales] = useState(0)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (role === UserRole.DRIVER) {
      router.replace("/web/routes")
    }
  }, [role, router])

  if (role === UserRole.DRIVER) return null

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your vending machine management dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { loadStats(); loadChart(salesPeriod) }}
            disabled={statsLoading || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading || loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-2xl font-bold">
                {statsLoading
                  ? "—"
                  : `$${(stats?.todayRevenue ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {!statsLoading && stats?.todayVsYesterdayPct != null ? (
                <>
                  {stats.todayVsYesterdayPct >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <p className={`text-xs font-medium ${stats.todayVsYesterdayPct >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {stats.todayVsYesterdayPct >= 0 ? "+" : ""}{stats.todayVsYesterdayPct.toFixed(0)}% vs yesterday
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {statsLoading ? "" : `$${(stats?.yesterdayRevenue ?? 0).toFixed(2)} yesterday`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Machines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Truck className="h-5 w-5 mr-2 text-primary" />
              <span className="text-2xl font-bold">
                {statsLoading ? "—" : `${stats?.activeMachines ?? 0}/${stats?.totalMachines ?? 0}`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statsLoading ? "" : `${(stats?.totalMachines ?? 0) - (stats?.activeMachines ?? 0)} machines need attention`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Inventory Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-primary" />
              <span className="text-2xl font-bold">
                {statsLoading ? "—" : `${stats?.inventoryPct ?? 0}%`}
              </span>
            </div>
            <div className="mt-2">
              <Progress value={stats?.inventoryPct ?? 0} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statsLoading
                ? ""
                : `${stats?.lowStockCount ?? 0} products low, ${stats?.outOfStockCount ?? 0} out of stock`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
              <span className="text-2xl font-bold">
                {statsLoading ? "—" : (stats?.monthlySalesCount ?? 0)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              transactions this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Sales Overview</CardTitle>
              <Select
                value={salesPeriod}
                onValueChange={(value: GroupByType) => setSalesPeriod(value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GroupByType.DAY}>Daily</SelectItem>
                  <SelectItem value={GroupByType.WEEK}>Weekly</SelectItem>
                  <SelectItem value={GroupByType.MONTH}>Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription className="mb-4">
              {salesPeriod === GroupByType.DAY
                ? "Last 30 days sales performance"
                : salesPeriod === GroupByType.WEEK
                ? "Last 12 weeks sales performance"
                : "Last 12 months sales performance"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <SalesChart data={salesData} period={salesPeriod} />
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <div>
              <p className="text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold">
                {loading
                  ? "$0.00"
                  : `$${totalSales.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">
                Average{" "}
                {salesPeriod === GroupByType.DAY
                  ? "Daily"
                  : salesPeriod === GroupByType.WEEK
                  ? "Weekly"
                  : "Monthly"}
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
            <Button variant="outline" size="sm">
              View Detailed Report
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>

        {/* Right Column - Recent Activity */}
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
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="machines">
        <TabsList>
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Machines Tab */}
        <TabsContent value="machines" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Machine Status</CardTitle>
                <Link href="/web/machines">
                  <Button size="sm">View All Machines</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsLoading ? (
                  <p className="text-sm text-muted-foreground col-span-4">Loading…</p>
                ) : (stats?.machines ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground col-span-4">No machines found</p>
                ) : (
                  (stats?.machines ?? []).map((machine) => (
                    <div key={machine.id} className="border rounded-lg p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <p className="font-medium text-sm leading-tight">{machine.model}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{machine.locationName ?? machine.locationId}</p>
                        </div>
                        <StatusBadge status={machine.status} />
                      </div>
                      <div className="border-t pt-3">
                        {machine.revenue === null ? (
                          <p className="text-xs text-muted-foreground italic">No card reader configured</p>
                        ) : (
                          <div>
                            <p className="text-xs text-muted-foreground">Revenue (all-time)</p>
                            <p className="text-lg font-semibold">${machine.revenue.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                      <Link href={`/web/machines/${machine.id}`}>
                        <Button variant="outline" size="sm" className="w-full">View Details</Button>
                      </Link>
                    </div>
                  ))
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
                <div>
                  <CardTitle>Top Selling</CardTitle>
                  <CardDescription>By revenue — last 30 days</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
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
                  (stats?.unattributedRevenue ?? 0) === 0 && (
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
      </Tabs>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  BarChart3,
  TrendingUp,
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
import { getTransactionGraphData } from "./actions"
import { GroupByType } from "@/domains/Transaction/schemas/GetTransactionGraphDataSchemas"
import { formatDateLabel, formatWeekRangeLabel } from "@/utils/date"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Sample dashboard data - in a real app, this would come from your backend
const dashboardData = {
  summary: {
    totalMachines: 12,
    activeMachines: 10,
    totalProducts: 24,
    totalRevenue: "$12,845.75",
    dailyRevenue: "$1,245.50",
    weeklyRevenue: "$8,762.25",
    monthlySales: 4250,
    monthlyRevenue: "$12,845.75",
  },
  alerts: {
    critical: 2,
    warning: 3,
    maintenance: 1,
  },
  inventory: {
    lowStock: 4,
    outOfStock: 1,
    reorderNeeded: 3,
    totalStock: 85, // percentage
  },
  machines: [
    {
      id: "VM001",
      location: "Main Building, Floor 1",
      status: "Online",
      inventory: 87,
      revenue: "$1,245.50",
    },
    {
      id: "VM002",
      location: "Science Block, Floor 2",
      status: "Online",
      inventory: 62,
      revenue: "$876.25",
    },
    {
      id: "VM003",
      location: "Library, Floor 1",
      status: "Maintenance",
      inventory: 45,
      revenue: "$523.75",
    },
    {
      id: "VM004",
      location: "Student Center",
      status: "Online",
      inventory: 91,
      revenue: "$1,102.00",
    },
  ],
  products: [
    {
      id: "4",
      name: "Doritos",
      inventory: 85,
      status: "critical",
      daysLeft: 3,
    },
    {
      id: "6",
      name: "Snickers",
      inventory: 60,
      status: "critical",
      daysLeft: 2,
    },
    {
      id: "3",
      name: "Sprite",
      inventory: 120,
      status: "warning",
      daysLeft: 8,
    },
    {
      id: "8",
      name: "Twix",
      inventory: 90,
      status: "warning",
      daysLeft: 7,
    },
  ],
  recentActivity: [
    {
      type: "sale",
      machine: "VM001",
      product: "Coca-Cola",
      time: "10 minutes ago",
      amount: "$2.50",
    },
    {
      type: "restock",
      machine: "VM003",
      time: "2 hours ago",
      user: "John Doe",
    },
    {
      type: "maintenance",
      machine: "VM005",
      time: "Yesterday, 3:45 PM",
      user: "Jane Smith",
    },
    {
      type: "alert",
      machine: "VM002",
      time: "Yesterday, 2:30 PM",
      message: "Low inventory alert",
    },
    {
      type: "sale",
      machine: "VM004",
      product: "Snickers",
      time: "Yesterday, 1:15 PM",
      amount: "$1.50",
    },
  ],
  salesData: {
    daily: [
      { day: "Mon", sales: 145 },
      { day: "Tue", sales: 132 },
      { day: "Wed", sales: 164 },
      { day: "Thu", sales: 156 },
      { day: "Fri", sales: 178 },
      { day: "Sat", sales: 210 },
      { day: "Sun", sales: 190 },
    ],
    weekly: [
      { week: "Week 1", sales: 1050 },
      { week: "Week 2", sales: 980 },
      { week: "Week 3", sales: 1100 },
      { week: "Week 4", sales: 1200 },
    ],
    monthly: [
      { month: "Jan", sales: 4200 },
      { month: "Feb", sales: 3800 },
      { month: "Mar", sales: 4100 },
      { month: "Apr", sales: 4300 },
      { month: "May", sales: 4500 },
      { month: "Jun", sales: 4800 },
      { month: "Jul", sales: 5100 },
      { month: "Aug", sales: 5300 },
      { month: "Sep", sales: 5200 },
      { month: "Oct", sales: 5400 },
      { month: "Nov", sales: 5600 },
      { month: "Dec", sales: 6000 },
    ],
  },
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Online") {
    return <Badge className="bg-green-600">Online</Badge>
  } else if (status === "Maintenance") {
    return <Badge variant="destructive">Maintenance</Badge>
  } else if (status === "Offline") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Offline
      </Badge>
    )
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
function SalesChart({
  data,
  period,
}: {
  data: SalesData[]
  period: GroupByType
}) {
  const maxSales = Math.max(...data.map((item) => item.totalSales))

  return (
    <div className="h-[200px] flex items-end gap-2">
      {data.map((item, i) => {
        const height = (item.totalSales / maxSales) * 200 // 200px container height
        const date = new Date(item.date)
        const dayOfWeek = date.toLocaleString("default", { weekday: "short" })

        return (
          <div
            key={i}
            className="flex-1 flex flex-col justify-end items-center h-[220px]"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="w-full bg-green-500 hover:bg-primary rounded-t-sm transition-colors mb-3 cursor-pointer"
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
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground">
                {period === GroupByType.WEEK
                  ? formatWeekRangeLabel(item.date)
                  : formatDateLabel(item.date, period)}
              </span>
              {period === GroupByType.DAY && (
                <span className="text-[10px] text-muted-foreground/60">
                  {dayOfWeek}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
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

export function Dashboard() {
  const [salesPeriod, setSalesPeriod] = useState<GroupByType>(GroupByType.DAY)
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(false)
  const [totalSales, setTotalSales] = useState(0)
  const [averageSales, setAverageSales] = useState(0)

  useEffect(() => {
    setLoading(true)
    getTransactionGraphData(salesPeriod)
      .then((res) => {
        if (res.success && res.data) {
          setSalesData(res.data.groupedData)
          setTotalSales(res.data.totalSales)
          setAverageSales(res.data.averageSales)
        }
      })
      .finally(() => setLoading(false))
  }, [salesPeriod])

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
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary" />
              <span className="text-2xl font-bold">
                {loading
                  ? "$0.00"
                  : `$${totalSales.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1 text-green-600" />
              <span className="text-green-600 font-medium">+12.5%</span> from
              last month
            </p>
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
                {dashboardData.summary.activeMachines}/
                {dashboardData.summary.totalMachines}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.summary.totalMachines -
                dashboardData.summary.activeMachines}{" "}
              machines need attention
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
                {dashboardData.inventory.totalStock}%
              </span>
            </div>
            <div className="mt-2">
              <Progress
                value={dashboardData.inventory.totalStock}
                className="h-2"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.inventory.lowStock} products low,{" "}
              {dashboardData.inventory.outOfStock} out of stock
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
                {dashboardData.summary.monthlySales}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1 text-green-600" />
              <span className="text-green-600 font-medium">+8.2%</span> from
              last month
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
              {dashboardData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <ActivityIcon type={activity.type} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {activity.type === "sale" &&
                        `Sale: ${activity.product} from ${activity.machine}`}
                      {activity.type === "restock" &&
                        `Restock: ${activity.machine} by ${activity.user}`}
                      {activity.type === "maintenance" &&
                        `Maintenance: ${activity.machine} by ${activity.user}`}
                      {activity.type === "alert" &&
                        `Alert: ${activity.message} on ${activity.machine}`}
                    </p>
                    <div className="flex justify-between">
                      <p className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {activity.time}
                      </p>
                      {activity.amount && (
                        <p className="text-xs font-medium">{activity.amount}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
              <CardDescription>
                Overview of your vending machines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardData.machines.map((machine) => (
                  <Card key={machine.id} className="border-none shadow-none">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">
                          {machine.id}
                        </CardTitle>
                        <StatusBadge status={machine.status} />
                      </div>
                      <CardDescription className="text-xs">
                        {machine.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Inventory
                          </p>
                          <p className="font-medium">{machine.inventory}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Revenue
                          </p>
                          <p className="font-medium">{machine.revenue}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Link href={`/machines/${machine.id}`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Product Inventory</CardTitle>
                <Link href="products">
                  <Button size="sm">View All Products</Button>
                </Link>
              </div>
              <CardDescription>Products that need attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge status={product.status} />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Inventory: {product.inventory} units
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${
                            product.daysLeft <= 3
                              ? "text-red-600"
                              : product.daysLeft <= 7
                              ? "text-yellow-600"
                              : ""
                          }`}
                        >
                          {product.daysLeft} days left
                        </p>
                      </div>
                      <Link href={`/products/${product.id}`}>
                        <Button size="sm" variant="outline">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 inline mr-1 text-yellow-600" />
                {dashboardData.inventory.reorderNeeded} products need to be
                reordered
              </div>
              <Link href="/products">
                <Button variant="outline" size="sm">
                  Manage Inventory
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Issues that need your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.alerts.critical > 0 && (
                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      <h3 className="font-medium">
                        Critical Alerts ({dashboardData.alerts.critical})
                      </h3>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      {dashboardData.alerts.critical} products are at critical
                      inventory levels and need immediate attention.
                    </p>
                    <Button
                      size="sm"
                      className="mt-2 bg-red-600 hover:bg-red-700"
                    >
                      View Critical Items
                    </Button>
                  </div>
                )}

                {dashboardData.alerts.warning > 0 && (
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <AlertTriangle className="h-5 w-5" />
                      <h3 className="font-medium">
                        Warnings ({dashboardData.alerts.warning})
                      </h3>
                    </div>
                    <p className="text-sm text-yellow-600 mt-1">
                      {dashboardData.alerts.warning} products are running low
                      and should be reordered soon.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                    >
                      View Low Stock Items
                    </Button>
                  </div>
                )}

                {dashboardData.alerts.maintenance > 0 && (
                  <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Settings className="h-5 w-5" />
                      <h3 className="font-medium">
                        Maintenance ({dashboardData.alerts.maintenance})
                      </h3>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      {dashboardData.alerts.maintenance} machines require
                      maintenance or service.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 border-blue-600 text-blue-700 hover:bg-blue-100"
                    >
                      View Maintenance Schedule
                    </Button>
                  </div>
                )}

                {dashboardData.alerts.critical === 0 &&
                  dashboardData.alerts.warning === 0 &&
                  dashboardData.alerts.maintenance === 0 && (
                    <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <div className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <h3 className="font-medium">All Systems Operational</h3>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        There are no alerts or warnings that need your attention
                        at this time.
                      </p>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/machines">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
              >
                <Truck className="h-6 w-6" />
                <span>Manage Machines</span>
              </Button>
            </Link>
            <Link href="/products">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
              >
                <Package className="h-6 w-6" />
                <span>Inventory</span>
              </Button>
            </Link>
            <Link href="/orders">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
              >
                <ShoppingCart className="h-6 w-6" />
                <span>Orders</span>
              </Button>
            </Link>
            <Link href="/reports">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
              >
                <BarChart3 className="h-6 w-6" />
                <span>Reports</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
              >
                <Settings className="h-6 w-6" />
                <span>Settings</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

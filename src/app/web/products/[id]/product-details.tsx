"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Clock,
  PlusCircle,
  Truck,
  History,
  Edit,
  Trash2,
  ExternalLink,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SalesData {
  date?: string
  week?: string
  month?: string
  quantity: number
  revenue?: number
  sales?: number // For monthly data
}

interface Product {
  id: string
  name: string
  image: string
  price: number
  costPrice: number
  profitMargin: number
  sku: string
  barcode: string
  supplier: string
  vendorUrl: string
  leadTime: number
  caseQuantity: number
  minOrderQuantity: number
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
  salesHistory: SalesData[]
  weeklySales: SalesData[] // Now matches the actual data structure
  monthlySales: SalesData[] // Now matches the actual data structure
}

interface SalesGraphProps {
  product: Product
}

// Extended product data with more details for the product detail page
const getProductData = (id: string) => {
  // Find the base product from our inventory data
  const baseProduct = productInventory.find((p) => p.id === id)

  if (!baseProduct) {
    return null
  }

  // Extended data for the product detail view
  return {
    ...baseProduct,
    description: `Premium quality ${baseProduct.name.toLowerCase()} that's popular among customers of all ages.`,
    sku: `SKU-${baseProduct.id}-${Math.floor(1000 + Math.random() * 9000)}`,
    barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    supplier:
      baseProduct.category === "drink"
        ? "Beverage Distributors Inc."
        : "Snack Supply Co.",
    supplierContact: "supplier@example.com",
    lastOrdered: "2023-10-15",
    leadTime: baseProduct.category === "drink" ? 3 : 5, // days
    minOrderQuantity: 24,
    caseQuantity: baseProduct.category === "drink" ? 24 : 36, // Units per case
    costPrice: baseProduct.price * 0.6,
    profitMargin: 40, // percentage
    vendorUrl:
      baseProduct.category === "drink"
        ? "https://www.samsclub.com/b/beverages/1520104"
        : "https://www.samsclub.com/b/snacks/1520107",
    salesHistory: [
      { date: "2023-11-01", quantity: Math.floor(10 + Math.random() * 20) },
      { date: "2023-11-02", quantity: Math.floor(10 + Math.random() * 20) },
      { date: "2023-11-03", quantity: Math.floor(10 + Math.random() * 20) },
      { date: "2023-11-04", quantity: Math.floor(10 + Math.random() * 20) },
      { date: "2023-11-05", quantity: Math.floor(10 + Math.random() * 20) },
      { date: "2023-11-06", quantity: Math.floor(10 + Math.random() * 20) },
      { date: "2023-11-07", quantity: Math.floor(10 + Math.random() * 20) },
      { date: "2023-11-08", quantity: Math.floor(10 + Math.random() * 20) },
      { date: "2023-11-09", quantity: Math.floor(10 + Math.random() * 20) },
      { date: "2023-11-10", quantity: Math.floor(10 + Math.random() * 20) },
      { date: "2023-11-11", quantity: Math.floor(10 + Math.random() * 20) },
      { date: "2023-11-12", quantity: Math.floor(10 + Math.random() * 20) },
      { date: "2023-11-13", quantity: Math.floor(10 + Math.random() * 20) },
      { date: "2023-11-14", quantity: Math.floor(10 + Math.random() * 20) },
    ],
    // Add weekly sales data for the past 12 weeks
    weeklySales: [
      {
        week: "Aug 7-13",
        quantity: Math.floor(80 + Math.random() * 40),
        revenue: Math.floor(200 + Math.random() * 100),
      },
      {
        week: "Aug 14-20",
        quantity: Math.floor(80 + Math.random() * 40),
        revenue: Math.floor(200 + Math.random() * 100),
      },
      {
        week: "Aug 21-27",
        quantity: Math.floor(80 + Math.random() * 40),
        revenue: Math.floor(200 + Math.random() * 100),
      },
      {
        week: "Aug 28-Sep 3",
        quantity: Math.floor(80 + Math.random() * 40),
        revenue: Math.floor(200 + Math.random() * 100),
      },
      {
        week: "Sep 4-10",
        quantity: Math.floor(80 + Math.random() * 40),
        revenue: Math.floor(200 + Math.random() * 100),
      },
      {
        week: "Sep 11-17",
        quantity: Math.floor(80 + Math.random() * 40),
        revenue: Math.floor(200 + Math.random() * 100),
      },
      {
        week: "Sep 18-24",
        quantity: Math.floor(80 + Math.random() * 40),
        revenue: Math.floor(200 + Math.random() * 100),
      },
      {
        week: "Sep 25-Oct 1",
        quantity: Math.floor(80 + Math.random() * 40),
        revenue: Math.floor(200 + Math.random() * 100),
      },
      {
        week: "Oct 2-8",
        quantity: Math.floor(80 + Math.random() * 40),
        revenue: Math.floor(200 + Math.random() * 100),
      },
      {
        week: "Oct 9-15",
        quantity: Math.floor(80 + Math.random() * 40),
        revenue: Math.floor(200 + Math.random() * 100),
      },
      {
        week: "Oct 16-22",
        quantity: Math.floor(80 + Math.random() * 40),
        revenue: Math.floor(200 + Math.random() * 100),
      },
      {
        week: "Oct 23-29",
        quantity: Math.floor(90 + Math.random() * 50),
        revenue: Math.floor(220 + Math.random() * 120),
      },
    ],
    machineDistribution: [
      {
        machineId: "VM001",
        location: "Main Building, Floor 1",
        quantity: 12,
        lastRestocked: "2023-11-10",
      },
      {
        machineId: "VM002",
        location: "Science Block, Floor 2",
        quantity: 8,
        lastRestocked: "2023-11-12",
      },
      {
        machineId: "VM003",
        location: "Library, Floor 1",
        quantity: 10,
        lastRestocked: "2023-11-08",
      },
      {
        machineId: "VM004",
        location: "Student Center",
        quantity: 15,
        lastRestocked: "2023-11-15",
      },
      {
        machineId: "VM005",
        location: "Sports Complex",
        quantity: 15,
        lastRestocked: "2023-11-09",
      },
    ],
    reorderHistory: [
      { date: "2023-10-15", quantity: 120, cases: 5, status: "delivered" },
      { date: "2023-09-22", quantity: 120, cases: 5, status: "delivered" },
      { date: "2023-08-30", quantity: 100, cases: 4, status: "delivered" },
    ],
    monthlySales: [
      {
        month: "Jan",
        quantity: Math.floor(300 + Math.random() * 100),
        sales: Math.floor(300 + Math.random() * 100),
      },
      {
        month: "Feb",
        quantity: Math.floor(300 + Math.random() * 100),
        sales: Math.floor(300 + Math.random() * 100),
      },
      {
        month: "Mar",
        quantity: Math.floor(300 + Math.random() * 100),
        sales: Math.floor(300 + Math.random() * 100),
      },
      // ... add more months as needed
    ],
  }
}

// Sample product inventory data (same as in products-inventory.tsx)
const productInventory = [
  {
    id: "1",
    name: "Coca-Cola",
    image:
      "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&h=300&fit=crop",
    category: "drink",
    price: 2.5,
    inventory: {
      total: 240,
      storage: 180,
      machines: 60,
    },
    sales: {
      daily: 24,
      weekly: 168,
      trend: "up" as const,
      velocity: "high" as const,
      velocityRank: 3,
    },
    reorderPoint: 100,
    reorderStatus: "ok" as const,
    daysUntilStockout: 10,
  },
  {
    id: "2",
    name: "Diet Coke",
    image:
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&h=300&fit=crop",
    category: "drink",
    price: 2.5,
    inventory: {
      total: 180,
      storage: 120,
      machines: 60,
    },
    sales: {
      daily: 18,
      weekly: 126,
      trend: "stable" as const,
      velocity: "medium" as const,
      velocityRank: 2,
    },
    reorderPoint: 100,
    reorderStatus: "ok" as const,
    daysUntilStockout: 10,
  },
  {
    id: "3",
    name: "Sprite",
    image:
      "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=300&h=300&fit=crop",
    category: "drink",
    price: 2.5,
    inventory: {
      total: 120,
      storage: 60,
      machines: 60,
    },
    sales: {
      daily: 15,
      weekly: 105,
      trend: "up" as const,
      velocity: "medium" as const,
      velocityRank: 2,
    },
    reorderPoint: 100,
    reorderStatus: "warning" as const,
    daysUntilStockout: 8,
  },
  {
    id: "4",
    name: "Doritos",
    image:
      "https://images.unsplash.com/photo-1600952841320-db92ec4047ca?w=300&h=300&fit=crop",
    category: "snack",
    price: 1.75,
    inventory: {
      total: 85,
      storage: 25,
      machines: 60,
    },
    sales: {
      daily: 22,
      weekly: 154,
      trend: "up" as const,
      velocity: "high" as const,
      velocityRank: 3,
    },
    reorderPoint: 80,
    reorderStatus: "critical" as const,
    daysUntilStockout: 3,
  },
  {
    id: "5",
    name: "Lays Classic",
    image:
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop",
    category: "snack",
    price: 1.75,
    inventory: {
      total: 150,
      storage: 90,
      machines: 60,
    },
    sales: {
      daily: 20,
      weekly: 140,
      trend: "stable" as const,
      velocity: "medium" as const,
      velocityRank: 2,
    },
    reorderPoint: 80,
    reorderStatus: "ok" as const,
    daysUntilStockout: 7,
  },
  {
    id: "6",
    name: "Snickers",
    image:
      "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=300&h=300&fit=crop",
    category: "snack",
    price: 1.5,
    inventory: {
      total: 60,
      storage: 0,
      machines: 60,
    },
    sales: {
      daily: 25,
      weekly: 175,
      trend: "up" as const,
      velocity: "high" as const,
      velocityRank: 3,
    },
    reorderPoint: 80,
    reorderStatus: "critical" as const,
    daysUntilStockout: 2,
  },
  {
    id: "7",
    name: "M&Ms",
    image:
      "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=300&h=300&fit=crop",
    category: "snack",
    price: 1.5,
    inventory: {
      total: 200,
      storage: 140,
      machines: 60,
    },
    sales: {
      daily: 15,
      weekly: 105,
      trend: "down" as const,
      velocity: "low" as const,
      velocityRank: 1,
    },
    reorderPoint: 80,
    reorderStatus: "ok" as const,
    daysUntilStockout: 13,
  },
  {
    id: "8",
    name: "Twix",
    image:
      "https://images.unsplash.com/photo-1527904324834-3bda86da6771?w=300&h=300&fit=crop",
    category: "snack",
    price: 1.5,
    inventory: {
      total: 90,
      storage: 30,
      machines: 60,
    },
    sales: {
      daily: 12,
      weekly: 84,
      trend: "stable" as const,
      velocity: "medium" as const,
      velocityRank: 2,
    },
    reorderPoint: 80,
    reorderStatus: "warning" as const,
    daysUntilStockout: 7,
  },
]

function InventoryStatusBadge({
  status,
}: {
  status: "ok" | "warning" | "critical"
}) {
  if (status === "ok") {
    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200"
      >
        Good
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
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200"
      >
        Critical
      </Badge>
    )
  }
}

function SalesTrendIndicator({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") {
    return <TrendingUp className="h-4 w-4 text-green-600" />
  } else if (trend === "down") {
    return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
  } else {
    return <TrendingUp className="h-4 w-4 text-muted-foreground rotate-90" />
  }
}

function SalesVelocityBadge({
  velocity,
}: {
  velocity: "high" | "medium" | "low"
}) {
  if (velocity === "high") {
    return <Badge className="bg-green-600">High</Badge>
  } else if (velocity === "medium") {
    return <Badge className="bg-blue-600">Medium</Badge>
  } else {
    return <Badge variant="secondary">Low</Badge>
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

// Update the SalesGraph component to handle different data structures
function SalesGraph({ product }: SalesGraphProps) {
  const getPeriodData = () => {
    return {
      data: product.weeklySales.map((item) => ({
        ...item,
        quantity: item.quantity || item.sales || 0, // Handle both quantity and sales fields
      })),
    }
  }

  const { data } = getPeriodData()
  const peakQuantity = Math.max(...data.map((item: SalesData) => item.quantity))

  return (
    <div className="space-y-6">
      <div className="h-[300px] flex items-end gap-2">
        {data.map((item: SalesData, i: number) => {
          const height = (item.quantity / peakQuantity) * 100
          return (
            <div
              key={i}
              className="relative flex-1 group"
              style={{ height: `${height}%` }}
            >
              {/* Bar content */}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Update the ProductDetail component to handle case quantities
export function ProductDetail({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ReturnType<
    typeof getProductData
  > | null>(null)
  const [reorderCases, setReorderCases] = useState("5")

  useEffect(() => {
    setProduct(getProductData(productId))
  }, [productId])

  if (!product) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    )
  }

  const totalUnits = Number.parseInt(reorderCases) * product.caseQuantity

  const handleCaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*$/.test(value)) {
      setReorderCases(value)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section remains the same */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/web/products"
            className="flex items-center text-sm text-muted-foreground hover:text-primary mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Products
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <Badge variant="outline" className="capitalize">
              {product.category}
            </Badge>
            <InventoryStatusBadge status={product.reorderStatus} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Product info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-40 h-40 object-cover rounded-md"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">${product.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cost:</span>
                <span className="font-medium">
                  ${product.costPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profit Margin:</span>
                <span className="font-medium">{product.profitMargin}%</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SKU:</span>
                <span className="font-medium">{product.sku}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Barcode:</span>
                <span className="font-medium">{product.barcode}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Supplier:</span>
                <span className="font-medium">{product.supplier}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vendor Link:</span>
                <a
                  href={product.vendorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary flex items-center hover:underline"
                >
                  Sam&apos;s Club <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lead Time:</span>
                <span className="font-medium">{product.leadTime} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Case Quantity:</span>
                <span className="font-medium">
                  {product.caseQuantity} units/case
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Min Order:</span>
                <span className="font-medium">
                  {product.minOrderQuantity} units
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inventory Status</CardTitle>
            <CardDescription>
              Current stock levels and distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Inventory
                  </span>
                  <span className="text-sm font-medium">
                    {product.inventory.total} units
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    100,
                    (product.inventory.total / product.reorderPoint) * 100
                  )}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Reorder Point: {product.reorderPoint}</span>
                  <span>
                    {product.daysUntilStockout <= 3 ? (
                      <span className="text-red-600 font-medium">
                        {product.daysUntilStockout} days left
                      </span>
                    ) : product.daysUntilStockout <= 7 ? (
                      <span className="text-yellow-600">
                        {product.daysUntilStockout} days left
                      </span>
                    ) : (
                      <span>{product.daysUntilStockout} days left</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    In Storage
                  </span>
                  <span className="text-sm font-medium">
                    {product.inventory.storage} units
                  </span>
                </div>
                <Progress
                  value={
                    (product.inventory.storage / product.inventory.total) * 100
                  }
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  {Math.round(
                    (product.inventory.storage / product.inventory.total) * 100
                  )}
                  % of total inventory
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    In Machines
                  </span>
                  <span className="text-sm font-medium">
                    {product.inventory.machines} units
                  </span>
                </div>
                <Progress
                  value={
                    (product.inventory.machines / product.inventory.total) * 100
                  }
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  {Math.round(
                    (product.inventory.machines / product.inventory.total) * 100
                  )}
                  % of total inventory
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1 p-3 border rounded-md">
                <span className="text-xs text-muted-foreground">
                  Daily Sales
                </span>
                <div className="flex items-center gap-1">
                  <SalesTrendIndicator trend={product.sales.trend} />
                  <span className="text-lg font-medium">
                    {product.sales.daily}/day
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 p-3 border rounded-md">
                <span className="text-xs text-muted-foreground">
                  Sales Velocity
                </span>
                <div className="flex items-center gap-2">
                  <SalesVelocityBadge velocity={product.sales.velocity} />
                  <span className="text-lg font-medium">
                    {product.sales.weekly}/week
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 p-3 border rounded-md">
                <span className="text-xs text-muted-foreground">
                  Last Ordered
                </span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-medium">
                    {formatDate(product.lastOrdered)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-medium mb-3">Reorder Product</h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="quantity" className="mb-2 block text-sm">
                    Number of Cases
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={reorderCases}
                    onChange={handleCaseChange}
                    min="1"
                    step="1"
                  />
                </div>
                <div className="flex-1">
                  <Label className="mb-2 block text-sm">Total Units</Label>
                  <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center">
                    {totalUnits} units
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    className="flex-shrink-0"
                    variant={
                      product.reorderStatus === "ok" ? "outline" : "default"
                    }
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Reorder Now
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Products must be ordered in full cases. Each case contains{" "}
                {product.caseQuantity} units. Estimated delivery in{" "}
                {product.leadTime} days.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs section */}
      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales Data</TabsTrigger>
          <TabsTrigger value="distribution">Machine Distribution</TabsTrigger>
          <TabsTrigger value="history">Order History</TabsTrigger>
        </TabsList>
        {/* // Replace the sales tab content with this updated version */}
        <TabsContent value="sales" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
              <CardDescription>Sales data and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesGraph product={product} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="distribution" className="mt-6">
          {/* Distribution tab content remains the same */}
          <Card>
            <CardHeader>
              <CardTitle>Machine Distribution</CardTitle>
              <CardDescription>
                Current distribution across vending machines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Last Restocked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.machineDistribution.map((machine) => (
                    <TableRow key={machine.machineId}>
                      <TableCell className="font-medium">
                        {machine.machineId}
                      </TableCell>
                      <TableCell>{machine.location}</TableCell>
                      <TableCell>{machine.quantity} units</TableCell>
                      <TableCell>{formatDate(machine.lastRestocked)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          <Truck className="h-4 w-4 mr-2" />
                          Restock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Total in machines: {product.inventory.machines} units across{" "}
                  {product.machineDistribution.length} machines
                </div>
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add to Machine
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          {/* Update the order history tab to show case quantities */}
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>
                Previous orders and restock history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Cases</TableHead>
                    <TableHead>Total Units</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.reorderHistory.map((order, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(order.date)}</TableCell>
                      <TableCell>{order.cases} cases</TableCell>
                      <TableCell>{order.quantity} units</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        ${(order.quantity * product.costPrice).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          <History className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Last order placed on{" "}
                  {formatDate(product.reorderHistory[0].date)}
                </div>
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Place New Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

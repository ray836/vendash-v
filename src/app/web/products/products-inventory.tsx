"use client"

import type React from "react"

import { useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Search,
  Filter,
  Package,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

// Sample product inventory data
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
      trend: "up", // up, down, stable
      velocity: "high", // high, medium, low
      velocityRank: 3, // Numeric rank for sorting (higher = faster selling)
    },
    reorderPoint: 100,
    reorderStatus: "ok", // ok, warning, critical
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
      trend: "stable",
      velocity: "medium",
      velocityRank: 2,
    },
    reorderPoint: 100,
    reorderStatus: "ok",
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
      trend: "up",
      velocity: "medium",
      velocityRank: 2,
    },
    reorderPoint: 100,
    reorderStatus: "warning",
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
      trend: "up",
      velocity: "high",
      velocityRank: 3,
    },
    reorderPoint: 80,
    reorderStatus: "critical",
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
      trend: "stable",
      velocity: "medium",
      velocityRank: 2,
    },
    reorderPoint: 80,
    reorderStatus: "ok",
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
      trend: "up",
      velocity: "high",
      velocityRank: 3,
    },
    reorderPoint: 80,
    reorderStatus: "critical",
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
      trend: "down",
      velocity: "low",
      velocityRank: 1,
    },
    reorderPoint: 80,
    reorderStatus: "ok",
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
      trend: "stable",
      velocity: "medium",
      velocityRank: 2,
    },
    reorderPoint: 80,
    reorderStatus: "warning",
    daysUntilStockout: 7,
  },
]

function InventoryStatusBadge({ status }: { status: string }) {
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

function SalesTrendIndicator({ trend }: { trend: string }) {
  if (trend === "up") {
    return <ArrowUp className="h-4 w-4 text-green-600" />
  } else if (trend === "down") {
    return <ArrowDown className="h-4 w-4 text-red-600" />
  } else {
    return <ArrowRight className="h-4 w-4 text-muted-foreground" />
  }
}

function SalesVelocityBadge({ velocity }: { velocity: string }) {
  if (velocity === "high") {
    return <Badge className="bg-green-600">High</Badge>
  } else if (velocity === "medium") {
    return <Badge className="bg-blue-600">Medium</Badge>
  } else {
    return <Badge variant="secondary">Low</Badge>
  }
}

function SortableTableHeader({
  children,
  sortKey,
  currentSort,
  onSort,
  className,
}: {
  children: React.ReactNode
  sortKey: string
  currentSort: { key: string; direction: "asc" | "desc" }
  onSort: (key: string) => void
  className?: string
}) {
  const isSorted = currentSort.key === sortKey

  return (
    <TableHead
      className={`cursor-pointer hover:bg-muted/50 transition-colors ${
        className || ""
      }`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isSorted && (
          <span className="ml-1">
            {currentSort.direction === "asc" ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        )}
      </div>
    </TableHead>
  )
}

function ProductCard({ product }: { product: (typeof productInventory)[0] }) {
  const storagePercentage =
    Math.round((product.inventory.storage / product.inventory.total) * 100) || 0
  const machinesPercentage =
    Math.round((product.inventory.machines / product.inventory.total) * 100) ||
    0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="w-14 h-14 rounded-md object-cover"
            />
            <div>
              <Link href={`products/${product.id}`} className="hover:underline">
                <CardTitle className="text-base">{product.name}</CardTitle>
              </Link>
              <p className="text-xs text-muted-foreground capitalize">
                {product.category}
              </p>
            </div>
          </div>
          <InventoryStatusBadge status={product.reorderStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Inventory</span>
            <span className="font-medium">{product.inventory.total} units</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Storage</span>
              <span>{product.inventory.storage} units</span>
            </div>
            <Progress value={storagePercentage} className="h-1" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>In Machines</span>
              <span>{product.inventory.machines} units</span>
            </div>
            <Progress value={machinesPercentage} className="h-1" />
          </div>
        </div>

        <div className="pt-2 border-t flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Daily Sales</span>
            <div className="flex items-center gap-1">
              <SalesTrendIndicator trend={product.sales.trend} />
              <span className="text-sm">{product.sales.daily}/day</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">
              Sales Velocity
            </span>
            <SalesVelocityBadge velocity={product.sales.velocity} />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="text-muted-foreground mr-1">Days left:</span>
            <span
              className={
                product.daysUntilStockout <= 3
                  ? "text-red-600 font-medium"
                  : product.daysUntilStockout <= 7
                  ? "text-yellow-600"
                  : ""
              }
            >
              {product.daysUntilStockout}
            </span>
          </div>
          <div className="flex gap-2">
            <Link href={`products/${product.id}`}>
              <Button size="sm" variant="outline">
                Details
              </Button>
            </Link>
            <Button
              size="sm"
              variant={product.reorderStatus === "ok" ? "outline" : "default"}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Reorder
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductsInventory() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  // Changed default sort to days until stockout, ascending (lowest first)
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "daysUntilStockout",
    direction: "asc",
  })

  // Handle sort click
  const handleSort = (key: string) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }))
  }

  // Helper function to get nested property value
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((prev, curr) => {
      return prev ? prev[curr] : null
    }, obj)
  }

  // Filter products based on search query and filters
  const filteredProducts = productInventory
    .filter((product) => {
      // Search filter
      if (
        searchQuery &&
        !product.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      // Category filter
      if (categoryFilter !== "all" && product.category !== categoryFilter) {
        return false
      }

      // Status filter
      if (statusFilter !== "all" && product.reorderStatus !== statusFilter) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      const aValue = getNestedValue(a, sort.key)
      const bValue = getNestedValue(b, sort.key)

      // Handle string comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sort.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      // Handle numeric comparison
      return sort.direction === "asc" ? aValue - bValue : bValue - aValue
    })

  // Get counts for filter badges
  const criticalCount = productInventory.filter(
    (p) => p.reorderStatus === "critical"
  ).length
  const warningCount = productInventory.filter(
    (p) => p.reorderStatus === "warning"
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Product Inventory</h1>
          <p className="text-muted-foreground">
            Manage your product inventory and reordering
          </p>
        </div>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="snack">Snacks</SelectItem>
              <SelectItem value="drink">Drinks</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
                {(statusFilter !== "all" || categoryFilter !== "all") && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                    {(statusFilter !== "all" ? 1 : 0) +
                      (categoryFilter !== "all" ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Inventory Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("all")}
                  className={statusFilter === "all" ? "bg-accent" : ""}
                >
                  All Products
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("critical")}
                  className={statusFilter === "critical" ? "bg-accent" : ""}
                >
                  <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                  Critical
                  {criticalCount > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {criticalCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("warning")}
                  className={statusFilter === "warning" ? "bg-accent" : ""}
                >
                  <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                  Low Stock
                  {warningCount > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {warningCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("ok")}
                  className={statusFilter === "ok" ? "bg-accent" : ""}
                >
                  <Package className="h-4 w-4 mr-2 text-green-600" />
                  Good Stock
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setStatusFilter("all")
                  setCategoryFilter("all")
                  setSearchQuery("")
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="table">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
          </TabsList>

          {filteredProducts.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {filteredProducts.length} of {productInventory.length}{" "}
              products
            </p>
          )}
        </div>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHeader
                      sortKey="name"
                      currentSort={sort}
                      onSort={handleSort}
                    >
                      Product
                    </SortableTableHeader>
                    <SortableTableHeader
                      sortKey="category"
                      currentSort={sort}
                      onSort={handleSort}
                      className="hidden md:table-cell"
                    >
                      Category
                    </SortableTableHeader>
                    <SortableTableHeader
                      sortKey="inventory.total"
                      currentSort={sort}
                      onSort={handleSort}
                    >
                      Inventory
                    </SortableTableHeader>
                    <SortableTableHeader
                      sortKey="inventory.storage"
                      currentSort={sort}
                      onSort={handleSort}
                      className="hidden md:table-cell"
                    >
                      Storage
                    </SortableTableHeader>
                    <SortableTableHeader
                      sortKey="inventory.machines"
                      currentSort={sort}
                      onSort={handleSort}
                      className="hidden md:table-cell"
                    >
                      In Machines
                    </SortableTableHeader>
                    <SortableTableHeader
                      sortKey="sales.daily"
                      currentSort={sort}
                      onSort={handleSort}
                    >
                      Daily Sales
                    </SortableTableHeader>
                    <SortableTableHeader
                      sortKey="sales.velocityRank"
                      currentSort={sort}
                      onSort={handleSort}
                    >
                      Sales Velocity
                    </SortableTableHeader>
                    <SortableTableHeader
                      sortKey="daysUntilStockout"
                      currentSort={sort}
                      onSort={handleSort}
                      className="hidden md:table-cell"
                    >
                      Days Left
                    </SortableTableHeader>
                    <SortableTableHeader
                      sortKey="reorderStatus"
                      currentSort={sort}
                      onSort={handleSort}
                    >
                      Status
                    </SortableTableHeader>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No products found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="w-12 h-12 rounded-md object-cover"
                            />
                            <Link
                              href={`products/${product.id}`}
                              className="font-medium hover:underline"
                            >
                              {product.name}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell capitalize">
                          {product.category}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{product.inventory.total}</span>
                            <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full ${
                                  product.reorderStatus === "critical"
                                    ? "bg-red-500"
                                    : product.reorderStatus === "warning"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (product.inventory.total /
                                      product.reorderPoint) *
                                      100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {product.inventory.storage}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {product.inventory.machines}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <SalesTrendIndicator trend={product.sales.trend} />
                            <span>{product.sales.daily}/day</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <SalesVelocityBadge
                            velocity={product.sales.velocity}
                          />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span
                            className={
                              product.daysUntilStockout <= 3
                                ? "text-red-600 font-medium"
                                : product.daysUntilStockout <= 7
                                ? "text-yellow-600"
                                : ""
                            }
                          >
                            {product.daysUntilStockout} days
                          </span>
                        </TableCell>
                        <TableCell>
                          <InventoryStatusBadge
                            status={product.reorderStatus}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`products/${product.id}`}>
                              <Button size="sm" variant="outline">
                                Details
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant={
                                product.reorderStatus === "ok"
                                  ? "outline"
                                  : "default"
                              }
                            >
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Reorder
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grid" className="mt-4">
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter("all")
                    setCategoryFilter("all")
                    setSearchQuery("")
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

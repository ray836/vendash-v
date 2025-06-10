/* eslint-disable */
"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
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
import { getOrgProductDataMetrics } from "./actions"
import { mockProductInventory } from "./mock-data"
import { toast } from "@/hooks/use-toast"
import { PublicProductWithInventorySalesOrderDataDTO } from "@/domains/Product/schemas/ProductSchemas"
import { addProductToNextOrder } from "@/app/web/orders/actions"
import { AddProductDialog } from "./add-product"

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

function ProductCard({
  productDataMetrics,
  onAddToNextOrder,
}: {
  productDataMetrics: PublicProductWithInventorySalesOrderDataDTO
  onAddToNextOrder: (productId: string) => Promise<void>
}) {
  const storagePercentage =
    Math.round(
      (productDataMetrics.inventory.storage /
        productDataMetrics.inventory.total) *
        100
    ) || 0
  const machinesPercentage =
    Math.round(
      (productDataMetrics.inventory.machines /
        productDataMetrics.inventory.total) *
        100
    ) || 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={productDataMetrics.product.image || "/placeholder.svg"}
              alt={productDataMetrics.product.name}
              className="w-14 h-14 rounded-md object-cover"
            />
            <div>
              <Link
                href={`products/${productDataMetrics.product.id}`}
                className="hover:underline"
              >
                <CardTitle className="text-base">
                  {productDataMetrics.product.name}
                </CardTitle>
              </Link>
              <p className="text-xs text-muted-foreground capitalize">
                {productDataMetrics.product.category}
              </p>
            </div>
          </div>
          <InventoryStatusBadge
            status={
              productDataMetrics.orderStatus.shouldOrder ? "critical" : "ok"
            }
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Inventory</span>
            <span className="font-medium">
              {productDataMetrics.inventory.total} units
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Storage</span>
              <span>{productDataMetrics.inventory.storage} units</span>
            </div>
            <Progress value={storagePercentage} className="h-1" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>In Machines</span>
              <span>{productDataMetrics.inventory.machines} units</span>
            </div>
            <Progress value={machinesPercentage} className="h-1" />
          </div>
        </div>

        <div className="pt-2 border-t flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Daily Sales</span>
            <div className="flex items-center gap-1">
              <SalesTrendIndicator
                trend={productDataMetrics.salesData.trend > 1 ? "up" : "down"}
              />
              <span className="text-sm">
                {productDataMetrics.salesData.averageDailySales}/day
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">
              Sales Velocity
            </span>
            <SalesVelocityBadge
              velocity={
                productDataMetrics.salesData.salesVelocity > 1 ? "high" : "low"
              }
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="text-muted-foreground mr-1">Days left:</span>
            <span
              className={
                productDataMetrics.salesData.daysToSellOut <= 3
                  ? "text-red-600 font-medium"
                  : productDataMetrics.salesData.daysToSellOut <= 7
                  ? "text-yellow-600"
                  : ""
              }
            >
              {productDataMetrics.salesData.daysToSellOut}
            </span>
          </div>
          <div className="flex gap-2">
            <Link href={`products/${productDataMetrics.product.id}`}>
              <Button size="sm" variant="outline">
                Details
              </Button>
            </Link>
            <Button
              size="sm"
              variant={
                productDataMetrics.orderStatus.shouldOrder
                  ? "outline"
                  : "default"
              }
              onClick={() => onAddToNextOrder(productDataMetrics.product.id)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Next Order
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
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "salesData.daysToSellOut",
    direction: "asc",
  })
  const [productDataMetrics, setProductDataMetrics] = useState<
    PublicProductWithInventorySalesOrderDataDTO[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  type NestedValue = string | number | null | Record<string, unknown>

  const getNestedValue = (obj: any, path: string): NestedValue => {
    const value = path.split(".").reduce((current, key) => {
      return current && typeof current === "object" ? current[key] : null
    }, obj)
    console.log(`Getting value for path ${path}:`, value)
    return value
  }

  const handleSort = (key: string) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }))
  }

  const filteredProducts = productDataMetrics
    .filter((productDataMetrics) => {
      if (
        searchQuery &&
        !productDataMetrics.product.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      if (
        categoryFilter !== "all" &&
        productDataMetrics.product.category !== categoryFilter
      ) {
        return false
      }

      if (
        statusFilter !== "all" &&
        productDataMetrics.orderStatus.shouldOrder
      ) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      const aValue = getNestedValue(a, sort.key)
      const bValue = getNestedValue(b, sort.key)

      console.log(
        `Comparing ${a.product.name} (${aValue}) with ${b.product.name} (${bValue})`
      )

      if (aValue === null || bValue === null) return 0

      // Handle numeric comparison for daysToSellOut
      if (sort.key === "salesData.daysToSellOut") {
        const numA = Number(aValue)
        const numB = Number(bValue)
        return sort.direction === "asc" ? numA - numB : numB - numA
      }

      // Handle string comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sort.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      // Handle numeric comparison
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sort.direction === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })

  const criticalCount = mockProductInventory.filter(
    (p) => p.reorderStatus === "critical"
  ).length
  const warningCount = mockProductInventory.filter(
    (p) => p.reorderStatus === "warning"
  ).length

  const refreshProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      const productDataMetrics = await getOrgProductDataMetrics("1")
      setProductDataMetrics(productDataMetrics)
    } catch (error) {
      console.error("Failed to refresh products:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    async function fetchProductDataMetrics() {
      const productDataMetrics = await getOrgProductDataMetrics("1")
      console.log("productDataMetrics", productDataMetrics)
      setProductDataMetrics(productDataMetrics)
      setIsLoading(false)
    }
    fetchProductDataMetrics()
  }, [])

  const handleAddToNextOrder = async (productId: string) => {
    try {
      const result = await addProductToNextOrder(productId)

      if (result.success) {
        toast({
          title: "Success",
          description: "Product added to next order",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to add product to order",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add product to order",
      })
    }
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  const displayData = isLoading ? mockProductInventory : productDataMetrics

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Product Inventory</h1>
          <p className="text-muted-foreground">
            Manage your product inventory and reordering
          </p>
        </div>
        <AddProductDialog onSuccess={refreshProducts} />
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
              Showing {filteredProducts.length} of {mockProductInventory.length}{" "}
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
                      sortKey="product.name"
                      currentSort={sort}
                      onSort={handleSort}
                    >
                      Product
                    </SortableTableHeader>
                    <SortableTableHeader
                      sortKey="product.category"
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
                      sortKey="salesData.averageDailySales"
                      currentSort={sort}
                      onSort={handleSort}
                    >
                      Daily Sales
                    </SortableTableHeader>
                    <SortableTableHeader
                      sortKey="salesData.salesVelocity"
                      currentSort={sort}
                      onSort={handleSort}
                    >
                      Sales Velocity
                    </SortableTableHeader>
                    <SortableTableHeader
                      sortKey="salesData.daysToSellOut"
                      currentSort={sort}
                      onSort={handleSort}
                      className="hidden md:table-cell"
                    >
                      Days Left
                    </SortableTableHeader>
                    <SortableTableHeader
                      sortKey="orderStatus.shouldOrder"
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
                    filteredProducts.map((productDataMetrics) => (
                      <TableRow key={productDataMetrics.product.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                productDataMetrics.product.image ||
                                "/placeholder.svg"
                              }
                              alt={productDataMetrics.product.name}
                              className="w-12 h-12 rounded-md object-cover"
                            />
                            <Link
                              href={`products/${productDataMetrics.product.id}`}
                              className="font-medium hover:underline"
                            >
                              {productDataMetrics.product.name}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell capitalize">
                          {productDataMetrics.product.category}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{productDataMetrics.inventory.total}</span>
                            <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full ${
                                  productDataMetrics.orderStatus.shouldOrder
                                    ? "bg-red-500"
                                    : productDataMetrics.orderStatus
                                        .isOnNextOrder
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    ((productDataMetrics.inventory.total +
                                      0.5) /
                                      (productDataMetrics.inventory.total +
                                        5)) *
                                      100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {productDataMetrics.inventory.storage}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {productDataMetrics.inventory.machines}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <SalesTrendIndicator
                              trend={
                                productDataMetrics.salesData.trend > 1
                                  ? "up"
                                  : "down"
                              }
                            />
                            <span>
                              {productDataMetrics.salesData.averageDailySales}
                              /day
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <SalesVelocityBadge
                            velocity={
                              productDataMetrics.salesData.salesVelocity > 1
                                ? "high"
                                : "low"
                            }
                          />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span
                            className={
                              productDataMetrics.salesData.daysToSellOut <= 3
                                ? "text-red-600 font-medium"
                                : productDataMetrics.salesData.daysToSellOut <=
                                  7
                                ? "text-yellow-600"
                                : ""
                            }
                          >
                            {productDataMetrics.salesData.daysToSellOut} days
                          </span>
                        </TableCell>
                        <TableCell>
                          <InventoryStatusBadge
                            status={
                              productDataMetrics.orderStatus.shouldOrder
                                ? "critical"
                                : "ok"
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`products/${productDataMetrics.product.id}`}
                            >
                              <Button size="sm" variant="outline">
                                Details
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant={
                                productDataMetrics.orderStatus.shouldOrder
                                  ? "outline"
                                  : "default"
                              }
                              onClick={() =>
                                handleAddToNextOrder(
                                  productDataMetrics.product.id
                                )
                              }
                            >
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Next Order
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
              {filteredProducts.map((productDataMetrics) => (
                <ProductCard
                  key={productDataMetrics.product.id}
                  productDataMetrics={productDataMetrics}
                  onAddToNextOrder={handleAddToNextOrder}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

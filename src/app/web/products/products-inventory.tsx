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
  TrendingUp,
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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import Link from "next/link"
import { getOrgProductDataMetrics } from "./actions"
import { mockProductInventory } from "./mock-data"
import { toast } from "@/hooks/use-toast"
import { PublicProductWithInventorySalesOrderDataDTO } from "@/domains/Product/schemas/ProductSchemas"
import { addProductToNextOrder, getCurrentOrder } from "@/app/web/orders/actions"
import { AddProductDialog } from "./add-product"
import { useRole } from "@/lib/role-context"
import { UserRole } from "@/domains/User/entities/User"

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

function InventoryLevelBadge({ total }: { total: number }) {
  if (total === 0) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 whitespace-nowrap">
        Out of Stock
      </Badge>
    )
  } else if (total <= 20) {
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 whitespace-nowrap">
        Low Stock
      </Badge>
    )
  } else {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 whitespace-nowrap">
        In Stock
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
  isInNextOrder,
  showSalesData,
}: {
  productDataMetrics: PublicProductWithInventorySalesOrderDataDTO
  onAddToNextOrder: (productId: string) => Promise<void>
  isInNextOrder: boolean
  showSalesData: boolean
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
          {showSalesData && (
            <InventoryStatusBadge
              status={
                productDataMetrics.orderStatus.shouldOrder ? "critical" : "ok"
              }
            />
          )}
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

        {showSalesData && (
          <>
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
                  variant={isInNextOrder ? "secondary" : "default"}
                  onClick={() => onAddToNextOrder(productDataMetrics.product.id)}
                  disabled={isInNextOrder}
                  className="w-32"
                >
                  {isInNextOrder ? (
                    <>On Next Order</>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Next Order
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {!showSalesData && (
          <div className="pt-2 border-t flex justify-end">
            <div className="flex gap-2">
              <Link href={`products/${productDataMetrics.product.id}`}>
                <Button size="sm" variant="outline">
                  Details
                </Button>
              </Link>
              <Button
                size="sm"
                variant={isInNextOrder ? "secondary" : "default"}
                onClick={() => onAddToNextOrder(productDataMetrics.product.id)}
                disabled={isInNextOrder}
                className="w-32"
              >
                {isInNextOrder ? (
                  <>On Next Order</>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Next Order
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ProductsInventory() {
  const { role } = useRole()
  const canEditProducts = role !== UserRole.DRIVER
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
  const [productsInNextOrder, setProductsInNextOrder] = useState<Set<string>>(new Set())
  const [showSalesData, setShowSalesData] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  // Different items per page for table vs grid view
  const itemsPerPage = viewMode === "table" ? 20 : 12

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, statusFilter, sort])

  // Reset to page 1 when view mode changes
  useEffect(() => {
    setCurrentPage(1)
  }, [viewMode])

  const fetchCurrentOrderProducts = useCallback(async () => {
    try {
      const result = await getCurrentOrder()
      if (result.success && result.order) {
        const productIds = new Set(
          result.order.orderItems.map((item: any) => item.product.id)
        )
        setProductsInNextOrder(productIds)
      }
    } catch (error) {
      console.error("Failed to fetch current order:", error)
    }
  }, [])

  const refreshProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      const productDataMetrics = await getOrgProductDataMetrics()
      setProductDataMetrics(productDataMetrics)
      await fetchCurrentOrderProducts()
    } catch (error) {
      console.error("Failed to refresh products:", error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchCurrentOrderProducts])

  useEffect(() => {
    async function fetchProductDataMetrics() {
      const productDataMetrics = await getOrgProductDataMetrics()
      console.log("productDataMetrics", productDataMetrics)
      setProductDataMetrics(productDataMetrics)
      await fetchCurrentOrderProducts()
      setIsLoading(false)
    }
    fetchProductDataMetrics()
  }, [fetchCurrentOrderProducts])

  const handleAddToNextOrder = async (productId: string) => {
    try {
      const result = await addProductToNextOrder(productId)

      if (result.success) {
        // Add product to local state immediately
        setProductsInNextOrder(prev => new Set([...prev, productId]))

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
      </div>

      {/* Search Bar Row with Categories and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
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

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
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
              <span>Filter</span>
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

      {/* Second Row - View Toggle, Sales Data, Add Product, and Count */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "table" | "grid")}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Left side - View toggle, Sales Data, and Add Product */}
          <div className="flex items-center gap-3">
            <TabsList>
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2 border rounded-md px-3 py-1">
              <Switch
                id="sales-data"
                checked={showSalesData}
                onCheckedChange={setShowSalesData}
              />
              <Label htmlFor="sales-data" className="flex items-center gap-2 cursor-pointer text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>Sales Data</span>
              </Label>
            </div>

            {canEditProducts && <AddProductDialog onSuccess={refreshProducts} />}
          </div>

          {/* Right side - Product count */}
          <div className="flex items-center gap-3">
            {filteredProducts.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length}{" "}
                products
              </p>
            )}
          </div>
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
                    <TableHead>Status</TableHead>
                    {showSalesData && (
                      <>
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
                      </>
                    )}
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
                    paginatedProducts.map((productDataMetrics) => (
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
                          {productDataMetrics.inventory.total}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {productDataMetrics.inventory.storage}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {productDataMetrics.inventory.machines}
                        </TableCell>
                        <TableCell>
                          <InventoryLevelBadge total={productDataMetrics.inventory.total} />
                        </TableCell>
                        {showSalesData && (
                          <>
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
                          </>
                        )}
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
                                productsInNextOrder.has(productDataMetrics.product.id)
                                  ? "secondary"
                                  : "default"
                              }
                              onClick={() =>
                                handleAddToNextOrder(
                                  productDataMetrics.product.id
                                )
                              }
                              disabled={productsInNextOrder.has(productDataMetrics.product.id)}
                              className="w-32"
                            >
                              {productsInNextOrder.has(productDataMetrics.product.id) ? (
                                <>On Next Order</>
                              ) : (
                                <>
                                  <PlusCircle className="h-4 w-4 mr-2" />
                                  Next Order
                                </>
                              )}
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

          {/* Pagination for Table View */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first, last, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    }
                    // Show ellipsis
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )
                    }
                    return null
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
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
              {paginatedProducts.map((productDataMetrics) => (
                <ProductCard
                  key={productDataMetrics.product.id}
                  productDataMetrics={productDataMetrics}
                  onAddToNextOrder={handleAddToNextOrder}
                  isInNextOrder={productsInNextOrder.has(productDataMetrics.product.id)}
                  showSalesData={showSalesData}
                />
              ))}
            </div>
          )}

          {/* Pagination for Grid View */}
          {totalPages > 1 && filteredProducts.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first, last, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    }
                    // Show ellipsis
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )
                    }
                    return null
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

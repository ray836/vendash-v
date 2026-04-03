"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CalendarIcon, Download, Filter, Search } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { SalesTableSkeleton } from "./sales-table-skeleton"
import { SalesStats } from "./sales-stats"
import { getOrgTransactions } from "./actions"
import { PublicTransactionWithItemsAndProductDTO } from "@/domains/Transaction/schemas/TransactionSchemas"

// interface Product {
//   id: string
//   name: string
//   image: string
//   price: number
// }

// interface TransactionItem {
//   product: Product
//   quantity: number
//   price: number // Price at time of purchase
// }

// interface Transaction {
//   id: string
//   date: string
//   vendingMachine: {
//     id: string
//     location: string
//   }
//   items: TransactionItem[]
//   totalAmount: number
//   paymentMethod: string
//   status: "Completed" | "Processing" | "Refunded"
// }

function sortTransactionsByDate(
  transactions: PublicTransactionWithItemsAndProductDTO[]
) {
  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA // Sort in descending order (newest first)
  })
}

import { useRole } from "@/lib/role-context"
import { AccessGuard } from "@/components/access-guard"
import { UserRole } from "@/domains/User/entities/User"

function SalesPageContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [filteredSales, setFilteredSales] = useState<
    PublicTransactionWithItemsAndProductDTO[]
  >([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [allSales, setAllSales] = useState<
    PublicTransactionWithItemsAndProductDTO[]
  >([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch data effect
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await getOrgTransactions()
        const sorted = sortTransactionsByDate(response)
        setAllSales(sorted)
        setFilteredSales(sorted) // Initialize filtered sales with all sales
      } catch (error) {
        console.error("Failed to fetch sales:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSales()
  }, [])

  // Filter effect
  useEffect(() => {
    // Don't filter while loading initial data
    if (isLoading) return

    const timer = setTimeout(() => {
      let filtered = [...allSales]

      if (searchQuery) {
        filtered = filtered.filter(
          (sale) =>
            sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sale.cardReaderId
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            sale.last4CardDigits
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
        )
      }

      if (statusFilter !== "all") {
        filtered = filtered.filter(
          (sale) =>
            sale.transactionType.toLowerCase() === statusFilter.toLowerCase()
        )
      }

      if (date) {
        const dateString = format(date, "yyyy-MM-dd")
        filtered = filtered.filter(
          (sale) =>
            format(new Date(sale.createdAt), "yyyy-MM-dd") === dateString
        )
      }

      setFilteredSales(filtered)
      setCurrentPage(1) // Reset to first page when filters change
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, statusFilter, date, allSales, isLoading])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
  }

  // Calculate summary statistics
  const totalSales = filteredSales.length
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
  const uniqueMachines = new Set(filteredSales.map((sale) => sale.cardReaderId))
    .size

  // Month-over-month calculations from all (unfiltered) sales
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const thisMonthSales = allSales.filter((s) => new Date(s.createdAt) >= thisMonthStart)
  const lastMonthSales = allSales.filter((s) => {
    const d = new Date(s.createdAt)
    return d >= lastMonthStart && d <= lastMonthEnd
  })

  const thisMonthCount = thisMonthSales.length
  const lastMonthCount = lastMonthSales.length
  const salesChangePct = lastMonthCount === 0 ? null
    : Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)

  const thisMonthRevenue = thisMonthSales.reduce((s, t) => s + t.total, 0)
  const lastMonthRevenue = lastMonthSales.reduce((s, t) => s + t.total, 0)
  const revenueChangePct = lastMonthRevenue === 0 ? null
    : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)

  const thisMonthMachines = new Set(thisMonthSales.map((s) => s.cardReaderId)).size
  const lastMonthMachines = new Set(lastMonthSales.map((s) => s.cardReaderId)).size
  const machinesChange = thisMonthMachines - lastMonthMachines

  // Calculate pagination
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSales = filteredSales.slice(startIndex, endIndex)

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Product Sales</h1>
        <p className="text-muted-foreground">
          View and analyze all product transactions across vending machines
        </p>
      </div>

      <SalesStats
        totalSales={totalSales}
        totalRevenue={totalRevenue}
        uniqueMachines={uniqueMachines}
        salesChangePct={salesChangePct}
        revenueChangePct={revenueChangePct}
        machinesChange={machinesChange}
        isLoading={isLoading}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Sales Transactions</CardTitle>
          <CardDescription>
            Detailed list of all product sales transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search transactions..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {date ? format(date, "PPP") : "Pick a date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {isLoading ? (
            <SalesTableSkeleton />
          ) : (
            <div className="border rounded-md">
              {paginatedSales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Vending Machine</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.id}</TableCell>
                        <TableCell>
                          <div className="rounded-md border bg-muted/50 p-3">
                            <div className="space-y-3">
                              {sale.items.map((item) => (
                                <div
                                  key={item.product.id}
                                  className="flex items-center gap-3 bg-background rounded-sm p-2 relative"
                                >
                                  <div className="relative h-10 w-10 overflow-hidden rounded-md">
                                    <Image
                                      src={
                                        item.product.image || "/placeholder.svg"
                                      }
                                      alt={item.product.name}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {item.product.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {item.quantity}x @ $
                                      {item.salePrice.toFixed(2)}
                                    </div>
                                  </div>
                                  <Badge
                                    variant={
                                      item.slotCode ? "outline" : "destructive"
                                    }
                                    className="text-xs absolute top-2 right-2"
                                  >
                                    {item.slotCode
                                      ? `Slot ${item.slotCode}`
                                      : "No slot"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(sale.createdAt).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {sale.cardReaderId}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {sale.last4CardDigits}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>${sale.total.toFixed(2)}</TableCell>
                        <TableCell>
                          {sale.last4CardDigits ? (
                            <span>Card ···· {sale.last4CardDigits}</span>
                          ) : (
                            <span>Cash</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              sale.vendingMachineId ? "default" : "destructive"
                            }
                          >
                            {sale.vendingMachineId
                              ? sale.vendingMachineId
                              : "No machine"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No transactions found matching your filters.
                  </p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery("")
                      setStatusFilter("all")
                      setDate(undefined)
                    }}
                  >
                    Reset filters
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {filteredSales.length > 0 ? (
                <>
                  Showing <strong>{startIndex + 1}-{Math.min(endIndex, filteredSales.length)}</strong> of{" "}
                  <strong>{filteredSales.length}</strong> transactions
                </>
              ) : (
                "No transactions found"
              )}
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(totalPages)}
                          className="cursor-pointer"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SalesPage() {
  return (
    <AccessGuard allowedRoles={[UserRole.ADMIN, UserRole.OPERATOR]}>
      <SalesPageContent />
    </AccessGuard>
  )
}

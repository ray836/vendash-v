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
import { SalesTableSkeleton } from "./sales-table-skeleton"
import { SalesStats } from "./sales-stats"

// Mock data for the sales table
const salesData = [
  {
    id: "TXN-001-28492",
    product: {
      name: "Organic Bananas",
      image:
        "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=100&h=100&q=80&fit=crop",
    },
    date: "2023-03-15T14:32:00",
    vendingMachine: {
      id: "VM-001",
      location: "Main Street Mall",
    },
    price: 3.99,
    paymentMethod: "Credit Card",
    status: "Completed",
  },
  {
    id: "TXN-001-28493",
    product: {
      name: "Whole Milk",
      image:
        "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100&h=100&q=80&fit=crop",
    },
    date: "2023-03-15T15:45:00",
    vendingMachine: {
      id: "VM-002",
      location: "Central Station",
    },
    price: 4.5,
    paymentMethod: "Mobile Pay",
    status: "Completed",
  },
  {
    id: "TXN-001-28494",
    product: {
      name: "Sourdough Bread",
      image:
        "https://images.unsplash.com/photo-1585478259715-4ddc6572944d?w=100&h=100&q=80&fit=crop",
    },
    date: "2023-03-15T16:20:00",
    vendingMachine: {
      id: "VM-003",
      location: "Downtown Office",
    },
    price: 5.99,
    paymentMethod: "Credit Card",
    status: "Completed",
  },
  {
    id: "TXN-001-28495",
    product: {
      name: "Organic Eggs",
      image:
        "https://images.unsplash.com/photo-1598965675045-45c7c640ef0c?w=100&h=100&q=80&fit=crop",
    },
    date: "2023-03-15T17:05:00",
    vendingMachine: {
      id: "VM-001",
      location: "Main Street Mall",
    },
    price: 6.49,
    paymentMethod: "Cash",
    status: "Completed",
  },
  {
    id: "TXN-001-28496",
    product: {
      name: "Fresh Apples",
      image:
        "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=100&h=100&q=80&fit=crop",
    },
    date: "2023-03-16T09:15:00",
    vendingMachine: {
      id: "VM-004",
      location: "University Campus",
    },
    price: 4.25,
    paymentMethod: "Mobile Pay",
    status: "Completed",
  },
  {
    id: "TXN-001-28497",
    product: {
      name: "Protein Bars",
      image:
        "https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=100&h=100&q=80&fit=crop",
    },
    date: "2023-03-16T10:30:00",
    vendingMachine: {
      id: "VM-002",
      location: "Central Station",
    },
    price: 3.5,
    paymentMethod: "Credit Card",
    status: "Refunded",
  },
  {
    id: "TXN-001-28498",
    product: {
      name: "Sparkling Water",
      image:
        "https://images.unsplash.com/photo-1598343175492-e316fb5aa3fd?w=100&h=100&q=80&fit=crop",
    },
    date: "2023-03-16T11:45:00",
    vendingMachine: {
      id: "VM-003",
      location: "Downtown Office",
    },
    price: 2.25,
    paymentMethod: "Mobile Pay",
    status: "Completed",
  },
  {
    id: "TXN-001-28499",
    product: {
      name: "Chocolate Bar",
      image:
        "https://images.unsplash.com/photo-1614088685112-0a760b71a3c8?w=100&h=100&q=80&fit=crop",
    },
    date: "2023-03-16T13:20:00",
    vendingMachine: {
      id: "VM-001",
      location: "Main Street Mall",
    },
    price: 1.99,
    paymentMethod: "Cash",
    status: "Completed",
  },
  {
    id: "TXN-001-28500",
    product: {
      name: "Trail Mix",
      image:
        "https://images.unsplash.com/photo-1604215707327-57f886e8d9d3?w=100&h=100&q=80&fit=crop",
    },
    date: "2023-03-16T14:55:00",
    vendingMachine: {
      id: "VM-004",
      location: "University Campus",
    },
    price: 3.75,
    paymentMethod: "Credit Card",
    status: "Processing",
  },
  {
    id: "TXN-001-28501",
    product: {
      name: "Fresh Orange Juice",
      image:
        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=100&h=100&q=80&fit=crop",
    },
    date: "2023-03-16T16:10:00",
    vendingMachine: {
      id: "VM-002",
      location: "Central Station",
    },
    price: 4.99,
    paymentMethod: "Mobile Pay",
    status: "Completed",
  },
]

export default function SalesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [filteredSales, setFilteredSales] = useState(salesData)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Simulate data loading when the component mounts
  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Simulate loading when filters change
  useEffect(() => {
    if (!isLoading) {
      setIsLoading(true)

      // Simulate filtering delay
      const timer = setTimeout(() => {
        let filtered = [...salesData]

        // Apply search filter
        if (searchQuery) {
          filtered = filtered.filter(
            (sale) =>
              sale.product.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
              sale.vendingMachine.id
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              sale.vendingMachine.location
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
          )
        }

        // Apply status filter
        if (statusFilter !== "all") {
          filtered = filtered.filter(
            (sale) => sale.status.toLowerCase() === statusFilter.toLowerCase()
          )
        }

        // Apply date filter
        if (date) {
          const dateString = date.toISOString().split("T")[0]
          filtered = filtered.filter((sale) => sale.date.startsWith(dateString))
        }

        setFilteredSales(filtered)
        setIsLoading(false)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [searchQuery, statusFilter, date])

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
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.price, 0)
  const uniqueMachines = new Set(
    filteredSales.map((sale) => sale.vendingMachine.id)
  ).size

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
              {filteredSales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Vending Machine</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 overflow-hidden rounded-md">
                              <Image
                                src={sale.product.image || "/placeholder.svg"}
                                alt={sale.product.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <span>{sale.product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(sale.date).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {sale.vendingMachine.id}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {sale.vendingMachine.location}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>${sale.price.toFixed(2)}</TableCell>
                        <TableCell>{sale.paymentMethod}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              sale.status === "Completed"
                                ? "default"
                                : sale.status === "Processing"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {sale.status}
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
              Showing <strong>1-{filteredSales.length}</strong> of{" "}
              <strong>{filteredSales.length}</strong> transactions
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Settings,
  Banknote,
  Package,
  Calendar,
  MapPin,
  BarChart3,
  Plus,
  Minus,
  Check,
  Loader2,
  X,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getMachineWithSlots,
  createPreKit,
  getMachinePreKit,
  updatePreKitItems,
  getMachineTransactions,
} from "./actions"
import { MachineDetailDataDTO } from "@/domains/VendingMachine/schemas/vendingMachineDTOs"
import { PublicSlotDTO } from "@/domains/Slot/schemas/SlotSchemas"
import { PublicSlotWithProductDTO } from "@/domains/Slot/schemas/SlotSchemas"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { MachineType } from "@/domains/VendingMachine/entities/VendingMachine"
import { PublicPreKitItem } from "@/domains/PreKit/schemas/PrekitSchemas"
import { GetTransactionsForMachineResponseDTO } from "@/domains/Transaction/schemas/GetTransactionsForMachineSchema"
import { TransactionSchemas } from "@/domains/Transaction/schemas/TransactionSchemas"
import { formatDateLabel } from "@/utils/date"
import { GroupByType } from "@/domains/Transaction/schemas/GetTransactionGraphDataSchemas"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { SalesChart, SalesChartData } from "@/components/SalesChart"

interface MachineDetailsProps {
  id: string
}

interface PreKitItem extends PublicPreKitItem {
  currentQuantity: number
  capacity: number
  slotCode: string
}

function calculateOverallInventory(slots: PublicSlotDTO[]) {
  if (slots.length === 0) return 0

  const totalQuantity = slots.reduce(
    (sum, slot) => sum + slot.currentQuantity,
    0
  )
  const totalCapacity = slots.reduce((sum, slot) => sum + slot.capacity, 0)

  return Math.round((totalQuantity / totalCapacity) * 100)
}

// First, create a helper function to organize slots by row (if not already present)
const organizeSlotsByRow = (slots: PublicSlotWithProductDTO[]) => {
  // Sort slots by row (A, B, C...) and then by column number
  const sortedSlots = [...slots].sort((a, b) => {
    const rowA = a.labelCode.charAt(0)
    const rowB = b.labelCode.charAt(0)
    if (rowA !== rowB) {
      return rowA.localeCompare(rowB)
    }
    const colA = parseInt(a.labelCode.slice(1))
    const colB = parseInt(b.labelCode.slice(1))
    return colA - colB
  })

  // Assign sequence numbers
  sortedSlots.forEach((slot, index) => {
    slot.sequenceNumber = index + 1
  })

  // Organize by row
  return sortedSlots.reduce((acc, slot) => {
    const rowLabel = slot.labelCode.charAt(0)
    if (!acc[rowLabel]) {
      acc[rowLabel] = []
    }
    acc[rowLabel].push(slot)
    return acc
  }, {} as Record<string, PublicSlotWithProductDTO[]>)
}

// Hook to detect mobile devices (width < 640px)
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < breakpoint)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [breakpoint])
  return isMobile
}

export default function MachineDetails({ id }: MachineDetailsProps) {
  const router = useRouter()
  const [machineData, setMachineData] = useState<MachineDetailDataDTO | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [preKitItems, setPreKitItems] = useState<PreKitItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [isLoadingPreKit, setIsLoadingPreKit] = useState(false)
  const [hasExistingPreKit, setHasExistingPreKit] = useState(false)
  const [isEditingPreKit, setIsEditingPreKit] = useState(false)
  const [salesData, setSalesData] =
    useState<GetTransactionsForMachineResponseDTO | null>(null)
  const [isLoadingSales, setIsLoadingSales] = useState(false)
  const [groupBy, setGroupBy] = useState<GroupByType>(GroupByType.DAY)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const isMobile = useIsMobile()

  const fetchPreKit = async () => {
    if (!machineData) return

    setIsLoadingPreKit(true)
    try {
      const result = await getMachinePreKit(id)
      if (result.success && result.data) {
        setHasExistingPreKit(true)
        // Convert pre-kit items to PreKitItem format
        const items = result.data.items
          .map((item) => {
            const slot = machineData.slots.find((s) => s.id === item.slotId)
            if (!slot) return null
            const preKitItem: PreKitItem = {
              id: item.id,
              productId: item.productId,
              slotId: item.slotId,
              quantity: item.quantity,
              productImage: slot.productImage ?? "",
              productName: slot.productName,
              preKitId: item.preKitId,
              currentQuantity: slot.currentQuantity,
              capacity: slot.capacity,
              slotCode: slot.labelCode,
            }
            return preKitItem
          })
          .filter((item): item is PreKitItem => item !== null)
        setPreKitItems(items)
      } else {
        setHasExistingPreKit(false)
      }
    } catch (error) {
      console.error("Failed to fetch pre-kit:", error)
      setHasExistingPreKit(false)
    } finally {
      setIsLoadingPreKit(false)
    }
  }

  useEffect(() => {
    const fetchMachineData = async () => {
      try {
        const data = await getMachineWithSlots(id)
        setMachineData(data)
      } catch (error) {
        console.error("Failed to fetch machine data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMachineData()
  }, [id])

  useEffect(() => {
    if (machineData) {
      fetchPreKit()
    }
  }, [id, machineData])

  const fetchSalesData = async () => {
    try {
      setIsLoadingSales(true)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 90) // Last 90 days

      const response = await getMachineTransactions(id, startDate, endDate)
      if (response.success && response.data) {
        setSalesData(response.data)
      }
    } catch (error) {
      console.error("Error fetching sales data:", error)
    } finally {
      setIsLoadingSales(false)
    }
  }

  useEffect(() => {
    if (machineData) {
      fetchSalesData()
    }
  }, [id, machineData])

  if (isLoading || !machineData) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    )
  }

  const { machine, slots, revenue, setup, lastRestocked, lastMaintenance } =
    machineData
  const isSetup = setup.status === "complete"
  const setupPercentage = setup.percentage

  const handleSetupClick = () => {
    router.push(`/web/machines/${id}/setup`)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const handleSlotClick = (slot: PublicSlotWithProductDTO) => {
    // Allow adding items to pre-kit when in edit mode or when there's no pre-kit
    if (!isEditingPreKit && hasExistingPreKit) return

    if (!slot.productId) return

    const existingItem = preKitItems.find((item) => item.slotId === slot.id)
    if (existingItem) {
      setPreKitItems(preKitItems.filter((item) => item.slotId !== slot.id))
    } else {
      const quantityNeeded = slot.capacity - slot.currentQuantity
      setPreKitItems([
        ...preKitItems,
        {
          id: crypto.randomUUID(),
          productId: slot.productId,
          slotId: slot.id!, // Add non-null assertion since we know productId exists
          quantity: quantityNeeded,
          productImage: slot.productImage ?? "",
          productName: slot.productName,
          preKitId: "",
          currentQuantity: slot.currentQuantity,
          capacity: slot.capacity,
          slotCode: slot.labelCode,
        },
      ])
    }
  }

  const updatePreKitItemQuantity = (slotId: string, newQuantity: number) => {
    setPreKitItems(
      preKitItems.map((item) =>
        item.slotId === slotId
          ? {
              ...item,
              quantity: Math.max(
                0,
                Math.min(
                  newQuantity,
                  machineData.slots.find((s) => s.id === item.slotId)
                    ?.capacity ??
                    0 -
                      (machineData.slots.find((s) => s.id === item.slotId)
                        ?.currentQuantity ?? 0)
                )
              ),
            }
          : item
      )
    )
  }

  const handleEditPreKit = () => {
    setIsEditingPreKit(true)
  }

  const handleCancelEdit = () => {
    // Reset to the original pre-kit items
    fetchPreKit()
    setIsEditingPreKit(false)
  }

  const handleCreatePreKit = async () => {
    if (!machineData || preKitItems.length === 0) return

    startTransition(async () => {
      try {
        let result

        if (hasExistingPreKit) {
          // Get the pre-kit ID from the machine data
          const preKitResult = await getMachinePreKit(id)
          if (!preKitResult.success || !preKitResult.data) {
            throw new Error("Failed to get pre-kit data")
          }

          // Update existing pre-kit
          result = await updatePreKitItems(
            preKitResult.data.id,
            preKitItems.map((item) => ({
              id: item.id ?? undefined,
              productId: item.productId,
              slotId: item.slotId,
              quantity: item.quantity,
            }))
          )
        } else {
          // Create new pre-kit
          result = await createPreKit(
            id,
            preKitItems.map((item) => ({
              productId: item.productId,
              slotId: item.slotId,
              quantity: item.quantity,
            }))
          )
        }

        if (!result.success) {
          throw new Error(result.error)
        }

        // Refresh the pre-kit data
        await fetchPreKit()
        setIsEditingPreKit(false)
      } catch (error) {
        console.error("Failed to create/update pre-kit:", error)
      }
    })
  }

  const handleRemoveItem = (slotId: string) => {
    setPreKitItems(preKitItems.filter((item) => item.slotId !== slotId))
  }

  console.log("salesData", salesData)
  console.log("chart data", Object.entries(salesData?.daily ?? {}))

  // Helper to group and sum transactions by period
  type PublicTransaction = typeof TransactionSchemas.public._type

  function groupAndSum(
    transactions: PublicTransaction[],
    period: "daily" | "weekly" | "monthly"
  ) {
    const map = new Map<string, number>()
    transactions.forEach((tx) => {
      let key = ""
      if (period === "daily") {
        key = tx.createdAt.toISOString().split("T")[0]
      } else if (period === "weekly") {
        const d = new Date(
          Date.UTC(
            tx.createdAt.getFullYear(),
            tx.createdAt.getMonth(),
            tx.createdAt.getDate()
          )
        )
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
        const weekNo = Math.ceil(
          ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
        )
        key = `${d.getUTCFullYear()}-W${weekNo}`
      } else if (period === "monthly") {
        key = `${tx.createdAt.getFullYear()}-${String(
          tx.createdAt.getMonth() + 1
        ).padStart(2, "0")}`
      }
      map.set(key, (map.get(key) || 0) + tx.total)
    })
    // Sort keys chronologically
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, sales]) => ({ period, sales }))
  }

  const dummyData = [
    { period: "2025-04-08", sales: 10 },
    { period: "2025-04-09", sales: 20 },
    { period: "2025-04-10", sales: 5 },
  ]
  console.log("Dummy chart data", dummyData)

  // Helper to filter daily data to last 30 days
  const now = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const filteredDailyData = salesData?.daily
    ? salesData.daily.filter((item) => {
        // Use only item.createdAt for the date
        const date = new Date(item.createdAt)
        return date >= thirtyDaysAgo && date <= now
      })
    : []

  // When preparing data for SalesChart, only pass last 15 items if on mobile
  function getChartData(): SalesChartData[] {
    if (!salesData) return []
    let chartData: SalesChartData[] = []
    if (groupBy === GroupByType.DAY) {
      chartData = groupAndSum(filteredDailyData, "daily")
    } else if (groupBy === GroupByType.WEEK) {
      chartData = groupAndSum(salesData.weekly, "weekly")
    } else if (groupBy === GroupByType.MONTH) {
      chartData = groupAndSum(salesData.monthly, "monthly")
    }
    if (isMobile) {
      return chartData.slice(-15)
    }
    return chartData
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/web/dashboard"
            className="flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Vending Machine {machine.id}
            </h1>
            <Badge
              variant={machine.status === "ONLINE" ? "default" : "destructive"}
            >
              {machine.status}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {machine.locationId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
          {!isSetup && (
            <Button size="sm" onClick={handleSetupClick}>
              Setup Machine
            </Button>
          )}
          {isSetup && (
            <Button size="sm" onClick={handleSetupClick}>
              Edit Configuration
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Setup Status</CardTitle>
              <CardDescription>
                {isSetup
                  ? `${slots.length} slots configured`
                  : "Machine needs to be configured"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{setupPercentage}% Complete</span>
                  <span className="text-muted-foreground">
                    {slots.length} slots configured
                  </span>
                </div>
                <Progress value={setupPercentage} className="h-2" />
              </div>
            </CardContent>
            <CardFooter>
              {!isSetup && (
                <Button className="w-full" size="sm" onClick={handleSetupClick}>
                  Configure Products
                </Button>
              )}
              {isSetup && (
                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={handleSetupClick}
                >
                  Edit Configuration
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Daily Revenue</p>
                    <p className="text-2xl font-bold">
                      ${revenue.daily.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Weekly Revenue</p>
                    <p className="text-2xl font-bold">
                      ${revenue.weekly.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Monthly Revenue</p>
                  <p className="text-2xl font-bold">
                    ${revenue.monthly.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Inventory Status</CardTitle>
              <CardDescription>Current stock level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{calculateOverallInventory(slots)}% Full</span>
                  <span className="text-muted-foreground">
                    {slots.reduce((sum, slot) => sum + slot.currentQuantity, 0)}{" "}
                    / {slots.reduce((sum, slot) => sum + slot.capacity, 0)}{" "}
                    items
                  </span>
                </div>
                <Progress
                  value={calculateOverallInventory(slots)}
                  className="h-2"
                />
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-between text-sm">
                <span className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  Last Restocked
                </span>
                <span>{lastRestocked ? formatDate(lastRestocked) : "N/A"}</span>
              </div>
            </CardFooter>
          </Card>

          {/* Alerts Card - Commented out for future use
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Alerts</CardTitle>
              <CardDescription>
                {machineData.alerts.length === 0
                  ? "No active alerts"
                  : `${machineData.alerts.length} active alert${
                      machineData.alerts.length > 1 ? "s" : ""
                    }`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {machineData.alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 text-muted-foreground">
                  <p>All systems operational</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {machineData.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-destructive"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-between text-sm">
                <span className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  Last Maintenance
                </span>
                <span>
                  {lastMaintenance ? formatDate(lastMaintenance) : "N/A"}
                </span>
              </div>
            </CardFooter>
          </Card>
          */}
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Machine Overview</CardTitle>
                <CardDescription>
                  {machine.type === MachineType.SNACK ? "Snack" : "Drink"}{" "}
                  vending machine with {slots.length} slots
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium leading-none">
                      Machine Type
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {machine.type} Machine
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium leading-none">
                      Location
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {machine.locationId}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium leading-none">Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {machine.status}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium leading-none">
                      Total Slots
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {slots.length} slots
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium leading-none">
                      Configured Slots
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {slots.length} slots ({setupPercentage}%)
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium leading-none">
                      Inventory Level
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {calculateOverallInventory(slots)}% full
                    </p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
                  <div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Machine Layout</h3>
                      <div className="space-y-4">
                        {Object.entries(organizeSlotsByRow(slots)).map(
                          ([row, rowSlots]) => (
                            <div key={row} className="flex items-center gap-4">
                              <div
                                className="flex-1 grid gap-4"
                                style={{
                                  gridTemplateColumns: `repeat(${rowSlots.length}, minmax(0, 1fr))`,
                                }}
                              >
                                {rowSlots.map((slot) => (
                                  <TooltipProvider key={slot.id}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div
                                          key={slot.id}
                                          className={`
                                            border rounded-md bg-muted/20 aspect-square relative
                                            ${
                                              slot.currentQuantity > 0
                                                ? "border-primary/30"
                                                : ""
                                            }
                                            ${
                                              slot.productId && isEditingPreKit
                                                ? "cursor-pointer hover:bg-primary/20"
                                                : ""
                                            }
                                            overflow-hidden
                                          `}
                                          onClick={() => handleSlotClick(slot)}
                                        >
                                          {slot.productImage && (
                                            <div
                                              className="absolute inset-0 bg-cover bg-center opacity-50"
                                              style={{
                                                backgroundImage: `url(${slot.productImage})`,
                                              }}
                                            />
                                          )}
                                          <div className="flex flex-col items-center justify-center h-full text-xs p-1 relative z-10">
                                            <span className="font-medium absolute top-1 left-1">
                                              {slot.labelCode}
                                            </span>
                                            {slot.productName && (
                                              <>
                                                <span className="text-primary font-medium absolute top-1 right-1">
                                                  ${slot.price.toFixed(2)}
                                                </span>
                                                <span className="text-primary absolute bottom-1 right-1">
                                                  {slot.currentQuantity}/
                                                  {slot.capacity}
                                                </span>
                                                {preKitItems.some(
                                                  (item) =>
                                                    item.slotId === slot.id
                                                ) && (
                                                  <span className="absolute bottom-1 left-1 text-primary">
                                                    <Check className="h-4 w-4" />
                                                  </span>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      {slot.productName && (
                                        <TooltipContent>
                                          <p>{slot.productName}</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium">Activity Panel</h3>
                    </div>
                    <Tabs defaultValue="activity" className="w-full">
                      <TabsList className="w-full">
                        <TabsTrigger value="activity" className="flex-1">
                          Recent Activity
                        </TabsTrigger>
                        <TabsTrigger value="prekit" className="flex-1">
                          Pre-Kit
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="activity" className="mt-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                Restocked
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {lastRestocked
                                  ? formatDate(lastRestocked)
                                  : "N/A"}
                              </p>
                            </div>
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                Maintenance
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {lastMaintenance
                                  ? formatDate(lastMaintenance)
                                  : "N/A"}
                              </p>
                            </div>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                Last Sale
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Today, 10:42 AM
                              </p>
                            </div>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="prekit" className="mt-4">
                        <div className="space-y-4">
                          {isLoadingPreKit ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                          ) : preKitItems.length === 0 ? (
                            <div className="space-y-4">
                              <div className="text-center text-muted-foreground py-4">
                                Click on slots in the machine layout to add
                                items to your pre-kit
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  className="flex-1"
                                  onClick={handleCreatePreKit}
                                  disabled={
                                    isPending || preKitItems.length === 0
                                  }
                                >
                                  {isPending
                                    ? "Processing..."
                                    : "Create Pre-kit"}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="space-y-2">
                                {preKitItems.map((item) => (
                                  <div
                                    key={item.slotId}
                                    className="flex items-center justify-between p-2 border rounded-md"
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="w-12 h-12 rounded-md border bg-muted/20 relative overflow-hidden">
                                        {item.productImage ? (
                                          <div
                                            className="absolute inset-0 bg-cover bg-center"
                                            style={{
                                              backgroundImage: `url(${item.productImage})`,
                                            }}
                                          />
                                        ) : (
                                          <Package className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">
                                          {item.productName}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <span className="font-medium">
                                            Slot {item.slotCode}
                                          </span>
                                          <span>•</span>
                                          <span>
                                            Current: {item.currentQuantity}/
                                            {item.capacity}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    {isEditingPreKit ? (
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            updatePreKitItemQuantity(
                                              item.slotId,
                                              item.quantity - 1
                                            )
                                          }}
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                        <Input
                                          type="number"
                                          value={item.quantity}
                                          onChange={(e) =>
                                            updatePreKitItemQuantity(
                                              item.slotId,
                                              parseInt(e.target.value) || 0
                                            )
                                          }
                                          className="w-16 text-center"
                                        />
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            updatePreKitItemQuantity(
                                              item.slotId,
                                              item.quantity + 1
                                            )
                                          }}
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemoveItem(item.slotId)
                                          }}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="text-sm font-medium">
                                        Quantity: {item.quantity}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                {hasExistingPreKit && !isEditingPreKit ? (
                                  <Button
                                    className="flex-1"
                                    onClick={handleEditPreKit}
                                  >
                                    Edit Pre-kit
                                  </Button>
                                ) : (
                                  <>
                                    {isEditingPreKit && (
                                      <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={handleCancelEdit}
                                      >
                                        Cancel
                                      </Button>
                                    )}
                                    <Button
                                      className="flex-1"
                                      onClick={handleCreatePreKit}
                                      disabled={
                                        isPending || preKitItems.length === 0
                                      }
                                    >
                                      {isPending
                                        ? "Processing..."
                                        : hasExistingPreKit
                                        ? "Update Pre-kit"
                                        : "Create Pre-kit"}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="sales" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Information</CardTitle>
                <CardDescription>Revenue and transaction data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Sales Overview</h3>
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] justify-start text-left font-normal",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {date ? (
                              formatDateLabel(date.toISOString(), groupBy)
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DayPicker
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Select
                        value={groupBy}
                        onValueChange={(value: GroupByType) =>
                          setGroupBy(value)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select time range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={GroupByType.DAY}>Daily</SelectItem>
                          <SelectItem value={GroupByType.WEEK}>
                            Weekly
                          </SelectItem>
                          <SelectItem value={GroupByType.MONTH}>
                            Monthly
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {isLoadingSales ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : salesData ? (
                    <SalesChart
                      data={getChartData()}
                      isMobile={isMobile}
                      groupBy={
                        groupBy === GroupByType.DAY
                          ? "daily"
                          : groupBy === GroupByType.WEEK
                          ? "weekly"
                          : groupBy === GroupByType.MONTH
                          ? "monthly"
                          : undefined
                      }
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No sales data available
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Daily Average
                    </p>
                    <p className="text-2xl font-bold">
                      ${salesData?.dailyAverage.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Weekly Average
                    </p>
                    <p className="text-2xl font-bold">
                      ${salesData?.weeklyAverage.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Monthly Average
                    </p>
                    <p className="text-2xl font-bold">
                      ${salesData?.monthlyAverage.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="inventory" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Details</CardTitle>
                <CardDescription>
                  Product stock levels and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isSetup ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Machine Not Configured
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      This machine hasn&apos;t been set up with products yet.
                    </p>
                    <Button onClick={handleSetupClick}>Set Up Machine</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Overall Inventory</h3>
                      <Progress
                        value={calculateOverallInventory(slots)}
                        className="h-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Empty</span>
                        <span>Full</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Top Products</h3>
                      <div className="space-y-3">
                        {slots.map((slot, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                <Package className="h-4 w-4 text-primary" />
                              </div>
                              <span className="text-sm font-medium">
                                {slot.labelCode}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-muted-foreground">
                                {Math.round(
                                  (slot.currentQuantity / slot.capacity) * 100
                                )}
                                % full
                              </span>
                              <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

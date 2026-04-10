"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  Plus,
  Minus,
  Check,
  Loader2,
  X,
  AlertTriangle,
  Trash2,
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
import { deleteMachine } from "../actions"
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
import { GroupByType } from "@/domains/Transaction/schemas/GetTransactionGraphDataSchemas"
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
  const [isCreatingPreKit, setIsCreatingPreKit] = useState(false)
  const [preKitStatus, setPreKitStatus] = useState<"OPEN" | "PICKED" | "STOCKED" | null>(null)
  const [salesData, setSalesData] =
    useState<GetTransactionsForMachineResponseDTO | null>(null)
  const [isLoadingSales, setIsLoadingSales] = useState(false)
  const [groupBy, setGroupBy] = useState<GroupByType>(GroupByType.DAY)
  const isMobile = useIsMobile()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchPreKit = async () => {
    if (!machineData) return

    setIsLoadingPreKit(true)
    try {
      const result = await getMachinePreKit(id)
      if (result.success && result.data) {
        setHasExistingPreKit(true)
        setPreKitStatus(result.data.status as "OPEN" | "PICKED" | "STOCKED")
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
              inStock: item.inStock,
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

  const handleDelete = async () => {
    setIsDeleting(true)
    await deleteMachine(id)
    router.push('/web/machines')
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
    if (!isEditingPreKit && !isCreatingPreKit) return

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
    fetchPreKit()
    setIsEditingPreKit(false)
    setIsCreatingPreKit(false)
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
        setIsCreatingPreKit(false)
      } catch (error) {
        console.error("Failed to create/update pre-kit:", error)
      }
    })
  }

  const handleRemoveItem = (slotId: string) => {
    setPreKitItems(preKitItems.filter((item) => item.slotId !== slotId))
  }


  // Use pre-computed chart data from server to avoid client-side Date issues
  function getChartData(): SalesChartData[] {
    if (!salesData) return []
    let chartData: SalesChartData[]
    if (groupBy === GroupByType.DAY) {
      chartData = salesData.dailyChartData.slice(-30)
    } else if (groupBy === GroupByType.WEEK) {
      chartData = salesData.weeklyChartData.slice(-12)
    } else {
      chartData = salesData.monthlyChartData
    }
    return isMobile ? chartData.slice(-15) : chartData
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
            {machine.locationName}
          </p>
        </div>
        {/* Desktop buttons */}
        <div className="hidden sm:flex items-center gap-2">
          {!isSetup && (
            <Button size="sm" onClick={handleSetupClick}>
              Setup Machine
            </Button>
          )}
          {confirmingDelete ? (
            <>
              <span className="text-sm text-muted-foreground">Delete this machine?</span>
              <Button size="sm" variant="destructive" disabled={isDeleting} onClick={handleDelete}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setConfirmingDelete(true)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>
      {/* Mobile buttons */}
      {!isSetup && (
        <div className="flex flex-col gap-2 mt-2 sm:hidden">
          <Button size="sm" onClick={handleSetupClick}>
            Setup Machine
          </Button>
        </div>
      )}

      <div className="space-y-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!isSetup && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Setup Status</CardTitle>
                <CardDescription>
                  Machine needs to be configured
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
                <Button className="w-full" size="sm" onClick={handleSetupClick}>
                  Configure Products
                </Button>
              </CardFooter>
            </Card>
          )}


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
                <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
                  <div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Machine Layout</h3>
                        <Button variant="outline" size="sm" onClick={handleSetupClick}>
                          Edit Configuration
                        </Button>
                      </div>
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
                                              slot.productId && (isEditingPreKit || isCreatingPreKit)
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
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">Pre-Kit</h3>
                        {preKitStatus && !isCreatingPreKit && !isEditingPreKit && (
                          <Badge
                            className={
                              preKitStatus === "STOCKED"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : preKitStatus === "PICKED"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            }
                          >
                            {preKitStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                        <div className="space-y-4">
                          {isLoadingPreKit ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                          ) : !hasExistingPreKit && !isCreatingPreKit ? (
                            <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                              <p className="text-sm text-muted-foreground">No pre-kit for this machine yet.</p>
                              <Button className="w-full" onClick={() => { setIsCreatingPreKit(true); setPreKitItems([]) }}>
                                Create Pre-Kit
                              </Button>
                            </div>
                          ) : isCreatingPreKit && preKitItems.length === 0 ? (
                            <div className="space-y-4">
                              <div className="text-center text-sm text-muted-foreground py-4">
                                Click slots in the machine layout to add items to your pre-kit
                              </div>
                              <Button variant="outline" className="w-full" onClick={handleCancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="space-y-2">
                                {preKitItems.map((item) => {
                                  const isShort = item.inStock !== undefined && item.quantity > item.inStock
                                  return (
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
                                          {item.inStock !== undefined && (
                                            <span
                                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                                isShort
                                                  ? "bg-red-950 text-red-400 border-red-800"
                                                  : "bg-transparent text-muted-foreground border-border"
                                              }`}
                                            >
                                              {isShort && <AlertTriangle className="h-2.5 w-2.5" />}
                                              Stock: {item.inStock}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {(isEditingPreKit || isCreatingPreKit) ? (
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
                                  )
                                })}
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
                    </div>
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                      <div className="flex-1 min-w-0">
                        <Select
                          value={groupBy}
                          onValueChange={(value: GroupByType) =>
                            setGroupBy(value)
                          }
                        >
                          <SelectTrigger className="w-full max-w-xs sm:max-w-[200px]">
                            <SelectValue placeholder="Select time range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={GroupByType.DAY}>
                              Daily
                            </SelectItem>
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

                <Separator className="my-6" />

                <div>
                  <h3 className="text-base font-semibold mb-3">
                    Transactions
                    {salesData && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({salesData.transactions.length} in last 90 days)
                      </span>
                    )}
                  </h3>
                  {!salesData || salesData.transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No transactions found</p>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Date & Time</th>
                            <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                            <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">Card</th>
                            <th className="text-right px-4 py-2 font-medium text-muted-foreground">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...salesData.transactions]
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((tx) => (
                              <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3 text-muted-foreground">
                                  {new Intl.DateTimeFormat("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }).format(new Date(tx.createdAt))}
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell capitalize text-muted-foreground">
                                  {tx.transactionType?.toLowerCase() ?? "—"}
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                                  {tx.last4CardDigits ? `•••• ${tx.last4CardDigits}` : "—"}
                                </td>
                                <td className="px-4 py-3 text-right font-medium">
                                  ${Number(tx.total).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{calculateOverallInventory(slots)}% Full</span>
                        <span className="text-muted-foreground">
                          {slots.reduce((sum, slot) => sum + slot.currentQuantity, 0)} / {slots.reduce((sum, slot) => sum + slot.capacity, 0)} items
                        </span>
                      </div>
                      <Progress value={calculateOverallInventory(slots)} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Last Restocked
                        </span>
                        <span>{lastRestocked ? formatDate(lastRestocked) : "N/A"}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      {slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center gap-3 py-2 border-b last:border-b-0"
                        >
                          <div className="w-10 h-10 rounded border bg-muted/20 relative overflow-hidden shrink-0">
                            {slot.productImage ? (
                              <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${slot.productImage})` }}
                              />
                            ) : (
                              <Package className="h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium truncate">
                                {slot.productName || (
                                  <span className="text-muted-foreground italic">Empty</span>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2 shrink-0">
                                {slot.currentQuantity} / {slot.capacity}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-8 shrink-0">
                                {slot.labelCode}
                              </span>
                              <Progress
                                value={Math.round((slot.currentQuantity / slot.capacity) * 100)}
                                className="h-1.5 flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
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

"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  Loader2,
  X,
  Trash2,
  Pencil,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  getMachineTransactions,
  updateSlot,
} from "./actions"
import { deleteMachine, updateMachineStatus } from "../actions"
import { updateMachineInfo, updateMachine, getLocationsServer, getOrgProducts } from "./setup/actions"
import { PublicProductDTO } from "@/domains/Product/schemas/ProductSchemas"
import { RestockCountDialog } from "./restock-count-dialog"
import { MachineSettingsDialog } from "./setup/MachineSettingsDialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
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
import { Label } from "@/components/ui/label"
import { MachineType, MachineStatus } from "@/domains/VendingMachine/entities/VendingMachine"
import { GetTransactionsForMachineResponseDTO } from "@/domains/Transaction/schemas/GetTransactionsForMachineSchema"
import { TransactionSchemas } from "@/domains/Transaction/schemas/TransactionSchemas"
import { GroupByType } from "@/domains/Transaction/schemas/GetTransactionGraphDataSchemas"
import { SalesChart, SalesChartData } from "@/components/SalesChart"
import { ComparisonLineChart } from "@/components/ComparisonLineChart"

interface MachineDetailsProps {
  id: string
  defaultTab?: string
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

export default function MachineDetails({ id, defaultTab = "overview" }: MachineDetailsProps) {
  const router = useRouter()
  const [machineData, setMachineData] = useState<MachineDetailDataDTO | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  // Overview slot quick-edit panel
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [orgProducts, setOrgProducts] = useState<PublicProductDTO[]>([])
  const [slotPriceDraft, setSlotPriceDraft] = useState("")
  const [slotQtyDraft, setSlotQtyDraft] = useState("")
  const [savingSlot, setSavingSlot] = useState(false)
  const [salesData, setSalesData] =
    useState<GetTransactionsForMachineResponseDTO | null>(null)
  const [isLoadingSales, setIsLoadingSales] = useState(false)
  const [groupBy, setGroupBy] = useState<GroupByType>(GroupByType.DAY)
  const [viewMode, setViewMode] = useState<"chart" | "compare">("chart")
  const isMobile = useIsMobile()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSavingInfo, setIsSavingInfo] = useState(false)
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [txPage, setTxPage] = useState(1)
  const TX_PAGE_SIZE = 15

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
    getLocationsServer()
      .then((locs) => setLocations(locs.map((l: { id: string; name: string }) => ({ id: l.id, name: l.name }))))
      .catch(() => {})
    getOrgProducts()
      .then((prods) => setOrgProducts(prods))
      .catch(() => {})
  }, [])

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

  const refetchMachine = async () => {
    try {
      const data = await getMachineWithSlots(id)
      setMachineData(data)
    } catch (error) {
      console.error("Failed to refresh machine:", error)
    }
  }

  const handleSaveMachineInfo = async (info: { model: string; notes: string; locationId: string }) => {
    setIsSavingInfo(true)
    try {
      const res = JSON.parse(await updateMachineInfo(id, info))
      if (res.success) {
        toast({ title: "Saved", description: "Machine details updated" })
        await refetchMachine()
        setIsEditOpen(false)
      } else {
        toast({ variant: "destructive", title: "Error", description: res.error || "Failed to save" })
      }
    } catch (error) {
      console.error("updateMachineInfo:", error)
      toast({ variant: "destructive", title: "Error", description: "Failed to save" })
    } finally {
      setIsSavingInfo(false)
    }
  }

  const handleUpdateCardReader = async (cardReaderId: string) => {
    await updateMachine(id, { cardReaderId })
    await refetchMachine()
  }

  const handleSetupClick = () => {
    router.push(`/web/machines/${id}/setup`)
  }

  const handleStatusChange = async (newStatus: string) => {
    const status = newStatus as MachineStatus
    setIsUpdatingStatus(true)
    try {
      await updateMachineStatus(id, status)
      setMachineData((prev) =>
        prev ? { ...prev, machine: { ...prev.machine, status } } : prev
      )
    } catch (error) {
      console.error("Failed to update status:", error)
    } finally {
      setIsUpdatingStatus(false)
    }
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

  const handleSelectSlot = (slot: PublicSlotWithProductDTO) => {
    setSelectedSlotId(slot.id)
    setSlotPriceDraft(slot.price ? String(slot.price) : "")
    setSlotQtyDraft(String(slot.currentQuantity))
  }

  const handleSaveSlot = async () => {
    if (!selectedSlotId) return
    setSavingSlot(true)
    try {
      const res = await updateSlot(selectedSlotId, {
        price: slotPriceDraft === "" ? 0 : Math.max(0, parseFloat(slotPriceDraft) || 0),
        currentQuantity: slotQtyDraft === "" ? 0 : Math.max(0, parseInt(slotQtyDraft, 10) || 0),
      })
      if (res.success) {
        toast({ title: "Saved", description: "Slot updated" })
        await refetchMachine()
      } else {
        toast({ variant: "destructive", title: "Error", description: res.error || "Failed to update slot" })
      }
    } catch (error) {
      console.error("updateSlot:", error)
      toast({ variant: "destructive", title: "Error", description: "Failed to update slot" })
    } finally {
      setSavingSlot(false)
    }
  }

  // From Product Performance: jump to Overview and select the product's slot
  const jumpToSlot = (slot: PublicSlotWithProductDTO) => {
    setActiveTab("overview")
    handleSelectSlot(slot)
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

  function getComparisonRows() {
    if (!salesData) return null

    const rowStats = (data: SalesChartData[]) => {
      const curr = data[data.length - 1]
      const prev = data[data.length - 2]
      if (!curr) return null
      const rev = curr.sales
      const prevRev = prev?.sales ?? null
      const revPct = prevRev && prevRev > 0 ? Math.round(((rev - prevRev) / prevRev) * 100) : null
      const cost = curr.cost != null && curr.cost > 0 ? curr.cost : null
      const profit = cost !== null ? rev - cost : null
      const prevCost = prev?.cost != null && prev.cost > 0 ? prev.cost : null
      const prevProfit = prevCost !== null && prev ? prev.sales - prevCost : null
      const profitPct =
        profit !== null && prevProfit !== null && prevProfit !== 0
          ? Math.round(((profit - prevProfit) / Math.abs(prevProfit)) * 100)
          : null
      const margin = profit !== null && rev > 0 ? Math.round((profit / rev) * 100) : null
      const prevMargin = prevProfit !== null && prev && prev.sales > 0 ? Math.round((prevProfit / prev.sales) * 100) : null
      const marginPts = margin !== null && prevMargin !== null ? margin - prevMargin : null
      return { rev, revPct, profit, profitPct, margin, marginPts }
    }

    return {
      day: rowStats(salesData.dailyChartData),
      week: rowStats(salesData.weeklyChartData),
      month: rowStats(salesData.monthlyChartData),
    }
  }

  function getPreviousChartData(): { period: string; sales: number }[] {
    if (!salesData) return []
    const curr = getChartData()
    const window = curr.length
    if (groupBy === GroupByType.DAY) {
      const prev = salesData.dailyChartData.slice(-(window * 2), -window)
      return isMobile ? prev.slice(-15) : prev
    }
    if (groupBy === GroupByType.WEEK) {
      const prev = salesData.weeklyChartData.slice(-(window * 2), -window)
      return isMobile ? prev.slice(-15) : prev
    }
    const full = salesData.monthlyChartData
    return full.slice(0, full.length - window)
  }

  // Stats section uses local-time transactions so the numbers always match
  // what the user can manually count in the transaction list.
  // (The chart bars use UTC day-bucketing from the server, which is why they differ.)
  function getDayComparisonStats() {
    if (!salesData) return null

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    const toLocalDateStr = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    const todayStr = toLocalDateStr(now)
    const yest = new Date(now)
    yest.setDate(now.getDate() - 1)
    const yesterdayStr = toLocalDateStr(yest)
    const nowMinutes = now.getHours() * 60 + now.getMinutes()

    let todayRev = 0
    let yestSameTimeRev = 0

    for (const tx of salesData.transactions) {
      const d = new Date(tx.createdAt)
      const ds = toLocalDateStr(d)
      const txMin = d.getHours() * 60 + d.getMinutes()
      if (ds === todayStr) {
        todayRev += Number(tx.total)
      } else if (ds === yesterdayStr && txMin <= nowMinutes) {
        yestSameTimeRev += Number(tx.total)
      }
    }

    const revPct = yestSameTimeRev > 0
      ? Math.round(((todayRev - yestSameTimeRev) / yestSameTimeRev) * 100)
      : null

    // Estimate cost using daily cost ratios from server data (best approximation available)
    const daily = salesData.dailyChartData
    const todayChart = daily[daily.length - 1]
    const yestChart  = daily[daily.length - 2]
    const todayCostRatio = todayChart?.cost && todayChart.sales > 0 ? todayChart.cost / todayChart.sales : null
    const yestCostRatio  = yestChart?.cost  && yestChart.sales  > 0 ? yestChart.cost  / yestChart.sales  : null

    const profit        = todayCostRatio !== null ? todayRev       * (1 - todayCostRatio) : null
    const yestSameProfit = yestCostRatio !== null ? yestSameTimeRev * (1 - yestCostRatio)  : null

    const profitPct = profit !== null && yestSameProfit !== null && yestSameProfit !== 0
      ? Math.round(((profit - yestSameProfit) / Math.abs(yestSameProfit)) * 100)
      : null

    const margin     = profit       !== null && todayRev       > 0 ? Math.round((profit       / todayRev)       * 100) : null
    const prevMargin = yestSameProfit !== null && yestSameTimeRev > 0 ? Math.round((yestSameProfit / yestSameTimeRev) * 100) : null
    const marginPts  = margin !== null && prevMargin !== null ? margin - prevMargin : null

    return { rev: todayRev, revPct, profit, profitPct, margin, marginPts }
  }

  // Compares this week's revenue so far to last week's revenue through the exact
  // same day-of-week and time, so a partial week isn't penalised vs a complete one.
  function getWeekComparisonStats() {
    if (!salesData) return null

    const now = new Date()

    // Sunday midnight (local) = start of this week
    const thisSunday = new Date(now)
    thisSunday.setDate(now.getDate() - now.getDay())
    thisSunday.setHours(0, 0, 0, 0)

    const lastSunday = new Date(thisSunday)
    lastSunday.setDate(thisSunday.getDate() - 7)

    // "Same point last week" — identical offset from last Sunday
    const msIntoWeek = now.getTime() - thisSunday.getTime()
    const samePointLastWeek = new Date(lastSunday.getTime() + msIntoWeek)

    let thisWeekRev = 0
    let lastWeekRev = 0

    for (const tx of salesData.transactions) {
      const t = new Date(tx.createdAt).getTime()
      if (t >= thisSunday.getTime() && t <= now.getTime())
        thisWeekRev += Number(tx.total)
      else if (t >= lastSunday.getTime() && t <= samePointLastWeek.getTime())
        lastWeekRev += Number(tx.total)
    }

    const revPct = lastWeekRev > 0
      ? Math.round(((thisWeekRev - lastWeekRev) / lastWeekRev) * 100)
      : null

    const weekly = salesData.weeklyChartData
    const thisCostRatio = weekly[weekly.length - 1]?.cost && weekly[weekly.length - 1].sales > 0
      ? weekly[weekly.length - 1].cost! / weekly[weekly.length - 1].sales : null
    const lastCostRatio = weekly[weekly.length - 2]?.cost && weekly[weekly.length - 2].sales > 0
      ? weekly[weekly.length - 2].cost! / weekly[weekly.length - 2].sales : null

    const profit      = thisCostRatio !== null ? thisWeekRev * (1 - thisCostRatio) : null
    const lastProfit  = lastCostRatio !== null ? lastWeekRev * (1 - lastCostRatio)  : null
    const profitPct   = profit !== null && lastProfit !== null && lastProfit !== 0
      ? Math.round(((profit - lastProfit) / Math.abs(lastProfit)) * 100) : null

    const margin     = profit     !== null && thisWeekRev > 0 ? Math.round((profit    / thisWeekRev) * 100) : null
    const prevMargin = lastProfit !== null && lastWeekRev > 0 ? Math.round((lastProfit / lastWeekRev) * 100) : null
    const marginPts  = margin !== null && prevMargin !== null ? margin - prevMargin : null

    return { rev: thisWeekRev, revPct, profit, profitPct, margin, marginPts }
  }

  // Compare mode: this week vs last week at hourly granularity (168 points, Sun–Sat).
  // X-axis labels appear only at midnight of each day; tooltip shows the full time.
  // Future hours → null (green line trails off); past hours with no sales → 0 (no gaps).
  function getWeekCompareData(): { label: string; tooltipLabel: string; current: number | null; previous: number | null }[] {
    if (!salesData) return []

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    const hourKey = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}`
    const currentHourKey = hourKey(now)

    // Sunday midnight of this week (local time)
    const thisSunday = new Date(now)
    thisSunday.setDate(now.getDate() - now.getDay())
    thisSunday.setHours(0, 0, 0, 0)

    // Aggregate all fetched transactions by hour key
    const salesByHour = new Map<string, number>()
    for (const tx of salesData.transactions) {
      const d = new Date(tx.createdAt)
      const k = hourKey(d)
      salesByHour.set(k, (salesByHour.get(k) ?? 0) + Number(tx.total))
    }

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const fmtHour = (h: number) =>
      h === 0 ? "12am" : h === 12 ? "12pm" : h < 12 ? `${h}am` : `${h - 12}pm`

    const result: { label: string; tooltipLabel: string; current: number | null; previous: number | null }[] = []

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const curr = new Date(thisSunday)
        curr.setDate(thisSunday.getDate() + day)
        curr.setHours(hour)

        const prev = new Date(thisSunday)
        prev.setDate(thisSunday.getDate() + day - 7)
        prev.setHours(hour)

        const ck = hourKey(curr)
        const pk = hourKey(prev)

        result.push({
          label: hour === 0 ? dayNames[day] : "",
          tooltipLabel: `${dayNames[day]} ${fmtHour(hour)}`,
          current: ck > currentHourKey ? null : (salesByHour.get(ck) ?? 0),
          previous: salesByHour.get(pk) ?? 0,
        })
      }
    }

    // Convert to cumulative so both lines only ever go up
    let cumCurrent = 0
    let cumPrevious = 0
    return result.map((pt) => {
      cumPrevious += pt.previous ?? 0
      if (pt.current === null) return { ...pt, previous: cumPrevious }
      cumCurrent += pt.current
      return { ...pt, current: cumCurrent, previous: cumPrevious }
    })
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
            <Select
              value={machine.status}
              onValueChange={handleStatusChange}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="h-7 w-auto text-xs px-2 gap-1 border-0 shadow-none bg-transparent p-0 focus:ring-0">
                <Badge
                  variant={
                    machine.status === "ONLINE"
                      ? "default"
                      : machine.status === "MAINTENANCE"
                      ? "secondary"
                      : "destructive"
                  }
                  className="cursor-pointer"
                >
                  {isUpdatingStatus ? "Saving…" : machine.status}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONLINE">Online</SelectItem>
                <SelectItem value="OFFLINE">Offline</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-muted-foreground flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {machine.locationName}
          </p>
        </div>
        {/* Desktop buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          {!isSetup && (
            <Button size="sm" onClick={handleSetupClick}>
              Setup Machine
            </Button>
          )}
          {isSetup && (
            <RestockCountDialog machineId={id} onSuccess={() => window.location.reload()} />
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
      <div className="flex flex-col gap-2 mt-2 sm:hidden">
        <Button size="sm" variant="outline" onClick={() => setIsEditOpen(true)}>
          <Pencil className="h-4 w-4 mr-1" />
          Edit machine
        </Button>
        {!isSetup && (
          <Button size="sm" onClick={handleSetupClick}>
            Setup Machine
          </Button>
        )}
      </div>

      {/* Edit machine dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden max-h-[85vh] overflow-y-auto">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Edit machine</DialogTitle>
          </DialogHeader>
          <MachineSettingsDialog
            machine={machine}
            locations={locations}
            onUpdate={handleUpdateCardReader}
            onSaveMachineInfo={handleSaveMachineInfo}
            isSavingInfo={isSavingInfo}
          />
        </DialogContent>
      </Dialog>

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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                                            border rounded-md bg-muted/20 aspect-square relative cursor-pointer transition-colors
                                            ${
                                              slot.currentQuantity > 0
                                                ? "border-primary/30"
                                                : ""
                                            }
                                            ${
                                              selectedSlotId === slot.id
                                                ? "ring-2 ring-primary border-primary"
                                                : "hover:bg-primary/10"
                                            }
                                            overflow-hidden
                                          `}
                                          onClick={() => handleSelectSlot(slot)}
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
                  {/* Slot detail / quick-edit panel */}
                  <div>
                    {(() => {
                      const selected = selectedSlotId ? slots.find((s) => s.id === selectedSlotId) : null
                      if (!selected) {
                        return (
                          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center text-sm text-muted-foreground border rounded-lg p-6">
                            Select a slot to view details and make quick edits.
                          </div>
                        )
                      }
                      const product = orgProducts.find((p) => p.id === selected.productId)
                      const costPerUnit =
                        product && Number(product.caseSize) > 0
                          ? Number(product.caseCost) / Number(product.caseSize)
                          : null
                      const priceNum = slotPriceDraft === "" ? 0 : parseFloat(slotPriceDraft) || 0
                      const liveMargin =
                        costPerUnit !== null && priceNum > 0
                          ? Math.round(((priceNum - costPerUnit) / priceNum) * 100)
                          : null
                      return (
                        <div className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">Slot {selected.labelCode}</h3>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedSlotId(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {selected.productId ? (
                            <>
                              <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={selected.productImage || "/placeholder.svg"}
                                  alt={selected.productName}
                                  className="w-12 h-12 object-contain shrink-0"
                                />
                                <Link
                                  href={`/web/products/${selected.productId}`}
                                  className="text-sm font-medium hover:underline"
                                  target="_blank"
                                >
                                  {selected.productName}
                                </Link>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label htmlFor="slot-price">Price</Label>
                                  <Input
                                    id="slot-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder={product ? `$${product.recommendedPrice.toFixed(2)}` : "0.00"}
                                    value={slotPriceDraft}
                                    onChange={(e) => setSlotPriceDraft(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="slot-qty">Quantity</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      id="slot-qty"
                                      type="number"
                                      min="0"
                                      max={selected.capacity}
                                      value={slotQtyDraft}
                                      onChange={(e) => setSlotQtyDraft(e.target.value)}
                                    />
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">/ {selected.capacity}</span>
                                  </div>
                                </div>
                              </div>

                              {costPerUnit !== null && (
                                <div className="rounded-md bg-muted/40 px-3 py-2 text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cost / unit</span>
                                    <span>${costPerUnit.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Margin</span>
                                    <span className={`font-semibold ${liveMargin !== null && liveMargin < 0 ? "text-red-500" : "text-green-600"}`}>
                                      {liveMargin !== null ? `${liveMargin}%` : "—"}
                                    </span>
                                  </div>
                                  {liveMargin !== null && liveMargin < 0 && (
                                    <p className="text-xs text-red-500">Losing money — raise the price above ${costPerUnit.toFixed(2)}.</p>
                                  )}
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Button onClick={handleSaveSlot} disabled={savingSlot} className="flex-1">
                                  {savingSlot ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                  Save
                                </Button>
                                <Button variant="outline" onClick={handleSetupClick}>Edit Configuration</Button>
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground space-y-3">
                              <p>This slot is empty.</p>
                              <Button variant="outline" className="w-full" onClick={handleSetupClick}>
                                Assign a product
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })()}
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
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-medium">Revenue Overview</h3>
                      {viewMode === "compare" && (
                        <p className="text-xs text-muted-foreground mt-0.5">This week vs last week — hourly, Sun through Sat</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-md border bg-muted p-0.5 text-xs">
                        <button
                          onClick={() => setViewMode("chart")}
                          className={`px-2.5 py-1 rounded transition-colors ${viewMode === "chart" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          Chart
                        </button>
                        <button
                          onClick={() => setViewMode("compare")}
                          className={`px-2.5 py-1 rounded transition-colors ${viewMode === "compare" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          Compare
                        </button>
                      </div>
                      {viewMode !== "compare" && (
                        <Select
                          value={groupBy}
                          onValueChange={(value: GroupByType) => setGroupBy(value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={GroupByType.DAY}>Daily</SelectItem>
                            <SelectItem value={GroupByType.WEEK}>Weekly</SelectItem>
                            <SelectItem value={GroupByType.MONTH}>Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  {isLoadingSales ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : salesData ? (
                    viewMode === "compare" ? (
                      <ComparisonLineChart
                        data={getWeekCompareData()}
                        currentLabel="This week"
                        previousLabel="Last week"
                        xInterval={24}
                      />
                    ) : (
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
                    )
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No sales data available
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {salesData && (() => {
                  const rows = getComparisonRows()
                  const hasCostAny = salesData.dailyChartData.some((d) => d.cost != null && d.cost > 0)
                  const chip = (pct: number | null, pts = false) => {
                    if (pct === null) return null
                    const up = pct >= 0
                    return (
                      <span className={`ml-1.5 text-xs font-medium ${up ? "text-green-600" : "text-red-500"}`}>
                        {up ? "↑" : "↓"}{Math.abs(pct)}{pts ? "pp" : "%"}
                      </span>
                    )
                  }
                  const marginColor = (m: number | null) =>
                    m === null ? "" : m >= 30 ? "text-green-600" : m >= 15 ? "text-yellow-600" : "text-red-600"
                  const now = new Date()
                  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                  const activeData =
                    groupBy === GroupByType.DAY  ? getDayComparisonStats()  :
                    groupBy === GroupByType.WEEK ? getWeekComparisonStats() :
                    rows?.month
                  const periodLabel =
                    groupBy === GroupByType.DAY  ? `vs yesterday at ${timeStr}` :
                    groupBy === GroupByType.WEEK ? `vs last week ${dayNames[now.getDay()]} ${timeStr}` :
                    "vs last month"
                  return (
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-2xl font-bold">{activeData ? `$${activeData.rev.toFixed(2)}` : "—"}</p>
                        {activeData && <p className="text-xs text-muted-foreground">{chip(activeData.revPct)} <span className="text-muted-foreground">{periodLabel}</span></p>}
                      </div>
                      {hasCostAny && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Est. Profit</p>
                          <p className="text-2xl font-bold">{activeData?.profit != null ? `$${activeData.profit.toFixed(2)}` : "—"}</p>
                          {activeData && <p className="text-xs text-muted-foreground">{chip(activeData.profitPct)} <span className="text-muted-foreground">{periodLabel}</span></p>}
                        </div>
                      )}
                      {hasCostAny && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Margin</p>
                          <p className={`text-2xl font-bold ${marginColor(activeData?.margin ?? null)}`}>
                            {activeData?.margin != null ? `${activeData.margin}%` : "—"}
                          </p>
                          {activeData && <p className="text-xs text-muted-foreground">{chip(activeData.marginPts, true)} <span className="text-muted-foreground">{periodLabel}</span></p>}
                        </div>
                      )}
                    </div>
                  )
                })()}

                <Separator className="my-6" />

                <Tabs defaultValue="transactions">
                  <TabsList className="mb-4">
                    <TabsTrigger value="transactions">
                      Transactions
                      {salesData && (
                        <span className="ml-1.5 text-xs text-muted-foreground">({salesData.transactions.length})</span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="products">Product Performance</TabsTrigger>
                  </TabsList>

                  {/* Transactions tab */}
                  <TabsContent value="transactions">
                    {!salesData || salesData.transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No transactions found</p>
                    ) : (() => {
                      const sorted = [...salesData.transactions].sort(
                        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                      )
                      const totalPages = Math.ceil(sorted.length / TX_PAGE_SIZE)
                      const paginated = sorted.slice((txPage - 1) * TX_PAGE_SIZE, txPage * TX_PAGE_SIZE)
                      return (
                        <>
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
                                {paginated.map((tx) => (
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
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-3">
                              <p className="text-sm text-muted-foreground">
                                Page {txPage} of {totalPages}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={txPage === 1}
                                  onClick={() => setTxPage((p) => p - 1)}
                                >
                                  Previous
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={txPage === totalPages}
                                  onClick={() => setTxPage((p) => p + 1)}
                                >
                                  Next
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </TabsContent>

                  {/* Product performance tab */}
                  <TabsContent value="products">
                    {!salesData || salesData.productPerformance.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No product data — transactions may not have item-level detail yet
                      </p>
                    ) : (() => {
                      const perf = salesData.productPerformance
                      const hasCostData = perf.some((p) => p.profit !== null)
                      const best = perf[0]
                      const worst = perf[perf.length - 1]
                      return (
                        <>
                          {/* Best / Worst callouts */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
                              <p className="text-xs text-muted-foreground mb-0.5">Best performer</p>
                              <p className="font-semibold text-sm text-green-600 truncate">{best.productName}</p>
                              <p className="text-xs text-muted-foreground">${best.revenue.toFixed(2)} · {best.unitsSold} units</p>
                            </div>
                            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                              <p className="text-xs text-muted-foreground mb-0.5">Lowest revenue</p>
                              <p className="font-semibold text-sm text-red-500 truncate">{worst.productName}</p>
                              <p className="text-xs text-muted-foreground">${worst.revenue.toFixed(2)} · {worst.unitsSold} units</p>
                            </div>
                          </div>
                          <div className="rounded-md border overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="text-left px-4 py-2 font-medium text-muted-foreground w-6">#</th>
                                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Product</th>
                                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Units</th>
                                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Revenue</th>
                                  {hasCostData && <th className="text-right px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">Est. Profit</th>}
                                  {hasCostData && <th className="text-right px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">Margin</th>}
                                  <th className="px-4 py-2" />
                                </tr>
                              </thead>
                              <tbody>
                                {perf.map((p, i) => {
                                  const marginColor =
                                    p.margin === null ? "text-muted-foreground"
                                    : p.margin >= 30 ? "text-green-600"
                                    : p.margin >= 15 ? "text-yellow-600"
                                    : "text-red-500"
                                  const isBest = i === 0
                                  const isWorst = i === perf.length - 1
                                  return (
                                    <tr key={p.productId} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${isBest ? "bg-green-500/5" : isWorst ? "bg-red-500/5" : ""}`}>
                                      <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                                      <td className="px-4 py-3 font-medium">{p.productName}</td>
                                      <td className="px-4 py-3 text-right text-muted-foreground">{p.unitsSold}</td>
                                      <td className="px-4 py-3 text-right font-medium">${p.revenue.toFixed(2)}</td>
                                      {hasCostData && (
                                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                                          {p.profit !== null ? `$${p.profit.toFixed(2)}` : "—"}
                                        </td>
                                      )}
                                      {hasCostData && (
                                        <td className={`px-4 py-3 text-right font-medium hidden sm:table-cell ${marginColor}`}>
                                          {p.margin !== null ? `${p.margin}%` : "—"}
                                        </td>
                                      )}
                                      <td className="px-4 py-3 text-right">
                                        {(() => {
                                          const slot = slots.find((s) => s.productId === p.productId)
                                          return slot ? (
                                            <button
                                              onClick={() => jumpToSlot(slot)}
                                              className="text-xs text-primary hover:underline whitespace-nowrap"
                                            >
                                              Slot {slot.labelCode} →
                                            </button>
                                          ) : (
                                            <span className="text-xs text-muted-foreground">not stocked</span>
                                          )
                                        })()}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">Last 90 days · sorted by revenue</p>
                        </>
                      )
                    })()}
                  </TabsContent>
                </Tabs>
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

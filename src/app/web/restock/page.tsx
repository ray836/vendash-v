"use client"

import { useState, useEffect } from "react"
import {
  Search,
  RefreshCw,
  MapPin,
  Package,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  LayoutList,
  PackageCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { PreKitDetailsDialog } from "../prekits/prekit-details-dialog"
import { LocationRestockDialog } from "./location-restock-dialog"
import { StockMachineDialog } from "./stock-machine-dialog"
import { getMachinesWithRestockStatus, generateAllRestockLists } from "./actions"
import { generatePreKit } from "../prekits/actions"
import { toast } from "@/hooks/use-toast"

interface RestockItem {
  id: string
  preKitId: string
  productId: string
  quantity: number
  slotId: string
  productImage: string
  productName: string
  currentQuantity: number
  capacity: number
  slotCode: string
  inStock: number
}

interface RestockList {
  id: string
  machineId: string
  status: "OPEN" | "PICKED" | "STOCKED"
  items: RestockItem[]
  routeId?: string | null
  routeName?: string | null
  locationName?: string | null
}

interface MachineWithRestock {
  id: string
  locationId: string
  locationName: string | null
  model: string
  machineStatus: string
  needsRestock: boolean
  slotStats: { total: number; low: number; empty: number }
  preKit: RestockList | null
}

type PreKit = RestockList

export default function RestockPage() {
  const [machines, setMachines] = useState<MachineWithRestock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showUpToDate, setShowUpToDate] = useState(false)

  const [selectedPreKit, setSelectedPreKit] = useState<PreKit | null>(null)
  const [selectedMachineName, setSelectedMachineName] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [selectedLocationData, setSelectedLocationData] = useState<{
    locationName: string
    machines: Array<{ machineId: string; preKit: RestockList }>
  } | null>(null)
  const [generatingLocationId, setGeneratingLocationId] = useState<string | null>(null)

  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [stockingMachine, setStockingMachine] = useState<MachineWithRestock | null>(null)

  const load = async () => {
    setIsLoading(true)
    setError(null)
    const result = await getMachinesWithRestockStatus()
    if (result.success && result.data) {
      setMachines(result.data)
      setIsLoading(false)
      return result.data
    } else {
      setError("error" in result ? result.error ?? "Failed to load" : "Failed to load")
      setIsLoading(false)
      return null
    }
  }

  useEffect(() => { load() }, [])

  const handleGenerateOne = async (machineId: string) => {
    setGeneratingId(machineId)
    const result = await generatePreKit(machineId)
    setGeneratingId(null)
    if (!result.success) {
      // still reload so UI is consistent, but don't open dialog
      load()
      return
    }
    const updated = await load()
    if (updated) {
      const machine = updated.find((m) => m.id === machineId)
      if (machine?.preKit) {
        setSelectedLocationData({
          locationName: machine.locationName ?? machine.id,
          machines: [{ machineId: machine.id, preKit: machine.preKit }],
        })
        setLocationDialogOpen(true)
      }
    }
  }

  const handleGenerateAll = async () => {
    setIsGeneratingAll(true)
    const result = await generateAllRestockLists()
    setIsGeneratingAll(false)
    load()
    if (!result.success) {
      toast({ variant: "destructive", title: "Error", description: result.error ?? "Failed to create restock plans" })
    } else if (result.succeeded === 0) {
      toast({ title: "All machines already have restock plans" })
    } else {
      toast({ title: `${result.succeeded} restock plan${result.succeeded !== 1 ? "s" : ""} created` })
    }
  }

  const handleViewList = (machine: MachineWithRestock) => {
    if (!machine.preKit) return
    setSelectedLocationData({
      locationName: machine.locationName ?? machine.id,
      machines: [{ machineId: machine.id, preKit: machine.preKit }],
    })
    setLocationDialogOpen(true)
  }

  const handleStockMachine = (machine: MachineWithRestock) => {
    if (!machine.preKit) return
    setStockingMachine(machine)
    setStockDialogOpen(true)
  }

  const openLocationDialog = (locationKey: string, locationName: string | null, locationMachines: MachineWithRestock[]) => {
    const withLists = locationMachines.filter((m) => !!m.preKit)
    if (withLists.length === 0) return
    setSelectedLocationData({
      locationName: locationName ?? locationKey,
      machines: withLists.map((m) => ({ machineId: m.id, preKit: m.preKit! })),
    })
    setLocationDialogOpen(true)
  }

  const handleGenerateLocation = async (locationKey: string, locationName: string | null, locationMachines: MachineWithRestock[]) => {
    setGeneratingLocationId(locationKey)
    const missing = locationMachines.filter((m) => !m.preKit && m.needsRestock)
    if (missing.length > 0) {
      await Promise.all(missing.map((m) => generatePreKit(m.id)))
    }
    setGeneratingLocationId(null)
    const updated = await load()
    if (updated) {
      const updatedGroup = updated.filter((m) => (m.locationId ?? m.id) === locationKey)
      openLocationDialog(locationKey, locationName, updatedGroup)
    }
  }

  const displayName = (m: MachineWithRestock) =>
    m.locationName ?? m.id

  const filtered = machines.filter((m) => {
    if (!showUpToDate && !m.needsRestock && !m.preKit) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        displayName(m).toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
      )
    }
    return true
  })

  const needsRestockCount = machines.filter((m) => m.needsRestock || !!m.preKit).length

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Restock</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {needsRestockCount} machine{needsRestockCount !== 1 ? "s" : ""} need restocking
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleGenerateAll}
            disabled={isGeneratingAll || isLoading}
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            {isGeneratingAll ? "Planning..." : "Plan All Restocks"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by location or machine ID..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap self-center">
          <Switch
            id="show-all"
            checked={showUpToDate}
            onCheckedChange={setShowUpToDate}
          />
          <Label htmlFor="show-all">Show up-to-date machines</Label>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg border bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
            <p className="font-medium text-lg">All machines are up to date</p>
            <p className="text-sm text-muted-foreground mt-1">
              No machines need restocking right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(() => {
            const groups = new Map<string, { locationName: string | null; machines: MachineWithRestock[] }>()
            for (const m of filtered) {
              const key = m.locationId ?? m.id
              if (!groups.has(key)) groups.set(key, { locationName: m.locationName, machines: [] })
              groups.get(key)!.machines.push(m)
            }

            return Array.from(groups.entries()).map(([locationKey, group]) => {
              const withLists = group.machines.filter((m) => !!m.preKit)
              const missingLists = group.machines.filter((m) => !m.preKit && m.needsRestock)
              const isGeneratingLoc = generatingLocationId === locationKey
              const allHaveLists = missingLists.length === 0 && withLists.length > 0

              return (
                <Card key={locationKey} className="overflow-hidden">
                  {/* Location header — tinted, contains location-level action */}
                  <div className="flex items-center gap-3 px-5 py-3 bg-muted/40 border-b">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm">
                        {group.locationName ?? locationKey}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {group.machines.length} machine{group.machines.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {allHaveLists ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openLocationDialog(locationKey, group.locationName, group.machines)}
                      >
                        <LayoutList className="h-3.5 w-3.5 mr-1.5" />
                        View Location List
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isGeneratingLoc}
                        onClick={() => handleGenerateLocation(locationKey, group.locationName, group.machines)}
                      >
                        {isGeneratingLoc ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            Planning...
                          </>
                        ) : (
                          <>
                            <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                            Plan Location Restock
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Machine rows — no individual card borders; separated by dividers */}
                  <div className="divide-y">
                    {group.machines.map((machine) => {
                      const hasList = !!machine.preKit
                      const { needsRestock, slotStats } = machine
                      const uniqueProducts = hasList
                        ? new Set(machine.preKit!.items.map((i) => i.productId)).size
                        : 0
                      const totalItems = hasList
                        ? machine.preKit!.items.reduce((s, i) => s + i.quantity, 0)
                        : 0
                      const hasStockWarning =
                        hasList && machine.preKit!.items.some((item) => (item.inStock ?? 0) < item.quantity)
                      const isGenerating = generatingId === machine.id
                      const isPickedKit = machine.preKit?.status === "PICKED"
                      const showNeedsRestock = needsRestock || hasList

                      return (
                        <div
                          key={machine.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4"
                        >
                          {/* Left: machine info */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div
                              className={`mt-0.5 p-1.5 rounded-md flex-shrink-0 ${
                                isPickedKit ? "bg-blue-500/10" : showNeedsRestock ? "bg-amber-500/10" : "bg-muted"
                              }`}
                            >
                              {isPickedKit ? (
                                <Package className="h-4 w-4 text-blue-500" />
                              ) : showNeedsRestock ? (
                                <Package className="h-4 w-4 text-amber-500" />
                              ) : (
                                <CircleDashed className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-sm">{machine.id}</span>
                                {machine.model && (
                                  <span className="text-xs text-muted-foreground">{machine.model}</span>
                                )}
                                {isPickedKit ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-500/10 text-blue-600 border-blue-300 text-xs"
                                  >
                                    Ready to Stock
                                  </Badge>
                                ) : showNeedsRestock ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-500/10 text-amber-600 border-amber-300 text-xs"
                                  >
                                    Needs Restock
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-green-500/10 text-green-600 border-green-300 text-xs"
                                  >
                                    Up to Date
                                  </Badge>
                                )}
                                {hasStockWarning && (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-500/10 text-red-600 border-red-300 text-xs gap-1"
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    Low Stock
                                  </Badge>
                                )}
                              </div>
                              {hasList ? (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  <span className="font-medium text-foreground">
                                    {uniqueProducts} product{uniqueProducts !== 1 ? "s" : ""}
                                  </span>
                                  {" "}· {totalItems} unit{totalItems !== 1 ? "s" : ""} to restock
                                </p>
                              ) : needsRestock ? (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {slotStats.empty > 0 && (
                                    <span className="text-red-600 font-medium">{slotStats.empty} empty</span>
                                  )}
                                  {slotStats.empty > 0 && slotStats.low > 0 && <span> · </span>}
                                  {slotStats.low > 0 && (
                                    <span className="text-amber-600 font-medium">{slotStats.low} low</span>
                                  )}
                                  <span> slot{slotStats.empty + slotStats.low !== 1 ? "s" : ""}</span>
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {/* Right: action — ghost for "generate", two buttons when list exists */}
                          <div className="flex-shrink-0 flex gap-2">
                            {hasList ? (
                              isPickedKit ? (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleStockMachine(machine)}
                                >
                                  <PackageCheck className="h-4 w-4 mr-1.5" />
                                  Stock Machine →
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewList(machine)}
                                  >
                                    View List
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleStockMachine(machine)}
                                  >
                                    <PackageCheck className="h-4 w-4 mr-1.5" />
                                    Stock Machine
                                  </Button>
                                </>
                              )
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
                                onClick={() => handleGenerateOne(machine.id)}
                                disabled={isGenerating}
                              >
                                {isGenerating ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Planning...
                                  </>
                                ) : (
                                  <>
                                    <ClipboardList className="h-4 w-4 mr-2" />
                                    Plan Restock
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )
            })
          })()}
        </div>
      )}

      <PreKitDetailsDialog
        preKit={
          selectedPreKit
            ? { ...selectedPreKit, locationName: selectedMachineName, createdAt: new Date() }
            : null
        }
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onPreKitPicked={load}
        onPreKitStocked={load}
        onPreKitDeleted={load}
        skipPickedStep={true}
      />

      {selectedLocationData && (
        <LocationRestockDialog
          open={locationDialogOpen}
          onOpenChange={setLocationDialogOpen}
          locationName={selectedLocationData.locationName}
          machines={selectedLocationData.machines}
          onDeleted={load}
          onStocked={load}
        />
      )}

      {stockingMachine?.preKit && (
        <StockMachineDialog
          open={stockDialogOpen}
          onOpenChange={setStockDialogOpen}
          machineId={stockingMachine.id}
          locationName={stockingMachine.locationName}
          preKit={stockingMachine.preKit}
          onStocked={load}
        />
      )}
    </div>
  )
}

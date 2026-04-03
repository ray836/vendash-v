"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import dynamic from "next/dynamic"

const RouteMap = dynamic(() => import("@/components/route-map"), { ssr: false })
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Trash2,
  GripVertical,
  MapPin,
  Clock,
  Package,
  User
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getLocations, analyzeLocationRestockingNeeds, getDrivers } from "./actions"
import { useSession } from "@/lib/use-session"

// Warehouse home base — 1639 W 3300 S, West Valley City UT 84119
const WAREHOUSE = { lat: 40.7047, lng: -111.9350 }

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // miles
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function nearestNeighborSort(stops: RouteStop[]): RouteStop[] {
  const withCoords = stops.filter((s) => s.latitude != null && s.longitude != null)
  const noCoords = stops.filter((s) => s.latitude == null || s.longitude == null)

  const sorted: RouteStop[] = []
  const remaining = [...withCoords]
  let curLat = WAREHOUSE.lat
  let curLng = WAREHOUSE.lng

  while (remaining.length > 0) {
    let nearestIdx = 0
    let nearestDist = Infinity
    remaining.forEach((s, i) => {
      const d = haversine(curLat, curLng, s.latitude!, s.longitude!)
      if (d < nearestDist) { nearestDist = d; nearestIdx = i }
    })
    const next = remaining.splice(nearestIdx, 1)[0]
    sorted.push(next)
    curLat = next.latitude!
    curLng = next.longitude!
  }

  return [...sorted, ...noCoords].map((s, i) => ({ ...s, order: i + 1 }))
}

interface RouteStop {
  id?: string
  locationId: string
  locationName: string
  locationAddress: string
  latitude?: number | null
  longitude?: number | null
  order: number
  notes: string
  estimatedTime: number
  vendingMachineIds: string[]
}

interface RouteBuilderDialogProps {
  route?: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (routeData: any) => void
}

export function RouteBuilderDialog({
  route,
  open,
  onOpenChange,
  onSave,
}: RouteBuilderDialogProps) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    estimatedDuration: 0,
    recurringPattern: "none",
    assignedToUserId: "",
  })

  const [stops, setStops] = useState<RouteStop[]>([])
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [locations, setLocations] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [locationAnalysis, setLocationAnalysis] = useState<any[]>([])
  const [showNeedsRestockOnly, setShowNeedsRestockOnly] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null)
  const nameManuallyEdited = useRef(false)

  const generateName = (driverId: string, pattern: string) => {
    const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const driver = drivers.find((d) => d.id === driverId)
    const firstName = driver?.firstName
    const patternLabel =
      pattern === "daily" ? "Daily"
      : pattern === "weekly" ? "Weekly"
      : pattern === "biweekly" ? "Bi-weekly"
      : pattern === "monthly" ? "Monthly"
      : null
    if (firstName && patternLabel) return `${firstName}'s ${patternLabel} Route`
    if (firstName) return `${firstName}'s Route — ${dateStr}`
    if (patternLabel) return `${patternLabel} Route — ${dateStr}`
    return `Route — ${dateStr}`
  }

  // Auto-generate name when driver or pattern changes (unless user manually typed one)
  useEffect(() => {
    if (nameManuallyEdited.current) return
    setFormData((prev) => ({ ...prev, name: generateName(prev.assignedToUserId, prev.recurringPattern) }))
  }, [formData.assignedToUserId, formData.recurringPattern, drivers])

  useEffect(() => {
    if (route) {
      setFormData({
        name: route.name || "",
        description: route.description || "",
        isActive: route.isActive ?? true,
        estimatedDuration: route.estimatedDuration || 0,
        recurringPattern: route.recurringPattern || "none",
        assignedToUserId: route.assignedToUserId || "",
      })
      setStops(route.stops || [])
      nameManuallyEdited.current = true // existing route has an intentional name
      setShowDescription(!!route?.description)
    } else {
      setFormData({
        name: "",
        description: "",
        isActive: true,
        estimatedDuration: 0,
        recurringPattern: "none",
        assignedToUserId: "",
      })
      setStops([])
      nameManuallyEdited.current = false
      setShowDescription(false)
    }
  }, [route, open])

  // Load locations when dialog opens
  useEffect(() => {
    if (open) {
      loadLocations()
    } else {
      setLocations([])
      setDrivers([])
    }
  }, [open])

  const loadLocations = async () => {
    // Prevent multiple concurrent loads
    if (isLoadingLocations) return

    setIsLoadingLocations(true)
    try {
      // Load locations, analysis, and drivers in parallel
      const [locationsResult, analysisResult, driversResult] = await Promise.all([
        getLocations(),
        analyzeLocationRestockingNeeds(30),
        getDrivers(),
      ])

      console.log("Locations result:", locationsResult)
      console.log("Analysis result:", analysisResult)

      if (locationsResult.success && locationsResult.data) {
        setLocations(locationsResult.data)
        console.log("Loaded locations:", locationsResult.data.length)
      } else {
        setLocations([])
        console.log("No locations returned")
      }

      if (analysisResult.success && analysisResult.data) {
        setLocationAnalysis(analysisResult.data)
      } else {
        setLocationAnalysis([])
      }

      if (driversResult.success && driversResult.data) {
        setDrivers(driversResult.data)
      } else {
        setDrivers([])
      }
    } catch (error) {
      console.error("Failed to load locations:", error)
      setLocations([])
      setLocationAnalysis([])
    } finally {
      setIsLoadingLocations(false)
    }
  }

  const handleAddStop = (locationId: string) => {
    const location = locations.find(l => l.id === locationId)
    if (!location) return

    const analysis = getLocationAnalysis(location.id)
    const newStop: RouteStop = {
      locationId: location.id,
      locationName: location.name,
      locationAddress: location.address,
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
      order: stops.length + 1,
      notes: "",
      estimatedTime: analysis?.metrics?.estimatedTime || 15,
      vendingMachineIds: location.machineIds,
    }

    const newStops = nearestNeighborSort([...stops, newStop])
    setStops(newStops)
    updateEstimatedDuration(newStops)
  }

  const handleRemoveStop = (index: number) => {
    const newStops = stops.filter((_, i) => i !== index)
    // Reorder remaining stops
    newStops.forEach((stop, i) => {
      stop.order = i + 1
    })
    setStops(newStops)
    updateEstimatedDuration(newStops)
  }

  const updateStopTime = (index: number, time: number) => {
    const newStops = [...stops]
    newStops[index].estimatedTime = time
    setStops(newStops)
    updateEstimatedDuration(newStops)
  }

  const updateStopNotes = (index: number, notes: string) => {
    const newStops = [...stops]
    newStops[index].notes = notes
    setStops(newStops)
  }

  const updateEstimatedDuration = (stopsArray: RouteStop[]) => {
    const total = stopsArray.reduce((sum, stop) => sum + stop.estimatedTime, 0)
    setFormData(prev => ({ ...prev, estimatedDuration: total }))
  }

  const handleDragStart = (index: number) => {
    setDraggedItem(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedItem === null || draggedItem === index) return

    const newStops = [...stops]
    const draggedStop = newStops[draggedItem]

    // Remove dragged item
    newStops.splice(draggedItem, 1)

    // Insert at new position
    newStops.splice(index, 0, draggedStop)

    // Update order numbers
    newStops.forEach((stop, i) => {
      stop.order = i + 1
    })

    setStops(newStops)
    setDraggedItem(index)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const handleSave = () => {
    const routeData = {
      ...formData,
      assignedToUserId: formData.assignedToUserId && formData.assignedToUserId !== "unassigned" ? formData.assignedToUserId : null,
      stops: stops.map(stop => ({
        locationId: stop.locationId,
        locationName: stop.locationName,
        locationAddress: stop.locationAddress,
        order: stop.order,
        notes: stop.notes,
        estimatedTime: stop.estimatedTime,
        vendingMachineIds: stop.vendingMachineIds,
      }))
    }
    onSave(routeData)
  }

  // Helper function to get analysis data for a location
  const getLocationAnalysis = (locationId: string) => {
    return locationAnalysis.find(analysis => analysis.locationId === locationId)
  }

  // Helper function to get urgency badge color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500'
      case 'moderate': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-green-500'
    }
  }

  // Filter available locations based on stops already added and filter toggle
  let availableLocations = locations.filter(
    location => !stops.some(stop => stop.locationId === location.id)
  )

  // Apply "needs restock only" filter
  if (showNeedsRestockOnly) {
    availableLocations = availableLocations.filter(location => {
      const analysis = getLocationAnalysis(location.id)
      return analysis?.needsVisit
    })
  }

  // Sort by urgency level (critical first)
  const urgencyOrder = { critical: 0, moderate: 1, low: 2, none: 3 }
  availableLocations.sort((a, b) => {
    const analysisA = getLocationAnalysis(a.id)
    const analysisB = getLocationAnalysis(b.id)
    const urgencyA = analysisA?.urgencyLevel || 'none'
    const urgencyB = analysisB?.urgencyLevel || 'none'
    return urgencyOrder[urgencyA as keyof typeof urgencyOrder] - urgencyOrder[urgencyB as keyof typeof urgencyOrder]
  })

  // Calculate route summary metrics
  const routeSummary = stops.reduce(
    (acc, stop, index) => {
      const analysis = getLocationAnalysis(stop.locationId)
      const prevLat = index === 0 ? WAREHOUSE.lat : (stops[index - 1].latitude ?? null)
      const prevLng = index === 0 ? WAREHOUSE.lng : (stops[index - 1].longitude ?? null)
      const segDist =
        prevLat != null && prevLng != null && stop.latitude != null && stop.longitude != null
          ? haversine(prevLat, prevLng, stop.latitude, stop.longitude)
          : 0
      return {
        totalItems: acc.totalItems + (analysis?.metrics?.estimatedItemsToStock || 0),
        totalEstimatedTime: acc.totalEstimatedTime + (analysis?.metrics?.estimatedTime || 0),
        criticalStops: acc.criticalStops + (analysis?.urgencyLevel === 'critical' ? 1 : 0),
        moderateStops: acc.moderateStops + (analysis?.urgencyLevel === 'moderate' ? 1 : 0),
        totalMiles: acc.totalMiles + segDist,
      }
    },
    { totalItems: 0, totalEstimatedTime: 0, criticalStops: 0, moderateStops: 0, totalMiles: 0 }
  )

  // Map of locationId → urgencyLevel for coloring map pins
  const locationUrgencyMap = useMemo(() => {
    const map: Record<string, string> = {}
    locationAnalysis.forEach((a) => { map[a.locationId] = a.urgencyLevel })
    return map
  }, [locationAnalysis])

  // Locations that have coordinates — shown as pins on the map
  const mappableLocations = useMemo(
    () => locations.filter((l) => l.latitude != null && l.longitude != null).map((l) => ({
      id: l.id,
      name: l.name,
      address: l.address,
      latitude: l.latitude as number,
      longitude: l.longitude as number,
    })),
    [locations]
  )

  const handleMapLocationClick = (locationId: string) => {
    const alreadyAdded = stops.some((s) => s.locationId === locationId)
    if (alreadyAdded) {
      const idx = stops.findIndex((s) => s.locationId === locationId)
      if (idx !== -1) handleRemoveStop(idx)
    } else {
      handleAddStop(locationId)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle>
            {route ? "Edit Route" : "Create New Route"}
          </DialogTitle>
          <DialogDescription>
            {route
              ? "Edit the route details and manage stops"
              : "Create a new delivery route with multiple stops"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel — form */}
          <ScrollArea className="w-[480px] flex-shrink-0 border-r">
          <div className="p-5 space-y-4">
            {/* Route setup */}
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="recurring" className="text-xs text-muted-foreground">Pattern</Label>
                  <Select
                    value={formData.recurringPattern}
                    onValueChange={(value) => setFormData({ ...formData, recurringPattern: value })}
                  >
                    <SelectTrigger id="recurring" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">One-time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="driver" className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Driver
                  </Label>
                  <Select
                    value={formData.assignedToUserId}
                    onValueChange={(value) => setFormData({ ...formData, assignedToUserId: value })}
                  >
                    <SelectTrigger id="driver" className="h-9">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.firstName} {driver.lastName}
                        </SelectItem>
                      ))}
                      {drivers.length === 0 && (
                        <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                          No drivers found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name" className="text-xs text-muted-foreground">Route Name</Label>
                  {nameManuallyEdited.current && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        nameManuallyEdited.current = false
                        setFormData((prev) => ({ ...prev, name: generateName(prev.assignedToUserId, prev.recurringPattern) }))
                      }}
                    >
                      ↺ Regenerate
                    </button>
                  )}
                </div>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    nameManuallyEdited.current = true
                    setFormData({ ...formData, name: e.target.value })
                  }}
                  className="h-9"
                  placeholder="Auto-generated from driver & pattern"
                />
              </div>

              {/* Description — collapsed by default */}
              {showDescription ? (
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="text-xs text-muted-foreground">Description</Label>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => { setShowDescription(false); setFormData({ ...formData, description: "" }) }}
                    >
                      Remove
                    </button>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional notes about this route"
                    rows={2}
                    className="text-sm"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground text-left"
                  onClick={() => setShowDescription(true)}
                >
                  + Add description
                </button>
              )}

              {/* Active toggle — only show when editing */}
              {route && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="active" className="text-sm">Route is active</Label>
                </div>
              )}
            </div>

            <div className="border-t" />

            {/* Route Stops */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Stops <span className="text-muted-foreground font-normal">({stops.length})</span></h3>
                <div className="flex items-center gap-2">
                  {stops.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const sorted = nearestNeighborSort(stops)
                        setStops(sorted)
                        updateEstimatedDuration(sorted)
                      }}
                      className="text-xs px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
                      title="Re-sort stops by shortest driving order from warehouse"
                    >
                      ↻ Optimize order
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNeedsRestockOnly(!showNeedsRestockOnly)}
                    className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                      showNeedsRestockOnly
                        ? "bg-orange-500/10 border-orange-500/30 text-orange-500"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {showNeedsRestockOnly ? "● Needs restock" : "All locations"}
                  </button>
                </div>
              </div>

              {/* Available Locations — card list */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  {availableLocations.length === 0
                    ? showNeedsRestockOnly ? "No locations need restocking" : "All locations added"
                    : `${availableLocations.length} location${availableLocations.length !== 1 ? "s" : ""} available — click to add`}
                </p>
                {availableLocations.map((location) => {
                  const analysis = getLocationAnalysis(location.id)
                  const urgency = analysis?.urgencyLevel || "none"
                  const fillPct = analysis?.metrics?.lowestStockPercentage ?? 100
                  const fillColor =
                    fillPct < 10 ? "bg-red-500" : fillPct < 30 ? "bg-orange-400" : "bg-green-500"
                  return (
                    <button
                      key={location.id}
                      onClick={() => handleAddStop(location.id)}
                      onMouseEnter={() => setHoveredLocationId(location.id)}
                      onMouseLeave={() => setHoveredLocationId(null)}
                      className="w-full text-left rounded-lg border px-3 py-2.5 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${getUrgencyColor(urgency)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium leading-tight">{location.name}</div>
                          {/* Fill bar */}
                          <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${fillColor}`}
                              style={{ width: `${Math.max(fillPct, 2)}%` }}
                            />
                          </div>
                          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                            {analysis ? (
                              <>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {analysis.metrics.machinesNeedingRestock}/{analysis.metrics.totalMachines} machines
                                </span>
                                {analysis.needsVisit && (
                                  <>
                                    <span className="flex items-center gap-1">
                                      <Package className="h-3 w-3" />
                                      ~{analysis.metrics.estimatedItemsToStock} items
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      ~{analysis.metrics.estimatedTime}min
                                    </span>
                                  </>
                                )}
                              </>
                            ) : (
                              <span>{location.address}</span>
                            )}
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Stops List */}
              {stops.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="w-14 text-center">Mach.</TableHead>
                        <TableHead className="w-14 text-right text-muted-foreground font-normal">mi</TableHead>
                        <TableHead className="w-14 text-center">Min</TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stops.map((stop, index) => {
                        const prevLat = index === 0 ? WAREHOUSE.lat : (stops[index - 1].latitude ?? null)
                        const prevLng = index === 0 ? WAREHOUSE.lng : (stops[index - 1].longitude ?? null)
                        const dist =
                          prevLat != null && prevLng != null && stop.latitude != null && stop.longitude != null
                            ? haversine(prevLat, prevLng, stop.latitude, stop.longitude)
                            : null
                        return (
                          <TableRow
                            key={index}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onMouseEnter={() => setHoveredLocationId(stop.locationId)}
                            onMouseLeave={() => setHoveredLocationId(null)}
                            className="cursor-move"
                          >
                            <TableCell className="p-2">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <GripVertical className="h-3.5 w-3.5" />
                                <span className="text-xs">{stop.order}</span>
                              </div>
                            </TableCell>
                            <TableCell className="p-2">
                              <div className="font-medium text-sm leading-tight">{stop.locationName}</div>
                            </TableCell>
                            <TableCell className="p-2 text-center">
                              <Badge variant="outline">{stop.vendingMachineIds.length}</Badge>
                            </TableCell>
                            <TableCell className="p-2 text-right">
                              {dist != null ? (
                                <span className="text-xs text-muted-foreground">{dist.toFixed(1)}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground/40">—</span>
                              )}
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                type="number"
                                value={stop.estimatedTime}
                                onChange={(e) => updateStopTime(index, parseInt(e.target.value) || 0)}
                                className="w-14 h-7 text-sm"
                                min={0}
                              />
                            </TableCell>
                            <TableCell className="p-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleRemoveStop(index)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No stops added yet</p>
                  <p className="text-sm">Add locations to build your route</p>
                </div>
              )}

              {/* Route Summary */}
              {stops.length > 0 && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="text-sm font-medium mb-3">Route Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Total Items</div>
                      <div className="text-2xl font-bold">{routeSummary.totalItems}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Est. Time</div>
                      <div className="text-2xl font-bold">{routeSummary.totalEstimatedTime}m</div>
                    </div>
                    {routeSummary.totalMiles > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">~Distance</div>
                        <div className="text-2xl font-bold">{routeSummary.totalMiles.toFixed(1)}<span className="text-sm font-normal text-muted-foreground ml-0.5">mi</span></div>
                      </div>
                    )}
                    {routeSummary.criticalStops > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Critical Stops</div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <div className="text-2xl font-bold">{routeSummary.criticalStops}</div>
                        </div>
                      </div>
                    )}
                    {routeSummary.moderateStops > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Moderate Stops</div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-500" />
                          <div className="text-2xl font-bold">{routeSummary.moderateStops}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          </ScrollArea>

          {/* Right panel — map */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              <p className="text-sm font-medium">Locations</p>
              <p className="text-xs text-muted-foreground">
                {mappableLocations.length > 0
                  ? "Click a pin to add or remove it from the route"
                  : "Add map coordinates to locations to see them here"}
              </p>
            </div>
            <div className="flex-1 px-4 pb-4">
              <RouteMap
                locations={mappableLocations}
                selectedLocationIds={stops.map((s) => s.locationId)}
                locationUrgency={locationUrgencyMap}
                hoveredLocationId={hoveredLocationId}
                onLocationClick={handleMapLocationClick}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t flex-shrink-0 flex items-center justify-between">
          <div className="text-sm text-muted-foreground flex items-center gap-1.5">
            {formData.assignedToUserId && formData.assignedToUserId !== "unassigned" ? (
              <>
                <User className="h-3.5 w-3.5" />
                Assigned to{" "}
                <span className="font-medium text-foreground">
                  {(() => {
                    const d = drivers.find((d) => d.id === formData.assignedToUserId)
                    return d ? `${d.firstName} ${d.lastName}` : "—"
                  })()}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground/60">No driver assigned</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={stops.length === 0}
            >
              {route ? "Update Route" : "Create Route"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Package, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { getMachines, getMachinePerformance, getMachinesStock } from "./actions"
// Update the interface to match your actual data model
interface VendingMachine {
  id: string
  type: "DRINK" | "SNACK"
  locationId: string
  locationName?: string
  model: string
  notes: string
  organizationId: string
  cardReaderId: string | null
  displayId?: number | null
  status?: "Online" | "Maintenance" | "Low Stock" | "Offline"
}

// Sample vending machine data
/*const vendingMachines: VendingMachine[] = [
  {
    id: "VM001",
    locationId: "Main Building, Floor 1",
    locationName: "Main Building, Floor 1",
    type: "DRINK",
    status: "Online",
    model: "Drink Machine",
    notes: "First floor, main building",
    organizationId: "University",
    cardReaderId: null,
  },
  {
    id: "VM002",
    locationId: "Science Block, Floor 2",
    locationName: "Science Block, Floor 2",
    type: "SNACK",
    status: "Online",
    model: "Snack Machine",
    notes: "Second floor, science block",
    organizationId: "University",
    cardReaderId: null,
  },
  {
    id: "VM003",
    locationId: "Library, Floor 1",
    locationName: "Library, Floor 1",
    type: "SNACK",
    status: "Maintenance",
    model: "Snack Machine",
    notes: "First floor, library",
    organizationId: "University",
    cardReaderId: null,
  },
  {
    id: "VM004",
    locationId: "Student Center",
    locationName: "Student Center",
    type: "SNACK",
    status: "Online",
    model: "Snack Machine",
    notes: "Student center",
    organizationId: "University",
    cardReaderId: null,
  },
  {
    id: "VM005",
    locationId: "Sports Complex",
    locationName: "Sports Complex",
    type: "SNACK",
    status: "Low Stock",
    model: "Snack Machine",
    notes: "Sports complex",
    organizationId: "University",
    cardReaderId: null,
  },
  {
    id: "VM006",
    locationId: "Engineering Building, Floor 3",
    locationName: "Engineering Building, Floor 3",
    type: "SNACK",
    status: "Online",
    model: "Snack Machine",
    notes: "Third floor, engineering building",
    organizationId: "University",
    cardReaderId: null,
  },
]*/

function statusVariant(status?: string) {
  if (status === "Online") return "default"
  if (status === "Maintenance") return "destructive"
  if (status === "Low Stock") return "secondary"
  return "outline"
}

function typeLabel(type: string) {
  return type === "SNACK" ? "Snack" : type === "DRINK" ? "Drink" : type
}

// Composite health: worst-case across machine status and stock level.
function healthColor(machine: VendingMachine, stock?: MachineStock): "green" | "amber" | "red" {
  const s = (machine.status ?? "").toLowerCase()
  if (s === "offline" || s === "maintenance") return "red"
  if (s === "low stock") return "amber"
  if (stock) {
    if (stock.emptySlots > 0) return "amber"
    if (stock.pctStocked !== null && stock.pctStocked < 30) return "amber"
  }
  return "green"
}

function stockBarColor(pct: number) {
  if (pct < 30) return "bg-red-500"
  if (pct < 60) return "bg-amber-500"
  return "bg-green-500"
}

function VendingMachineCard({
  machine,
  perf,
  stock,
}: {
  machine: VendingMachine
  perf?: MachinePerf
  stock?: MachineStock
}) {
  const dot = healthColor(machine, stock)
  const dotClass = dot === "green" ? "bg-green-500" : dot === "amber" ? "bg-amber-500" : "bg-red-500"
  const pct = stock?.pctStocked ?? null

  return (
    <Card className="w-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotClass}`} aria-hidden />
            <span className="text-lg font-bold leading-tight truncate">{machine.model}</span>
            <Badge variant="outline" className="text-xs font-normal shrink-0">{typeLabel(machine.type)}</Badge>
            {machine.displayId && (
              <span className="text-xs font-mono text-muted-foreground shrink-0">#{machine.displayId}</span>
            )}
          </div>
          <Badge variant={statusVariant(machine.status)} className="shrink-0 mt-0.5">
            {machine.status ?? "Unknown"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3 space-y-3">
        {/* Stock level */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Stocked</span>
            {pct !== null ? (
              <span className="font-medium">{pct}%</span>
            ) : (
              <span className="text-xs text-muted-foreground italic">Not set up</span>
            )}
          </div>
          {pct !== null && (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div className={`h-2 rounded-full transition-all ${stockBarColor(pct)}`} style={{ width: `${pct}%` }} />
              </div>
              {stock!.emptySlots > 0 && (
                <span className="flex items-center gap-1 text-xs text-amber-600 shrink-0">
                  <AlertTriangle className="h-3 w-3" /> {stock!.emptySlots} empty
                </span>
              )}
            </div>
          )}
        </div>

        {/* Revenue this month */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">This month</span>
          {perf ? (
            <span className="font-medium">
              ${perf.revenue.toFixed(0)}
              {perf.margin !== null && (
                <span className="text-muted-foreground font-normal"> · {perf.margin}% margin</span>
              )}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">No sales yet</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Link href={`/web/machines/${machine.id}`} className="w-full">
          <Button size="sm" variant="outline" className="w-full">View Machine</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

// Update the component to properly handle the fetched data
type MachinePerf = {
  id: string
  model: string
  displayId: number | null
  locationName: string | null
  revenue: number
  profit: number | null
  margin: number | null
  txCount: number
}

type MachineStock = {
  id: string
  slotCount: number
  emptySlots: number
  pctStocked: number | null
}

export default function VendingMachineDashboard() {
  const [machines, setMachines] = useState<VendingMachine[]>([])
  const [perf, setPerf] = useState<MachinePerf[]>([])
  const [stock, setStock] = useState<MachineStock[]>([])
  const searchParams = useSearchParams()
  const attentionFilter = searchParams.get("attention") === "1"

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await getMachines()
        const data = JSON.parse(response)
        setMachines(data)
      } catch (error) {
        console.error("Failed to fetch machines:", error)
      }
    }
    const fetchPerf = async () => {
      try {
        const data = await getMachinePerformance()
        setPerf(data)
      } catch (error) {
        console.error("Failed to fetch performance:", error)
      }
    }
    const fetchStock = async () => {
      try {
        const data = await getMachinesStock()
        setStock(data)
      } catch (error) {
        console.error("Failed to fetch stock:", error)
      }
    }
    fetchMachines()
    fetchPerf()
    fetchStock()
  }, [])

  const perfById = new Map(perf.map((p) => [p.id, p]))
  const stockById = new Map(stock.map((s) => [s.id, s]))

  const displayedMachines = attentionFilter
    ? machines.filter((m) => (m.status ?? "").toUpperCase() !== "ONLINE")
    : machines

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Machines</h1>
        <Link href="/web/machines/new">
          <Button>Add Machine</Button>
        </Link>
      </div>

      {attentionFilter && (
        <div className="flex items-center justify-between mb-4 px-3 py-2 rounded-md bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
          <span>Showing machines that need attention</span>
          <Link href="/web/machines" className="text-yellow-700 hover:text-yellow-900 font-medium underline">
            Show all
          </Link>
        </div>
      )}

      {/* Performance ranking — only shows when ≥2 machines have transaction data */}
      {!attentionFilter && perf.length >= 2 && (() => {
        const ranked = [...perf].sort((a, b) => b.revenue - a.revenue)
        const maxRevenue = Math.max(...ranked.map((m) => m.revenue), 1)
        const fleetRevenue = ranked.reduce((sum, m) => sum + m.revenue, 0)
        const margins = ranked.filter((m) => m.margin !== null)
        const lowestMarginId =
          margins.length >= 3
            ? margins.reduce((lo, m) => (m.margin! < lo.margin! ? m : lo)).id
            : null
        return (
          <div className="mb-6 rounded-lg border overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-muted/40 border-b">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Revenue This Month</span>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="text-sm font-semibold text-foreground">${fleetRevenue.toFixed(0)}</span>
                {" "}across {ranked.length} machines · bar length = revenue
              </div>
            </div>
            <div className="divide-y">
              {ranked.map((m) => {
                const barPct = Math.round((m.revenue / maxRevenue) * 100)
                const isLowest = m.id === lowestMarginId
                return (
                  <Link key={m.id} href={`/web/machines/${m.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="w-32 flex-shrink-0">
                      <p className="text-sm font-semibold truncate">{m.model} {m.displayId ? `#${m.displayId}` : ""}</p>
                      {m.locationName && <p className="text-xs text-muted-foreground truncate">{m.locationName}</p>}
                    </div>
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-green-500 transition-all"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <div className="w-20 text-right flex-shrink-0">
                        <p className="text-sm font-semibold leading-tight">${m.revenue.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground leading-tight">revenue</p>
                      </div>
                    </div>
                    <div className="w-12 text-right flex-shrink-0">
                      <p className="text-sm font-medium leading-tight">
                        {m.margin !== null ? `${m.margin}%` : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight">margin</p>
                    </div>
                    {isLowest ? (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-500/5 flex-shrink-0">
                        Lowest margin
                      </Badge>
                    ) : (
                      <span className="w-[92px] flex-shrink-0" aria-hidden />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })()}

      {displayedMachines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Package className="h-10 w-10 mb-3 opacity-30" />
          {attentionFilter ? (
            <>
              <p className="font-medium">No machines need attention</p>
              <p className="text-sm mt-1">All your machines are online.</p>
              <Link href="/web/machines" className="mt-4">
                <Button variant="outline">Show all machines</Button>
              </Link>
            </>
          ) : (
            <>
              <p className="font-medium">No machines yet</p>
              <p className="text-sm mt-1">Add your first vending machine to get started.</p>
              <Link href="/web/machines/new" className="mt-4">
                <Button>Add Machine</Button>
              </Link>
            </>
          )}
        </div>
      ) : (() => {
        // Group by location
        const groups = displayedMachines.reduce((acc, m) => {
          const loc = m.locationName || m.locationId || "Unknown Location"
          if (!acc[loc]) acc[loc] = []
          acc[loc].push(m)
          return acc
        }, {} as Record<string, VendingMachine[]>)
        const locationKeys = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length)
        const multipleLocations = locationKeys.length > 1

        return (
          <div className="space-y-8">
            {locationKeys.map((loc, i) => (
              <div key={loc}>
                {i > 0 && <hr className="mb-8 border-border" />}
                {multipleLocations && (
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <h2 className="text-base font-semibold">{loc}</h2>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups[loc].map((machine) => (
                    <VendingMachineCard
                      key={machine.id}
                      machine={machine}
                      perf={perfById.get(machine.id)}
                      stock={stockById.get(machine.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      })()}
    </div>
  )
}

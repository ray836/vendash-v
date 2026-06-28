"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Package, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { getMachines, getMachinePerformance } from "./actions"
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
  status?: "Online" | "Maintenance" | "Low Stock" | "Offline" // This would need to come from a different source
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

function displayId(id: string) {
  // If it looks like a UUID, show a shortened version
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id)) return id.slice(0, 8).toUpperCase()
  return id
}

function VendingMachineCard({ machine }: { machine: VendingMachine }) {
  return (
    <Card className="w-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold leading-tight">{displayId(machine.id)}</span>
              <Badge variant="outline" className="text-xs font-normal capitalize">
                {machine.type === "DRINK" ? "Drink" : machine.type === "SNACK" ? "Snack" : machine.type}
              </Badge>
            </div>
            {machine.locationName && (
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{machine.locationName}</span>
              </div>
            )}
          </div>
          <Badge variant={statusVariant(machine.status)} className="shrink-0 mt-0.5">
            {machine.status ?? "Unknown"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <div className="space-y-2 text-sm">
          {machine.model && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model</span>
              <span className="font-medium">{machine.model}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Card reader</span>
            {machine.cardReaderId ? (
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{machine.cardReaderId}</span>
            ) : (
              <span className="text-muted-foreground text-xs italic">Not configured</span>
            )}
          </div>
          {machine.notes && machine.notes.trim() && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Notes</span>
              <span className="text-right text-xs">{machine.notes}</span>
            </div>
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
  locationName: string | null
  revenue: number
  profit: number | null
  margin: number | null
  txCount: number
}

export default function VendingMachineDashboard() {
  const [machines, setMachines] = useState<VendingMachine[]>([])
  const [perf, setPerf] = useState<MachinePerf[]>([])
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
    fetchMachines()
    fetchPerf()
  }, [])

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
        const maxMargin = Math.max(...perf.map((m) => m.margin ?? 0), 1)
        const lowestId = perf[perf.length - 1]?.id
        return (
          <div className="mb-6 rounded-lg border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Performance This Month</span>
            </div>
            <div className="divide-y">
              {perf.map((m) => {
                const barPct = m.margin !== null ? Math.round((m.margin / maxMargin) * 100) : 0
                const isLowest = m.id === lowestId && perf.length >= 3
                return (
                  <Link key={m.id} href={`/web/machines/${m.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="w-20 flex-shrink-0">
                      <p className="text-sm font-semibold truncate">{m.id.length > 8 ? m.id.slice(0, 8).toUpperCase() : m.id}</p>
                      {m.locationName && <p className="text-xs text-muted-foreground truncate">{m.locationName}</p>}
                    </div>
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-green-500 transition-all"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-10 text-right flex-shrink-0">
                        {m.margin !== null ? `${m.margin}%` : "—"}
                      </span>
                    </div>
                    <div className="w-20 text-right flex-shrink-0">
                      <p className="text-sm font-semibold">${m.revenue.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">revenue</p>
                    </div>
                    {isLowest && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-500/5 flex-shrink-0">
                        Lowest
                      </Badge>
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
                    <VendingMachineCard key={machine.id} machine={machine} />
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

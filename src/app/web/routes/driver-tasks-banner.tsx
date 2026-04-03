"use client"

import Link from "next/link"
import { MapPin, Package, CheckCircle2, Clock, ChevronRight, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface DriverRoute {
  id: string
  name: string
  description?: string
  stops: any[]
  estimatedDuration?: number
  preKitStatus?: {
    hasPreKits: boolean
    openPreKitsCount: number
    totalMachines: number
  }
}

interface DriverTasksBannerProps {
  routes: DriverRoute[]
  preKitStatuses: Record<string, any>
  onStartRoute: (route: DriverRoute) => void
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}` : `${m}m`
}

export function DriverTasksBanner({ routes, preKitStatuses, onStartRoute }: DriverTasksBannerProps) {
  const activeRoutes = routes.filter((r: any) => r.isActive !== false)
  const totalPreKits = activeRoutes.reduce((sum, r) => {
    return sum + (preKitStatuses[r.id]?.openPreKitsCount ?? 0)
  }, 0)
  const totalStops = activeRoutes.reduce((sum, r) => sum + (r.stops?.length ?? 0), 0)
  const allDone = activeRoutes.length > 0 && totalPreKits === 0

  return (
    <div className="rounded-xl border bg-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()}</p>
          <h2 className="text-2xl font-bold mt-0.5">Today&apos;s Tasks</h2>
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{activeRoutes.length}</p>
            <p className="text-xs text-muted-foreground">Routes</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{totalStops}</p>
            <p className="text-xs text-muted-foreground">Stops</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${totalPreKits > 0 ? "text-blue-500" : "text-green-500"}`}>
              {totalPreKits}
            </p>
            <p className="text-xs text-muted-foreground">Pre-kits</p>
          </div>
        </div>
      </div>

      {/* All done state */}
      {allDone && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">All pre-kits complete!</p>
            <p className="text-xs text-muted-foreground">Nothing left to stock on your routes today.</p>
          </div>
        </div>
      )}

      {/* No routes state */}
      {activeRoutes.length === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
          <Truck className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-medium">No routes assigned yet</p>
            <p className="text-xs text-muted-foreground">Create a route below to get started.</p>
          </div>
        </div>
      )}

      {/* Route cards */}
      {activeRoutes.length > 0 && (
        <div className="space-y-3">
          {activeRoutes.map((route) => {
            const status = preKitStatuses[route.id]
            const openKits = status?.openPreKitsCount ?? 0
            const totalMachines = status?.totalMachines ?? route.stops?.length ?? 0
            const hasKits = status?.hasPreKits

            return (
              <div
                key={route.id}
                className="flex items-center gap-4 p-4 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{route.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {route.stops?.length ?? 0} stops
                    </span>
                    {route.estimatedDuration && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(route.estimatedDuration)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {hasKits ? (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {openKits} pre-kit{openKits !== 1 ? "s" : ""}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Done
                    </Badge>
                  )}
                  <Button size="sm" onClick={() => onStartRoute(route)}>
                    Start
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick links */}
      <div className="flex gap-2 pt-1">
        <Link href="/web/prekits">
          <Button variant="outline" size="sm">
            <Package className="h-4 w-4 mr-2" />
            View All Pre-kits
          </Button>
        </Link>
        <Link href="/web/machines">
          <Button variant="outline" size="sm">
            <Truck className="h-4 w-4 mr-2" />
            Machines
          </Button>
        </Link>
      </div>
    </div>
  )
}

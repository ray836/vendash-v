"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  User,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  AlertCircle,
  Package,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DriverTasksBanner } from "./driver-tasks-banner"
import { RouteBuilderDialog } from "./route-builder-dialog"
import { AssignDriverDialog } from "./assign-driver-dialog"
import { MiniPreKitCard } from "./mini-prekit-card"
import { PreKitDetailsDialog } from "../prekits/prekit-details-dialog"
import { getOrgRoutes, createRoute, updateRoute, deleteRoute, assignDriverToRoute, generatePreKitsForRoute, getRoutePreKitStatus, getRoutePreKits } from "./actions"
import { useSession } from "@/lib/use-session"
import { useRole } from "@/lib/role-context"
import { UserRole } from "@/domains/User/entities/User"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Mock data for fallback/demo
const mockRoutes = [
  {
    id: "1",
    name: "Downtown Route",
    description: "Covers all downtown vending machines",
    isActive: true,
    assignedDriver: {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    },
    estimatedDuration: 240,
    recurringPattern: "daily",
    stops: [
      {
        id: "1",
        order: 1,
        location: { name: "TechHub HQ", address: "123 Innovation Drive" },
        estimatedTime: 30,
        vendingMachineIds: ["vm1", "vm2"],
      },
      {
        id: "2",
        order: 2,
        location: { name: "Riverside Office", address: "456 Commerce Blvd" },
        estimatedTime: 25,
        vendingMachineIds: ["vm3"],
      },
      {
        id: "3",
        order: 3,
        location: { name: "Metro Shopping", address: "789 Retail Plaza" },
        estimatedTime: 45,
        vendingMachineIds: ["vm4", "vm5"],
      },
    ],
    nextScheduled: new Date("2024-12-15T08:00:00"),
  },
  {
    id: "2",
    name: "North Side Route",
    description: "Services northern district locations",
    isActive: true,
    assignedDriver: null,
    estimatedDuration: 180,
    recurringPattern: "weekly",
    stops: [
      {
        id: "4",
        order: 1,
        location: { name: "University Library", address: "555 Campus Way" },
        estimatedTime: 20,
        vendingMachineIds: ["vm6"],
      },
      {
        id: "5",
        order: 2,
        location: { name: "City Gym", address: "321 Fitness Ave" },
        estimatedTime: 30,
        vendingMachineIds: ["vm7", "vm8"],
      },
    ],
    nextScheduled: null,
  },
]

export default function RoutesPage() {
  const { data: session } = useSession()
  const { role } = useRole()
  const isDriver = role === UserRole.DRIVER
  const toast = (message: any) => {
    console.log("Toast:", message)
  }
  const [searchQuery, setSearchQuery] = useState("")
  const [routes, setRoutes] = useState<any[]>([])
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [useMockData, setUseMockData] = useState(false)
  const [preKitDialogOpen, setPreKitDialogOpen] = useState(false)
  const [preKitGenerating, setPreKitGenerating] = useState(false)
  const [preKitResults, setPreKitResults] = useState<any>(null)
  const [preKitStatuses, setPreKitStatuses] = useState<Record<string, any>>({})
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set())
  const [routePreKits, setRoutePreKits] = useState<Record<string, any[]>>({})
  const [selectedPreKit, setSelectedPreKit] = useState<any>(null)
  const [preKitDetailsOpen, setPreKitDetailsOpen] = useState(false)

  // Mock locations for demo mode
  const mockLocations = [
    { id: "loc1", name: "TechHub HQ", address: "123 Innovation Drive" },
    { id: "loc2", name: "Riverside Office", address: "456 Commerce Blvd" },
    { id: "loc3", name: "Metro Shopping", address: "789 Retail Plaza" },
    { id: "loc4", name: "University Library", address: "555 Campus Way" },
    { id: "loc5", name: "City Gym", address: "321 Fitness Ave" },
    { id: "loc6", name: "Greenfield Hospital", address: "321 Medical Center Dr" },
  ]

  // Load routes on mount
  useEffect(() => {
    loadRoutes()
  }, [])

  const loadPreKitStatuses = async (routeList: any[]) => {
    const statuses: Record<string, any> = {}

    for (const route of routeList) {
      const result = await getRoutePreKitStatus(route.id)
      if (result.success) {
        statuses[route.id] = {
          hasPreKits: result.hasPreKits,
          openPreKitsCount: result.openPreKitsCount,
          totalMachines: result.totalMachines
        }
      }
    }

    setPreKitStatuses(statuses)
  }

  const loadRoutes = async () => {
    if (!session?.user?.organizationId) {
      // If no session, use mock data
      setRoutes(mockRoutes)
      setUseMockData(true)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)
    try {
      const result = await getOrgRoutes()
      if (result.success) {
        const routeData = result.data || []
        setRoutes(routeData)
        setUseMockData(false)

        // Load pre-kit statuses for all routes
        if (routeData.length > 0) {
          await loadPreKitStatuses(routeData)
        }
      } else {
        // If error, fall back to mock data
        console.error("Failed to load routes:", result.error)
        setRoutes(mockRoutes)
        setUseMockData(true)
        setLoadError(result.error || "Failed to load routes from database")
      }
    } catch (error) {
      console.error("Error loading routes:", error)
      // Fall back to mock data on error
      setRoutes(mockRoutes)
      setUseMockData(true)
      setLoadError("Unable to connect to database. Using demo data.")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRoutes = routes.filter((route) =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateRoute = () => {
    setSelectedRoute(null)
    setIsBuilderOpen(true)
  }

  const handleEditRoute = (route: any) => {
    setSelectedRoute(route)
    setIsBuilderOpen(true)
  }

  const handleAssignDriver = (route: any) => {
    setSelectedRoute(route)
    setIsAssignOpen(true)
  }

  const handleSaveRoute = async (routeData: any) => {
    try {
      console.log("handleSaveRoute called with:", routeData)

      const result = selectedRoute
        ? await updateRoute(selectedRoute.id, routeData)
        : await createRoute(routeData)

      if (result.success) {
        toast({
          title: "Success",
          description: selectedRoute
            ? "Route updated successfully"
            : "Route created successfully",
        })
        setIsBuilderOpen(false)
        setSelectedRoute(null)
        await loadRoutes() // Reload routes from database
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save route",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in handleSaveRoute:", error)
      toast({
        title: "Error",
        description: "Failed to save route. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAssignDriverSubmit = async (assignment: any) => {
    try {
      // Demo mode: update route in local state
      const routeIndex = routes.findIndex(r => r.id === assignment.routeId)
      if (routeIndex !== -1) {
        const updatedRoutes = [...routes]

        // Mock driver data (would come from the assignment.driverId lookup)
        const mockDrivers = [
          { id: "driver1", firstName: "John", lastName: "Doe", email: "john.doe@example.com" },
          { id: "driver2", firstName: "Jane", lastName: "Smith", email: "jane.smith@example.com" },
          { id: "driver3", firstName: "Mike", lastName: "Johnson", email: "mike.johnson@example.com" },
          { id: "driver4", firstName: "Sarah", lastName: "Williams", email: "sarah.williams@example.com" },
        ]

        const assignedDriver = mockDrivers.find(d => d.id === assignment.driverId)

        updatedRoutes[routeIndex] = {
          ...updatedRoutes[routeIndex],
          assignedDriver: assignedDriver || null,
          nextScheduled: new Date(assignment.scheduledDate),
        }

        setRoutes(updatedRoutes)
        toast({
          title: "Success",
          description: "Driver assigned successfully (demo mode)",
        })
      }

      setIsAssignOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign driver",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRoute = async (routeId: string) => {
    if (confirm("Are you sure you want to delete this route?")) {
      try {
        const result = await deleteRoute(routeId)
        if (result.success) {
          toast({
            title: "Success",
            description: "Route deleted successfully",
          })
          await loadRoutes()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to delete route",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete route",
          variant: "destructive",
        })
      }
    }
  }

  const handleDuplicateRoute = async (route: any) => {
    try {
      const duplicatedRoute = {
        ...route,
        name: `${route.name} (Copy)`,
        id: undefined, // Remove ID so a new one is generated
      }
      delete duplicatedRoute.id
      delete duplicatedRoute.createdAt
      delete duplicatedRoute.updatedAt

      const result = await createRoute(duplicatedRoute)

      if (result.success) {
        toast({
          title: "Success",
          description: "Route duplicated successfully",
        })
        await loadRoutes()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to duplicate route",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate route",
        variant: "destructive",
      })
    }
  }

  const handleGeneratePreKits = async (route: any) => {
    setSelectedRoute(route)
    setPreKitDialogOpen(true)
    setPreKitGenerating(true)
    setPreKitResults(null)

    try {
      const result = await generatePreKitsForRoute(route.id, {
        restockThreshold: 30, // 30% threshold by default
        skipMachinesWithOpenPreKits: true,
      })

      if (result.success && result.data) {
        setPreKitResults(result.data)
        toast({
          title: "Pre-Kits Generated",
          description: `Successfully generated ${result.data.totalPreKitsGenerated} pre-kits with ${result.data.totalItemsToStock} items`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate pre-kits",
          variant: "destructive",
        })
        setPreKitDialogOpen(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate pre-kits",
        variant: "destructive",
      })
      setPreKitDialogOpen(false)
    } finally {
      setPreKitGenerating(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`
    }
    return `${mins}m`
  }

  const toggleRouteExpand = async (routeId: string) => {
    const newExpanded = new Set(expandedRoutes)
    if (newExpanded.has(routeId)) {
      newExpanded.delete(routeId)
    } else {
      newExpanded.add(routeId)
      // Load pre-kits if not already loaded
      if (!routePreKits[routeId]) {
        const result = await getRoutePreKits(routeId)
        if (result.success && result.data) {
          setRoutePreKits(prev => ({
            ...prev,
            [routeId]: result.data
          }))
        }
      }
    }
    setExpandedRoutes(newExpanded)
  }

  const handlePreKitClick = (preKit: any) => {
    setSelectedPreKit(preKit)
    setPreKitDetailsOpen(true)
  }

  const handlePreKitPicked = () => {
    // Reload pre-kits for the current route
    if (selectedPreKit) {
      const routeId = routes.find(r =>
        r.stops.some((stop: any) =>
          stop.vendingMachineIds?.includes(selectedPreKit.machineId)
        )
      )?.id
      if (routeId && expandedRoutes.has(routeId)) {
        getRoutePreKits(routeId).then(result => {
          if (result.success && result.data) {
            setRoutePreKits(prev => ({
              ...prev,
              [routeId]: result.data
            }))
          }
        })
      }
    }
  }

  const handlePreKitStocked = () => {
    handlePreKitPicked() // Same logic
  }

  const handlePreKitDeleted = () => {
    handlePreKitPicked() // Same logic
    setPreKitDetailsOpen(false)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Show error alert if there was an issue loading data */}
      {loadError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>
            {loadError}. You can still explore the interface with sample data.
          </AlertDescription>
        </Alert>
      )}

      {/* Driver Tasks Banner */}
      {isDriver && !isLoading && (
        <DriverTasksBanner
          routes={routes}
          preKitStatuses={preKitStatuses}
          onStartRoute={(route) => {
            toggleRouteExpand(route.id)
            setTimeout(() => {
              document.getElementById(`route-${route.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
            }, 100)
          }}
        />
      )}

      <div className={isDriver ? "border rounded-lg p-4 space-y-4" : "space-y-4"}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{isDriver ? "My Routes" : "Routes"}</h1>
            <p className="text-muted-foreground">
              {isDriver
                ? "Your assigned routes and stops"
                : `Manage delivery routes and driver assignments${useMockData ? " (Demo Mode)" : ""}`}
            </p>
          </div>
          <Button onClick={handleCreateRoute}>
            <Plus className="mr-2 h-4 w-4" />
            Create Route
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search routes..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading routes...</p>
          </CardContent>
        </Card>
      )}

      {/* Routes List */}
      {!isLoading && (
        <div className="grid gap-4">
          {filteredRoutes.map((route) => (
            <Card key={route.id} id={`route-${route.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {route.name}
                  </CardTitle>
                  <CardDescription>{route.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {route.isActive ? (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  {preKitStatuses[route.id]?.hasPreKits ? (
                    <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {preKitStatuses[route.id].openPreKitsCount} Pre-kit{preKitStatuses[route.id].openPreKitsCount !== 1 ? 's' : ''}
                    </Badge>
                  ) : preKitStatuses[route.id] && !preKitStatuses[route.id]?.hasPreKits ? (
                    <Badge variant="outline" className="text-green-600 border-green-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Done
                    </Badge>
                  ) : null}
                  {isDriver && (
                    <Button size="sm" onClick={() => toggleRouteExpand(route.id)}>
                      {expandedRoutes.has(route.id) ? "Collapse" : "Start"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleRouteExpand(route.id)}
                  >
                    {expandedRoutes.has(route.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleGeneratePreKits(route)}>
                        <Package className="mr-2 h-4 w-4" />
                        Generate Pre-Kits
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditRoute(route)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Route
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAssignDriver(route)}>
                        <User className="mr-2 h-4 w-4" />
                        Assign Driver
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateRoute(route)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteRoute(route.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {route.assignedDriver ? (
                      <span className="font-medium">
                        {route.assignedDriver.firstName}{" "}
                        {route.assignedDriver.lastName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Est. {formatDuration(route.estimatedDuration)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {route.recurringPattern
                      ? `Repeats ${route.recurringPattern}`
                      : "One-time"}
                  </span>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Machines</TableHead>
                      <TableHead>Est. Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {route.stops.map((stop: any) => (
                      <TableRow key={stop.id}>
                        <TableCell>{stop.order}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{stop.location?.name || stop.locationName}</div>
                            <div className="text-xs text-muted-foreground">
                              {stop.location?.address || stop.locationAddress}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {stop.vendingMachineIds?.length || 0} machines
                          </Badge>
                        </TableCell>
                        <TableCell>{stop.estimatedTime}m</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pre-kits Section (when expanded) */}
              {expandedRoutes.has(route.id) && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Pre-Kits
                    </h4>
                    {routePreKits[route.id] && (
                      <span className="text-xs text-muted-foreground">
                        {routePreKits[route.id].length} pre-kit{routePreKits[route.id].length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {routePreKits[route.id] && routePreKits[route.id].length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {routePreKits[route.id].map((preKit) => (
                        <MiniPreKitCard
                          key={preKit.id}
                          preKit={preKit}
                          onClick={() => handlePreKitClick(preKit)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-6">
                      No pre-kits generated for this route yet.
                      <br />
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleGeneratePreKits(route)}
                        className="mt-2"
                      >
                        Generate Pre-Kits
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {route.nextScheduled && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">
                    Next scheduled:
                  </span>
                  <span className="text-sm font-medium">
                    {route.nextScheduled.toLocaleDateString()} at{" "}
                    {route.nextScheduled.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {filteredRoutes.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No routes found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Get started by creating your first route"}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateRoute}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Route
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      )}
      </div>{/* end My Routes border wrapper */}

      <RouteBuilderDialog
        route={selectedRoute}
        open={isBuilderOpen}
        onOpenChange={setIsBuilderOpen}
        onSave={handleSaveRoute}
      />

      <AssignDriverDialog
        route={selectedRoute}
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        onAssign={handleAssignDriverSubmit}
      />

      {/* Pre-Kit Generation Results Dialog */}
      <Dialog open={preKitDialogOpen} onOpenChange={setPreKitDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Pre-Kit Generation {preKitGenerating ? "In Progress" : "Complete"}
            </DialogTitle>
            <DialogDescription>
              {preKitGenerating
                ? "Generating pre-kits for all machines on this route..."
                : selectedRoute
                ? `Results for ${selectedRoute.name}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {preKitGenerating && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Package className="h-12 w-12 animate-pulse text-muted-foreground mb-4 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Analyzing inventory levels and generating pre-kits...
                </p>
              </div>
            </div>
          )}

          {!preKitGenerating && preKitResults && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {preKitResults.totalPreKitsGenerated}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pre-Kits Generated
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {preKitResults.totalItemsToStock}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total Items
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {formatDuration(preKitResults.totalEstimatedTime)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Est. Time
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Machine Results */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Machine Details</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Machine</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Items</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preKitResults.results?.map((result: any) => (
                        <TableRow key={result.machineId}>
                          <TableCell className="font-medium">
                            {result.machineId}
                          </TableCell>
                          <TableCell>{result.locationName || result.locationId}</TableCell>
                          <TableCell>
                            {result.status === "generated" && (
                              <Badge className="bg-green-100 text-green-800">
                                Generated
                              </Badge>
                            )}
                            {result.status === "skipped" && (
                              <Badge variant="secondary">Skipped</Badge>
                            )}
                            {result.status === "error" && (
                              <Badge variant="destructive">Error</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.totalItems ? `${result.totalItems} items` : result.error || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {!preKitGenerating && preKitResults && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setPreKitDialogOpen(false)
                  setPreKitResults(null)
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  // Navigate to pre-kits page
                  window.location.href = "/web/prekits"
                }}
              >
                View Pre-Kits
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Pre-Kit Details Dialog */}
      <PreKitDetailsDialog
        preKit={selectedPreKit}
        open={preKitDetailsOpen}
        onOpenChange={setPreKitDetailsOpen}
        onPreKitPicked={handlePreKitPicked}
        onPreKitStocked={handlePreKitStocked}
        onPreKitDeleted={handlePreKitDeleted}
      />
    </div>
  )
}
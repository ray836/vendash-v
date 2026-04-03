"use client"

import { useState } from "react"
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

// Mock data for demonstration
const mockRoutes = [
  {
    id: "1",
    name: "Downtown Route",
    description: "Covers all downtown vending machines",
    isActive: true,
    assignedDriver: "John Doe",
    estimatedDuration: 240,
    recurringPattern: "daily",
    stops: 3,
    nextScheduled: "2024-12-15 08:00",
  },
  {
    id: "2",
    name: "North Side Route",
    description: "Services northern district locations",
    isActive: true,
    assignedDriver: null,
    estimatedDuration: 180,
    recurringPattern: "weekly",
    stops: 2,
    nextScheduled: null,
  },
]

export default function SimpleRoutesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [routes] = useState(mockRoutes)

  const filteredRoutes = routes.filter((route) =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`
    }
    return `${mins}m`
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Routes</h1>
          <p className="text-muted-foreground">
            Manage delivery routes and driver assignments
          </p>
        </div>
        <Button>
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

      <div className="grid gap-4">
        {filteredRoutes.map((route) => (
          <Card key={route.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Route
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        Assign Driver
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {route.assignedDriver || (
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
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{route.stops} stops</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {route.recurringPattern === "daily"
                      ? "Daily"
                      : route.recurringPattern === "weekly"
                      ? "Weekly"
                      : "One-time"}
                  </span>
                </div>
              </div>

              {route.nextScheduled && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">
                    Next scheduled:
                  </span>
                  <span className="text-sm font-medium">{route.nextScheduled}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

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
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Route
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
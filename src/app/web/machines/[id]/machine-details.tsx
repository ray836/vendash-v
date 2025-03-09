"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Settings,
  AlertTriangle,
  Banknote,
  Package,
  Calendar,
  MapPin,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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

// Sample machine data - in a real app, this would come from your backend
const getMachineData = (id: string) => {
  return {
    id,
    name: `Vending Machine ${id}`,
    type: id.startsWith("D") ? "drink" : "snack",
    location: id.startsWith("D")
      ? "Main Building - Floor 1"
      : "Science Block - Floor 2",
    status: "Online",
    setupStatus: id === "VM001" || id === "D001" ? "complete" : "pending",
    inventory: 72,
    revenue: {
      daily: "$145.50",
      weekly: "$876.25",
      monthly: "$3,245.75",
    },
    alerts: id === "VM001" ? 0 : 2,
    lastRestocked: "2023-11-15T10:30:00",
    lastMaintenance: "2023-10-28T14:15:00",
    slots: {
      total: id.startsWith("D") ? 10 : 24,
      filled:
        id === "VM001" || id === "D001" ? (id.startsWith("D") ? 8 : 20) : 0,
    },
  }
}

interface MachineDetailsProps {
  id: string
}

export default function MachineDetails({ id }: MachineDetailsProps) {
  const router = useRouter()
  const [machine, setMachine] = useState<ReturnType<
    typeof getMachineData
  > | null>(null)

  useEffect(() => {
    // Simulate API call to fetch machine data
    setMachine(getMachineData(id))
  }, [id])

  if (!machine) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    )
  }

  const isSetup = machine.setupStatus === "complete"
  const setupPercentage = Math.round(
    (machine.slots.filled / machine.slots.total) * 100
  )

  const handleSetupClick = () => {
    router.push(`/web/machines/${id}/setup`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/web/dashboard"
            className="flex items-center text-sm text-muted-foreground hover:text-primary mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{machine.name}</h1>
            <Badge
              variant={machine.status === "Online" ? "default" : "destructive"}
            >
              {machine.status}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            {machine.location}
          </p>
        </div>
        <div className="flex gap-2">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Setup Status</CardTitle>
            <CardDescription>
              {isSetup
                ? `${machine.slots.filled} of ${machine.slots.total} slots configured`
                : "Machine needs to be configured"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{setupPercentage}% Complete</span>
                <span className="text-muted-foreground">
                  {machine.slots.filled}/{machine.slots.total} slots
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
            <CardTitle className="text-base">Inventory Status</CardTitle>
            <CardDescription>Current stock level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{machine.inventory}% Full</span>
                <span className="text-muted-foreground">
                  {machine.inventory < 30 ? "Low Stock" : "Good Stock"}
                </span>
              </div>
              <Progress value={machine.inventory} className="h-2" />
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full flex justify-between text-sm">
              <span className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                Last Restocked
              </span>
              <span>{formatDate(machine.lastRestocked)}</span>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alerts</CardTitle>
            <CardDescription>
              {machine.alerts === 0
                ? "No active alerts"
                : `${machine.alerts} active alert${
                    machine.alerts > 1 ? "s" : ""
                  }`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {machine.alerts === 0 ? (
              <div className="flex flex-col items-center justify-center h-20 text-muted-foreground">
                <p>All systems operational</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Low inventory in 2 slots</span>
                </div>
                {machine.alerts > 1 && (
                  <div className="flex items-center gap-2 text-sm text-amber-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Maintenance due in 3 days</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <div className="w-full flex justify-between text-sm">
              <span className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                Last Maintenance
              </span>
              <span>{formatDate(machine.lastMaintenance)}</span>
            </div>
          </CardFooter>
        </Card>
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
                {machine.type === "snack" ? "Snack" : "Drink"} vending machine
                with {machine.slots.total} slots
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
                  <h3 className="text-sm font-medium leading-none">Location</h3>
                  <p className="text-sm text-muted-foreground">
                    {machine.location}
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
                    {machine.slots.total} slots
                  </p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium leading-none">
                    Configured Slots
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {machine.slots.filled} slots ({setupPercentage}%)
                  </p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium leading-none">
                    Inventory Level
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {machine.inventory}% full
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Machine Visualization
                  </h3>
                  <div className="border rounded-lg p-4">
                    <div
                      className="grid gap-2 w-full"
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${
                          machine.type === "drink" ? 5 : 4
                        }, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${
                          machine.type === "drink" ? 2 : 6
                        }, minmax(0, 1fr))`,
                        aspectRatio: machine.type === "drink" ? "5/2" : "4/6",
                      }}
                    >
                      {Array.from({ length: machine.slots.total }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className={`
                              border rounded-md bg-muted/20 aspect-square w-full h-full
                              ${
                                i < machine.slots.filled
                                  ? "bg-primary/10 border-primary/30"
                                  : ""
                              }
                            `}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Restocked
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(machine.lastRestocked)}
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
                          {formatDate(machine.lastMaintenance)}
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
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium leading-none">
                    Daily Revenue
                  </h3>
                  <div className="flex items-center">
                    <Banknote className="h-5 w-5 mr-2 text-primary" />
                    <p className="text-2xl font-bold">
                      {machine.revenue.daily}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium leading-none">
                    Weekly Revenue
                  </h3>
                  <div className="flex items-center">
                    <Banknote className="h-5 w-5 mr-2 text-primary" />
                    <p className="text-2xl font-bold">
                      {machine.revenue.weekly}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium leading-none">
                    Monthly Revenue
                  </h3>
                  <div className="flex items-center">
                    <Banknote className="h-5 w-5 mr-2 text-primary" />
                    <p className="text-2xl font-bold">
                      {machine.revenue.monthly}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Revenue Trend</h3>
                <div className="h-[200px] flex items-end gap-2">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const height = 30 + Math.random() * 70
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <div
                          className="w-full bg-primary/80 rounded-t-sm"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inventory" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Details</CardTitle>
              <CardDescription>Product stock levels and alerts</CardDescription>
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
                    <Progress value={machine.inventory} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Empty</span>
                      <span>Full</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Top Products</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">Coca-Cola</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            85% full
                          </span>
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">Doritos</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            62% full
                          </span>
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">Snickers</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-destructive">
                            15% full
                          </span>
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

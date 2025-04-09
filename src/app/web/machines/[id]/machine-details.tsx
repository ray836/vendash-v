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
import { getMachineWithSlots } from "./actions"
import { MachineWithSlotsDTO } from "@/core/use-cases/VendingMachine/GetMachineWithSlotsUseCase"
import { MachineType } from "@/core/domain/entities/VendingMachine"
import { PublicSlotDTO } from "@/core/domain/DTOs/slotDTOs"
import { PublicSlotWithProductDTO } from "@/core/domain/DTOs/slotDTOs"

interface MachineDetailsProps {
  id: string
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

function getGridDimensions(slots: PublicSlotWithProductDTO[]) {
  if (slots.length === 0) return { rows: 0, columns: 0 }

  const maxRow =
    Math.max(...slots.map((slot) => slot.row.charCodeAt(0) - 65)) + 1 // Convert 'A' to 0, 'B' to 1, etc.
  const maxColumn = Math.max(...slots.map((slot) => slot.column)) + 1

  return {
    rows: maxRow,
    columns: maxColumn,
  }
}

export default function MachineDetails({ id }: MachineDetailsProps) {
  const router = useRouter()
  const [machineData, setMachineData] = useState<MachineWithSlotsDTO | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)

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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
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
            <h1 className="text-2xl font-bold">Vending Machine {machine.id}</h1>
            <Badge
              variant={machine.status === "ONLINE" ? "default" : "destructive"}
            >
              {machine.status}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            {machine.locationId}
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
                ? `${slots.length} slots configured`
                : "Machine needs to be configured"}
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
            <CardTitle className="text-base">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Daily Revenue</p>
                  <p className="text-2xl font-bold">
                    ${revenue.daily.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Weekly Revenue</p>
                  <p className="text-2xl font-bold">
                    ${revenue.weekly.toFixed(2)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Monthly Revenue</p>
                <p className="text-2xl font-bold">
                  ${revenue.monthly.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inventory Status</CardTitle>
            <CardDescription>Current stock level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{calculateOverallInventory(slots)}% Full</span>
                <span className="text-muted-foreground">
                  {slots.reduce((sum, slot) => sum + slot.currentQuantity, 0)} /{" "}
                  {slots.reduce((sum, slot) => sum + slot.capacity, 0)} items
                </span>
              </div>
              <Progress
                value={calculateOverallInventory(slots)}
                className="h-2"
              />
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full flex justify-between text-sm">
              <span className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                Last Restocked
              </span>
              <span>{formatDate(lastRestocked)}</span>
            </div>
          </CardFooter>
        </Card>

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
              <span>{formatDate(lastMaintenance)}</span>
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
                {machine.type === MachineType.SNACK ? "Snack" : "Drink"} vending
                machine with {slots.length} slots
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
                    {machine.locationId}
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
                    {slots.length} slots
                  </p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium leading-none">
                    Configured Slots
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {slots.length} slots ({setupPercentage}%)
                  </p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium leading-none">
                    Inventory Level
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {calculateOverallInventory(slots)}% full
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Machine Visualization
                  </h3>
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Machine Layout</h3>
                    <div
                      className="grid gap-2 w-full"
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${
                          getGridDimensions(slots).columns
                        }, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${
                          getGridDimensions(slots).rows
                        }, minmax(0, 1fr))`,
                        aspectRatio: `${getGridDimensions(slots).columns}/${
                          getGridDimensions(slots).rows
                        }`,
                      }}
                    >
                      {slots.map((slot) => {
                        const rowIndex = slot.row.charCodeAt(0) - 65 // Convert 'A' to 0, 'B' to 1, etc.
                        return (
                          <div
                            key={slot.id}
                            style={{
                              gridRow: rowIndex + 1,
                              gridColumn: slot.column + 1,
                            }}
                            className={`
                              border rounded-md bg-muted/20 aspect-square w-full h-full relative
                              ${
                                slot.currentQuantity > 0
                                  ? "border-primary/30"
                                  : ""
                              }
                              ${
                                slot.productId
                                  ? "cursor-pointer hover:bg-primary/20"
                                  : ""
                              }
                              overflow-hidden
                            `}
                            title={slot.productName || "Empty Slot"}
                          >
                            {/* Background Image */}
                            {slot.productImage && (
                              <div
                                className="absolute inset-0 bg-cover bg-center opacity-10"
                                style={{
                                  backgroundImage: `url(${slot.productImage})`,
                                }}
                              />
                            )}

                            {/* Content */}
                            <div className="flex flex-col items-center justify-center h-full text-xs p-1 relative z-10">
                              <span className="font-medium absolute top-1 left-1">
                                {slot.labelCode}
                              </span>
                              {slot.productName && (
                                <>
                                  <span className="text-muted-foreground text-center line-clamp-1 bg-background/80 px-1 rounded">
                                    {slot.productName}
                                  </span>
                                  <span className="text-primary font-medium bg-background/80 px-1 rounded">
                                    ${slot.price.toFixed(2)}
                                  </span>
                                  <span className="text-muted-foreground absolute bottom-1 right-1 bg-background/80 px-1 rounded">
                                    {slot.currentQuantity}/{slot.capacity}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
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
                          {formatDate(lastRestocked)}
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
                          {formatDate(lastMaintenance)}
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
                      ${revenue.daily.toFixed(2)}
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
                      ${revenue.weekly.toFixed(2)}
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
                      ${revenue.monthly.toFixed(2)}
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
                    <Progress
                      value={calculateOverallInventory(slots)}
                      className="h-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Empty</span>
                      <span>Full</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Top Products</h3>
                    <div className="space-y-3">
                      {slots.map((slot, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium">
                              {slot.labelCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              {Math.round(
                                (slot.currentQuantity / slot.capacity) * 100
                              )}
                              % full
                            </span>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
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

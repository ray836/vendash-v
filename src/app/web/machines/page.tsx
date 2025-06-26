"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Package, AlertCircle, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { getMachines } from "./actions"
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

// Component for a single vending machine card
function VendingMachineCard({ machine }: { machine: VendingMachine }) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-row items-center space-x-2">
            <div className="flex items-center">
              <span className="text-base font-bold">{machine.id}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">·</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">
                {machine.type}
              </span>
            </div>
          </div>
          <Badge
            variant={
              machine.status === "Online"
                ? "default"
                : machine.status === "Maintenance"
                ? "destructive"
                : machine.status === "Low Stock"
                ? "secondary"
                : "outline"
            }
          >
            {machine.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center mt-1">
          <MapPin className="h-3.5 w-3.5 mr-1" />
          {machine.locationName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Model</span>
            <div className="flex items-center">
              <span className="font-medium">{machine.model ?? "--"}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Notes</span>
            <div className="flex items-center">
              <span className="font-medium">{machine.notes}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Organization</span>
            <div className="flex items-center">
              <span className="font-medium">{machine.organizationId}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Card Reader</span>
            <div className="flex items-center">
              <span className="font-medium">
                {machine.cardReaderId || "None"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Link href={`/web/machines/${machine.id}`}>
          <Button size="sm">View</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

// Update the component to properly handle the fetched data
export default function VendingMachineDashboard() {
  const [machines, setMachines] = useState<VendingMachine[]>([])

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await getMachines()
        const data = JSON.parse(response)
        setMachines(data)
      } catch (error) {
        console.error("Failed to fetch machines:", error)
        // Handle error appropriately
      }
    }
    fetchMachines()
  }, [])

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vending Machines</h1>
        <Link href="/web/machines/new">
          <Button>Add Machine</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines.map((machine) => (
          <VendingMachineCard key={machine.id} machine={machine} />
        ))}
      </div>
    </div>
  )
}

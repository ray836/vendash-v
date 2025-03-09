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

// Add interface for machine data
interface VendingMachine {
  id: string
  location: string
  type: string
  status: "Online" | "Maintenance" | "Low Stock" | "Offline"
  inventory: number
  lastRestocked: string
  revenue: string
  alerts: number
}

// Sample vending machine data
const vendingMachines: VendingMachine[] = [
  {
    id: "VM001",
    location: "Main Building, Floor 1",
    type: "Drink",
    status: "Online",
    inventory: 87,
    lastRestocked: "2023-11-15",
    revenue: "$1,245.50",
    alerts: 0,
  },
  {
    id: "VM002",
    location: "Science Block, Floor 2",
    type: "Snack",
    status: "Online",
    inventory: 62,
    lastRestocked: "2023-11-12",
    revenue: "$876.25",
    alerts: 0,
  },
  {
    id: "VM003",
    location: "Library, Floor 1",
    type: "Snack",
    status: "Maintenance",
    inventory: 45,
    lastRestocked: "2023-11-10",
    revenue: "$523.75",
    alerts: 2,
  },
  {
    id: "VM004",
    location: "Student Center",
    type: "Snack",
    status: "Online",
    inventory: 91,
    lastRestocked: "2023-11-16",
    revenue: "$1,102.00",
    alerts: 0,
  },
  {
    id: "VM005",
    location: "Sports Complex",
    type: "Snack",
    status: "Low Stock",
    inventory: 23,
    lastRestocked: "2023-11-08",
    revenue: "$789.50",
    alerts: 1,
  },
  {
    id: "VM006",
    location: "Engineering Building, Floor 3",
    type: "Snack",
    status: "Online",
    inventory: 78,
    lastRestocked: "2023-11-14",
    revenue: "$934.25",
    alerts: 0,
  },
]

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
          {machine.location}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Inventory</span>
            <div className="flex items-center">
              <Package className="h-4 w-4 mr-1 text-primary" />
              <span className="font-medium">{machine.inventory}%</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Alerts</span>
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-1 text-primary" />
              <span className="font-medium">{machine.alerts}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Revenue</span>
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-1 text-primary" />
              <span className="font-medium">{machine.revenue}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              Last Restocked
            </span>
            <span className="font-medium">
              {new Date(machine.lastRestocked).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Link href={`/web/machines/${machine.id}`}>
          <Button variant="outline" size="sm">
            Details
          </Button>
        </Link>
        <Button size="sm">Manage</Button>
      </CardFooter>
    </Card>
  )
}

// Dashboard component that displays a grid of vending machine cards
export default function VendingMachineDashboard() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vending Machines</h1>
        <Link href="/web/machines/new">
          <Button>Add Machine</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendingMachines.map((machine) => (
          <VendingMachineCard key={machine.id} machine={machine} />
        ))}
      </div>
    </div>
  )
}

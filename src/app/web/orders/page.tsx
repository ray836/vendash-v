import { CalendarClock, Package } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrderItem } from "./order-item"
import { PastOrderCard } from "./past-order-card"
export default function OrdersPage() {
  // This would typically come from an API or database
  const nextOrderDate = new Date()
  nextOrderDate.setDate(nextOrderDate.getDate() + 3)

  const nextOrderItems = [
    {
      id: 1,
      name: "Organic Bananas",
      quantity: 1,
      price: 3.99,
      image:
        "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=200&h=200&q=80&fit=crop",
    },
    {
      id: 2,
      name: "Whole Milk",
      quantity: 2,
      price: 4.5,
      image:
        "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=200&h=200&q=80&fit=crop",
    },
    {
      id: 3,
      name: "Sourdough Bread",
      quantity: 1,
      price: 5.99,
      image:
        "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=200&h=200&q=80&fit=crop",
    },
  ]

  const pastOrders = [
    {
      id: "ORD-2023-001",
      date: "March 1, 2023",
      status: "Delivered",
      items: 5,
      total: 32.45,
    },
    {
      id: "ORD-2023-002",
      date: "February 15, 2023",
      status: "Delivered",
      items: 8,
      total: 47.99,
    },
    {
      id: "ORD-2023-003",
      date: "January 28, 2023",
      status: "Delivered",
      items: 3,
      total: 21.5,
    },
  ]

  const totalNextOrder = nextOrderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Your Orders</h1>
        <p className="text-muted-foreground">
          View and manage your upcoming and past orders
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Order</TabsTrigger>
          <TabsTrigger value="past">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Next Scheduled Order</CardTitle>
                  <CardDescription className="mt-2">
                    <div className="flex items-center text-sm">
                      <CalendarClock className="mr-2 h-4 w-4" />
                      Delivery on{" "}
                      {nextOrderDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </CardDescription>
                </div>
                <Button variant="outline">Modify Schedule</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border">
                  <div className="p-4 flex items-center justify-between font-medium">
                    <h3>Items in your next order ({nextOrderItems.length})</h3>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/shop">Add Items</Link>
                    </Button>
                  </div>
                  <Separator />
                  <div className="p-4 space-y-4">
                    {nextOrderItems.map((item) => (
                      <OrderItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="text-xl font-bold">
                  ${totalNextOrder.toFixed(2)}
                </p>
              </div>
              <Button>Checkout Now</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Order History</h2>
              <div className="flex items-center text-sm text-muted-foreground">
                <Package className="mr-2 h-4 w-4" />
                {pastOrders.length} orders placed
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastOrders.map((order) => (
                <PastOrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { Package } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PastOrderCard } from "./past-order-card"
import { NextOrderCard } from "./next-order-card"

export default function OrdersPage() {
  // This would typically come from an API or database
  const nextOrderDate = new Date()
  nextOrderDate.setDate(nextOrderDate.getDate() + 3)

  const nextOrderItems = [
    {
      id: "1",
      orderId: "draft-1",
      quantity: 1,
      unitPrice: 3.99,
      product: {
        id: "prod-1",
        name: "Organic Bananas",
        recommendedPrice: 3.99,
        category: "Produce",
        image:
          "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=200&h=200&q=80&fit=crop",
        vendorLink: "https://vendor.com/bananas",
        caseCost: 35.99,
        caseSize: 10,
        shippingAvailable: true,
        shippingTimeInDays: 2,
        organizationId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      id: "2",
      orderId: "draft-1",
      quantity: 2,
      unitPrice: 4.5,
      product: {
        id: "prod-2",
        name: "Whole Milk",
        recommendedPrice: 4.5,
        category: "Dairy",
        image:
          "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=200&h=200&q=80&fit=crop",
        vendorLink: "https://vendor.com/milk",
        caseCost: 40.5,
        caseSize: 12,
        shippingAvailable: true,
        shippingTimeInDays: 1,
        organizationId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      id: "3",
      orderId: "draft-1",
      quantity: 1,
      unitPrice: 5.99,
      product: {
        id: "prod-3",
        name: "Sourdough Bread",
        recommendedPrice: 5.99,
        category: "Bakery",
        image:
          "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=200&h=200&q=80&fit=crop",
        vendorLink: "https://vendor.com/bread",
        caseCost: 50.0,
        caseSize: 10,
        shippingAvailable: true,
        shippingTimeInDays: 1,
        organizationId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
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
          <NextOrderCard
            nextOrderDate={nextOrderDate}
            orderItems={nextOrderItems}
          />
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

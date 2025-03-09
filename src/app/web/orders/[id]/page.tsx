"use server"
import {
  ArrowLeft,
  CalendarClock,
  CreditCard,
  MapPin,
  Package,
  Printer,
  RefreshCw,
  Truck,
} from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
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
import { OrderItemDetail } from "./order-item-detail"

interface OrderDetailsPageProps {
  params: {
    id: string
  }
}

// This would typically come from an API or database based on the order ID
const getOrderDetails = (id: string) => {
  return {
    id: id,
    orderNumber: "ORD-2023-001",
    date: "March 1, 2023",
    status: "Delivered",
    deliveryAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "Anytown",
      state: "CA",
      zip: "12345",
      country: "USA",
    },
    deliveryDate: "March 3, 2023",
    paymentMethod: "Credit Card •••• 4242",
    items: [
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
      {
        id: 4,
        name: "Organic Eggs",
        quantity: 1,
        price: 6.49,
        image:
          "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=200&h=200&q=80&fit=crop",
      },
    ],
    subtotal: 25.47,
    tax: 2.04,
    shipping: 4.99,
    discount: 0,
    total: 32.5,
  }
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const order = getOrderDetails(params.id)

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/web/orders">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to orders</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
          <p className="text-muted-foreground">
            {order.orderNumber} • Placed on {order.date}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reorder
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Status</CardTitle>
                <Badge>{order.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Progress line positioned behind the badges */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-primary" />

                <div className="flex justify-between mb-2 relative">
                  <div className="text-center">
                    <div className="relative z-10">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="absolute top-0 left-0 h-8 w-8 rounded-full border-2 border-primary animate-ping opacity-20" />
                    </div>
                    <p className="text-xs mt-1">Ordered</p>
                  </div>
                  <div className="text-center">
                    <div className="relative z-10">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <Package className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-xs mt-1">Packed</p>
                  </div>
                  <div className="text-center">
                    <div className="relative z-10">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <Truck className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-xs mt-1">Shipped</p>
                  </div>
                  <div className="text-center">
                    <div className="relative z-10">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <MapPin className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-xs mt-1">Delivered</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                {order.items.length} items purchased
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {order.items.map((item) => (
                  <OrderItemDetail key={item.id} item={item} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{order.deliveryAddress.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.deliveryAddress.street}
                    <br />
                    {order.deliveryAddress.city}, {order.deliveryAddress.state}{" "}
                    {order.deliveryAddress.zip}
                    <br />
                    {order.deliveryAddress.country}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">Delivered on {order.deliveryDate}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{order.paymentMethod}</p>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>${order.shipping.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Need Help?
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

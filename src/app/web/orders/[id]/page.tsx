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
import { notFound } from "next/navigation"

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
import { getOrderById } from "../actions"

interface OrderDetailsPageProps {
  params: {
    id: string
  }
}

export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const result = await getOrderById(params.id)

  if (!result.success || !result.order) {
    notFound()
  }

  const order = result.order

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
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-primary" />
                <div className="flex justify-between mb-2 relative">
                  <div className="text-center">
                    <div className="relative z-10">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <CreditCard className="h-4 w-4" />
                      </div>
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
                {order.items.length} item{order.items.length !== 1 ? "s" : ""} ordered
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
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">Placed on {order.date}</p>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                )}
                {order.shipping > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>${order.shipping.toFixed(2)}</span>
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
              <Button variant="outline" className="w-full" asChild>
                <Link href="/web/orders">Back to Orders</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

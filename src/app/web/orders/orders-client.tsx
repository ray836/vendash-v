"use client"

import { useState, useEffect, useCallback } from "react"
import { Package } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PastOrderCard } from "./past-order-card"
import { NextOrderCard } from "./next-order-card"
import { UploadReceiptDialog } from "./upload-receipt-dialog"
import { getOrderHistory } from "./actions"

export function OrdersClient({ nextOrderDate }: { nextOrderDate: Date }) {
  const [pastOrders, setPastOrders] = useState<
    { id: string; date: string; status: string; items: number; total: number }[]
  >([])

  const fetchHistory = useCallback(async () => {
    const { orders } = await getOrderHistory()
    setPastOrders(orders)
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Your Orders</h1>
          <p className="text-muted-foreground">
            View and manage your upcoming and past orders
          </p>
        </div>
        <UploadReceiptDialog />
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Order</TabsTrigger>
          <TabsTrigger value="past">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          <NextOrderCard nextOrderDate={nextOrderDate} onOrderPlaced={fetchHistory} />
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

            {pastOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No orders placed yet
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastOrders.map((order) => (
                  <PastOrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

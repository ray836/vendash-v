"use client"

import { useState, useEffect, useCallback } from "react"
import { Package, Wand2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PastOrderCard } from "./past-order-card"
import { NextOrderCard } from "./next-order-card"
import { UploadReceiptDialog } from "./upload-receipt-dialog"
import { getOrderHistory, autoPopulateOrder } from "./actions"
import { toast } from "@/hooks/use-toast"
import { useSession } from "@/lib/use-session"

export function OrdersClient({ nextOrderDate }: { nextOrderDate: Date }) {
  const { data: session } = useSession()
  const [pastOrders, setPastOrders] = useState<
    { id: string; date: string; status: string; items: number; total: number }[]
  >([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [isAutoPopulating, setIsAutoPopulating] = useState(false)
  const [nextOrderKey, setNextOrderKey] = useState(0)

  const fetchHistory = useCallback(async () => {
    setIsHistoryLoading(true)
    const { orders } = await getOrderHistory()
    setPastOrders(orders)
    setIsHistoryLoading(false)
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleAutoPopulate = async () => {
    if (!session?.user?.organizationId) return
    setIsAutoPopulating(true)
    try {
      const result = await autoPopulateOrder(session.user.organizationId, session.user.id)
      if (!result.success) {
        toast({ title: "Auto-populate failed", description: result.error, variant: "destructive" })
        return
      }
      const lines = []
      if (result.primaryCount > 0) lines.push(`${result.primaryCount} needed item${result.primaryCount !== 1 ? "s" : ""} added`)
      if (result.paddedCount > 0) lines.push(`${result.paddedCount} extra item${result.paddedCount !== 1 ? "s" : ""} added to reach $50`)
      if (result.skippedCount > 0) lines.push(`${result.skippedCount} item${result.skippedCount !== 1 ? "s" : ""} skipped (shelf life)`)
      if (result.primaryCount === 0 && result.paddedCount === 0) lines.push("Nothing needed right now")
      const costLine = result.totalCost > 0
        ? `Order total: $${result.totalCost.toFixed(2)}${!result.reachedMinimum ? " — under $50 minimum" : ""}`
        : ""
      toast({
        title: result.reachedMinimum ? "Order ready" : "Order updated",
        description: [lines.join(" · "), costLine].filter(Boolean).join("\n"),
      })
      setNextOrderKey((k) => k + 1) // force NextOrderCard to refresh
    } finally {
      setIsAutoPopulating(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Plan your next Sam&apos;s Club or Costco run
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleAutoPopulate}
            disabled={isAutoPopulating}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {isAutoPopulating ? "Building order..." : "Auto-populate Order"}
          </Button>
          <UploadReceiptDialog />
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upcoming">Shopping List</TabsTrigger>
          <TabsTrigger value="past">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          <NextOrderCard key={nextOrderKey} nextOrderDate={nextOrderDate} onOrderPlaced={fetchHistory} />
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Purchase History</h2>
              <div className="flex items-center text-sm text-muted-foreground">
                <Package className="mr-2 h-4 w-4" />
                {pastOrders.length} purchases recorded
              </div>
            </div>

            {isHistoryLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-32" />
                    <div className="flex justify-between pt-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pastOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No purchases recorded yet
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

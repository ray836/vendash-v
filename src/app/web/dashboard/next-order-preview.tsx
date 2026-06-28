"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingCart, ArrowRight, Package, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCurrentOrderWithInventory, getUnorderedRestockCount } from "@/app/web/orders/actions"
import { PublicOrderDTO } from "@/domains/Order/schemas/orderDTOs"

type InventoryMap = Map<string, { storage: number; machines: number }>

export function NextOrderPreview() {
  const [order, setOrder] = useState<PublicOrderDTO | null>(null)
  const [inventory, setInventory] = useState<InventoryMap>(new Map())
  const [loading, setLoading] = useState(true)
  const [unorderedCount, setUnorderedCount] = useState(0)

  useEffect(() => {
    Promise.all([
      getCurrentOrderWithInventory(),
      getUnorderedRestockCount(),
    ]).then(([r, countResult]) => {
      if (r.success && r.order) setOrder(r.order)
      if (r.inventory) setInventory(r.inventory)
      if (countResult.success) setUnorderedCount(countResult.unorderedCount)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (!order || order.orderItems.length === 0) return null

  const subtotal = order.orderItems.reduce(
    (sum, item) => sum + item.product.caseCost * item.quantity,
    0
  )
  const totalUnits = order.orderItems.reduce(
    (sum, item) => sum + Number(item.product.caseSize || 0) * item.quantity,
    0
  )

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Next Order</CardTitle>
              <CardDescription>
                {order.orderItems.length} product{order.orderItems.length !== 1 ? "s" : ""}{totalUnits > 0 ? ` · ${totalUnits} units` : ""} · estimated ${subtotal.toFixed(2)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unorderedCount > 0 && (
              <Link
                href="/web/orders"
                className="flex items-center gap-1.5 rounded-md border border-amber-800/40 bg-amber-950/40 px-3 py-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {unorderedCount} product{unorderedCount !== 1 ? "s" : ""} need{unorderedCount === 1 ? "s" : ""} ordering
              </Link>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href="/web/orders" className="flex items-center gap-1.5">
                Manage Order <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border divide-y">
          {order.orderItems.map((item) => {
            const inv = inventory.get(item.product.id)
            const storageQty = inv?.storage ?? 0
            const machinesQty = inv?.machines ?? 0
            const totalOnHand = storageQty + machinesQty

            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                {item.product.image ? (
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-10 w-10 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ${item.product.caseCost.toFixed(2)} / case
                    {item.product.caseSize ? ` · ${item.product.caseSize} per case` : ""}
                  </p>
                </div>

                {/* Inventory on hand */}
                <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {storageQty} in storage
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    {machinesQty} in machines
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge variant="secondary">{item.quantity} case{item.quantity !== 1 ? "s" : ""}</Badge>
                  <p className="text-sm font-medium w-16 text-right">
                    ${(item.product.caseCost * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex justify-end pt-3">
          <p className="text-sm text-muted-foreground mr-3">Subtotal</p>
          <p className="text-sm font-semibold">${subtotal.toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

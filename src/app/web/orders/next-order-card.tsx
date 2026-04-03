"use client"

import { CalendarClock } from "lucide-react"
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
import { OrderItem } from "./order-item"
import { AddProductDialog } from "./add-product-dialog"
import { useState, useEffect } from "react"
import {
  getCurrentOrder,
  updateOrderItemQuantity,
  placeCurrentOrder,
  removeOrderItem,
} from "./actions"
import { toast } from "@/hooks/use-toast"
import {
  PublicOrderItemResponseDTO,
  PublicOrderDTO,
  PlaceCurrentOrderRequestDTO,
} from "@/domains/Order/schemas/orderDTOs"

interface NextOrderCardProps {
  nextOrderDate?: Date
  onOrderPlaced?: () => void
}

export function NextOrderCard({ nextOrderDate, onOrderPlaced }: NextOrderCardProps) {
  const [items, setItems] = useState<PublicOrderItemResponseDTO[]>([])
  const [order, setOrder] = useState<PublicOrderDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCurrentOrder = async () => {
    try {
      setIsLoading(true)
      const result = await getCurrentOrder()
      if (result.success && result.order) {
        setOrder(result.order)
        setItems(result.order.orderItems)
      } else {
        // No current order found (e.g., after placing an order)
        setOrder(null)
        setItems([])
      }
    } catch (err: unknown) {
      console.error("Failed to fetch current order:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch current order",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrentOrder()
  }, [])

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    try {
      // Find the item to get its orderId
      const item = items.find(item => item.id === id)
      if (!item) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Item not found",
        })
        return
      }

      const result = await updateOrderItemQuantity(id, item.orderId, newQuantity)

      if (result.success) {
        // just update the quantity of the item in the items array
        setItems(
          items.map((item) =>
            item.id === id ? { ...item, quantity: newQuantity } : item
          )
        )
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update quantity",
        })
      }
    } catch (err: unknown) {
      console.error("Failed to update quantity:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update quantity",
      })
    }
  }

  const handleRemoveItem = async (id: string) => {
    try {
      const result = await removeOrderItem(id)

      if (result.success) {
        // Remove from local state after successful backend deletion
        setItems(items.filter((item) => item.id !== id))
        toast({
          title: "Success",
          description: "Item removed from order",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to remove item",
        })
      }
    } catch (err: unknown) {
      console.error("Failed to remove item:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove item",
      })
    }
  }

  const totalNextOrder = items.reduce(
    (sum, item) => sum + item.product.caseCost * item.quantity,
    0
  )

  const handlePlaceOrder = async () => {
    if (!order) return

    const orderItems = items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }))

    const request: PlaceCurrentOrderRequestDTO = {
      id: order.id,
      organizationId: order.organizationId,
      status: "placed",
      scheduledOrderDate: order.scheduledOrderDate,
      orderPlacedDate: new Date(),
      taxPaid: order.taxPaid,
      shippingCost: order.shippingCost,
      totalAmount: totalNextOrder,
      placedBy: "1",
      orderItems: orderItems,
    }

    try {
      const result = await placeCurrentOrder(request)
      if (result.success) {
        toast({
          title: "Success",
          description: "Order placed successfully",
        })
        // Refresh the order data after successful placement
        await fetchCurrentOrder()
        onOrderPlaced?.()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to place order",
        })
      }
    } catch (err) {
      console.error("Failed to place order:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to place order",
      })
    }
  }

  if (isLoading) {
    return <div>Loading order...</div> // You might want to use a proper loading component
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Next Scheduled Order</CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center text-sm">
                <CalendarClock className="mr-2 h-4 w-4" />
                Delivery on{" "}
                {(
                  order?.scheduledOrderDate || nextOrderDate
                )?.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <AddProductDialog onSuccess={fetchCurrentOrder} />
            <Button variant="outline">Modify Schedule</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-lg border p-12 text-center">
              <p className="text-lg text-muted-foreground">Your cart is empty</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <div className="p-4 flex items-center justify-between font-medium">
                <h3>Items in your next order ({items.length})</h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/shop">Add Items</Link>
                </Button>
              </div>
              <Separator />
              <div className="px-4 py-2 border-b bg-muted/50">
                <div className="grid grid-cols-[64px_1fr] gap-4">
                  <div />
                  <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground">
                    <div className="col-span-1">Product</div>
                    <div className="col-span-1">Case Details</div>
                    <div className="col-span-1 text-center">Total Items</div>
                    <div className="col-span-1 text-center">Total Cost</div>
                    <div className="col-span-1">Quantity</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {items.map((item) => (
                  <OrderItem
                    key={item.id}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={() => handleRemoveItem(item.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {items.length > 0 && (
        <CardFooter className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Subtotal</p>
            <p className="text-xl font-bold">${totalNextOrder.toFixed(2)}</p>
          </div>
          <Button onClick={handlePlaceOrder}>Place Order</Button>
        </CardFooter>
      )}
    </Card>
  )
}

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
import { useState, useEffect } from "react"
import {
  getCurrentOrder,
  testAddItemToOrder,
  updateOrderItemQuantity,
  placeCurrentOrder,
} from "./actions"
import { toast } from "@/hooks/use-toast"
import {
  PublicOrderItemResponseDTO,
  PublicOrderDTO,
  PlaceCurrentOrderRequestDTO,
} from "@/core/domain/DTOs/OrderDTOs"

interface NextOrderCardProps {
  nextOrderDate?: Date // Make this optional since we'll get it from the order
}

export function NextOrderCard({ nextOrderDate }: NextOrderCardProps) {
  const [items, setItems] = useState<PublicOrderItemResponseDTO[]>([])
  const [order, setOrder] = useState<PublicOrderDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingTestItem, setIsAddingTestItem] = useState(false)
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const fetchCurrentOrder = async () => {
    try {
      setIsLoading(true)
      const result = await getCurrentOrder()
      if (result.success && result.order) {
        setOrder(result.order)
        setItems(result.order.orderItems)
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
      const result = await updateOrderItemQuantity(id, newQuantity)

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

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const totalNextOrder = items.reduce(
    (sum, item) => sum + item.product.caseCost * item.quantity,
    0
  )

  const handleTestAddItem = async () => {
    try {
      setIsAddingTestItem(true)
      const result = await testAddItemToOrder()

      if (result.success) {
        toast({
          title: "Success",
          description: "Test item added successfully",
        })
        // Refresh the order data after adding an item
        await fetchCurrentOrder()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to add test item",
        })
      }
    } catch (err: unknown) {
      console.error("Failed to add test item:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add test item",
      })
    } finally {
      setIsAddingTestItem(false)
    }
  }

  const handleReviewClick = () => {
    setIsReviewMode(true)
  }

  const handleCancelReview = () => {
    setIsReviewMode(false)
    setSelectedItems(new Set())
  }

  const handleItemSelect = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleCompleteOrder = async () => {
    if (!order) return

    const selectedOrderItems = items
      .filter((item) => selectedItems.has(item.id))
      .map((item) => ({
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
      orderItems: selectedOrderItems,
    }

    try {
      const result = await placeCurrentOrder(request)
      if (result.success) {
        toast({
          title: "Success",
          description: "Order placed successfully",
        })
        // Redirect to order confirmation or orders list
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
            <Button
              variant="outline"
              onClick={handleTestAddItem}
              disabled={isAddingTestItem}
            >
              {isAddingTestItem ? "Adding..." : "Test Add Item"}
            </Button>
            <Button variant="outline">Modify Schedule</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
                <div
                  className={`grid ${
                    isReviewMode
                      ? "grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1.5fr_0.5fr]"
                      : "grid-cols-6"
                  } gap-4 text-sm font-medium text-muted-foreground`}
                >
                  <div className="col-span-1">Product</div>
                  <div className="col-span-1">Case Details</div>
                  <div className="col-span-1 text-center">Total Items</div>
                  <div className="col-span-1 text-center">Total Cost</div>
                  <div className="col-span-1">Quantity</div>
                  <div className="col-span-1 text-right">Actions</div>
                  {isReviewMode && (
                    <div className="col-span-1 text-center">Review</div>
                  )}
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
                  isReviewMode={isReviewMode}
                  isSelected={selectedItems.has(item.id)}
                  onSelect={() => handleItemSelect(item.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Subtotal</p>
          <p className="text-xl font-bold">${totalNextOrder.toFixed(2)}</p>
        </div>
        <div className="flex gap-2">
          {isReviewMode ? (
            <>
              <Button variant="outline" onClick={handleCancelReview}>
                Cancel
              </Button>
              <Button
                disabled={selectedItems.size === 0}
                onClick={handleCompleteOrder}
              >
                Complete Order
              </Button>
            </>
          ) : (
            <Button onClick={handleReviewClick}>Review Order</Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

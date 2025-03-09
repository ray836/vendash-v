import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

interface OrderItemProps {
  item: {
    id: number
    name: string
    quantity: number
    price: number
    image: string
  }
}

export function OrderItem({ item }: OrderItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20">
          <Image
            src={item.image || "/placeholder.svg"}
            alt={item.name}
            width={80}
            height={80}
            className="rounded-md object-cover"
            priority
            unoptimized={item.image.startsWith("http")}
          />
        </div>
        <div>
          <h4 className="font-medium">{item.name}</h4>
          <p className="text-sm text-muted-foreground">
            ${item.price.toFixed(2)} each
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center border rounded-md">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none">
            <Minus className="h-4 w-4" />
            <span className="sr-only">Decrease quantity</span>
          </Button>
          <span className="w-8 text-center">{item.quantity}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Increase quantity</span>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remove item</span>
        </Button>
      </div>
    </div>
  )
}

export default OrderItem

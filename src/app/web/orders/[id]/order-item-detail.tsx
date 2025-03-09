import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"

interface OrderItemDetailProps {
  item: {
    id: number
    name: string
    quantity: number
    price: number
    image: string
  }
}

export function OrderItemDetail({ item }: OrderItemDetailProps) {
  const subtotal = item.price * item.quantity

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-md">
          <Image
            src={item.image || "/placeholder.svg"}
            alt={item.name}
            fill
            className="object-cover"
            unoptimized={item.image.startsWith("http")}
          />
        </div>
        <div>
          <h4 className="font-medium">{item.name}</h4>
          <p className="text-sm text-muted-foreground">
            ${item.price.toFixed(2)} × {item.quantity}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-medium">${subtotal.toFixed(2)}</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/shop/product/${item.id}`}>Buy Again</Link>
        </Button>
      </div>
    </div>
  )
}

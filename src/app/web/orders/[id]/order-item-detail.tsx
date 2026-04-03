import Image from "next/image"

import Link from "next/link"

interface OrderItemDetailProps {
  item: {
    id: string
    productId: string
    name: string
    quantity: number
    unitPrice: number
    caseSize: number
    image: string
  }
}

export function OrderItemDetail({ item }: OrderItemDetailProps) {
  const subtotal = item.unitPrice * item.quantity

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              unoptimized={item.image.startsWith("http")}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>
        <div>
          <h4 className="font-medium hover:underline">
            <Link href={`/web/products/${item.productId}`}>{item.name}</Link>
          </h4>
          <p className="text-sm text-muted-foreground">
            ${item.unitPrice.toFixed(2)}/case × {item.quantity} {item.quantity === 1 ? "case" : "cases"} ({item.quantity * item.caseSize} units)
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium">${subtotal.toFixed(2)}</p>
      </div>
    </div>
  )
}

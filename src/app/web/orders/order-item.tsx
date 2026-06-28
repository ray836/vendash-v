import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PublicOrderItemResponseDTO } from "@/domains/Order/schemas/orderDTOs"

export interface OrderItemContext {
  reason: "out_of_stock" | "insufficient_stock" | "projected_low" | "pad_to_minimum" | null
  daysUntilStorageOut: number | null
  storageQty: number
  unitsShort: number
}

interface OrderItemProps {
  item: PublicOrderItemResponseDTO
  context?: OrderItemContext
  onQuantityChange?: (id: string, newQuantity: number) => void
  onRemove?: () => void
}

function ReasonTag({ context }: { context: OrderItemContext }) {
  const { reason, daysUntilStorageOut, unitsShort } = context

  if (reason === "out_of_stock") {
    return <span className="text-xs font-medium text-red-500">No storage remaining</span>
  }
  if (reason === "insufficient_stock") {
    return <span className="text-xs font-medium text-orange-500">Machine short {unitsShort} unit{unitsShort !== 1 ? "s" : ""}</span>
  }
  if (reason === "projected_low" && daysUntilStorageOut !== null) {
    const color = daysUntilStorageOut <= 7 ? "text-red-500" : "text-yellow-500"
    return <span className={`text-xs font-medium ${color}`}>~{daysUntilStorageOut} days of storage left</span>
  }
  if (reason === "pad_to_minimum" && daysUntilStorageOut !== null) {
    return <span className="text-xs text-muted-foreground">~{daysUntilStorageOut} days left · added for $50 min</span>
  }
  return null
}

export function OrderItem({
  item,
  context,
  onQuantityChange,
  onRemove,
}: OrderItemProps) {
  const totalItems = item.quantity * item.product.caseSize
  const totalCost = item.quantity * item.product.caseCost

  return (
    <div className="flex items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.product.image}
        alt={item.product.name}
        className="h-16 w-16 rounded-md object-cover"
      />

      <div className="flex-1 grid grid-cols-6 gap-4 items-center">
        {/* Product Name */}
        <div className="col-span-1">
          <h4 className="font-medium">{item.product.name}</h4>
          <p className="text-sm text-muted-foreground">
            ${item.product.recommendedPrice.toFixed(2)} per item
          </p>
          {context && <ReasonTag context={context} />}
        </div>

        {/* Case Info */}
        <div className="col-span-1 text-sm">
          <p>${item.product.caseCost.toFixed(2)} per case</p>
          <p>{item.product.caseSize} items per case</p>
        </div>

        {/* Total Items */}
        <div className="col-span-1 text-center">
          <p className="font-medium">{totalItems}</p>
          <p className="text-sm text-muted-foreground">Total Items</p>
        </div>

        {/* Total Cost */}
        <div className="col-span-1 text-center">
          <p className="font-medium">${totalCost.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Total Cost</p>
        </div>

        {/* Quantity Controls */}
        <div className="col-span-1 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              onQuantityChange?.(item.id, Math.max(0, item.quantity - 1))
            }
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onQuantityChange?.(item.id, item.quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="col-span-1 flex justify-end gap-2">
          <Button variant="outline" size="sm">
            View Product
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default OrderItem

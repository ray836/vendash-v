"use client"

// First, add the Slot interface
interface Slot {
  id: string
  row: number
  column: number
  productId: string | null
  capacity: number
  price: number | null
}

function SlotGrid({
  slots,
  onSlotClick,
  activeSlot,
  machineType,
}: {
  slots: Slot[]
  onSlotClick: (slot: Slot) => void
  activeSlot: Slot | null
  machineType: "snack" | "drink"
}) {
  return (
    <div
      className={`grid gap-2`}
      style={{
        gridTemplateColumns: `repeat(${
          machineType === "drink" ? 5 : 4
        }, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${
          machineType === "drink" ? 2 : 6
        }, minmax(0, 1fr))`,
      }}
    >
      {slots.map((slot) => {
        const isActive = activeSlot?.id === slot.id
        const hasProduct = slot.productId !== null

        return (
          <div
            key={slot.id}
            className={`
              aspect-square border rounded-md cursor-pointer
              ${
                hasProduct
                  ? "bg-primary/10 border-primary/30"
                  : "bg-muted/20 hover:bg-muted/30"
              }
              ${isActive ? "ring-2 ring-primary" : ""}
            `}
            onClick={() => onSlotClick(slot)}
          >
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              {slot.row + 1}-{slot.column + 1}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { SlotGrid }

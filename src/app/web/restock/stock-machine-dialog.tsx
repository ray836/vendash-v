"use client"

import { useState, useMemo } from "react"
import { CheckCircle2, Circle, Loader2, MapPin, PackageCheck, AlertTriangle, ShoppingCart, ArrowLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { stockPreKit, stockPreKitPartial, orderShortItems } from "../prekits/actions"
import { toast } from "@/hooks/use-toast"

interface RestockItem {
  productId: string
  productName: string
  productImage: string
  quantity: number
  slotCode: string
  inStock: number
}

interface StockMachineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  machineId: string
  locationName: string | null
  preKit: { id: string; items: RestockItem[] }
  initialPickedIds?: Set<string>
  onStocked: () => void
}

type DialogState = "checklist" | "confirm_partial"

export function StockMachineDialog({
  open,
  onOpenChange,
  machineId,
  locationName,
  preKit,
  initialPickedIds,
  onStocked,
}: StockMachineDialogProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [dialogState, setDialogState] = useState<DialogState>("checklist")
  const [partialNote, setPartialNote] = useState("")
  const [isMarking, setIsMarking] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)
  const [shortItemsOrdered, setShortItemsOrdered] = useState(false)

  const products = useMemo(() => {
    const map = new Map<string, {
      productId: string
      productName: string
      productImage: string
      totalQuantity: number
      inStock: number
      slots: string[]
    }>()
    for (const item of preKit.items) {
      // When coming from a pick session, only show what was picked
      if (initialPickedIds && initialPickedIds.size > 0 && !initialPickedIds.has(item.productId)) continue
      const existing = map.get(item.productId)
      if (existing) {
        existing.totalQuantity += item.quantity
        existing.slots.push(item.slotCode)
      } else {
        map.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          totalQuantity: item.quantity,
          inStock: item.inStock,
          slots: [item.slotCode],
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.productName.localeCompare(b.productName))
  }, [preKit.items, initialPickedIds])

  const checkedCount = products.filter((p) => checked[p.productId]).length
  const allChecked = checkedCount === products.length
  const progressPct = products.length > 0 ? (checkedCount / products.length) * 100 : 0
  const shortProducts = products.filter((p) => p.inStock < p.totalQuantity)

  const toggle = (productId: string) =>
    setChecked((prev) => ({ ...prev, [productId]: !prev[productId] }))

  const selectAll = () => {
    const allIds = Object.fromEntries(products.map((p) => [p.productId, true]))
    setChecked(allIds)
  }

  const handleClose = (v: boolean) => {
    if (!v) {
      setChecked({})
      setDialogState("checklist")
      setPartialNote("")
      setShortItemsOrdered(false)
    }
    onOpenChange(v)
  }

  const handleMarkStocked = async () => {
    setIsMarking(true)
    // If the dialog is showing a filtered subset (from a pick session), only
    // stock the visible products so unvisited slots don't get incorrectly updated.
    const allPreKitProductCount = new Set(preKit.items.map(i => i.productId)).size
    const isFilteredView = products.length < allPreKitProductCount
    const result = isFilteredView
      ? await stockPreKitPartial(preKit.id, products.map(p => p.productId), "")
      : await stockPreKit(preKit.id)
    setIsMarking(false)
    if (result.success) {
      toast({ title: `${machineId} marked as stocked` })
      handleClose(false)
      onStocked()
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error ?? "Failed to mark as stocked" })
    }
  }

  const handleMarkPartial = async () => {
    const stockedProductIds = products
      .filter((p) => checked[p.productId])
      .map((p) => p.productId)
    setIsMarking(true)
    const result = await stockPreKitPartial(preKit.id, stockedProductIds, partialNote)
    setIsMarking(false)
    if (result.success) {
      toast({ title: `${machineId} marked as stocked (${stockedProductIds.length}/${products.length} items)` })
      handleClose(false)
      onStocked()
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error ?? "Failed to mark as stocked" })
    }
  }

  const handleOrderShort = async () => {
    setIsOrdering(true)
    const result = await orderShortItems(preKit.id)
    setIsOrdering(false)
    if (result.success) setShortItemsOrdered(true)
  }

  const unstockedCount = products.length - checkedCount

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[92vw] flex flex-col max-h-[92vh] p-0 gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-xl">{machineId}</DialogTitle>
            {locationName && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5" />
                {locationName}
              </p>
            )}
          </DialogHeader>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {checkedCount} of {products.length} products stocked
              </span>
              <button
                onClick={allChecked ? () => setChecked({}) : selectAll}
                className="text-xs text-primary hover:underline font-medium"
              >
                {allChecked ? "Deselect all" : "Select all"}
              </button>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>

          {/* Low stock banner */}
          {shortProducts.length > 0 && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-amber-800/40 bg-amber-950/40 px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-400 font-medium">
                  {shortProducts.length} item{shortProducts.length !== 1 ? "s" : ""} don&apos;t have enough in storage
                </p>
              </div>
              {shortItemsOrdered ? (
                <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0" asChild>
                  <a href="/web/orders">Go to Order →</a>
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-7 text-xs flex-shrink-0 gap-1.5"
                  disabled={isOrdering}
                  onClick={handleOrderShort}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {isOrdering ? "Adding…" : "Add to Order"}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Checklist */}
        <div className="overflow-y-auto flex-1">
          <div className="divide-y">
            {products.map((product) => {
              const isDone = !!checked[product.productId]
              const lowStock = product.inStock < product.totalQuantity
              return (
                <button
                  key={product.productId}
                  onClick={() => toggle(product.productId)}
                  className={`w-full flex items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/40 active:bg-muted/60 ${
                    isDone ? "bg-green-500/5" : ""
                  }`}
                >
                  <div className="flex-shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="h-7 w-7 text-green-500" />
                    ) : (
                      <Circle className="h-7 w-7 text-muted-foreground/40" />
                    )}
                  </div>
                  {product.productImage ? (
                    <img
                      src={product.productImage}
                      alt={product.productName}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-muted"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-base leading-snug ${isDone ? "line-through text-muted-foreground" : ""}`}>
                      {product.productName}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Slots: {product.slots.join(", ")}
                    </p>
                    {lowStock && !isDone && (
                      <p className="text-xs text-amber-500 mt-0.5">
                        Only {product.inStock} in storage — need {product.totalQuantity}
                      </p>
                    )}
                  </div>
                  <div className={`text-right flex-shrink-0 ${isDone ? "text-muted-foreground" : ""}`}>
                    <span className="text-xl font-bold">{product.totalQuantity}</span>
                    <p className="text-xs text-muted-foreground">units</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t">
          {dialogState === "confirm_partial" ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                {unstockedCount} item{unstockedCount !== 1 ? "s" : ""} weren&apos;t stocked — why? <span className="text-muted-foreground font-normal">(optional)</span>
              </p>
              <textarea
                value={partialNote}
                onChange={(e) => setPartialNote(e.target.value)}
                placeholder="e.g. Machine was full in those slots, item was damaged, ran out of stock…"
                className="w-full text-sm rounded-md border bg-transparent px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                rows={2}
                autoFocus
              />
              <div className="flex justify-between gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setDialogState("checklist")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleMarkPartial} disabled={isMarking} className="gap-2">
                  {isMarking ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                  ) : (
                    <><PackageCheck className="h-4 w-4" />Confirm ({checkedCount}/{products.length} stocked)</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {allChecked
                  ? "All products stocked — ready to mark complete"
                  : checkedCount === 0
                  ? "Tap items above to mark them as stocked"
                  : `${unstockedCount} item${unstockedCount !== 1 ? "s" : ""} remaining`}
              </p>
              <div className="flex gap-2 flex-shrink-0">
                {checkedCount > 0 && !allChecked && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setDialogState("confirm_partial")}
                  >
                    Mark Partial
                  </Button>
                )}
                <Button
                  onClick={handleMarkStocked}
                  disabled={!allChecked || isMarking}
                  className="gap-2"
                  variant={allChecked ? "default" : "outline"}
                >
                  {isMarking ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Marking…</>
                  ) : (
                    <><PackageCheck className="h-4 w-4" />Mark as Stocked</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

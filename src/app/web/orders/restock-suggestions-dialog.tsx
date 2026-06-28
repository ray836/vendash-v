"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Loader2, PackageCheck, Copy, Check, AlertTriangle, TrendingDown, Package } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { getInventoryOrderSuggestions, addMultipleProductsToOrder } from "./actions"

type Suggestion = {
  productId: string
  productName: string
  productImage: string
  caseCost: number
  caseSize: number
  totalSlotDeficit: number
  unitsToOrder: number
  machineCount: number
  storageQty: number
  machinesQty: number
  avgWeeklySales: number
  daysUntilStorageOut: number | null
  reason: "out_of_stock" | "insufficient_stock" | "projected_low"
  recommendedCases: number
  casesAlreadyInOrder: number
}

const reasonConfig = {
  out_of_stock: {
    label: "Out of stock",
    icon: AlertTriangle,
    badgeClass: "border-red-800/40 bg-red-950/30 text-red-400",
    iconClass: "text-red-400",
  },
  insufficient_stock: {
    label: "Not enough stock",
    icon: Package,
    badgeClass: "border-amber-800/40 bg-amber-950/30 text-amber-400",
    iconClass: "text-amber-400",
  },
  projected_low: {
    label: "Running low",
    icon: TrendingDown,
    badgeClass: "border-orange-800/40 bg-orange-950/30 text-orange-400",
    iconClass: "text-orange-400",
  },
}

function reasonDetail(s: Suggestion): string {
  if (s.reason === "out_of_stock") {
    return `Needs ${s.totalSlotDeficit} units across ${s.machineCount} machine${s.machineCount !== 1 ? "s" : ""} — none in storage`
  }
  if (s.reason === "insufficient_stock") {
    return `${s.storageQty} in storage, need ${s.totalSlotDeficit} to fill machine${s.machineCount !== 1 ? "s" : ""} — short ${s.unitsToOrder}`
  }
  if (s.daysUntilStorageOut !== null && s.avgWeeklySales > 0) {
    return `~${s.daysUntilStorageOut} days of stock left at current pace (~${s.avgWeeklySales.toFixed(1)}/week)`
  }
  return "Running low based on sales velocity"
}

interface RestockSuggestionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function RestockSuggestionsDialog({
  open,
  onOpenChange,
  onSuccess,
}: RestockSuggestionsDialogProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [caseQty, setCaseQty] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    getInventoryOrderSuggestions().then((result) => {
      if (result.success) {
        setSuggestions(result.suggestions)
        const initialSelected: Record<string, boolean> = {}
        const initialQty: Record<string, number> = {}
        for (const s of result.suggestions) {
          initialSelected[s.productId] = true
          initialQty[s.productId] = s.recommendedCases
        }
        setSelected(initialSelected)
        setCaseQty(initialQty)
      }
      setIsLoading(false)
    })
  }, [open])

  const selectedItems = suggestions.filter((s) => selected[s.productId])
  const totalCost = selectedItems.reduce(
    (sum, s) => sum + s.caseCost * (caseQty[s.productId] ?? s.recommendedCases),
    0
  )

  const handleCopyList = () => {
    const lines = selectedItems.map((s) => {
      const qty = caseQty[s.productId] ?? s.recommendedCases
      return `${s.productName} ×${qty} case${qty !== 1 ? "s" : ""} — $${(s.caseCost * qty).toFixed(2)}`
    })
    lines.push(`\nTotal: $${totalCost.toFixed(2)}`)
    navigator.clipboard.writeText(lines.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAdd = async () => {
    if (selectedItems.length === 0) return
    setIsAdding(true)
    const items = selectedItems.map((s) => ({
      productId: s.productId,
      quantity: caseQty[s.productId] ?? s.recommendedCases,
    }))
    const result = await addMultipleProductsToOrder(items)
    setIsAdding(false)
    if (result.success) {
      toast({ title: `${items.length} item${items.length !== 1 ? "s" : ""} added to order` })
      onOpenChange(false)
      onSuccess()
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error ?? "Failed to add items" })
    }
  }

  const outOfStockCount = suggestions.filter((s) => s.reason === "out_of_stock").length
  const insufficientCount = suggestions.filter((s) => s.reason === "insufficient_stock").length
  const projectedCount = suggestions.filter((s) => s.reason === "projected_low").length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>What to Order</DialogTitle>
          {!isLoading && suggestions.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap mt-1">
              {outOfStockCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {outOfStockCount} out of stock
                </span>
              )}
              {insufficientCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {insufficientCount} not enough stock
                </span>
              )}
              {projectedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-orange-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  {projectedCount} running low this week
                </span>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="overflow-y-auto flex-1 -mx-1 px-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <PackageCheck className="h-10 w-10 text-green-500 mb-3" />
              <p className="font-medium">Everything looks good</p>
              <p className="text-sm text-muted-foreground mt-1">
                All products in your machines have enough stock for the week.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              <div className="grid grid-cols-[24px_56px_1fr_auto_auto] items-center gap-3 px-1 py-2 text-xs font-medium text-muted-foreground">
                <div />
                <div />
                <div>Product</div>
                <div className="text-right w-20">Cases</div>
                <div className="text-right w-16">Cost</div>
              </div>

              {suggestions.map((s) => {
                const qty = caseQty[s.productId] ?? s.recommendedCases
                const isChecked = !!selected[s.productId]
                const cfg = reasonConfig[s.reason]
                const Icon = cfg.icon
                return (
                  <div
                    key={s.productId}
                    className={`grid grid-cols-[24px_56px_1fr_auto_auto] items-center gap-3 px-1 py-3 transition-opacity ${
                      !isChecked ? "opacity-50" : ""
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(v) =>
                        setSelected((prev) => ({ ...prev, [s.productId]: !!v }))
                      }
                    />
                    {s.productImage ? (
                      <img
                        src={s.productImage}
                        alt={s.productName}
                        className="w-14 h-14 rounded-md object-cover bg-muted"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-md bg-muted" />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm truncate">{s.productName}</span>
                        <Badge variant="outline" className={`text-xs gap-1 ${cfg.badgeClass}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{reasonDetail(s)}</p>
                      {s.casesAlreadyInOrder > 0 && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {s.casesAlreadyInOrder} case{s.casesAlreadyInOrder !== 1 ? "s" : ""} already in order — showing remaining needed
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                          s.storageQty === 0
                            ? "border-red-800/40 bg-red-950/30 text-red-400"
                            : s.storageQty < s.totalSlotDeficit
                            ? "border-amber-800/40 bg-amber-950/30 text-amber-400"
                            : "text-muted-foreground"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            s.storageQty === 0 ? "bg-red-500" : s.storageQty < s.totalSlotDeficit ? "bg-amber-500" : "bg-blue-400"
                          }`} />
                          {s.storageQty} in storage
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                          {s.machinesQty} in machines
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 w-20 justify-end">
                      <button
                        className="w-6 h-6 rounded border text-sm flex items-center justify-center hover:bg-muted disabled:opacity-30"
                        onClick={() => setCaseQty((prev) => ({ ...prev, [s.productId]: Math.max(1, qty - 1) }))}
                        disabled={qty <= 1}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{qty}</span>
                      <button
                        className="w-6 h-6 rounded border text-sm flex items-center justify-center hover:bg-muted"
                        onClick={() => setCaseQty((prev) => ({ ...prev, [s.productId]: qty + 1 }))}
                      >
                        +
                      </button>
                    </div>
                    <div className="w-16 text-right text-sm font-medium">
                      ${(s.caseCost * qty).toFixed(2)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {suggestions.length > 0 && (
          <>
            <Separator />
            <DialogFooter className="flex items-center justify-between sm:justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {selectedItems.length} of {suggestions.length} selected
                </p>
                <p className="text-lg font-bold">${totalCost.toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyList}
                  disabled={selectedItems.length === 0}
                >
                  {copied ? (
                    <><Check className="h-4 w-4 mr-2 text-green-500" />Copied!</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-2" />Copy List</>
                  )}
                </Button>
                <Button onClick={handleAdd} disabled={isAdding || selectedItems.length === 0}>
                  {isAdding ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</>
                  ) : (
                    <><ShoppingCart className="h-4 w-4 mr-2" />Add {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} to Order</>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

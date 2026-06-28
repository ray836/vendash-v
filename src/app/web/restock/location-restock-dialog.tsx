"use client"

import { useState, useMemo } from "react"
import { AlertTriangle, PackageCheck, CheckCircle2, Circle, ArrowRight, ArrowLeft, Loader2, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StockMachineDialog } from "./stock-machine-dialog"
import { deletePreKit } from "../prekits/actions"
import { toast } from "@/hooks/use-toast"

interface RestockItem {
  productId: string
  productName: string
  productImage: string
  quantity: number
  slotCode: string
  inStock: number
}

interface MachinePrekitData {
  machineId: string
  preKit: { id: string; items: RestockItem[]; status?: string }
}

interface LocationRestockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locationName: string
  machines: MachinePrekitData[]
  onDeleted?: () => void
  onStocked?: () => void
}

type ViewMode = "product" | "machine"

export function LocationRestockDialog({
  open,
  onOpenChange,
  locationName,
  machines,
  onDeleted,
  onStocked,
}: LocationRestockDialogProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("product")
  const [stockMachine, setStockMachine] = useState<MachinePrekitData | null>(null)
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const byProduct = useMemo(() => {
    const map = new Map<
      string,
      {
        productId: string
        productName: string
        productImage: string
        totalQuantity: number
        inStock: number
        perMachine: { machineId: string; quantity: number }[]
      }
    >()

    for (const m of machines) {
      for (const item of m.preKit.items) {
        const existing = map.get(item.productId)
        if (existing) {
          existing.totalQuantity += item.quantity
          const machineEntry = existing.perMachine.find((p) => p.machineId === m.machineId)
          if (machineEntry) {
            machineEntry.quantity += item.quantity
          } else {
            existing.perMachine.push({ machineId: m.machineId, quantity: item.quantity })
          }
        } else {
          map.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            totalQuantity: item.quantity,
            inStock: item.inStock,
            perMachine: [{ machineId: m.machineId, quantity: item.quantity }],
          })
        }
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.productName.localeCompare(b.productName)
    )
  }, [machines])

  const totalUnits = byProduct.reduce((s, p) => s + p.totalQuantity, 0)
  const pickedCount = pickedIds.size
  const allPicked = pickedCount === byProduct.length && byProduct.length > 0
  const progressPct = byProduct.length > 0 ? (pickedCount / byProduct.length) * 100 : 0

  const toggle = (productId: string) => {
    setPickedIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const handleFillMachines = () => {
    if (machines.length === 1) {
      setStockMachine(machines[0])
      setStockDialogOpen(true)
    } else {
      setViewMode("machine")
    }
  }

  const handleDeleteAll = async () => {
    setIsDeleting(true)
    await Promise.all(machines.map(m => deletePreKit(m.preKit.id)))
    setIsDeleting(false)
    toast({ title: machines.length === 1 ? "List deleted" : `${machines.length} lists deleted` })
    onDeleted?.()
    handleClose(false)
  }

  const handleClose = (v: boolean) => {
    if (!v) {
      setPickedIds(new Set())
      setViewMode("product")
      setShowDeleteConfirm(false)
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl flex flex-col max-h-[85vh] p-0 gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle>{locationName}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {byProduct.length} product{byProduct.length !== 1 ? "s" : ""} · {totalUnits} total unit{totalUnits !== 1 ? "s" : ""}
            </p>
          </DialogHeader>

          {/* Pick progress */}
          {viewMode === "product" && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {pickedCount} of {byProduct.length} products picked
                </span>
                {allPicked && (
                  <span className="text-green-500 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Ready to fill
                  </span>
                )}
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {viewMode === "product" ? (
            <div className="divide-y">
              {byProduct.map((product) => {
                const isPicked = pickedIds.has(product.productId)
                const lowStock = product.inStock < product.totalQuantity
                return (
                  <button
                    key={product.productId}
                    onClick={() => toggle(product.productId)}
                    className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-muted/30 active:bg-muted/50 ${
                      isPicked ? "bg-green-500/5" : ""
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isPicked ? (
                        <CheckCircle2 className="h-7 w-7 text-green-500" />
                      ) : (
                        <Circle className="h-7 w-7 text-muted-foreground/30" />
                      )}
                    </div>
                    {product.productImage ? (
                      <img
                        src={product.productImage}
                        alt={product.productName}
                        className="w-12 h-12 rounded-md object-cover flex-shrink-0 bg-muted"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-muted flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm leading-snug ${isPicked ? "line-through text-muted-foreground" : ""}`}>
                        {product.productName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {product.perMachine.map((m) => `${m.machineId} ×${m.quantity}`).join("  ·  ")}
                      </p>
                      {lowStock && !isPicked && (
                        <p className="text-xs text-amber-500 mt-0.5">
                          Only {product.inStock} in storage — need {product.totalQuantity}
                        </p>
                      )}
                    </div>
                    <div className={`text-right flex-shrink-0 ${isPicked ? "text-muted-foreground" : ""}`}>
                      <span className="text-xl font-bold">{product.totalQuantity}</span>
                      <p className="text-xs text-muted-foreground">units</p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-5 px-6 pt-4 pb-2">
              {machines.map((m) => {
                const productMap = new Map<string, {
                  productId: string
                  productName: string
                  productImage: string
                  totalQuantity: number
                  inStock: number
                  slots: string[]
                }>()
                for (const item of m.preKit.items) {
                  if (pickedIds.size > 0 && !pickedIds.has(item.productId)) continue
                  const existing = productMap.get(item.productId)
                  if (existing) {
                    existing.totalQuantity += item.quantity
                    existing.slots.push(item.slotCode)
                  } else {
                    productMap.set(item.productId, {
                      productId: item.productId,
                      productName: item.productName,
                      productImage: item.productImage,
                      totalQuantity: item.quantity,
                      inStock: item.inStock,
                      slots: [item.slotCode],
                    })
                  }
                }
                const products = Array.from(productMap.values()).sort((a, b) =>
                  a.productName.localeCompare(b.productName)
                )

                return (
                  <div key={m.machineId}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {m.machineId}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => { setStockMachine(m); setStockDialogOpen(true) }}
                      >
                        <PackageCheck className="h-3.5 w-3.5" />
                        Stock Machine
                      </Button>
                    </div>
                    <div className="divide-y rounded-md border">
                      {products.map((product) => {
                        const lowStock = product.inStock < product.totalQuantity
                        return (
                          <div key={product.productId} className="flex items-center gap-3 px-3 py-2.5">
                            {product.productImage ? (
                              <img
                                src={product.productImage}
                                alt={product.productName}
                                className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-muted"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-muted flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{product.productName}</span>
                                {lowStock && (
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Slots: {product.slots.join(", ")}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="font-semibold text-sm">{product.totalQuantity}</span>
                              <p className="text-xs text-muted-foreground">need {product.totalQuantity} · have {product.inStock}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4">
          {showDeleteConfirm ? (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-destructive font-medium">
                Delete {machines.length === 1 ? "this list" : `all ${machines.length} lists`}? Can&apos;t be undone.
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDeleteAll} disabled={isDeleting}>
                  {isDeleting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Deleting…</> : "Delete"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              {viewMode === "machine" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 -ml-2 flex-shrink-0"
                  onClick={() => setViewMode("product")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to list
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive gap-1.5 -ml-2 flex-shrink-0"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete List
                </Button>
              )}

              {viewMode === "product" ? (
                <Button onClick={handleFillMachines} className="gap-2">
                  {machines.length === 1 ? "Fill Machine" : "Fill Machines"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground text-right">
                  Tap &quot;Stock Machine&quot; to fill each machine.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>

      {stockMachine && (
        <StockMachineDialog
          open={stockDialogOpen}
          onOpenChange={setStockDialogOpen}
          machineId={stockMachine.machineId}
          locationName={locationName}
          preKit={stockMachine.preKit}
          initialPickedIds={pickedIds}
          onStocked={() => {
            setStockDialogOpen(false)
            handleClose(false)
            onStocked?.()
          }}
        />
      )}
    </Dialog>
  )
}

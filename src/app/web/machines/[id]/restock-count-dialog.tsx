"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ClipboardCheck, Loader2 } from "lucide-react"
import { getRestockSlots, recordRestockCounts, type RestockSlotInfo } from "./actions"
import { toast } from "@/hooks/use-toast"

interface RestockCountDialogProps {
  machineId: string
  onSuccess?: () => void
}

type Row = { leftNow: string; refillTo: string }

export function RestockCountDialog({ machineId, onSuccess }: RestockCountDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [slots, setSlots] = useState<RestockSlotInfo[]>([])
  const [hasTelemetry, setHasTelemetry] = useState(false)
  const [rows, setRows] = useState<Record<string, Row>>({})

  useEffect(() => {
    if (!isOpen) return
    setIsLoading(true)
    getRestockSlots(machineId)
      .then((res) => {
        if (res.success) {
          setSlots(res.slots)
          setHasTelemetry(res.hasTelemetry)
          // Telemetry: single "Count" field (we mirror it into both leftNow/refillTo on
          // save, so no sales are inferred and the slot is just set to the count).
          // Manual: "Left now" defaults to the known count (safe default = nothing sold),
          // "Refill to" defaults to capacity.
          const initial: Record<string, Row> = {}
          for (const s of res.slots) {
            initial[s.slotId] = res.hasTelemetry
              ? { leftNow: String(s.currentQuantity), refillTo: String(s.currentQuantity) }
              : { leftNow: String(s.currentQuantity), refillTo: String(Math.max(s.capacity, s.currentQuantity)) }
          }
          setRows(initial)
        } else {
          toast({ variant: "destructive", title: "Error", description: res.error || "Failed to load slots" })
        }
      })
      .finally(() => setIsLoading(false))
  }, [isOpen, machineId])

  const setRow = (slotId: string, patch: Partial<Row>) =>
    setRows((prev) => ({ ...prev, [slotId]: { ...prev[slotId], ...patch } }))

  const parseQty = (v: string) => (v === "" ? 0 : Math.max(0, parseInt(v, 10) || 0))

  const handleSave = async () => {
    const entries = slots.map((s) => {
      const fallback = String(s.currentQuantity)
      const row = rows[s.slotId] ?? { leftNow: fallback, refillTo: fallback }
      if (hasTelemetry) {
        // Single count field lives in refillTo; mirror to leftNow so no sales are inferred.
        const count = parseQty(row.refillTo)
        return { slotId: s.slotId, leftNow: count, refillTo: count }
      }
      return { slotId: s.slotId, leftNow: parseQty(row.leftNow), refillTo: parseQty(row.refillTo) }
    })

    setIsSaving(true)
    try {
      const res = await recordRestockCounts(machineId, entries)
      if (res.success) {
        toast({
          title: "Restock recorded",
          description: res.telemetrySkipped
            ? `Inventory counts updated.`
            : `${res.totalSold} unit${res.totalSold !== 1 ? "s" : ""} sold recorded over ${res.daysSpread} day${res.daysSpread !== 1 ? "s" : ""}; refilled ${res.refilledSlots} slot${res.refilledSlots !== 1 ? "s" : ""}.`,
        })
        setIsOpen(false)
        onSuccess?.()
      } else {
        toast({ variant: "destructive", title: "Error", description: res.error || "Failed to record restock" })
      }
    } catch (error) {
      console.error("recordRestockCounts:", error)
      toast({ variant: "destructive", title: "Error", description: "Failed to record restock" })
    } finally {
      setIsSaving(false)
    }
  }

  // Layout differs by mode: telemetry shows one "Count" column, manual shows two.
  const gridCols = hasTelemetry ? "grid-cols-[1fr_96px]" : "grid-cols-[1fr_88px_88px]"

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Restock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] p-0 overflow-hidden">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle>{hasTelemetry ? "Update counts" : "Restock & count"}</DialogTitle>
            <DialogDescription>
              {hasTelemetry
                ? "This machine reports sales automatically. Enter the current count in each slot to correct inventory if it has drifted."
                : "Enter how many units are left in each slot, then what you refilled it to. We'll work out what sold since your last visit and keep your sales data up to date."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : slots.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              No products are assigned to this machine&apos;s slots yet.
            </div>
          ) : (
            <ScrollArea className="h-[420px] w-full pr-3">
              <div className="space-y-2">
                <div className={`grid ${gridCols} gap-3 px-1 pb-1 text-xs font-medium text-muted-foreground`}>
                  <span>Product</span>
                  {hasTelemetry ? (
                    <span className="text-center">Count</span>
                  ) : (
                    <>
                      <span className="text-center">Left now</span>
                      <span className="text-center">Refill to</span>
                    </>
                  )}
                </div>
                {slots.map((s) => {
                  const row = rows[s.slotId] ?? { leftNow: String(s.currentQuantity), refillTo: String(s.currentQuantity) }
                  const maxQty = Math.max(s.capacity, s.currentQuantity)
                  return (
                    <div key={s.slotId} className={`grid ${gridCols} gap-3 items-center border rounded-lg p-3`}>
                      <div className="min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{s.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          Slot {s.labelCode} · was {s.currentQuantity}/{s.capacity}
                        </p>
                      </div>
                      {hasTelemetry ? (
                        <div>
                          <Label htmlFor={`count-${s.slotId}`} className="sr-only">Count</Label>
                          <Input
                            id={`count-${s.slotId}`}
                            type="number"
                            min={0}
                            max={maxQty}
                            inputMode="numeric"
                            value={row.refillTo}
                            onChange={(e) => setRow(s.slotId, { refillTo: e.target.value })}
                            className="text-center"
                          />
                        </div>
                      ) : (
                        <>
                          <div>
                            <Label htmlFor={`left-${s.slotId}`} className="sr-only">Left now</Label>
                            <Input
                              id={`left-${s.slotId}`}
                              type="number"
                              min={0}
                              max={maxQty}
                              inputMode="numeric"
                              placeholder="0"
                              value={row.leftNow}
                              onChange={(e) => setRow(s.slotId, { leftNow: e.target.value })}
                              className="text-center"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`refill-${s.slotId}`} className="sr-only">Refill to</Label>
                            <Input
                              id={`refill-${s.slotId}`}
                              type="number"
                              min={0}
                              max={maxQty}
                              inputMode="numeric"
                              value={row.refillTo}
                              onChange={(e) => setRow(s.slotId, { refillTo: e.target.value })}
                              className="text-center"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading || slots.length === 0}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {hasTelemetry ? "Save counts" : "Save restock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { Package, Calendar, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { pickPreKit, stockPreKit } from "./actions"

interface PreKitItem {
  id: string
  preKitId: string
  productId: string
  quantity: number
  slotId: string
  productImage: string
  productName: string
  currentQuantity: number
  capacity: number
  slotCode: string
}

interface PreKit {
  id: string
  machineId: string
  status: "OPEN" | "PICKED" | "STOCKED"
  createdAt: Date
  items: PreKitItem[]
}

interface PreKitDetailsDialogProps {
  preKit: PreKit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPreKitPicked?: () => void
  onPreKitStocked?: () => void
}

export function PreKitDetailsDialog({
  preKit,
  open,
  onOpenChange,
  onPreKitPicked,
  onPreKitStocked,
}: PreKitDetailsDialogProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [isPicking, setIsPicking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset checked state when dialog opens or preKit changes
  useEffect(() => {
    if (preKit && preKit.status !== "STOCKED") {
      const initial: Record<string, boolean> = {}
      preKit.items.forEach((item) => {
        initial[item.id] = false
      })
      setCheckedItems(initial)
    }
  }, [preKit, open])

  if (!preKit) return null

  const isViewOnly = preKit.status === "STOCKED"

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-500"
      case "PICKED":
        return "bg-yellow-500"
      case "STOCKED":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  // Compute allChecked at the top of your component
  const allChecked =
    !isViewOnly &&
    preKit &&
    preKit.items.length > 0 &&
    preKit.items.every((item) => checkedItems[item.id])

  const handleAction = async () => {
    if (!preKit || !allChecked || isViewOnly) return

    try {
      setIsPicking(true)
      setError(null)

      if (preKit.status === "PICKED") {
        const result = await stockPreKit(preKit.id)
        if (result.success) {
          onPreKitStocked?.()
          onOpenChange(false)
        } else {
          setError(result.error || "Failed to mark pre-kit as filled")
        }
      } else {
        const result = await pickPreKit(preKit.id)
        if (result.success) {
          onPreKitPicked?.()
          onOpenChange(false)
        } else {
          setError(result.error || "Failed to mark pre-kit as picked")
        }
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsPicking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[90vh] max-w-4xl w-full md:w-[600px] lg:w-[900px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-6 w-6" />
            <span>Pre-kit Details</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Pre-kit {preKit.id}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <span>Machine {preKit.machineId}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(preKit.createdAt)}</span>
              </div>
              <Badge
                className={`${getStatusColor(
                  preKit.status
                )} text-white capitalize text-sm px-3 py-1`}
              >
                {preKit.status.toLowerCase()}
              </Badge>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-base font-medium mb-3">
              Items ({preKit.items.length})
            </h3>
            <ScrollArea className="h-[600px] rounded-md border p-4">
              <div className="space-y-3">
                {/* Mobile layout (block/cards) */}
                <div className="block md:hidden space-y-3">
                  {preKit.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-transparent shadow-sm"
                    >
                      <div className="flex-shrink-0">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted flex items-center justify-center rounded">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate">
                          {item.productName.length > 30
                            ? item.productName.slice(0, 30) + "..."
                            : item.productName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 md:hidden">
                          Qty:{" "}
                          <span className="font-semibold">{item.quantity}</span>
                        </div>
                      </div>
                      {!isViewOnly && (
                        <Checkbox
                          className="w-8 h-8 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary shadow-sm"
                          checked={checkedItems[item.id] || false}
                          onCheckedChange={(checked) =>
                            setCheckedItems((ci) => ({
                              ...ci,
                              [item.id]: !!checked,
                            }))
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop layout (table) */}
                <div className="hidden md:block w-full overflow-x-auto">
                  <table className="w-full table-fixed text-sm">
                    <colgroup>
                      <col style={{ width: "80px" }} />
                      <col style={{ width: isViewOnly ? "80%" : "60%" }} />
                      <col style={{ width: isViewOnly ? "20%" : "20%" }} />
                      {!isViewOnly && <col style={{ width: "40px" }} />}
                    </colgroup>
                    <thead>
                      <tr className="border-b">
                        <th className="px-2 py-2 text-left">Image</th>
                        <th className="px-2 py-2 text-left">Product</th>
                        <th className="px-2 py-2 text-left">Quantity</th>
                        {!isViewOnly && (
                          <th className="px-2 py-2 text-center">
                            {preKit.status === "PICKED" ? "Filled" : "Picked"}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {preKit.items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b hover:bg-muted/10"
                        >
                          <td className="px-2 py-2">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-20 h-20 object-cover rounded"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-muted flex items-center justify-center rounded">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <div className="font-medium text-xs truncate md:hidden">
                              {item.productName.length > 30
                                ? item.productName.slice(0, 30) + "..."
                                : item.productName}
                            </div>
                            <div className="font-medium text-xs hidden md:block">
                              {item.productName}
                            </div>
                          </td>
                          <td className="px-2 py-2">{item.quantity}</td>
                          {!isViewOnly && (
                            <td className="px-2 py-2 text-center">
                              <Checkbox
                                className="w-8 h-8 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary shadow-sm"
                                checked={checkedItems[item.id] || false}
                                onCheckedChange={(checked) =>
                                  setCheckedItems((ci) => ({
                                    ...ci,
                                    [item.id]: !!checked,
                                  }))
                                }
                              />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
        {!isViewOnly && (
          <DialogFooter className="flex flex-col gap-2 md:flex-row md:justify-end">
            <Button variant="outline" className="md:w-auto w-full">
              Edit
            </Button>
            <Button
              className={
                (allChecked
                  ? "md:w-auto w-full"
                  : "bg-gray-700 text-gray-300 opacity-70 cursor-not-allowed md:w-auto w-full") +
                " transition-all"
              }
              disabled={!allChecked || isPicking}
              onClick={handleAction}
            >
              {isPicking
                ? `Marking as ${
                    preKit.status === "PICKED" ? "Filled" : "Picked"
                  }...`
                : `Mark as ${preKit.status === "PICKED" ? "Filled" : "Picked"}`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

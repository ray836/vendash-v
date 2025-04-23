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
}

export function PreKitDetailsDialog({
  preKit,
  open,
  onOpenChange,
}: PreKitDetailsDialogProps) {
  if (!preKit) return null

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

  // Group items by their slot code prefix (A, B, C, etc.)
  const groupedItems = preKit.items.reduce<Record<string, PreKitItem[]>>(
    (acc, item) => {
      const prefix = item.slotCode.charAt(0)
      if (!acc[prefix]) {
        acc[prefix] = []
      }
      acc[prefix].push(item)
      return acc
    },
    {}
  )

  // Sort the prefixes alphabetically
  const sortedPrefixes = Object.keys(groupedItems).sort()

  // Sort items within each group by their slot code
  sortedPrefixes.forEach((prefix) => {
    groupedItems[prefix].sort((a, b) => {
      const aNum = parseInt(a.slotCode.substring(1))
      const bNum = parseInt(b.slotCode.substring(1))
      return aNum - bNum
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1400px] max-h-[90vh] w-[98vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-6 w-6" />
            <span>Pre-kit Details</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
              <div className="space-y-6">
                {sortedPrefixes.map((prefix) => (
                  <div key={prefix} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Row {prefix}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                      {groupedItems[prefix].map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col p-3 border rounded-md"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-xs">
                              Slot {item.slotCode}
                            </Badge>
                            <div className="text-xs font-medium">
                              {item.currentQuantity}/{item.capacity}
                            </div>
                          </div>
                          <div
                            className="w-full h-28 rounded bg-cover bg-center mb-2"
                            style={{
                              backgroundImage: `url(${item.productImage})`,
                            }}
                          />
                          <div>
                            <p className="font-medium text-sm">
                              {item.productName}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-muted-foreground">
                                Quantity: {item.quantity}
                              </p>
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{
                                    width: `${
                                      (item.currentQuantity / item.capacity) *
                                      100
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">Edit</Button>
            <Button>
              Mark as {preKit.status === "OPEN" ? "Picked" : "Stocked"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { Package, Calendar, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

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

interface PreKitsListProps {
  preKits: PreKit[]
  onPreKitClick: (preKit: PreKit) => void
}

export function PreKitsList({ preKits, onPreKitClick }: PreKitsListProps) {
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
    }).format(new Date(date))
  }

  return (
    <ScrollArea className="h-[500px] rounded-md border">
      <div className="p-4">
        {preKits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No pre-kits found</h3>
            <p className="text-muted-foreground">
              Create a new pre-kit or adjust your search filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preKits.map((preKit) => (
              <div
                key={preKit.id}
                className="border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors h-full flex flex-col"
                onClick={() => onPreKitClick(preKit)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Pre-kit {preKit.id}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Truck className="h-3.5 w-3.5" />
                      <span>Machine {preKit.machineId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(preKit.createdAt)}</span>
                  </div>
                  <Badge
                    className={`${getStatusColor(
                      preKit.status
                    )} text-white capitalize`}
                  >
                    {preKit.status.toLowerCase()}
                  </Badge>
                </div>

                <div className="text-sm font-medium mb-2">
                  {preKit.items.length} items
                </div>

                <div className="grid grid-cols-5 gap-1 mt-auto">
                  {preKit.items.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col items-center p-1 border rounded-md"
                    >
                      <div
                        className="w-8 h-8 rounded bg-cover bg-center mb-1"
                        style={{
                          backgroundImage: `url(${item.productImage})`,
                        }}
                      />
                      <div className="text-center w-full">
                        <p className="text-[10px] font-medium truncate">
                          {item.productName}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                  {preKit.items.length > 10 && (
                    <div className="flex items-center justify-center p-1 border rounded-md">
                      <p className="text-[10px] text-muted-foreground">
                        +{preKit.items.length - 10}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

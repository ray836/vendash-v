"use client"

import { Package, Calendar, Truck, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
  inStock?: number
}

interface PreKit {
  id: string
  machineId: string
  status: "OPEN" | "PICKED" | "STOCKED"
  createdAt: Date
  items: PreKitItem[]
  routeId?: string | null
  routeName?: string | null
  locationName?: string | null
}

interface PreKitsListProps {
  preKits: PreKit[]
  onPreKitClick: (preKit: PreKit) => void
}

function hasStockWarning(items: PreKitItem[]): boolean {
  const totalNeeded = new Map<string, number>()
  items.forEach((item) => {
    totalNeeded.set(item.productId, (totalNeeded.get(item.productId) ?? 0) + item.quantity)
  })
  return items.some(
    (item) => item.inStock !== undefined && (totalNeeded.get(item.productId) ?? 0) > item.inStock
  )
}

// Deduplicate items by product, summing quantities
function getUniqueProducts(items: PreKitItem[]) {
  const map = new Map<string, { productId: string; productName: string; productImage: string; totalQuantity: number }>()
  for (const item of items) {
    if (!map.has(item.productId)) {
      map.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        totalQuantity: 0,
      })
    }
    map.get(item.productId)!.totalQuantity += item.quantity
  }
  return Array.from(map.values())
}

export function PreKitsList({ preKits, onPreKitClick }: PreKitsListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-blue-500"
      case "PICKED": return "bg-yellow-500"
      case "STOCKED": return "bg-green-500"
      default: return "bg-gray-500"
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
    <>
      {preKits.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No pre-kits in this route</h3>
          <p className="text-muted-foreground">
            Generate pre-kits for this route to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {preKits.map((preKit) => {
            const uniqueProducts = getUniqueProducts(preKit.items)
            const displayProducts = uniqueProducts.slice(0, 10)
            const overflow = uniqueProducts.length - 10

            return (
              <div
                key={preKit.id}
                className="border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors h-full flex flex-col"
                onClick={() => onPreKitClick(preKit)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">#{preKit.id.slice(0, 8).toUpperCase()}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Truck className="h-3.5 w-3.5" />
                      <span>{preKit.locationName || preKit.machineId}</span>
                      {preKit.locationName && (
                        <span className="text-xs text-muted-foreground/60">{preKit.machineId}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(preKit.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasStockWarning(preKit.items) && preKit.status !== "STOCKED" && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Low Stock
                      </Badge>
                    )}
                    <Badge className={`${getStatusColor(preKit.status)} text-white capitalize`}>
                      {preKit.status.toLowerCase()}
                    </Badge>
                  </div>
                </div>

                <div className="text-sm font-medium mb-2">
                  {uniqueProducts.length} product{uniqueProducts.length !== 1 ? "s" : ""}
                </div>

                <div className="grid grid-cols-5 gap-1 mt-auto">
                  {displayProducts.map((product) => (
                    <div
                      key={product.productId}
                      className="flex flex-col items-center p-1 border rounded-md"
                    >
                      <div
                        className="w-8 h-8 rounded bg-cover bg-center mb-1"
                        style={{ backgroundImage: `url(${product.productImage})` }}
                      />
                      <div className="text-center w-full">
                        <p className="text-[10px] font-medium truncate">
                          {product.productName}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          ×{product.totalQuantity}
                        </p>
                      </div>
                    </div>
                  ))}
                  {overflow > 0 && (
                    <div className="flex items-center justify-center p-1 border rounded-md">
                      <p className="text-[10px] text-muted-foreground">+{overflow}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

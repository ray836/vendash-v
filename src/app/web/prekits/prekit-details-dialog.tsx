"use client"

import { Package, Calendar, Truck, Trash2, AlertTriangle, Pencil, Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { pickPreKit, stockPreKit, deletePreKit, orderShortItems, updatePreKitItemQuantities } from "./actions"

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
  locationName?: string | null
}

interface PreKitDetailsDialogProps {
  preKit: PreKit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPreKitPicked?: () => void
  onPreKitStocked?: () => void
  onPreKitDeleted?: () => void
}

// A product group for the picking (OPEN) phase
interface ProductGroup {
  productId: string
  productName: string
  productImage: string
  totalQuantity: number
  inStock?: number
  isShort: boolean
  itemIds: string[]
  slotCodes: string[]
}

export function PreKitDetailsDialog({
  preKit,
  open,
  onOpenChange,
  onPreKitPicked,
  onPreKitStocked,
  onPreKitDeleted,
}: PreKitDetailsDialogProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [isPicking, setIsPicking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)
  const [shortItemsOrdered, setShortItemsOrdered] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editQuantities, setEditQuantities] = useState<Record<string, number>>({})
  const [deletedItemIds, setDeletedItemIds] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (preKit && preKit.status !== "STOCKED") {
      const initial: Record<string, boolean> = {}
      preKit.items.forEach((item) => { initial[item.id] = false })
      setCheckedItems(initial)
    }
    setShortItemsOrdered(false)
    setIsEditing(false)
    setError(null)
  }, [preKit, open])

  if (!preKit) return null

  const isViewOnly = preKit.status === "STOCKED"
  // Group view: only in OPEN status and not editing
  const isGroupedView = preKit.status === "OPEN" && !isEditing

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
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  // Sum total needed per product across all slots
  const productTotalNeeded = new Map<string, number>()
  preKit.items.forEach((item) => {
    productTotalNeeded.set(item.productId, (productTotalNeeded.get(item.productId) ?? 0) + item.quantity)
  })

  const shortProductIds = new Set(
    preKit.items
      .filter((item) => item.inStock !== undefined && (productTotalNeeded.get(item.productId) ?? 0) > item.inStock)
      .map((item) => item.productId)
  )

  const shortItems = preKit.items.filter((item) => shortProductIds.has(item.productId))
  const hasStockIssues = shortProductIds.size > 0

  // Build product groups for picking mode
  const productGroups: ProductGroup[] = (() => {
    const map = new Map<string, ProductGroup>()
    for (const item of preKit.items) {
      if (!map.has(item.productId)) {
        map.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          totalQuantity: 0,
          inStock: item.inStock,
          isShort: shortProductIds.has(item.productId),
          itemIds: [],
          slotCodes: [],
        })
      }
      const group = map.get(item.productId)!
      group.totalQuantity += item.quantity
      group.itemIds.push(item.id)
      group.slotCodes.push(item.slotCode)
    }
    return Array.from(map.values())
  })()

  // In grouped mode a "group" is checked when all its items are checked
  const isGroupChecked = (group: ProductGroup) => group.itemIds.every((id) => checkedItems[id])
  const toggleGroup = (group: ProductGroup) => {
    const allCheckedForGroup = isGroupChecked(group)
    setCheckedItems((ci) => {
      const next = { ...ci }
      group.itemIds.forEach((id) => { next[id] = !allCheckedForGroup })
      return next
    })
  }

  const allChecked =
    !isViewOnly &&
    preKit.items.length > 0 &&
    preKit.items.every((item) => checkedItems[item.id])

  // Progress counter — groups in grouped view, items otherwise
  const progressTotal = isGroupedView ? productGroups.length : preKit.items.length
  const progressDone = isGroupedView
    ? productGroups.filter(isGroupChecked).length
    : preKit.items.filter((item) => checkedItems[item.id]).length
  const progressLabel = preKit.status === "PICKED" ? "filled" : "picked"

  const handleSelectAll = () => {
    if (isGroupedView) {
      const allGroupsChecked = productGroups.every(isGroupChecked)
      const next: Record<string, boolean> = {}
      preKit.items.forEach((i) => { next[i.id] = !allGroupsChecked })
      setCheckedItems(next)
    } else {
      const allSelected = preKit.items.every((i) => checkedItems[i.id])
      const next: Record<string, boolean> = {}
      preKit.items.forEach((i) => { next[i.id] = !allSelected })
      setCheckedItems(next)
    }
  }

  const selectAllLabel = isGroupedView
    ? productGroups.every(isGroupChecked) ? "Deselect All" : "Select All"
    : preKit.items.every((i) => checkedItems[i.id]) ? "Deselect All" : "Select All"

  const handleStartEdit = () => {
    const initial: Record<string, number> = {}
    preKit.items.forEach((item) => { initial[item.id] = item.quantity })
    setEditQuantities(initial)
    setDeletedItemIds(new Set())
    setIsEditing(true)
    setError(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditQuantities({})
    setDeletedItemIds(new Set())
    setError(null)
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    setError(null)
    const items = preKit.items
      .filter((item) => !deletedItemIds.has(item.id))
      .map((item) => ({
        id: item.id,
        slotId: item.slotId,
        productId: item.productId,
        quantity: editQuantities[item.id] ?? item.quantity,
      }))
    const result = await updatePreKitItemQuantities(preKit.id, items)
    setIsSaving(false)
    if (result.success) {
      setIsEditing(false)
      onPreKitPicked?.()
      onOpenChange(false)
    } else {
      setError(result.error || "Failed to save changes")
    }
  }

  const handleAction = async () => {
    if (!preKit || !allChecked || isViewOnly) return

    if (hasStockIssues && preKit.status === "OPEN") {
      const shortNames = [...new Set(shortItems.map((i) => i.productName))].join(", ")
      const proceed = confirm(
        `Warning: Some items have insufficient warehouse stock (${shortNames}). You may not be able to fully stock this pre-kit. Continue marking as picked?`
      )
      if (!proceed) return
    }

    try {
      setIsPicking(true)
      setError(null)
      if (preKit.status === "PICKED") {
        const result = await stockPreKit(preKit.id)
        if (result.success) { onPreKitStocked?.(); onOpenChange(false) }
        else setError(result.error || "Failed to mark pre-kit as filled")
      } else {
        const result = await pickPreKit(preKit.id)
        if (result.success) { onPreKitPicked?.(); onOpenChange(false) }
        else setError(result.error || "Failed to mark pre-kit as picked")
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsPicking(false)
    }
  }

  const handleDelete = async () => {
    if (!preKit) return
    if (!confirm("Are you sure you want to delete this pre-kit? This action cannot be undone.")) return
    try {
      setIsDeleting(true)
      setError(null)
      const result = await deletePreKit(preKit.id)
      if (result.success) { onPreKitDeleted?.(); onOpenChange(false) }
      else setError(result.error || "Failed to delete pre-kit")
    } catch {
      setError("An unexpected error occurred while deleting")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[90vh] w-[95vw] max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-6 w-6" />
            <span>Pre-kit Details</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">{error}</div>
          )}

          {hasStockIssues && !isViewOnly && (
            <div className="rounded-md border border-yellow-800/40 bg-yellow-950/40 px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-400" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-yellow-400">Insufficient warehouse stock</p>
                  <p className="text-xs text-muted-foreground">
                    {shortProductIds.size} product{shortProductIds.size !== 1 ? "s" : ""} don't have enough inventory to fill this pre-kit.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <a href="/web/products" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 whitespace-nowrap">
                  View Products
                </a>
                {shortItemsOrdered ? (
                  <Button size="sm" asChild className="h-7 text-xs whitespace-nowrap">
                    <a href="/web/orders">Go to Order →</a>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-7 text-xs whitespace-nowrap"
                    disabled={isOrdering}
                    onClick={async () => {
                      setIsOrdering(true)
                      const result = await orderShortItems(preKit.id)
                      setIsOrdering(false)
                      if (result.success) setShortItemsOrdered(true)
                    }}
                  >
                    {isOrdering ? "Adding..." : "Order Missing Stock"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Pre-kit header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-lg">#{preKit.id.slice(0, 8).toUpperCase()}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <span>{preKit.locationName || preKit.machineId}</span>
                  {preKit.locationName && (
                    <span className="text-xs text-muted-foreground/60">{preKit.machineId}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(preKit.createdAt)}</span>
              </div>
              <Badge className={`${getStatusColor(preKit.status)} text-white capitalize text-sm px-3 py-1 pointer-events-none`}>
                {preKit.status.toLowerCase()}
              </Badge>
            </div>
          </div>

          {/* Items section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-medium">
                  {isGroupedView
                    ? `Products (${productGroups.length})`
                    : `Slots (${preKit.items.length})`}
                </h3>
                {!isViewOnly && !isEditing && (
                  <span className="text-sm text-muted-foreground">
                    {progressDone} / {progressTotal} {progressLabel}
                  </span>
                )}
              </div>
              {!isViewOnly && !isEditing && (
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectAllLabel}
                </Button>
              )}
            </div>

            <ScrollArea className="h-[600px] rounded-md border p-4">
              <div className="space-y-3">

                {/* ── GROUPED VIEW (OPEN, picking phase) ─────────────────── */}
                {isGroupedView && (
                  <>
                    {/* Mobile */}
                    <div className="block md:hidden space-y-3">
                      {productGroups.map((group) => {
                        const checked = isGroupChecked(group)
                        return (
                          <div key={group.productId} className="flex items-center gap-3 p-3 border rounded-lg shadow-sm bg-transparent">
                            <div className="flex-shrink-0">
                              {group.productImage ? (
                                <img src={group.productImage} alt={group.productName} className="w-16 h-16 object-cover rounded" />
                              ) : (
                                <div className="w-16 h-16 bg-muted flex items-center justify-center rounded">
                                  <Package className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs truncate">
                                {group.productName.length > 30 ? group.productName.slice(0, 30) + "..." : group.productName}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Slots: <span className="font-mono">{group.slotCodes.join(", ")}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Need: <span className="font-semibold">{group.totalQuantity}</span>
                                {group.inStock !== undefined && (
                                  <span className={`ml-2 ${group.isShort ? "text-red-500 font-semibold" : ""}`}>
                                    In Stock: {group.inStock}
                                    {group.isShort && <AlertTriangle className="inline ml-1 h-3 w-3 text-red-500" />}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Checkbox
                              className="w-8 h-8 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary shadow-sm"
                              checked={checked}
                              onCheckedChange={() => toggleGroup(group)}
                            />
                          </div>
                        )
                      })}
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:block w-full overflow-x-auto">
                      <table className="w-full table-fixed text-sm">
                        <colgroup>
                          <col style={{ width: "56px" }} />
                          <col />
                          <col style={{ width: "130px" }} />
                          <col style={{ width: "60px" }} />
                          <col style={{ width: "70px" }} />
                          <col style={{ width: "56px" }} />
                        </colgroup>
                        <thead>
                          <tr className="border-b">
                            <th className="px-2 py-2 text-left">Image</th>
                            <th className="px-2 py-2 text-left">Product</th>
                            <th className="px-2 py-2 text-left">Slots</th>
                            <th className="px-2 py-2 text-left">Need</th>
                            <th className="px-2 py-2 text-left">Stock</th>
                            <th className="px-2 py-2 text-center">Picked</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productGroups.map((group) => {
                            const checked = isGroupChecked(group)
                            return (
                              <tr key={group.productId} className="border-b hover:bg-muted/10">
                                <td className="px-2 py-2">
                                  {group.productImage ? (
                                    <img src={group.productImage} alt={group.productName} className="w-12 h-12 object-cover rounded" />
                                  ) : (
                                    <div className="w-12 h-12 bg-muted flex items-center justify-center rounded">
                                      <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </td>
                                <td className="px-2 py-2">
                                  <div className="font-medium text-xs">{group.productName}</div>
                                </td>
                                <td className="px-2 py-2">
                                  <div className="flex flex-wrap gap-1">
                                    {group.slotCodes.map((code) => (
                                      <span key={code} className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{code}</span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-2 py-2 font-medium">{group.totalQuantity}</td>
                                <td className="px-2 py-2">
                                  {group.inStock !== undefined ? (
                                    <span className={group.isShort ? "text-red-500 font-semibold" : ""}>
                                      {group.inStock}
                                      {group.isShort && <AlertTriangle className="inline ml-1 h-3 w-3 text-red-500" />}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <Checkbox
                                    className="w-8 h-8 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary shadow-sm"
                                    checked={checked}
                                    onCheckedChange={() => toggleGroup(group)}
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* ── SLOT VIEW (PICKED stocking / edit mode) ─────────────── */}
                {!isGroupedView && (
                  <>
                    {/* Mobile */}
                    <div className="block md:hidden space-y-3">
                      {preKit.items.map((item) => {
                        const isShort = shortProductIds.has(item.productId)
                        const isDeleted = deletedItemIds.has(item.id)
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg shadow-sm bg-transparent transition-opacity ${isDeleted ? "opacity-40" : ""}`}
                          >
                            <div className="flex-shrink-0">
                              {item.productImage ? (
                                <img src={item.productImage} alt={item.productName} className="w-16 h-16 object-cover rounded" />
                              ) : (
                                <div className="w-16 h-16 bg-muted flex items-center justify-center rounded">
                                  <Package className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs truncate">
                                {item.productName.length > 30 ? item.productName.slice(0, 30) + "..." : item.productName}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Slot: <span className="font-mono font-semibold text-foreground">{item.slotCode}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Need:{" "}
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    min={1}
                                    className="inline-block w-16 h-6 text-xs px-1"
                                    value={editQuantities[item.id] ?? item.quantity}
                                    onChange={(e) =>
                                      setEditQuantities((q) => ({ ...q, [item.id]: Math.max(1, parseInt(e.target.value) || 1) }))
                                    }
                                  />
                                ) : (
                                  <span className="font-semibold">{item.quantity}</span>
                                )}
                                {item.inStock !== undefined && !isEditing && (
                                  <span className={`ml-2 ${isShort && !isViewOnly ? "text-red-500 font-semibold" : ""}`}>
                                    In Stock: {item.inStock}
                                    {isShort && !isViewOnly && <AlertTriangle className="inline ml-1 h-3 w-3 text-red-500" />}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 flex-shrink-0 ${isDeleted ? "text-muted-foreground" : "text-destructive hover:text-destructive"}`}
                                onClick={() =>
                                  setDeletedItemIds((prev) => {
                                    const next = new Set(prev)
                                    if (next.has(item.id)) next.delete(item.id)
                                    else next.add(item.id)
                                    return next
                                  })
                                }
                              >
                                {isDeleted ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            )}
                            {!isViewOnly && !isEditing && (
                              <Checkbox
                                className="w-8 h-8 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary shadow-sm"
                                checked={checkedItems[item.id] || false}
                                onCheckedChange={(checked) =>
                                  setCheckedItems((ci) => ({ ...ci, [item.id]: !!checked }))
                                }
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:block w-full overflow-x-auto">
                      <table className="w-full table-fixed text-sm">
                        <colgroup>
                          <col style={{ width: "56px" }} />
                          <col />
                          <col style={{ width: "60px" }} />
                          <col style={{ width: isEditing ? "90px" : "60px" }} />
                          <col style={{ width: "72px" }} />
                          {!isViewOnly && !isEditing && <col style={{ width: "48px" }} />}
                          {!isViewOnly && isEditing && <col style={{ width: "40px" }} />}
                        </colgroup>
                        <thead>
                          <tr className="border-b">
                            <th className="px-2 py-2 text-left">Image</th>
                            <th className="px-2 py-2 text-left">Product</th>
                            <th className="px-2 py-2 text-left">Slot</th>
                            <th className="px-2 py-2 text-left">Need</th>
                            <th className="px-2 py-2 text-left">Stock</th>
                            {!isViewOnly && !isEditing && (
                              <th className="px-2 py-2 text-center">Filled</th>
                            )}
                            {!isViewOnly && isEditing && <th className="px-2 py-2" />}
                          </tr>
                        </thead>
                        <tbody>
                          {preKit.items.map((item) => {
                            const isShort = shortProductIds.has(item.productId)
                            const isDeleted = deletedItemIds.has(item.id)
                            return (
                              <tr key={item.id} className={`border-b hover:bg-muted/10 transition-opacity ${isDeleted ? "opacity-40" : ""}`}>
                                <td className="px-2 py-2">
                                  {item.productImage ? (
                                    <img src={item.productImage} alt={item.productName} className="w-12 h-12 object-cover rounded" />
                                  ) : (
                                    <div className="w-12 h-12 bg-muted flex items-center justify-center rounded">
                                      <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </td>
                                <td className="px-2 py-2">
                                  <div className="font-medium text-xs">{item.productName}</div>
                                </td>
                                <td className="px-2 py-2">
                                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{item.slotCode}</span>
                                </td>
                                <td className="px-2 py-2">
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      min={1}
                                      className="w-20 h-7 text-xs px-2"
                                      value={editQuantities[item.id] ?? item.quantity}
                                      onChange={(e) =>
                                        setEditQuantities((q) => ({
                                          ...q,
                                          [item.id]: Math.max(1, parseInt(e.target.value) || 1),
                                        }))
                                      }
                                    />
                                  ) : (
                                    item.quantity
                                  )}
                                </td>
                                <td className="px-2 py-2">
                                  {item.inStock !== undefined ? (
                                    <span className={isShort && !isViewOnly && !isEditing ? "text-red-500 font-semibold" : ""}>
                                      {item.inStock}
                                      {isShort && !isViewOnly && !isEditing && (
                                        <AlertTriangle className="inline ml-1 h-3 w-3 text-red-500" />
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                {!isViewOnly && !isEditing && (
                                  <td className="px-2 py-2 text-center">
                                    <Checkbox
                                      className="w-8 h-8 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary shadow-sm"
                                      checked={checkedItems[item.id] || false}
                                      onCheckedChange={(checked) =>
                                        setCheckedItems((ci) => ({ ...ci, [item.id]: !!checked }))
                                      }
                                    />
                                  </td>
                                )}
                                {!isViewOnly && isEditing && (
                                  <td className="px-2 py-2 text-center">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={`h-7 w-7 ${isDeleted ? "text-muted-foreground" : "text-destructive hover:text-destructive"}`}
                                      onClick={() =>
                                        setDeletedItemIds((prev) => {
                                          const next = new Set(prev)
                                          if (next.has(item.id)) next.delete(item.id)
                                          else next.add(item.id)
                                          return next
                                        })
                                      }
                                    >
                                      {isDeleted ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

              </div>
            </ScrollArea>
          </div>
        </div>

        {!isViewOnly && (
          <DialogFooter className="flex flex-col gap-2 md:flex-row md:justify-between">
            <Button
              variant="destructive"
              className="md:w-auto w-full"
              disabled={isDeleting || isPicking || isEditing}
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
            <div className="flex flex-col md:flex-row gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" className="md:w-auto w-full" disabled={isSaving} onClick={handleCancelEdit}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button className="md:w-auto w-full" disabled={isSaving} onClick={handleSaveEdit}>
                    <Check className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="md:w-auto w-full" disabled={isPicking} onClick={handleStartEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
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
                      ? `Marking as ${preKit.status === "PICKED" ? "Filled" : "Picked"}...`
                      : `Mark as ${preKit.status === "PICKED" ? "Filled" : "Picked"}`}
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

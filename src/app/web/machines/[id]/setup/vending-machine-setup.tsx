"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Minus, ArrowRight, CheckCircle, Plus, Trash2, Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PublicProductDTO } from "@/domains/Product/schemas/ProductSchemas"
import {
  saveSlots,
  updateMachine,
  getMachine,
  updateMachineInfo,
} from "./actions"
import { useToast } from "@/hooks/use-toast"
import { PublicSlotWithProductDTO } from "@/domains/Slot/schemas/SlotSchemas"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MachineType } from "@/domains/VendingMachine/entities/VendingMachine"
import { PublicVendingMachineDTO } from "@/domains/VendingMachine/schemas/vendingMachineDTOs"
import {
  GRID_CONSTRAINTS,
  createInitialSlots as makeInitialSlots,
  addRow as gridAddRow,
  removeRow as gridRemoveRow,
  addColumn as gridAddColumn,
  removeColumn as gridRemoveColumn,
  addSlotToRow as gridAddSlotToRow,
  removeSlotFromRow as gridRemoveSlotFromRow,
  removeSpecificRow as gridRemoveSpecificRow,
  canAddSlotToRow,
  updateSlot as gridUpdateSlot,
  type SlotValidationError,
} from "@/domains/VendingMachine/gridLogic"
import { z } from "zod"
import { SlotSchemas } from "@/domains/Slot/schemas/SlotSchemas"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MachineSettingsDialog } from "./MachineSettingsDialog"
// Separate products by type
// const products = { drinks: [...], snacks: [...] }

// type Slot = PublicSlotDTO
type Slot = z.infer<typeof SlotSchemas.public> & {
  row: string
  column: number
}

function createInitialSlots(rows: number, columns: number, machineId = "", organizationId = ""): Slot[] {
  return makeInitialSlots(rows, columns, machineId, organizationId) as Slot[]
}

function MachineTypeToggle({
  type,
  onChange,
}: {
  type: MachineType
  onChange: (type: MachineType) => void
}) {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <Label>Machine Type:</Label>
      <div className="flex rounded-lg border p-1">
        <Button
          variant={type === MachineType.SNACK ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(MachineType.SNACK)}
          className="relative"
        >
          Snack Machine
        </Button>
        <Button
          variant={type === MachineType.DRINK ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(MachineType.DRINK)}
          className="relative"
        >
          Drink Machine
        </Button>
      </div>
    </div>
  )
}

function SlotGrid({
  slots,
  onSlotClick,
  activeSlot,
  machineType,
  orgProducts,
  onAddSlot,
  onRemoveSlot,
  onAddRow,
  onRemoveRow,
  rows,
}: {
  slots: Slot[]
  onSlotClick: (slot: Slot) => void
  activeSlot: Slot | null
  machineType: MachineType
  orgProducts: PublicProductDTO[]
  onAddSlot: (row: string) => void
  onRemoveSlot: (row: string) => void
  onAddRow: () => void
  onRemoveRow: (row: string) => void
  rows: number
}) {
  const { maxRows, minRows } = GRID_CONSTRAINTS[machineType]
  const slotsByRow = slots.reduce((acc, slot) => {
    if (!acc[slot.row]) {
      acc[slot.row] = []
    }
    acc[slot.row].push(slot)
    return acc
  }, {} as Record<string, Slot[]>)

  return (
    <div className="space-y-4">
      {Object.entries(slotsByRow).map(([row, rowSlots]) => (
        <div key={row} className="flex items-center gap-4">
          <div
            className="flex-1 grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${rowSlots.length}, minmax(0, 1fr))`,
            }}
          >
            {rowSlots.map((slot) => (
              <SlotButton
                key={slot.id}
                slot={slot}
                product={orgProducts.find((p) => p.id === slot.productId)}
                isActive={activeSlot?.id === slot.id}
                onClick={() => onSlotClick(slot)}
                machineType={machineType}
              />
            ))}
          </div>
          <div className="flex-none">
            <RowControls
              rowLetter={row}
              slotCount={rowSlots.length}
              machineType={machineType}
              onAddSlot={onAddSlot}
              onRemoveSlot={onRemoveSlot}
              canRemoveRow={rows > minRows}
              onRemoveRow={onRemoveRow}
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        className="w-full border-dashed text-muted-foreground hover:text-foreground"
        onClick={onAddRow}
        disabled={rows >= maxRows}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Row
      </Button>
    </div>
  )
}

function SlotButton({
  slot,
  product,
  isActive,
  onClick,
  machineType,
}: {
  slot: Slot
  product: PublicProductDTO | undefined
  isActive: boolean
  onClick: () => void
  machineType: MachineType
}) {
  return (
    <div
      className={`
        border rounded-md p-2 cursor-pointer transition-colors hover:bg-accent
        ${isActive ? "border-primary" : "border-border"}
        ${machineType === MachineType.DRINK ? "aspect-[2/3]" : "aspect-square"}
      `}
      onClick={onClick}
    >
      <div className="w-full h-full relative flex flex-col items-center justify-center text-center gap-1">
        <span className="absolute top-1 left-1 text-xs font-semibold bg-background/80 rounded px-1 leading-tight z-10">
          {slot.labelCode}
        </span>
        {product ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-contain opacity-90"
            />
            <span className="absolute bottom-1 right-1 text-xs font-semibold bg-background/80 rounded px-1 leading-tight">
              ${(slot.price || product.recommendedPrice).toFixed(2)}
            </span>
          </>
        ) : null}
      </div>
    </div>
  )
}

function SlotSettings({
  slot,
  onUpdate,
  orgProducts,
  validationError,
}: {
  slot: Slot
  onUpdate: (updates: Partial<Slot>) => void
  orgProducts: PublicProductDTO[]
  validationError?: SlotValidationError | null
}) {
  const product = orgProducts.find((p) => p.id === slot.productId)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">
          Slot {slot.labelCode}
        </h3>
        {product && (
          <div className="flex items-center gap-3 p-3 rounded-md bg-muted/40 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="w-10 h-10 object-contain shrink-0"
            />
            <Link
              href={`/web/products/${product.id}`}
              className="text-sm font-medium leading-snug hover:underline"
              target="_blank"
            >
              {product.name}
            </Link>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price Override</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          placeholder={
            product
              ? `Default: $${product.recommendedPrice.toFixed(2)}`
              : "Set price"
          }
          value={slot.price || ""}
          className={validationError?.field === "price" ? "border-destructive" : ""}
          onChange={(e) =>
            onUpdate({
              price: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
        {validationError?.field === "price" && (
          <p className="text-xs text-destructive">{validationError.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="currentQuantity">Current Quantity</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 p-0.5">
            <Input
              id="currentQuantity"
              type="number"
              min="0"
              max={slot.capacity}
              value={slot.currentQuantity}
              className={validationError?.field === "currentQuantity" ? "border-destructive" : ""}
              onChange={(e) =>
                onUpdate({ currentQuantity: Number(e.target.value) })
              }
            />
            <div className="text-sm text-muted-foreground whitespace-nowrap px-2">
              / {slot.capacity}
            </div>
          </div>
        </div>
        {validationError?.field === "currentQuantity" && (
          <p className="text-xs text-destructive">{validationError.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          min="1"
          max="50"
          value={slot.capacity}
          className={validationError?.field === "capacity" ? "border-destructive" : ""}
          onChange={(e) => onUpdate({ capacity: Number(e.target.value) })}
        />
        {validationError?.field === "capacity" && (
          <p className="text-xs text-destructive">{validationError.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardReaderSlotId">Card Reader Slot Code</Label>
        <Input
          id="cardReaderSlotId"
          value={slot.ccReaderCode || ""}
          onChange={(e) => onUpdate({ ccReaderCode: e.target.value })}
          placeholder="Enter card reader slot Code"
        />
      </div>

      {product && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onUpdate({ productId: "", price: undefined })}
        >
          Clear Slot
        </Button>
      )}
    </div>
  )
}

function RowControls({
  rowLetter,
  slotCount,
  machineType,
  onAddSlot,
  onRemoveSlot,
  canRemoveRow,
  onRemoveRow,
}: {
  rowLetter: string
  slotCount: number
  machineType: MachineType
  onAddSlot: (row: string) => void
  onRemoveSlot: (row: string) => void
  canRemoveRow: boolean
  onRemoveRow: (row: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onAddSlot(rowLetter)}
        disabled={!canAddSlotToRow(slotCount, machineType)}
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onRemoveSlot(rowLetter)}
        disabled={slotCount <= 1}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onRemoveRow(rowLetter)}
              disabled={!canRemoveRow}
              className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Remove row {rowLetter}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

interface MachineConfiguration {
  machineId: string
  machineType: MachineType
  gridSize: {
    rows: number
    columns: number
  }
  slots: Slot[]
}

interface VendingMachineSetupProps {
  machineId: string
  products: PublicProductDTO[]
  initialSlots: PublicSlotWithProductDTO[]
  machineType: MachineType
  locations: { id: string; name: string }[]
}

export function VendingMachineSetup({
  machineId,
  products,
  initialSlots,
  machineType: initialMachineType,
  locations,
}: VendingMachineSetupProps) {
  // Initialize all state with basic values
  const [machine, setMachine] = useState<PublicVendingMachineDTO | null>(null)
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [machineType, setMachineType] =
    useState<MachineType>(initialMachineType)
  const [rows, setRows] = useState(0)
  const [columns, setColumns] = useState(0)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedProduct, setSelectedProduct] =
    useState<PublicProductDTO | null>(null)
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const wasAlreadyCompleteRef = useRef(false)
  const [slotError, setSlotError] = useState<SlotValidationError | null>(null)
  const [activeTab, setActiveTab] = useState("products")
  const [isSavingInfo, setIsSavingInfo] = useState(false)
  const [productSearch, setProductSearch] = useState("")
  const [productCategoryFilter, setProductCategoryFilter] = useState("all")

  // Initialize everything in one effect
  useEffect(() => {
    const initialize = async () => {
      try {
        const machineData = await getMachine(machineId)
        setMachine(machineData)

        wasAlreadyCompleteRef.current = initialSlots.length > 0 && !!machineData?.cardReaderId

        if (initialSlots.length > 0) {
          const mappedSlots = initialSlots.map((slot) => ({
            ...slot,
            // Prefer stored rowKey/colIndex; fall back to parsing letter-based labelCodes
            row: slot.rowKey ?? slot.labelCode.charAt(0),
            column: slot.colIndex ?? (parseInt(slot.labelCode.split("-")[1]) - 1),
          }))
          const distinctRows = new Set(mappedSlots.map((s) => s.row)).size
          const rowCounts = mappedSlots.reduce((acc, s) => {
            acc[s.row] = (acc[s.row] || 0) + 1
            return acc
          }, {} as Record<string, number>)
          const maxCols = Math.max(...Object.values(rowCounts))
          setRows(distinctRows)
          setColumns(maxCols)
          setSlots(mappedSlots as Slot[])
        } else {
          const initialRows = initialMachineType === MachineType.DRINK ? 2 : 6
          const initialColumns = initialMachineType === MachineType.DRINK ? 5 : 4
          setRows(initialRows)
          setColumns(initialColumns)
          setSlots(createInitialSlots(initialRows, initialColumns))
        }
      } catch (error) {
        console.error("Failed to initialize:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [machineId, initialMachineType, initialSlots])

  if (isLoading) {
    return <div>Loading...</div> // Consider using a proper loading skeleton
  }

  if (!machine) {
    return <div>Machine not found</div> // Consider a better error state UI
  }

  // Reset slots when machine type changes
  const handleMachineTypeChange = (type: MachineType) => {
    setMachineType(type)
    setSelectedProduct(null)
    setActiveSlot(null)

    if (type === MachineType.DRINK) {
      setRows(2)
      setColumns(5)
      setSlots(createInitialSlots(2, 5))
    } else {
      setRows(6)
      setColumns(4)
      setSlots(createInitialSlots(6, 4))
    }
  }

  const handleSlotClick = (slot: Slot) => {
    setSlotError(null)
    // If no product is selected, just set active slot and switch to settings tab
    if (!selectedProduct) {
      setActiveSlot(slot)
      setActiveTab("settings")
      return
    }

    // If a product is selected, update the slot with the product
    const updatedSlot = {
      ...slot,
      productId: selectedProduct.id,
      price: selectedProduct.recommendedPrice,
    }

    // Update the slots array with the new slot
    setSlots(slots.map((s) => (s.id === slot.id ? updatedSlot : s)))
    setHasUnsavedChanges(true)

    // Update active slot
    setActiveSlot(updatedSlot)
  }

  // Grid manipulation functions — delegate to pure gridLogic module
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gs = (s: Slot[]) => s as any[]

  const addRow = () => {
    const result = gridAddRow(gs(slots), rows, columns, machineType, machineId, machine.organizationId)
    setRows(result.rows)
    setSlots(result.slots as Slot[])
    setHasUnsavedChanges(true)
  }

  const removeRow = () => {
    const lastRowLetter = String.fromCharCode(65 + rows - 1)
    const result = gridRemoveRow(gs(slots), rows, machineType)
    setRows(result.rows)
    setSlots(result.slots as Slot[])
    if (activeSlot && activeSlot.row === lastRowLetter) setActiveSlot(null)
  }

  const addColumn = () => {
    const result = gridAddColumn(gs(slots), rows, columns, machineType, machineId, machine.organizationId)
    setColumns(result.columns)
    setSlots(result.slots as Slot[])
  }

  const removeColumn = () => {
    if (activeSlot) {
      const rowSlots = slots.filter((s) => s.row === activeSlot.row)
      if (activeSlot.column === rowSlots.length - 1) setActiveSlot(null)
    }
    const result = gridRemoveColumn(gs(slots), rows, columns, machineType)
    setColumns(result.columns)
    setSlots(result.slots as Slot[])
  }

  const removeRowByLetter = (rowLetter: string) => {
    const result = gridRemoveSpecificRow(gs(slots), rows, rowLetter, machineType)
    setRows(result.rows)
    setSlots(result.slots as Slot[])
    setHasUnsavedChanges(true)
    if (activeSlot?.row === rowLetter) setActiveSlot(null)
  }

  const addSlotToRow = (rowLetter: string) => {
    setSlots(gridAddSlotToRow(gs(slots), rowLetter, machineType, machineId, machine.organizationId) as Slot[])
    setHasUnsavedChanges(true)
  }

  const removeSlotFromRow = (rowLetter: string) => {
    setSlots(gridRemoveSlotFromRow(gs(slots), rowLetter) as Slot[])
    setHasUnsavedChanges(true)
  }

  // Filter products based on machine type
  const availableProducts = products.filter((product) =>
    machineType === MachineType.DRINK
      ? product.category.toLowerCase().includes("drink")
      : !product.category.toLowerCase().includes("drink")
  )

  const normalizeCategory = (cat: string) => {
    const lower = cat.toLowerCase().trim()
    // Merge known plural/singular variants
    if (lower === "snacks") return "snack"
    if (lower === "drinks") return "drink"
    if (lower === "candies") return "candy"
    return lower
  }

  const productCategories = ["all", ...Array.from(new Set(availableProducts.map((p) => normalizeCategory(p.category)))).sort()]

  const filteredProducts = availableProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase())
    const matchesCategory = productCategoryFilter === "all" || normalizeCategory(p.category) === productCategoryFilter
    return matchesSearch && matchesCategory
  })

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  const handleSaveConfiguration = async () => {
    try {
      setIsSaving(true)
      const configuration: MachineConfiguration = {
        machineId,
        machineType,
        gridSize: {
          rows,
          columns,
        },
        slots: slots.map((slot) => ({
          machineId,
          productId: slot.productId && UUID_REGEX.test(slot.productId) ? slot.productId : undefined,
          labelCode: slot.labelCode, // preserve original label — never reconstruct
          rowKey: slot.row,
          colIndex: slot.column,
          row: slot.row,
          column: slot.column,
          ccReaderCode: slot.ccReaderCode || "",
          price: slot.price || 0,
          capacity: slot.capacity || 10,
          currentQuantity: slot.currentQuantity ?? 0,
          organizationId: machine.organizationId,
          sequenceNumber: slot.sequenceNumber,
          id: slot.id,
        })),
      }

      const result = await saveSlots(
        machineId,
        configuration.slots,
        machine.cardReaderId || ""
      )

      if (result.success) {
        setHasUnsavedChanges(false)
        const isNowComplete = slots.length > 0 && !!machine.cardReaderId
        if (isNowComplete && !setupComplete && !wasAlreadyCompleteRef.current) {
          setSetupComplete(true)
          wasAlreadyCompleteRef.current = true
        } else {
          setSavedSuccess(true)
          setTimeout(() => setSavedSuccess(false), 3000)
        }
      } else {
        console.error("Failed to save configuration:", result.error)
        toast({ title: "Error", description: result.error || "Failed to save configuration. Please try again.", variant: "destructive" })
      }
    } catch (error) {
      console.error("Failed to save configuration:", error)
      toast({ title: "Error", description: "Failed to save configuration. Please try again.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSlotUpdate = (updates: Partial<Slot>) => {
    if (!activeSlot) return

    const safeUpdates = { ...updates, productId: updates.productId ?? undefined }
    const { slots: newSlots, error } = gridUpdateSlot(gs(slots), activeSlot.id, safeUpdates)
    setSlotError(error)
    if (error) return  // reject invalid update — slots unchanged

    setSlots(newSlots as Slot[])
    setHasUnsavedChanges(true)
    setActiveSlot({ ...activeSlot, ...updates })
  }

  // Handler for saving machine info
  const handleSaveMachineInfo = async (machineInfo: {
    model: string
    notes: string
    locationId: string
  }) => {
    try {
      setIsSavingInfo(true)
      const result = await updateMachineInfo(machine!.id, machineInfo)
      const response = JSON.parse(result)
      if (response.success) {
        const updatedMachine = await getMachine(machine!.id)
        setMachine(updatedMachine)
        toast({ title: "Saved", description: "Machine info updated successfully." })
      } else {
        throw new Error(response.error || "Failed to update machine info")
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to save machine info.", variant: "destructive" })
    } finally {
      setIsSavingInfo(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/web/machines/${machineId}`}
            className="flex items-center text-sm text-muted-foreground hover:text-primary mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Machine Details
          </Link>
          <h1 className="text-2xl font-bold">
            Configure Vending Machine - {machineId}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Machine Settings</Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Machine Settings</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure machine hardware settings
                    </p>
                  </div>
                  <MachineSettingsDialog
                    machine={machine}
                    onUpdate={async (cardReaderId: string) => {
                      await updateMachine(machineId, { cardReaderId })
                      const updatedMachine = await getMachine(machineId)
                      setMachine(updatedMachine)
                    }}
                    locations={locations}
                    onSaveMachineInfo={handleSaveMachineInfo}
                    isSavingInfo={isSavingInfo}
                  />
                </div>
              </PopoverContent>
            </Popover>
            {hasUnsavedChanges && (
              <span className="flex items-center text-xs text-amber-600 dark:text-amber-400 font-medium self-center">
                Unsaved changes
              </span>
            )}
            <Button onClick={handleSaveConfiguration} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
          {setupComplete && (
            <div className="flex items-center gap-2 rounded-md bg-green-500/15 border border-green-500/30 px-3 py-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Machine setup is 100% complete!</span>
            </div>
          )}
          {savedSuccess && (
            <div className="flex items-center gap-2 rounded-md bg-green-500/15 border border-green-500/30 px-3 py-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Configuration saved successfully</span>
            </div>
          )}
        </div>
      </div>

      {initialSlots.length === 0 && (
        <MachineTypeToggle
          type={machineType}
          onChange={handleMachineTypeChange}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Slot Layout</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {slots.filter((s) => s.productId).length} / {slots.length} slots assigned
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {selectedProduct && (
                <div className="flex items-center justify-between rounded-md bg-primary/10 border border-primary/30 px-3 py-2 mb-4">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedProduct.image || "/placeholder.svg"}
                      alt={selectedProduct.name}
                      className="w-5 h-5 object-contain shrink-0"
                    />
                    <span className="text-sm">
                      Assigning <strong>{selectedProduct.name}</strong> — click a slot to assign
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedProduct(null)}>
                    Cancel
                  </Button>
                </div>
              )}
              <SlotGrid
                slots={slots}
                onSlotClick={handleSlotClick}
                activeSlot={activeSlot}
                machineType={machineType}
                orgProducts={products}
                onAddSlot={addSlotToRow}
                onRemoveSlot={removeSlotFromRow}
                onAddRow={addRow}
                onRemoveRow={removeRowByLetter}
                rows={rows}
              />
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              {machineType === MachineType.SNACK
                ? "Tip: Snack machines typically have 4-6 columns and 5-8 rows"
                : "Tip: Drink machines typically have 5-8 columns and 1-2 rows"}
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value)
              if (value === "settings") {
                setSelectedProduct(null)
              }
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="products" className="flex-1">
                Products
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="products">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Available Products</CardTitle>
                  <div className="space-y-2 pt-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                    </div>
                    <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {productCategories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="capitalize">
                            {cat === "all" ? "All categories" : cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[1300px]">
                    <div className="grid grid-cols-2 gap-2">
                      {filteredProducts.length === 0 ? (
                        <p className="col-span-2 text-center text-sm text-muted-foreground py-6">No products found</p>
                      ) : filteredProducts.map((product) => (
                        <TooltipProvider key={product.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={
                                  selectedProduct?.id === product.id
                                    ? "default"
                                    : "outline"
                                }
                                className="w-full h-auto aspect-square p-2 flex flex-col gap-1"
                                onClick={() =>
                                  setSelectedProduct(
                                    selectedProduct?.id === product.id
                                      ? null
                                      : product
                                  )
                                }
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={product.image || "/placeholder.svg"}
                                  alt={product.name}
                                  className="w-full h-3/4 object-contain"
                                />
                                <div className="text-xs font-medium truncate w-full">
                                  {product.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ${product.recommendedPrice.toFixed(2)}
                                </div>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ${product.recommendedPrice.toFixed(2)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                {activeSlot ? (
                  <SlotSettings
                    slot={activeSlot}
                    onUpdate={handleSlotUpdate}
                    orgProducts={products}
                    validationError={slotError}
                  />
                ) : (
                  <CardContent className="text-center py-6 text-muted-foreground">
                    Select a slot to configure
                  </CardContent>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

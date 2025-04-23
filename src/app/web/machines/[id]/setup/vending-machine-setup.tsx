"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Minus, ArrowDown, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
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
import { PublicProductDTO } from "@/core/domain/DTOs/productDTOs"
import { saveSlots, updateMachine, getMachine } from "./actions"
import {
  PublicSlotDTO,
  PublicSlotWithProductDTO,
} from "@/core/domain/DTOs/slotDTOs"
import { PublicVendingMachineDTO } from "@/core/domain/DTOs/vendingMachineDTOs"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MachineType } from "@/core/domain/entities/VendingMachine"
// Separate products by type
// const products = { drinks: [...], snacks: [...] }

type Slot = PublicSlotDTO

function createInitialSlots(rows: number, columns: number): Slot[] {
  const slots: Slot[] = []
  for (let row = 0; row < rows; row++) {
    const rowLetter = String.fromCharCode(65 + row)
    for (let col = 0; col < columns; col++) {
      slots.push({
        id: `${rowLetter}-${col + 1}`,
        productId: "",
        labelCode: `${rowLetter}-${col + 1}`,
        ccReaderCode: "",
        price: 0,
        capacity: 10,
        currentQuantity: 0,
        machineId: "",
        row: rowLetter,
        column: col,
      })
    }
  }
  return slots
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

function GridControls({
  rows,
  columns,
  onAddRow,
  onRemoveRow,
  onAddColumn,
  onRemoveColumn,
  machineType,
}: {
  rows: number
  columns: number
  onAddRow: () => void
  onRemoveRow: () => void
  onAddColumn: () => void
  onRemoveColumn: () => void
  machineType: MachineType
}) {
  // Set limits based on machine type
  const maxRows = machineType === MachineType.DRINK ? 4 : 8
  const minRows = machineType === MachineType.DRINK ? 1 : 2
  const maxColumns = machineType === MachineType.DRINK ? 8 : 6
  const minColumns = machineType === MachineType.DRINK ? 2 : 2

  return (
    <div className="flex flex-col items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onAddRow}
                disabled={rows >= maxRows}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Row</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onRemoveRow}
                disabled={rows <= minRows}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove Row</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="mx-2 text-sm text-muted-foreground">
          {rows} × {columns}
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onAddColumn}
                disabled={columns >= maxColumns}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Column</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onRemoveColumn}
                disabled={columns <= minColumns}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove Column</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

function SlotGrid({
  slots,
  selectedProduct,
  onSlotClick,
  activeSlot,
  machineType,
  orgProducts,
  onAddSlot,
  onRemoveSlot,
}: {
  slots: Slot[]
  selectedProduct: PublicProductDTO | null
  onSlotClick: (slot: Slot) => void
  activeSlot: Slot | null
  machineType: MachineType
  orgProducts: PublicProductDTO[]
  onAddSlot: (row: string) => void
  onRemoveSlot: (row: string) => void
}) {
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
              onAddSlot={onAddSlot}
              onRemoveSlot={onRemoveSlot}
            />
          </div>
        </div>
      ))}
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
        {product ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-contain opacity-50"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50">
              <span className="text-xs font-medium truncate max-w-full px-1">
                {product.name}
              </span>
              <span className="text-xs text-muted-foreground">
                ${(slot.price || product.recommendedPrice).toFixed(2)}
              </span>
            </div>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">
            {slot.row}-{slot.column + 1}
          </span>
        )}
      </div>
    </div>
  )
}

function SlotSettings({
  slot,
  onUpdate,
  orgProducts,
}: {
  slot: Slot
  onUpdate: (updates: Partial<Slot>) => void
  orgProducts: PublicProductDTO[]
}) {
  const product = orgProducts.find((p) => p.id === slot.productId)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">
          Slot {slot.row}-{slot.column + 1}
        </h3>
        {product && (
          <p className="text-sm text-muted-foreground mb-4">
            Currently assigned: {product.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price Override</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          placeholder={
            product
              ? `Default: $${product.recommendedPrice.toFixed(2)}`
              : "Set price"
          }
          value={slot.price || ""}
          onChange={(e) =>
            onUpdate({
              price: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
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
              onChange={(e) =>
                onUpdate({
                  currentQuantity: Math.min(
                    Number(e.target.value),
                    slot.capacity
                  ),
                })
              }
            />
            <div className="text-sm text-muted-foreground whitespace-nowrap px-2">
              / {slot.capacity}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          value={slot.capacity}
          onChange={(e) => onUpdate({ capacity: Number(e.target.value) })}
        />
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
  onAddSlot,
  onRemoveSlot,
}: {
  rowLetter: string
  slotCount: number
  onAddSlot: (row: string) => void
  onRemoveSlot: (row: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onAddSlot(rowLetter)}
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
}

export function VendingMachineSetup({
  machineId,
  products,
  initialSlots,
  machineType: initialMachineType,
}: VendingMachineSetupProps) {
  // Initialize all state with basic values
  const [machine, setMachine] = useState<PublicVendingMachineDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [machineType, setMachineType] =
    useState<MachineType>(initialMachineType)
  const [rows, setRows] = useState(0)
  const [columns, setColumns] = useState(0)
  const [slots, setSlots] = useState<PublicSlotDTO[]>([])
  const [selectedProduct, setSelectedProduct] =
    useState<PublicProductDTO | null>(null)
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("products")

  const { toast } = useToast()

  // Initialize everything in one effect
  useEffect(() => {
    const initialize = async () => {
      try {
        const machineData = await getMachine(machineId)
        setMachine(machineData)

        const initialRows = initialMachineType === MachineType.DRINK ? 2 : 6
        const initialColumns = initialMachineType === MachineType.DRINK ? 5 : 4

        setRows(initialRows)
        setColumns(initialColumns)
        setSlots(
          initialSlots.length > 0
            ? initialSlots
            : createInitialSlots(initialRows, initialColumns)
        )
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

    // Update active slot
    setActiveSlot(updatedSlot)
  }

  // Grid manipulation functions
  const addRow = () => {
    const rowLetter = String.fromCharCode(65 + rows)
    const newSlots = [...slots]

    // Add new slots for this row
    for (let col = 0; col < columns; col++) {
      newSlots.push({
        id: `${rowLetter}-${col + 1}`,
        row: rowLetter,
        column: col,
        productId: "",
        capacity: 10,
        price: 0,
        machineId: machineId,
        labelCode: `${rowLetter}-${col + 1}`,
        ccReaderCode: "",
        currentQuantity: 0,
      })
    }

    setRows(rows + 1)
    setSlots(newSlots)
  }

  const removeRow = () => {
    if (rows <= 1) return

    const lastRowLetter = String.fromCharCode(65 + rows - 1)

    // Remove only the last row
    const newSlots = slots.filter((slot) => slot.row !== lastRowLetter)

    setRows(rows - 1)
    setSlots(newSlots)

    // Clear active slot if it was in the removed row
    if (activeSlot && activeSlot.row === lastRowLetter) {
      setActiveSlot(null)
    }
  }

  const addColumn = () => {
    const newSlots: Slot[] = []

    // Reconstruct the slots array with new slots inserted in correct positions
    for (let row = 0; row < rows; row++) {
      const rowLetter = String.fromCharCode(65 + row)

      // Add all existing slots for this row
      const existingRowSlots = slots.filter((slot) => slot.row === rowLetter)
      newSlots.push(...existingRowSlots)

      // Add the new slot for this row using the row's current length
      const newColumn = existingRowSlots.length
      newSlots.push({
        id: `${rowLetter}-${newColumn + 1}`,
        machineId: machineId,
        productId: "",
        labelCode: `${rowLetter}-${newColumn + 1}`,
        ccReaderCode: "",
        price: 0,
        capacity: 10,
        currentQuantity: 0,
        row: rowLetter,
        column: newColumn,
      })
    }

    setSlots(newSlots)
  }

  const removeColumn = () => {
    const newSlots: Slot[] = []

    // Process each row
    for (let row = 0; row < rows; row++) {
      const rowLetter = String.fromCharCode(65 + row)

      // Get existing slots for this row
      const rowSlots = slots.filter((slot) => slot.row === rowLetter)
      if (rowSlots.length <= 1) continue

      // Add all slots except the last one
      newSlots.push(...rowSlots.slice(0, -1))
    }

    setSlots(newSlots)

    // Clear active slot if it was in a removed column
    if (activeSlot) {
      const rowSlots = slots.filter((s) => s.row === activeSlot.row)
      if (activeSlot.column === rowSlots.length - 1) {
        setActiveSlot(null)
      }
    }
  }

  const addSlotToRow = (rowLetter: string) => {
    const rowSlots = slots.filter((s) => s.row === rowLetter)
    const newColumn = rowSlots.length

    const newSlot: Slot = {
      id: `${rowLetter}-${newColumn + 1}`,
      machineId: machineId,
      productId: "",
      labelCode: `${rowLetter}-${newColumn + 1}`,
      ccReaderCode: "",
      price: 0,
      capacity: 10,
      currentQuantity: 0,
      row: rowLetter,
      column: newColumn,
    }

    setSlots([...slots, newSlot])
  }

  const removeSlotFromRow = (rowLetter: string) => {
    const rowSlots = slots.filter((s) => s.row === rowLetter)
    if (rowSlots.length <= 1) return

    const lastSlot = rowSlots[rowSlots.length - 1]
    setSlots(slots.filter((s) => s.id !== lastSlot.id))
  }

  // Filter products based on machine type
  const availableProducts = products.filter((product) =>
    machineType === MachineType.DRINK
      ? product.category.toLowerCase().includes("drink")
      : !product.category.toLowerCase().includes("drink")
  )

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
          productId: slot.productId || "",
          labelCode: `${slot.row}-${slot.column + 1}`,
          ccReaderCode: slot.ccReaderCode || "",
          price: slot.price || 0,
          capacity: slot.capacity || 10,
          currentQuantity: 0,
          row: slot.row,
          column: slot.column,
        })),
      }

      const result = await saveSlots(
        machineId,
        configuration.slots,
        machine.cardReaderId
      )

      if (result.success) {
        // Show success message or handle success case
        console.log("Configuration saved successfully")
      }
    } catch (error) {
      // Handle error case
      console.error("Failed to save configuration:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSlotUpdate = (updates: Partial<Slot>) => {
    if (!activeSlot) return

    setSlots(
      slots.map((slot) =>
        slot.id === activeSlot.id ? { ...slot, ...updates } : slot
      )
    )

    // Also update the active slot
    setActiveSlot({ ...activeSlot, ...updates })
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
                <MachineSettings
                  machine={machine}
                  onUpdate={async (cardReaderId: string) => {
                    await updateMachine(machineId, { cardReaderId })
                    const updatedMachine = await getMachine(machineId)
                    setMachine(updatedMachine)
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={handleSaveConfiguration} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>

      <MachineTypeToggle
        type={machineType}
        onChange={handleMachineTypeChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Slot Layout</CardTitle>
            </CardHeader>
            <CardContent>
              <GridControls
                rows={rows}
                columns={columns}
                onAddRow={addRow}
                onRemoveRow={removeRow}
                onAddColumn={addColumn}
                onRemoveColumn={removeColumn}
                machineType={machineType}
              />
              <SlotGrid
                slots={slots}
                selectedProduct={selectedProduct}
                onSlotClick={handleSlotClick}
                activeSlot={activeSlot}
                machineType={machineType}
                orgProducts={products}
                onAddSlot={addSlotToRow}
                onRemoveSlot={removeSlotFromRow}
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
                <CardHeader>
                  <CardTitle>Available Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[1300px]">
                    <div className="grid grid-cols-2 gap-2">
                      {availableProducts.map((product) => (
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

function MachineSettings({
  machine,
  onUpdate,
}: {
  machine: PublicVendingMachineDTO
  onUpdate: (cardReaderId: string) => Promise<void>
}) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [cardReaderId, setCardReaderId] = useState(machine.cardReaderId || "")

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onUpdate(cardReaderId)
      toast({
        title: "Success",
        description: "Card reader ID updated successfully",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to update card reader ID",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="cardReaderId">Card Reader ID</Label>
        <div className="flex gap-2">
          <Input
            id="cardReaderId"
            value={cardReaderId}
            onChange={(e) => setCardReaderId(e.target.value)}
            placeholder="Enter card reader ID"
          />
          <span>{machine.cardReaderId} here</span>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          This ID is used to associate transactions with this machine
        </p>
      </div>
    </div>
  )
}

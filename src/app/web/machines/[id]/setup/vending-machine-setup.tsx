"use client"

import { useState } from "react"
import { ArrowLeft, Minus, ArrowDown, ArrowRight } from "lucide-react"
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

// Separate products by type
const products = {
  drinks: [
    {
      id: "1",
      name: "Coca-Cola",
      price: 2.5,
      type: "drink",
      image:
        "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&h=300&fit=crop",
    },
    {
      id: "2",
      name: "Diet Coke",
      price: 2.5,
      type: "drink",
      image:
        "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&h=300&fit=crop",
    },
    {
      id: "3",
      name: "Sprite",
      price: 2.5,
      type: "drink",
      image:
        "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=300&h=300&fit=crop",
    },
    {
      id: "12",
      name: "Gatorade",
      price: 2.75,
      type: "drink",
      image:
        "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=300&h=300&fit=crop",
    },
  ],
  snacks: [
    {
      id: "4",
      name: "Doritos",
      price: 1.75,
      type: "snack",
      image:
        "https://images.unsplash.com/photo-1600952841320-db92ec4047ca?w=300&h=300&fit=crop",
    },
    {
      id: "5",
      name: "Lays Classic",
      price: 1.75,
      type: "snack",
      image:
        "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop",
    },
    {
      id: "6",
      name: "Snickers",
      price: 1.5,
      type: "snack",
      image:
        "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=300&h=300&fit=crop",
    },
    {
      id: "7",
      name: "M&Ms",
      price: 1.5,
      type: "snack",
      image:
        "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=300&h=300&fit=crop",
    },
    {
      id: "8",
      name: "Twix",
      price: 1.5,
      type: "snack",
      image:
        "https://images.unsplash.com/photo-1527904324834-3bda86da6771?w=300&h=300&fit=crop",
    },
    {
      id: "9",
      name: "Pringles",
      price: 2.0,
      type: "snack",
      image:
        "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=300&h=300&fit=crop",
    },
    {
      id: "10",
      name: "KitKat",
      price: 1.5,
      type: "snack",
      image:
        "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=300&h=300&fit=crop",
    },
    {
      id: "11",
      name: "Hershey's",
      price: 1.5,
      type: "snack",
      image:
        "https://images.unsplash.com/photo-1585553616435-2dc0a54e1d89?w=300&h=300&fit=crop",
    },
  ],
}

interface Slot {
  id: string
  row: number
  column: number
  productId: string | null
  capacity: number
  price: number | null
}

function createInitialSlots(rows: number, columns: number): Slot[] {
  const slots: Slot[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      slots.push({
        id: `${row}-${col}`,
        row,
        column: col,
        productId: null,
        capacity: 10,
        price: null,
      })
    }
  }
  return slots
}

function MachineTypeToggle({
  type,
  onChange,
}: {
  type: "snack" | "drink"
  onChange: (type: "snack" | "drink") => void
}) {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <Label>Machine Type:</Label>
      <div className="flex rounded-lg border p-1">
        <Button
          variant={type === "snack" ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange("snack")}
          className="relative"
        >
          Snack Machine
        </Button>
        <Button
          variant={type === "drink" ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange("drink")}
          className="relative"
        >
          Drink Machine
        </Button>
      </div>
    </div>
  )
}

function ProductCard({
  product,
  onSelect,
  isSelected,
}: {
  product: (typeof products.snacks)[0] | (typeof products.drinks)[0]
  onSelect: () => void
  isSelected: boolean
}) {
  return (
    <Card
      className={`cursor-pointer transition-colors ${
        isSelected ? "border-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="aspect-square relative mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="rounded-md object-cover w-full h-full"
          />
        </div>
        <div className="text-sm font-medium">{product.name}</div>
        <div className="text-sm text-muted-foreground">
          ${product.price.toFixed(2)}
        </div>
      </CardContent>
    </Card>
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
  machineType: "snack" | "drink"
}) {
  // Set limits based on machine type
  const maxRows = machineType === "drink" ? 4 : 8
  const minRows = machineType === "drink" ? 1 : 2
  const maxColumns = machineType === "drink" ? 8 : 6
  const minColumns = machineType === "drink" ? 2 : 2

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
  rows,
  columns,
}: {
  slots: Slot[]
  selectedProduct:
    | (typeof products.snacks)[0]
    | (typeof products.drinks)[0]
    | null
  onSlotClick: (slot: Slot) => void
  activeSlot: Slot | null
  machineType: "snack" | "drink"
  rows: number
  columns: number
}) {
  return (
    <div
      className={`grid gap-2 ${
        machineType === "drink" ? "max-w-3xl mx-auto" : ""
      }`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {slots.map((slot) => {
        const product = [...products.snacks, ...products.drinks].find(
          (p) => p.id === slot.productId
        )
        const isActive = activeSlot?.id === slot.id

        return (
          <div
            key={slot.id}
            className={`
              border rounded-md p-2 cursor-pointer transition-colors hover:bg-accent
              ${isActive ? "border-primary" : "border-border"}
              ${machineType === "drink" ? "aspect-[2/3]" : "aspect-square"}
            `}
            onClick={() => onSlotClick(slot)}
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
                    <span className="text-xs font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ${slot.price?.toFixed(2) || product.price.toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {slot.row + 1}-{slot.column + 1}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SlotSettings({
  slot,
  onUpdate,
}: {
  slot: Slot
  onUpdate: (updates: Partial<Slot>) => void
}) {
  const product = [...products.snacks, ...products.drinks].find(
    (p) => p.id === slot.productId
  )

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">
          Slot {slot.row + 1}-{slot.column + 1}
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
            product ? `Default: $${product.price.toFixed(2)}` : "Set price"
          }
          value={slot.price || ""}
          onChange={(e) =>
            onUpdate({ price: e.target.value ? Number(e.target.value) : null })
          }
        />
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

      {product && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onUpdate({ productId: null, price: null })}
        >
          Clear Slot
        </Button>
      )}
    </div>
  )
}

interface VendingMachineSetupProps {
  id: string
}

export function VendingMachineSetup({ id }: VendingMachineSetupProps) {
  const [machineType, setMachineType] = useState<"snack" | "drink">("snack")
  const [rows, setRows] = useState(machineType === "drink" ? 2 : 6)
  const [columns, setColumns] = useState(machineType === "drink" ? 5 : 4)
  const [slots, setSlots] = useState(() => createInitialSlots(rows, columns))
  const [selectedProduct, setSelectedProduct] = useState<
    (typeof products.snacks)[0] | (typeof products.drinks)[0] | null
  >(null)
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null)

  // Reset slots when machine type changes
  const handleMachineTypeChange = (type: "snack" | "drink") => {
    setMachineType(type)
    setSelectedProduct(null)
    setActiveSlot(null)

    if (type === "drink") {
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
    if (selectedProduct) {
      setSlots(
        slots.map((s) =>
          s.id === slot.id
            ? {
                ...s,
                productId: selectedProduct.id,
                price: selectedProduct.price,
              }
            : s
        )
      )
      setSelectedProduct(null)
    } else {
      setActiveSlot(slot)
    }
  }

  const updateSlot = (updates: Partial<Slot>) => {
    if (!activeSlot) return
    setSlots(
      slots.map((s) => (s.id === activeSlot.id ? { ...s, ...updates } : s))
    )
    if (updates.productId === null) {
      setActiveSlot(null)
    } else {
      setActiveSlot((prev) => (prev ? { ...prev, ...updates } : null))
    }
  }

  // Grid manipulation functions
  const addRow = () => {
    const newRow = rows
    const newSlots = [...slots]

    // Add new slots for the new row
    for (let col = 0; col < columns; col++) {
      newSlots.push({
        id: `${newRow}-${col}`,
        row: newRow,
        column: col,
        productId: null,
        capacity: 10,
        price: null,
      })
    }

    setRows(rows + 1)
    setSlots(newSlots)
  }

  const removeRow = () => {
    if (rows <= 1) return

    // Remove the last row
    const newSlots = slots.filter((slot) => slot.row < rows - 1)
    setRows(rows - 1)
    setSlots(newSlots)

    // Clear active slot if it was in the removed row
    if (activeSlot && activeSlot.row === rows - 1) {
      setActiveSlot(null)
    }
  }

  const addColumn = () => {
    const newCol = columns
    const newSlots = [...slots]

    // Add new slots for the new column
    for (let row = 0; row < rows; row++) {
      newSlots.push({
        id: `${row}-${newCol}`,
        row,
        column: newCol,
        productId: null,
        capacity: 10,
        price: null,
      })
    }

    setColumns(columns + 1)
    setSlots(newSlots)
  }

  const removeColumn = () => {
    if (columns <= 1) return

    // Remove the last column
    const newSlots = slots.filter((slot) => slot.column < columns - 1)
    setColumns(columns - 1)
    setSlots(newSlots)

    // Clear active slot if it was in the removed column
    if (activeSlot && activeSlot.column === columns - 1) {
      setActiveSlot(null)
    }
  }

  const availableProducts =
    machineType === "drink" ? products.drinks : products.snacks

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/web/machine/${id}`}
            className="flex items-center text-sm text-muted-foreground hover:text-primary mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Machine Details
          </Link>
          <h1 className="text-2xl font-bold">
            Configure Vending Machine - {id}
          </h1>
        </div>
        <Button>Save Configuration</Button>
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
                rows={rows}
                columns={columns}
              />
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              {machineType === "snack"
                ? "Tip: Snack machines typically have 4-6 columns and 5-8 rows"
                : "Tip: Drink machines typically have 5-8 columns and 1-2 rows"}
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Tabs defaultValue="products">
            <TabsList className="w-full">
              <TabsTrigger value="products" className="flex-1">
                Products
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                Slot Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="products" className="mt-4">
              <ScrollArea className="h-[600px] pr-4">
                <div className="grid grid-cols-2 gap-4">
                  {availableProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isSelected={selectedProduct?.id === product.id}
                      onSelect={() => {
                        setSelectedProduct(
                          selectedProduct?.id === product.id ? null : product
                        )
                        setActiveSlot(null)
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="settings" className="mt-4">
              {activeSlot ? (
                <SlotSettings slot={activeSlot} onUpdate={updateSlot} />
              ) : (
                <div className="text-center text-muted-foreground p-4">
                  Select a slot to configure its settings
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

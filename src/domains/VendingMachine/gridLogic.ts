import { MachineType } from "./entities/VendingMachine"

// ─── Grid constraints ─────────────────────────────────────────────────────────

export const GRID_CONSTRAINTS = {
  [MachineType.DRINK]: {
    minRows: 1,
    maxRows: 4,
    minColumns: 2,
    maxColumns: 8,
  },
  [MachineType.SNACK]: {
    minRows: 2,
    maxRows: 8,
    minColumns: 2,
    maxColumns: 6,
  },
} as const

export type GridConstraints = (typeof GRID_CONSTRAINTS)[MachineType]

// ─── Slot shape used by grid logic (no React, no DB) ─────────────────────────

export interface GridSlot {
  id: string
  machineId: string
  organizationId: string
  productId: string
  labelCode: string
  ccReaderCode: string
  price: number
  capacity: number
  currentQuantity: number
  sequenceNumber: number
  row: string
  column: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function rowLetter(rowIndex: number): string {
  return String.fromCharCode(65 + rowIndex) // 0 → "A", 1 → "B", …
}

export function makeLabelCode(row: string, column: number): string {
  return `${row}-${column + 1}` // column is 0-indexed; label is 1-indexed
}

function makeSlot(
  row: string,
  column: number,
  machineId: string,
  organizationId: string
): GridSlot {
  const label = makeLabelCode(row, column)
  return {
    id: label,
    machineId,
    organizationId,
    productId: "",
    labelCode: label,
    ccReaderCode: "",
    price: 0,
    capacity: 10,
    currentQuantity: 0,
    sequenceNumber: 0,
    row,
    column,
  }
}

// ─── Constraint guards ────────────────────────────────────────────────────────

export function canAddRow(rows: number, type: MachineType): boolean {
  return rows < GRID_CONSTRAINTS[type].maxRows
}

export function canRemoveRow(rows: number, type: MachineType): boolean {
  return rows > GRID_CONSTRAINTS[type].minRows
}

export function canAddColumn(columns: number, type: MachineType): boolean {
  return columns < GRID_CONSTRAINTS[type].maxColumns
}

export function canRemoveColumn(columns: number, type: MachineType): boolean {
  return columns > GRID_CONSTRAINTS[type].minColumns
}

/** Per-row add respects the same max-column limit as the global column control */
export function canAddSlotToRow(
  rowSlotCount: number,
  type: MachineType
): boolean {
  return rowSlotCount < GRID_CONSTRAINTS[type].maxColumns
}

// ─── Grid operations (pure, no side-effects) ──────────────────────────────────

export function createInitialSlots(
  rows: number,
  columns: number,
  machineId = "",
  organizationId = ""
): GridSlot[] {
  const slots: GridSlot[] = []
  for (let r = 0; r < rows; r++) {
    const letter = rowLetter(r)
    for (let c = 0; c < columns; c++) {
      slots.push(makeSlot(letter, c, machineId, organizationId))
    }
  }
  return slots
}

function sortedDistinctRows(slots: GridSlot[]): string[] {
  return [...new Set(slots.map((s) => s.row))].sort()
}

export function addRow(
  slots: GridSlot[],
  rows: number,
  columns: number,
  type: MachineType,
  machineId = "",
  organizationId = ""
): { slots: GridSlot[]; rows: number } {
  if (!canAddRow(rows, type)) return { slots, rows }

  const existing = sortedDistinctRows(slots)
  const lastRow = existing[existing.length - 1]
  const nextIndex = lastRow ? lastRow.charCodeAt(0) - 65 + 1 : rows
  const letter = rowLetter(nextIndex)

  const newSlots = [...slots]
  for (let c = 0; c < columns; c++) {
    newSlots.push(makeSlot(letter, c, machineId, organizationId))
  }
  return { slots: newSlots, rows: rows + 1 }
}

export function removeRow(
  slots: GridSlot[],
  rows: number,
  type: MachineType
): { slots: GridSlot[]; rows: number } {
  if (!canRemoveRow(rows, type)) return { slots, rows }

  const existing = sortedDistinctRows(slots)
  const lastRow = existing[existing.length - 1]
  if (!lastRow) return { slots, rows }

  return {
    slots: slots.filter((s) => s.row !== lastRow),
    rows: rows - 1,
  }
}

export function removeSpecificRow(
  slots: GridSlot[],
  rows: number,
  rowLetter: string,
  type: MachineType
): { slots: GridSlot[]; rows: number } {
  if (!canRemoveRow(rows, type)) return { slots, rows }
  return {
    slots: slots.filter((s) => s.row !== rowLetter),
    rows: rows - 1,
  }
}

export function addColumn(
  slots: GridSlot[],
  rows: number,
  columns: number,
  type: MachineType,
  machineId = "",
  organizationId = ""
): { slots: GridSlot[]; columns: number } {
  if (!canAddColumn(columns, type)) return { slots, columns }

  const newSlots: GridSlot[] = []
  for (const letter of sortedDistinctRows(slots)) {
    const rowSlots = slots.filter((s) => s.row === letter)
    newSlots.push(...rowSlots)
    newSlots.push(makeSlot(letter, rowSlots.length, machineId, organizationId))
  }
  return { slots: newSlots, columns: columns + 1 }
}

export function removeColumn(
  slots: GridSlot[],
  rows: number,
  columns: number,
  type: MachineType
): { slots: GridSlot[]; columns: number } {
  if (!canRemoveColumn(columns, type)) return { slots, columns }

  const newSlots: GridSlot[] = []
  for (const letter of sortedDistinctRows(slots)) {
    const rowSlots = slots.filter((s) => s.row === letter)
    newSlots.push(...rowSlots.slice(0, -1))
  }
  return { slots: newSlots, columns: columns - 1 }
}

export function addSlotToRow(
  slots: GridSlot[],
  row: string,
  type: MachineType,
  machineId = "",
  organizationId = ""
): GridSlot[] {
  const rowSlots = slots.filter((s) => s.row === row)
  if (!canAddSlotToRow(rowSlots.length, type)) return slots

  const newColumn = rowSlots.length
  return [...slots, makeSlot(row, newColumn, machineId, organizationId)]
}

export function removeSlotFromRow(
  slots: GridSlot[],
  row: string
): GridSlot[] {
  const rowSlots = slots.filter((s) => s.row === row)
  if (rowSlots.length <= 1) return slots

  const lastSlot = rowSlots[rowSlots.length - 1]
  return slots.filter((s) => s.id !== lastSlot.id)
}

// ─── Slot data validation ──────────────────────────────────────────────────────

export interface SlotValidationError {
  field: "price" | "capacity" | "currentQuantity"
  message: string
}

export function validateSlotPrice(price: number): SlotValidationError | null {
  if (price < 0) return { field: "price", message: "Price cannot be negative" }
  if (!isFinite(price)) return { field: "price", message: "Price must be a valid number" }
  return null
}

export function validateCapacity(capacity: number): SlotValidationError | null {
  if (!Number.isInteger(capacity)) return { field: "capacity", message: "Capacity must be a whole number" }
  if (capacity < 1) return { field: "capacity", message: "Capacity must be at least 1" }
  if (capacity > 50) return { field: "capacity", message: "Capacity cannot exceed 50" }
  return null
}

export function validateCurrentQuantity(
  currentQuantity: number,
  capacity: number
): SlotValidationError | null {
  if (!Number.isInteger(currentQuantity)) return { field: "currentQuantity", message: "Quantity must be a whole number" }
  if (currentQuantity < 0) return { field: "currentQuantity", message: "Quantity cannot be negative" }
  if (currentQuantity > capacity) return { field: "currentQuantity", message: "Quantity cannot exceed capacity" }
  return null
}

// ─── Slot data operations (pure) ──────────────────────────────────────────────

export type SlotUpdates = Partial<Pick<GridSlot, "productId" | "price" | "capacity" | "currentQuantity" | "ccReaderCode">>

/**
 * Returns a new slots array with the target slot's fields updated.
 * Returns the original array unchanged if slotId is not found or
 * the updates contain invalid values.
 */
export function updateSlot(
  slots: GridSlot[],
  slotId: string,
  updates: SlotUpdates
): { slots: GridSlot[]; error: SlotValidationError | null } {
  const target = slots.find((s) => s.id === slotId)
  if (!target) return { slots, error: null }

  // Validate individual fields if present in the update
  if (updates.price !== undefined) {
    const err = validateSlotPrice(updates.price)
    if (err) return { slots, error: err }
  }

  const newCapacity = updates.capacity ?? target.capacity
  if (updates.capacity !== undefined) {
    const err = validateCapacity(newCapacity)
    if (err) return { slots, error: err }
  }

  const newQuantity = updates.currentQuantity ?? target.currentQuantity
  if (updates.currentQuantity !== undefined) {
    const err = validateCurrentQuantity(newQuantity, newCapacity)
    if (err) return { slots, error: err }
  }

  return {
    slots: slots.map((s) => (s.id === slotId ? { ...s, ...updates } : s)),
    error: null,
  }
}

/**
 * Assigns a product to a slot, optionally overriding the price.
 * If no price override is given, the slot's current price is kept.
 */
export function assignProduct(
  slots: GridSlot[],
  slotId: string,
  productId: string,
  price?: number
): GridSlot[] {
  return slots.map((s) => {
    if (s.id !== slotId) return s
    return {
      ...s,
      productId,
      price: price !== undefined ? price : s.price,
    }
  })
}

/** Removes the product assignment from a slot, resetting price to 0. */
export function clearProduct(slots: GridSlot[], slotId: string): GridSlot[] {
  return slots.map((s) =>
    s.id === slotId ? { ...s, productId: "", price: 0 } : s
  )
}

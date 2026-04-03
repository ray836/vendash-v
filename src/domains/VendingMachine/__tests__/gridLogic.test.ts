import { describe, it, expect } from "vitest"
import { MachineType } from "../entities/VendingMachine"
import {
  GRID_CONSTRAINTS,
  createInitialSlots,
  addRow,
  removeRow,
  addColumn,
  removeColumn,
  addSlotToRow,
  removeSlotFromRow,
  canAddRow,
  canRemoveRow,
  canAddColumn,
  canRemoveColumn,
  canAddSlotToRow,
  rowLetter,
  makeLabelCode,
  validateSlotPrice,
  validateCapacity,
  validateCurrentQuantity,
  updateSlot,
  assignProduct,
  clearProduct,
} from "../gridLogic"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MACHINE_ID = "vm-test"
const ORG_ID = "org-test"

function makeGrid(rows: number, columns: number) {
  return createInitialSlots(rows, columns, MACHINE_ID, ORG_ID)
}

// ─── GRID_CONSTRAINTS ─────────────────────────────────────────────────────────

describe("GRID_CONSTRAINTS", () => {
  it("defines correct limits for DRINK machines", () => {
    const c = GRID_CONSTRAINTS[MachineType.DRINK]
    expect(c.minRows).toBe(1)
    expect(c.maxRows).toBe(4)
    expect(c.minColumns).toBe(2)
    expect(c.maxColumns).toBe(8)
  })

  it("defines correct limits for SNACK machines", () => {
    const c = GRID_CONSTRAINTS[MachineType.SNACK]
    expect(c.minRows).toBe(2)
    expect(c.maxRows).toBe(8)
    expect(c.minColumns).toBe(2)
    expect(c.maxColumns).toBe(6)
  })
})

// ─── rowLetter / makeLabelCode ────────────────────────────────────────────────

describe("rowLetter", () => {
  it("converts row index 0 to 'A'", () => expect(rowLetter(0)).toBe("A"))
  it("converts row index 7 to 'H'", () => expect(rowLetter(7)).toBe("H"))
})

describe("makeLabelCode", () => {
  it("generates correct label for first slot", () =>
    expect(makeLabelCode("A", 0)).toBe("A-1"))
  it("generates correct label for last slot of a large row", () =>
    expect(makeLabelCode("C", 7)).toBe("C-8"))
})

// ─── createInitialSlots ───────────────────────────────────────────────────────

describe("createInitialSlots", () => {
  it("creates the correct total number of slots", () => {
    expect(makeGrid(3, 4)).toHaveLength(12)
    expect(makeGrid(1, 5)).toHaveLength(5)
    expect(makeGrid(6, 4)).toHaveLength(24)
  })

  it("assigns correct row letters starting from A", () => {
    const slots = makeGrid(3, 2)
    const rows = [...new Set(slots.map((s) => s.row))]
    expect(rows).toEqual(["A", "B", "C"])
  })

  it("assigns correct 0-indexed column numbers", () => {
    const slots = makeGrid(1, 4)
    expect(slots.map((s) => s.column)).toEqual([0, 1, 2, 3])
  })

  it("generates labelCodes in 'A-1' format (1-indexed)", () => {
    const slots = makeGrid(2, 3)
    const labels = slots.map((s) => s.labelCode)
    expect(labels).toEqual(["A-1", "A-2", "A-3", "B-1", "B-2", "B-3"])
  })

  it("sets default capacity to 10", () => {
    makeGrid(2, 2).forEach((s) => expect(s.capacity).toBe(10))
  })

  it("sets default price to 0", () => {
    makeGrid(2, 2).forEach((s) => expect(s.price).toBe(0))
  })

  it("sets empty productId by default", () => {
    makeGrid(2, 2).forEach((s) => expect(s.productId).toBe(""))
  })

  it("propagates machineId to every slot", () => {
    makeGrid(2, 2).forEach((s) => expect(s.machineId).toBe(MACHINE_ID))
  })

  it("propagates organizationId to every slot", () => {
    makeGrid(2, 2).forEach((s) => expect(s.organizationId).toBe(ORG_ID))
  })

  it("returns empty array for 0 rows or 0 columns", () => {
    expect(makeGrid(0, 4)).toHaveLength(0)
    expect(makeGrid(3, 0)).toHaveLength(0)
  })
})

// ─── canAddRow / canRemoveRow ─────────────────────────────────────────────────

describe("canAddRow", () => {
  it("allows adding when below max", () => {
    expect(canAddRow(3, MachineType.DRINK)).toBe(true)   // max 4
    expect(canAddRow(7, MachineType.SNACK)).toBe(true)   // max 8
  })

  it("blocks adding at max", () => {
    expect(canAddRow(4, MachineType.DRINK)).toBe(false)
    expect(canAddRow(8, MachineType.SNACK)).toBe(false)
  })
})

describe("canRemoveRow", () => {
  it("allows removing when above min", () => {
    expect(canRemoveRow(2, MachineType.DRINK)).toBe(true)  // min 1
    expect(canRemoveRow(3, MachineType.SNACK)).toBe(true)  // min 2
  })

  it("blocks removing at min", () => {
    expect(canRemoveRow(1, MachineType.DRINK)).toBe(false)
    expect(canRemoveRow(2, MachineType.SNACK)).toBe(false)
  })
})

// ─── canAddColumn / canRemoveColumn ──────────────────────────────────────────

describe("canAddColumn", () => {
  it("allows adding when below max", () => {
    expect(canAddColumn(7, MachineType.DRINK)).toBe(true)  // max 8
    expect(canAddColumn(5, MachineType.SNACK)).toBe(true)  // max 6
  })

  it("blocks adding at max", () => {
    expect(canAddColumn(8, MachineType.DRINK)).toBe(false)
    expect(canAddColumn(6, MachineType.SNACK)).toBe(false)
  })
})

describe("canRemoveColumn", () => {
  it("allows removing when above min", () => {
    expect(canRemoveColumn(3, MachineType.DRINK)).toBe(true)
    expect(canRemoveColumn(3, MachineType.SNACK)).toBe(true)
  })

  it("blocks removing at min (2 for both types)", () => {
    expect(canRemoveColumn(2, MachineType.DRINK)).toBe(false)
    expect(canRemoveColumn(2, MachineType.SNACK)).toBe(false)
  })
})

// ─── canAddSlotToRow ─────────────────────────────────────────────────────────

describe("canAddSlotToRow", () => {
  it("allows adding when row is below max columns", () => {
    expect(canAddSlotToRow(5, MachineType.SNACK)).toBe(true)  // max 6
    expect(canAddSlotToRow(7, MachineType.DRINK)).toBe(true)  // max 8
  })

  it("blocks adding when row is at max columns", () => {
    expect(canAddSlotToRow(6, MachineType.SNACK)).toBe(false)
    expect(canAddSlotToRow(8, MachineType.DRINK)).toBe(false)
  })
})

// ─── addRow ───────────────────────────────────────────────────────────────────

describe("addRow", () => {
  it("adds one full row of slots", () => {
    const slots = makeGrid(2, 3)
    const result = addRow(slots, 2, 3, MachineType.SNACK, MACHINE_ID, ORG_ID)
    expect(result.slots).toHaveLength(9)  // 3 rows × 3 cols
    expect(result.rows).toBe(3)
  })

  it("new row uses the next letter", () => {
    const slots = makeGrid(2, 2)
    const result = addRow(slots, 2, 2, MachineType.SNACK, MACHINE_ID, ORG_ID)
    const newSlots = result.slots.filter((s) => s.row === "C")
    expect(newSlots).toHaveLength(2)
  })

  it("new slots have correct labelCodes", () => {
    const slots = makeGrid(1, 2)
    const result = addRow(slots, 1, 2, MachineType.DRINK, MACHINE_ID, ORG_ID)
    const newLabels = result.slots
      .filter((s) => s.row === "B")
      .map((s) => s.labelCode)
    expect(newLabels).toEqual(["B-1", "B-2"])
  })

  it("does not add a row when at maxRows", () => {
    const slots = makeGrid(4, 3)
    const result = addRow(slots, 4, 3, MachineType.DRINK, MACHINE_ID, ORG_ID)
    expect(result.slots).toHaveLength(12)  // unchanged
    expect(result.rows).toBe(4)
  })

  it("does not add a row when at maxRows for SNACK", () => {
    const slots = makeGrid(8, 4)
    const result = addRow(slots, 8, 4, MachineType.SNACK, MACHINE_ID, ORG_ID)
    expect(result.rows).toBe(8)
  })
})

// ─── removeRow ────────────────────────────────────────────────────────────────

describe("removeRow", () => {
  it("removes the last row's slots", () => {
    const slots = makeGrid(3, 2)
    const result = removeRow(slots, 3, MachineType.SNACK)
    expect(result.slots).toHaveLength(4)  // 2 rows × 2 cols
    expect(result.rows).toBe(2)
    expect(result.slots.some((s) => s.row === "C")).toBe(false)
  })

  it("always removes row C (the last letter) not an earlier row", () => {
    const slots = makeGrid(3, 2)
    const result = removeRow(slots, 3, MachineType.SNACK)
    expect(result.slots.every((s) => s.row !== "C")).toBe(true)
    expect(result.slots.some((s) => s.row === "A")).toBe(true)
    expect(result.slots.some((s) => s.row === "B")).toBe(true)
  })

  it("does not remove a row when at minRows for DRINK (1)", () => {
    const slots = makeGrid(1, 3)
    const result = removeRow(slots, 1, MachineType.DRINK)
    expect(result.slots).toHaveLength(3)
    expect(result.rows).toBe(1)
  })

  it("does not remove a row when at minRows for SNACK (2)", () => {
    const slots = makeGrid(2, 3)
    const result = removeRow(slots, 2, MachineType.SNACK)
    expect(result.slots).toHaveLength(6)
    expect(result.rows).toBe(2)
  })
})

// ─── addColumn ────────────────────────────────────────────────────────────────

describe("addColumn", () => {
  it("adds one slot to every row", () => {
    const slots = makeGrid(3, 2)
    const result = addColumn(slots, 3, 2, MachineType.SNACK, MACHINE_ID, ORG_ID)
    expect(result.slots).toHaveLength(9)  // 3 rows × 3 cols
    expect(result.columns).toBe(3)
  })

  it("new slots in each row have the next column index", () => {
    const slots = makeGrid(2, 2)
    const result = addColumn(slots, 2, 2, MachineType.SNACK, MACHINE_ID, ORG_ID)
    const newSlots = result.slots.filter((s) => s.column === 2)
    expect(newSlots).toHaveLength(2)
    expect(newSlots.map((s) => s.labelCode)).toEqual(["A-3", "B-3"])
  })

  it("preserves existing slots", () => {
    const original = makeGrid(2, 2)
    const result = addColumn(original, 2, 2, MachineType.SNACK, MACHINE_ID, ORG_ID)
    const originalLabels = original.map((s) => s.labelCode)
    originalLabels.forEach((label) => {
      expect(result.slots.some((s) => s.labelCode === label)).toBe(true)
    })
  })

  it("does not add a column when at maxColumns for SNACK (6)", () => {
    const slots = makeGrid(2, 6)
    const result = addColumn(slots, 2, 6, MachineType.SNACK, MACHINE_ID, ORG_ID)
    expect(result.slots).toHaveLength(12)  // unchanged
    expect(result.columns).toBe(6)
  })

  it("does not add a column when at maxColumns for DRINK (8)", () => {
    const slots = makeGrid(2, 8)
    const result = addColumn(slots, 2, 8, MachineType.DRINK, MACHINE_ID, ORG_ID)
    expect(result.columns).toBe(8)
  })
})

// ─── removeColumn ─────────────────────────────────────────────────────────────

describe("removeColumn", () => {
  it("removes the last slot from every row", () => {
    const slots = makeGrid(2, 3)
    const result = removeColumn(slots, 2, 3, MachineType.SNACK)
    expect(result.slots).toHaveLength(4)  // 2 rows × 2 cols
    expect(result.columns).toBe(2)
    expect(result.slots.some((s) => s.column === 2)).toBe(false)
  })

  it("preserves the non-removed slots", () => {
    const slots = makeGrid(2, 3)
    const result = removeColumn(slots, 2, 3, MachineType.SNACK)
    expect(result.slots.map((s) => s.labelCode)).toEqual([
      "A-1", "A-2", "B-1", "B-2",
    ])
  })

  it("does not remove a column when at minColumns (2)", () => {
    const slots = makeGrid(2, 2)
    const result = removeColumn(slots, 2, 2, MachineType.SNACK)
    expect(result.slots).toHaveLength(4)
    expect(result.columns).toBe(2)
  })
})

// ─── addSlotToRow ─────────────────────────────────────────────────────────────

describe("addSlotToRow", () => {
  it("adds exactly one slot to the target row", () => {
    const slots = makeGrid(2, 2)
    const result = addSlotToRow(slots, "A", MachineType.SNACK, MACHINE_ID, ORG_ID)
    const rowA = result.filter((s) => s.row === "A")
    expect(rowA).toHaveLength(3)
  })

  it("does not touch other rows", () => {
    const slots = makeGrid(2, 2)
    const result = addSlotToRow(slots, "A", MachineType.SNACK, MACHINE_ID, ORG_ID)
    const rowB = result.filter((s) => s.row === "B")
    expect(rowB).toHaveLength(2)
  })

  it("new slot gets the correct labelCode", () => {
    const slots = makeGrid(1, 3)
    const result = addSlotToRow(slots, "A", MachineType.SNACK, MACHINE_ID, ORG_ID)
    const newSlot = result.find((s) => s.labelCode === "A-4")
    expect(newSlot).toBeDefined()
    expect(newSlot?.column).toBe(3)
  })

  it("does not add a slot when the row is at maxColumns for SNACK", () => {
    const slots = makeGrid(1, 6)
    const result = addSlotToRow(slots, "A", MachineType.SNACK, MACHINE_ID, ORG_ID)
    expect(result).toHaveLength(6)
  })

  it("does not add a slot when the row is at maxColumns for DRINK", () => {
    const slots = makeGrid(1, 8)
    const result = addSlotToRow(slots, "A", MachineType.DRINK, MACHINE_ID, ORG_ID)
    expect(result).toHaveLength(8)
  })
})

// ─── removeSlotFromRow ────────────────────────────────────────────────────────

describe("removeSlotFromRow", () => {
  it("removes the last slot from the target row", () => {
    const slots = makeGrid(2, 3)
    const result = removeSlotFromRow(slots, "A")
    const rowA = result.filter((s) => s.row === "A")
    expect(rowA).toHaveLength(2)
    expect(rowA.some((s) => s.labelCode === "A-3")).toBe(false)
  })

  it("does not touch other rows", () => {
    const slots = makeGrid(2, 3)
    const result = removeSlotFromRow(slots, "A")
    const rowB = result.filter((s) => s.row === "B")
    expect(rowB).toHaveLength(3)
  })

  it("does not remove if only 1 slot remains in the row", () => {
    const slots = makeGrid(1, 1)
    const result = removeSlotFromRow(slots, "A")
    expect(result).toHaveLength(1)
  })

  it("removes the correct slot (last one by column index)", () => {
    const slots = makeGrid(1, 4)
    const result = removeSlotFromRow(slots, "A")
    expect(result.map((s) => s.labelCode)).toEqual(["A-1", "A-2", "A-3"])
  })
})

// ─── Integration: addRow then removeRow returns original state ────────────────

describe("round-trip operations", () => {
  it("addRow then removeRow returns same slot count", () => {
    const original = makeGrid(3, 4)
    const after = addRow(original, 3, 4, MachineType.SNACK, MACHINE_ID, ORG_ID)
    const back = removeRow(after.slots, after.rows, MachineType.SNACK)
    expect(back.slots).toHaveLength(original.length)
    expect(back.rows).toBe(3)
  })

  it("addColumn then removeColumn returns same slot count", () => {
    const original = makeGrid(2, 3)
    const after = addColumn(original, 2, 3, MachineType.SNACK, MACHINE_ID, ORG_ID)
    const back = removeColumn(after.slots, 2, after.columns, MachineType.SNACK)
    expect(back.slots).toHaveLength(original.length)
    expect(back.columns).toBe(3)
  })

  it("addSlotToRow then removeSlotFromRow returns same row length", () => {
    const original = makeGrid(1, 3)
    const after = addSlotToRow(original, "A", MachineType.SNACK, MACHINE_ID, ORG_ID)
    const back = removeSlotFromRow(after, "A")
    expect(back.filter((s) => s.row === "A")).toHaveLength(3)
  })
})

// ─── validateSlotPrice ────────────────────────────────────────────────────────

describe("validateSlotPrice", () => {
  it("accepts zero (free item)", () => {
    expect(validateSlotPrice(0)).toBeNull()
  })

  it("accepts a normal positive price", () => {
    expect(validateSlotPrice(1.5)).toBeNull()
    expect(validateSlotPrice(9.99)).toBeNull()
  })

  it("rejects negative prices", () => {
    const err = validateSlotPrice(-0.01)
    expect(err).not.toBeNull()
    expect(err?.field).toBe("price")
  })

  it("rejects NaN", () => {
    expect(validateSlotPrice(NaN)).not.toBeNull()
  })

  it("rejects Infinity", () => {
    expect(validateSlotPrice(Infinity)).not.toBeNull()
  })
})

// ─── validateCapacity ────────────────────────────────────────────────────────

describe("validateCapacity", () => {
  it("accepts valid capacity values", () => {
    expect(validateCapacity(1)).toBeNull()
    expect(validateCapacity(10)).toBeNull()
    expect(validateCapacity(50)).toBeNull()
  })

  it("rejects zero capacity", () => {
    const err = validateCapacity(0)
    expect(err).not.toBeNull()
    expect(err?.field).toBe("capacity")
  })

  it("rejects negative capacity", () => {
    expect(validateCapacity(-5)).not.toBeNull()
  })

  it("rejects capacity over 50", () => {
    expect(validateCapacity(51)).not.toBeNull()
  })

  it("rejects non-integer capacity", () => {
    expect(validateCapacity(5.5)).not.toBeNull()
  })
})

// ─── validateCurrentQuantity ─────────────────────────────────────────────────

describe("validateCurrentQuantity", () => {
  it("accepts 0 (empty slot)", () => {
    expect(validateCurrentQuantity(0, 10)).toBeNull()
  })

  it("accepts quantity equal to capacity (full slot)", () => {
    expect(validateCurrentQuantity(10, 10)).toBeNull()
  })

  it("accepts quantity less than capacity", () => {
    expect(validateCurrentQuantity(7, 10)).toBeNull()
  })

  it("rejects quantity exceeding capacity", () => {
    const err = validateCurrentQuantity(11, 10)
    expect(err).not.toBeNull()
    expect(err?.field).toBe("currentQuantity")
  })

  it("rejects negative quantity", () => {
    expect(validateCurrentQuantity(-1, 10)).not.toBeNull()
  })

  it("rejects non-integer quantity", () => {
    expect(validateCurrentQuantity(2.5, 10)).not.toBeNull()
  })
})

// ─── updateSlot ──────────────────────────────────────────────────────────────

describe("updateSlot", () => {
  it("updates price on the correct slot", () => {
    const slots = makeGrid(1, 2)
    const target = slots[0]
    const { slots: updated, error } = updateSlot(slots, target.id, { price: 2.50 })
    expect(error).toBeNull()
    expect(updated.find((s) => s.id === target.id)?.price).toBe(2.50)
  })

  it("does not modify other slots when updating price", () => {
    const slots = makeGrid(1, 2)
    const { slots: updated } = updateSlot(slots, slots[0].id, { price: 3.00 })
    expect(updated[1].price).toBe(0)  // other slot unchanged
  })

  it("updates capacity on the correct slot", () => {
    const slots = makeGrid(1, 1)
    const { slots: updated, error } = updateSlot(slots, slots[0].id, { capacity: 20 })
    expect(error).toBeNull()
    expect(updated[0].capacity).toBe(20)
  })

  it("updates currentQuantity on the correct slot", () => {
    const slots = makeGrid(1, 1)
    // First set capacity so quantity is valid
    const { slots: withCap } = updateSlot(slots, slots[0].id, { capacity: 15 })
    const { slots: updated, error } = updateSlot(withCap, withCap[0].id, { currentQuantity: 8 })
    expect(error).toBeNull()
    expect(updated[0].currentQuantity).toBe(8)
  })

  it("returns error and unchanged slots for negative price", () => {
    const slots = makeGrid(1, 1)
    const { slots: unchanged, error } = updateSlot(slots, slots[0].id, { price: -1 })
    expect(error).not.toBeNull()
    expect(error?.field).toBe("price")
    expect(unchanged[0].price).toBe(0)  // original price preserved
  })

  it("returns error for capacity of 0", () => {
    const slots = makeGrid(1, 1)
    const { error } = updateSlot(slots, slots[0].id, { capacity: 0 })
    expect(error?.field).toBe("capacity")
  })

  it("returns error when currentQuantity exceeds capacity", () => {
    const slots = makeGrid(1, 1)
    // capacity defaults to 10; try to set quantity to 11
    const { error } = updateSlot(slots, slots[0].id, { currentQuantity: 11 })
    expect(error?.field).toBe("currentQuantity")
  })

  it("validates quantity against the new capacity when both are updated together", () => {
    const slots = makeGrid(1, 1)
    // Setting capacity=5 and quantity=5 should be valid
    const { error } = updateSlot(slots, slots[0].id, { capacity: 5, currentQuantity: 5 })
    expect(error).toBeNull()
  })

  it("returns original slots unchanged when slotId is not found", () => {
    const slots = makeGrid(1, 2)
    const { slots: result, error } = updateSlot(slots, "nonexistent-id", { price: 5 })
    expect(error).toBeNull()
    expect(result).toBe(slots)  // same reference — nothing was copied
  })
})

// ─── assignProduct ────────────────────────────────────────────────────────────

describe("assignProduct", () => {
  it("sets productId on the correct slot", () => {
    const slots = makeGrid(1, 2)
    const result = assignProduct(slots, slots[0].id, "prod-abc")
    expect(result[0].productId).toBe("prod-abc")
  })

  it("does not change other slots", () => {
    const slots = makeGrid(1, 2)
    const result = assignProduct(slots, slots[0].id, "prod-abc")
    expect(result[1].productId).toBe("")
  })

  it("overrides price when provided", () => {
    const slots = makeGrid(1, 1)
    const result = assignProduct(slots, slots[0].id, "prod-abc", 1.75)
    expect(result[0].price).toBe(1.75)
  })

  it("keeps existing price when no price override is given", () => {
    const slots = makeGrid(1, 1)
    const withPrice = assignProduct(slots, slots[0].id, "prod-abc", 2.00)
    // Re-assign same product without new price
    const result = assignProduct(withPrice, withPrice[0].id, "prod-xyz")
    expect(result[0].price).toBe(2.00)  // price preserved
  })

  it("can reassign a different product to a slot", () => {
    const slots = makeGrid(1, 1)
    const first = assignProduct(slots, slots[0].id, "prod-1", 1.00)
    const second = assignProduct(first, first[0].id, "prod-2", 1.50)
    expect(second[0].productId).toBe("prod-2")
    expect(second[0].price).toBe(1.50)
  })
})

// ─── clearProduct ─────────────────────────────────────────────────────────────

describe("clearProduct", () => {
  it("removes the productId from the slot", () => {
    const slots = makeGrid(1, 1)
    const assigned = assignProduct(slots, slots[0].id, "prod-abc", 2.00)
    const cleared = clearProduct(assigned, assigned[0].id)
    expect(cleared[0].productId).toBe("")
  })

  it("resets price to 0 when cleared", () => {
    const slots = makeGrid(1, 1)
    const assigned = assignProduct(slots, slots[0].id, "prod-abc", 2.00)
    const cleared = clearProduct(assigned, assigned[0].id)
    expect(cleared[0].price).toBe(0)
  })

  it("does not affect other slots", () => {
    const slots = makeGrid(1, 2)
    const withProducts = assignProduct(
      assignProduct(slots, slots[0].id, "prod-1", 1.00),
      slots[1].id,
      "prod-2",
      1.50
    )
    const cleared = clearProduct(withProducts, withProducts[0].id)
    expect(cleared[1].productId).toBe("prod-2")
    expect(cleared[1].price).toBe(1.50)
  })

  it("is a no-op on a slot that already has no product", () => {
    const slots = makeGrid(1, 1)
    const result = clearProduct(slots, slots[0].id)
    expect(result[0].productId).toBe("")
    expect(result[0].price).toBe(0)
  })
})

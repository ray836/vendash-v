/**
 * Inventory forecast — the single source of truth for "what should we order?"
 *
 * Every reorder surface (the "What to Order" suggestions, the auto-populate cron,
 * the order-item context tags, the low-stock email, and the products "Days Left"
 * column) MUST derive its numbers from these helpers so they can never disagree.
 *
 * Pure functions only — no DB, no session. Callers fetch sales/inventory and pass
 * the raw numbers in.
 */

/** Days from placing an order to the product being stocked and sellable. */
export const LEAD_TIME_DAYS = 7
/** Order now if stock runs out within this window (2× lead time = 14 days). */
export const PROJECTED_LOW_WINDOW_DAYS = LEAD_TIME_DAYS * 2
/** Secondary window used only to pad an order up to the minimum. */
export const PAD_WINDOW_DAYS = 30
/** Minimum order value before padding kicks in. */
export const MIN_ORDER_TOTAL = 50
/** Weeks of stock to buy for a velocity-driven (projected_low) reorder. */
export const RESTOCK_WEEKS = 3
/** Fraction of shelf life by which a case must sell through to be worth ordering. */
export const SHELF_LIFE_SELLTHROUGH = 0.75

export type OrderReason = "out_of_stock" | "insufficient_stock" | "projected_low"

/**
 * Weighted daily sales velocity: 60% of the recent 7-day rate + 40% of the
 * 35-day rate. Weighting recent sales higher reacts faster to demand changes
 * while the longer window smooths noise.
 */
export function weightedAvgDailySales(unitsSold7: number, unitsSold35: number): number {
  return (unitsSold7 / 7) * 0.6 + (unitsSold35 / 35) * 0.4
}

/**
 * Whole days until `currentQty` is depleted at the given velocity.
 * Returns null when the product has no sales signal (can't project).
 */
export function daysUntilOut(currentQty: number, avgDailySales: number): number | null {
  return avgDailySales > 0 ? Math.round(currentQty / avgDailySales) : null
}

/**
 * Why a product needs ordering now, or null if it doesn't.
 * - out_of_stock: storage empty and the machine has unfilled capacity
 * - insufficient_stock: storage can't fully refill the machine's empty slots
 * - projected_low: storage will run out within the lead-time window
 */
export function classifyPrimaryReason(p: {
  storageQty: number
  totalSlotDeficit: number
  unitsToOrder: number
  daysUntilStorageOut: number | null
}): OrderReason | null {
  if (p.storageQty <= 0 && p.totalSlotDeficit > 0) return "out_of_stock"
  if (p.totalSlotDeficit > 0 && p.unitsToOrder > 0) return "insufficient_stock"
  if (p.daysUntilStorageOut !== null && p.daysUntilStorageOut < PROJECTED_LOW_WINDOW_DAYS) {
    return "projected_low"
  }
  return null
}

/**
 * Base number of cases to order for a primary need, before any shelf-life cap.
 * Velocity-driven needs buy RESTOCK_WEEKS of stock; refill needs buy exactly the
 * machine deficit. Always at least one case.
 */
export function basePrimaryCases(p: {
  reason: OrderReason
  unitsToOrder: number
  avgDailySales: number
  caseSize: number
}): number {
  const units =
    p.reason === "projected_low" ? p.avgDailySales * 7 * RESTOCK_WEEKS : p.unitsToOrder
  return Math.max(1, Math.ceil(units / Math.max(1, p.caseSize)))
}

/**
 * Cap a case count so we never order more than can sell before expiry.
 * Returns the (possibly reduced) count, or 0 when the product would spoil first
 * — callers treat 0 as "skip this product".
 */
export function shelfLifeCappedCases(p: {
  baseCases: number
  avgDailySales: number
  currentInventory: number
  caseSize: number
  shelfLifeDays?: number | null
}): number {
  if (!p.shelfLifeDays) return p.baseCases
  const maxSellableUnits = p.avgDailySales * p.shelfLifeDays - p.currentInventory
  const maxCases = Math.floor(maxSellableUnits / Math.max(1, p.caseSize))
  if (maxCases <= 0) return 0
  return Math.min(p.baseCases, maxCases)
}

/**
 * Whether a single case will sell through comfortably before it expires.
 * Used to decide if a slow-moving product is safe to add as order padding.
 */
export function sellsThroughBeforeExpiry(p: {
  avgDailySales: number
  caseSize: number
  shelfLifeDays?: number | null
}): boolean {
  if (!p.shelfLifeDays) return true
  if (p.avgDailySales <= 0) return false
  const daysToSellOneCase = p.caseSize / p.avgDailySales
  return daysToSellOneCase <= p.shelfLifeDays * SHELF_LIFE_SELLTHROUGH
}

/** Fractional days between a past date and `now` (never negative). */
export function daysSince(date: Date | string, now: Date = new Date()): number {
  const then = new Date(date).getTime()
  return Math.max(0, (now.getTime() - then) / 86_400_000)
}

/**
 * Project how many units remain in a slot given its last counted quantity, the
 * per-slot daily sales rate, and days elapsed since that count. Floored at 0.
 * With no velocity or no elapsed time it returns the last count unchanged.
 */
export function projectedRemaining(
  lastQty: number,
  perSlotDailySales: number,
  daysElapsed: number
): number {
  if (perSlotDailySales <= 0 || daysElapsed <= 0) return lastQty
  return Math.max(0, Math.round(lastQty - perSlotDailySales * daysElapsed))
}

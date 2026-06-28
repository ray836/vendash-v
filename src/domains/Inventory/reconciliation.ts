/**
 * Manual sales reconciliation — pure helpers.
 *
 * When an owner without card-reader telemetry restocks, they enter how many
 * units are physically LEFT in each slot. We infer units sold from the drop
 * since the last known count, then spread those sales across the elapsed days
 * so the forecast engine sees a smooth daily velocity (see inventoryForecast).
 *
 * No DB, no side effects — unit-testable.
 */

/** Sales older than this don't affect the weighted velocity window, so we never
 * spread across more days than this (also bounds how many rows we create). */
export const MAX_SPREAD_DAYS = 35

/** Units sold since the last count = the drop in slot quantity, never negative. */
export function inferUnitsSold(lastKnownQty: number, leftNow: number): number {
  return Math.max(0, lastKnownQty - leftNow)
}

/**
 * Distribute `total` units evenly across `days` days, returning one quantity per
 * day ordered oldest → most recent. The remainder is placed on the most-recent
 * days. `days` is clamped to [1, MAX_SPREAD_DAYS]. Returns [] when nothing sold.
 *
 * Example: spreadSalesOverDays(30, 14) → fourteen entries summing to 30 (≈2/day).
 */
export function spreadSalesOverDays(total: number, days: number): number[] {
  if (total <= 0) return []
  const n = Math.max(1, Math.min(Math.floor(days), MAX_SPREAD_DAYS))
  const base = Math.floor(total / n)
  const remainder = total - base * n
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    // The last `remainder` days (most recent) each get one extra unit.
    out.push(base + (n - i <= remainder ? 1 : 0))
  }
  return out
}

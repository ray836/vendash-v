/**
 * Projected on-hand — estimate what's physically left in each slot *now*, given
 * the last counted level and sales velocity. This is what makes Days Left,
 * reorder timing, and the "needs filling" signal accurate BETWEEN restock visits
 * (counts otherwise only refresh when someone restocks).
 *
 * Velocity is per-product (org-wide); we split it evenly across the slots holding
 * that product. Slots never counted (lastCountedAt null) are returned unchanged.
 */
import { daysSince, projectedRemaining } from "./inventoryForecast"

export interface ProjectableSlot {
  id: string
  productId: string | null | undefined
  currentQuantity: number
  lastCountedAt?: Date | string | null
}

/**
 * Map each slot id → projected current quantity.
 * @param velocityByProduct product id → weighted avg daily sales (units/day)
 */
export function projectSlotQuantities(
  slots: ProjectableSlot[],
  velocityByProduct: Map<string, number>,
  now: Date = new Date()
): Map<string, number> {
  // How many slots hold each product (to split product velocity per slot)
  const slotsPerProduct = new Map<string, number>()
  for (const s of slots) {
    if (s.productId) slotsPerProduct.set(s.productId, (slotsPerProduct.get(s.productId) ?? 0) + 1)
  }

  const projected = new Map<string, number>()
  for (const s of slots) {
    if (!s.productId || !s.lastCountedAt) {
      projected.set(s.id, s.currentQuantity)
      continue
    }
    const productVelocity = velocityByProduct.get(s.productId) ?? 0
    const perSlotVelocity = productVelocity / Math.max(1, slotsPerProduct.get(s.productId) ?? 1)
    projected.set(
      s.id,
      projectedRemaining(s.currentQuantity, perSlotVelocity, daysSince(s.lastCountedAt, now))
    )
  }
  return projected
}

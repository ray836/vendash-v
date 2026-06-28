"use server"

import { db } from "@/infrastructure/database"
import { PreKitRepository } from "@/infrastructure/repositories/PreKitRepository"
import { VendingMachineRepository } from "@/infrastructure/repositories/VendingMachineRepository"
import { LocationRepository } from "@/infrastructure/repositories/LocationRepository"
import { InventoryRepository } from "@/infrastructure/repositories/InventoryRepository"
import { SlotRepository } from "@/infrastructure/repositories/SlotRepository"
import * as PreKitService from "@/domains/PreKit/PreKitService"
import { auth } from "@/lib/auth"

const RESTOCK_THRESHOLD = 30 // % — slots at or below this are flagged

export async function getMachinesWithRestockStatus() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  try {
    const machineRepo = new VendingMachineRepository(db)
    const locationRepo = new LocationRepository(db)
    const preKitRepo = new PreKitRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const slotRepo = new SlotRepository(db)

    const [machines, locations, preKits, inventoryList, allSlots] = await Promise.all([
      machineRepo.findByOrganizationId(organizationId),
      locationRepo.findByOrganizationId(organizationId),
      PreKitService.getOrgPreKits(preKitRepo, organizationId),
      inventoryRepo.findByOrganizationId(organizationId),
      slotRepo.findByOrganizationId(organizationId),
    ])

    const locationMap = new Map(locations.map((l) => [l.id, l.name]))
    const inventoryMap = new Map(inventoryList.map((inv) => [inv.productId, inv.storage]))

    // Compute per-machine slot stats
    const slotsByMachine = new Map<string, { total: number; low: number; empty: number }>()
    for (const slot of allSlots) {
      if (!slot.productId) continue // unassigned slot, skip
      const cap = slot.capacity ?? 10
      const qty = slot.currentQuantity ?? 0
      const fillPct = cap > 0 ? (qty / cap) * 100 : 100
      const stats = slotsByMachine.get(slot.machineId) ?? { total: 0, low: 0, empty: 0 }
      stats.total++
      if (fillPct === 0) stats.empty++
      else if (fillPct <= RESTOCK_THRESHOLD) stats.low++
      slotsByMachine.set(slot.machineId, stats)
    }

    // Pick one non-STOCKED prekit per machine (OPEN takes priority over PICKED)
    const preKitByMachine = new Map<string, (typeof preKits)[0]>()
    for (const pk of preKits) {
      if (pk.status === "STOCKED") continue
      const existing = preKitByMachine.get(pk.machineId)
      if (!existing || pk.status === "OPEN") {
        preKitByMachine.set(pk.machineId, pk)
      }
    }

    return {
      success: true,
      data: machines.map((m) => {
        const pk = preKitByMachine.get(m.id) ?? null
        const slots = slotsByMachine.get(m.id) ?? { total: 0, low: 0, empty: 0 }
        const needsRestock = slots.empty > 0 || slots.low > 0
        return {
          id: m.id,
          locationId: m.locationId,
          locationName: locationMap.get(m.locationId) ?? null,
          model: m.model,
          machineStatus: m.status,
          slotStats: slots,
          needsRestock,
          preKit: pk
            ? {
                ...pk,
                items: pk.items.map((item) => ({
                  ...item,
                  inStock: inventoryMap.get(item.productId) ?? 0,
                })),
              }
            : null,
        }
      }),
    }
  } catch (error) {
    console.error("getMachinesWithRestockStatus:", error)
    return { success: false, error: "Failed to load machines" }
  }
}

export async function generateAllRestockLists() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  try {
    const machineRepo = new VendingMachineRepository(db)
    const preKitRepo = new PreKitRepository(db)
    const slotRepo = await import("@/infrastructure/repositories/SlotRepository").then(
      (m) => new m.SlotRepository(db)
    )

    const machines = await machineRepo.findByOrganizationId(organizationId)

    const results = await Promise.allSettled(
      machines.map((m) =>
        PreKitService.generatePreKitForMachine(preKitRepo, slotRepo, machineRepo, {
          machineId: m.id,
          userId: session.user.id,
          restockThreshold: 30,
        })
      )
    )

    const succeeded = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length
    return { success: true, succeeded, failed }
  } catch (error) {
    console.error("generateAllRestockLists:", error)
    return { success: false, error: "Failed to generate restock lists" }
  }
}

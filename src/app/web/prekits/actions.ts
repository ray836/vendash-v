"use server"

import { db } from "@/infrastructure/database"
import { PreKitRepository } from "@/infrastructure/repositories/PreKitRepository"
import { SlotRepository } from "@/infrastructure/repositories/SlotRepository"
import { VendingMachineRepository } from "@/infrastructure/repositories/VendingMachineRepository"
import { InventoryRepository } from "@/infrastructure/repositories/InventoryRepository"
import { InventoryTransactionRepository } from "@/infrastructure/repositories/InventoryTransactionRepository"
import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import * as PreKitService from "@/domains/PreKit/PreKitService"
import * as OrderService from "@/domains/Order/OrderService"
import { OrderRepository } from "@/infrastructure/repositories/OrderRepository"
import { auth } from "@/lib/auth"

export async function getOrgMachines() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const machineRepo = new VendingMachineRepository(db)
    const machines = await machineRepo.findByOrganizationId(organizationId)
    return { success: true, data: machines.map((m) => ({ id: m.id, locationId: m.locationId })) }
  } catch (error) {
    return { success: false, error: "Failed to fetch machines" }
  }
}

export async function generatePreKit(machineId: string, restockThreshold = 30) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const preKitRepo = new PreKitRepository(db)
    const slotRepo = new SlotRepository(db)
    const machineRepo = new VendingMachineRepository(db)
    const result = await PreKitService.generatePreKitForMachine(preKitRepo, slotRepo, machineRepo, {
      machineId,
      userId: session.user.id,
      restockThreshold,
    })
    return { success: true, data: result.preKit }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to generate pre-kit" }
  }
}

export async function getOrgPreKits() {
  const session = await auth()
  if (!session) return { success: false, error: 'Unauthorized' }
  const orgId = session.user.organizationId
  try {
    const preKitRepo = new PreKitRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const [preKits, inventoryList] = await Promise.all([
      PreKitService.getOrgPreKits(preKitRepo, orgId),
      inventoryRepo.findByOrganizationId(orgId),
    ])
    const inventoryMap = new Map(inventoryList.map((inv) => [inv.productId, inv.storage]))
    const preKitsWithStock = preKits.map((pk) => ({
      ...pk,
      items: pk.items.map((item) => ({ ...item, inStock: inventoryMap.get(item.productId) ?? 0 })),
    }))
    return { success: true, data: preKitsWithStock }
  } catch (error) {
    console.error("Error fetching organization pre-kits:", error)
    return { success: false, error: "Failed to fetch pre-kits" }
  }
}

export async function pickPreKit(preKitId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const preKitRepo = new PreKitRepository(db)
    await PreKitService.pickPreKit(preKitRepo, preKitId, session.user.id)
    return { success: true }
  } catch (error) {
    console.error("Failed to pick pre-kit:", error)
    return { success: false, error: "Failed to pick pre-kit" }
  }
}

export async function stockPreKit(preKitId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const preKitRepo = new PreKitRepository(db)
    const slotRepo = new SlotRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const inventoryTransactionRepo = new InventoryTransactionRepository(db)

    const result = await PreKitService.stockPreKit(preKitRepo, slotRepo, inventoryRepo, inventoryTransactionRepo, preKitId, session.user.id, session.user.organizationId)
    console.log(result)

    if (!result.success) return { success: false, error: result.error }
    return { success: true }
  } catch (error) {
    console.error("Error stocking pre-kit:", error)
    return { success: false, error: "Failed to stock pre-kit" }
  }
}

export async function recalculatePreKit(preKitId: string, restockThreshold?: number) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const preKitRepo = new PreKitRepository(db)
    const slotRepo = new SlotRepository(db)

    const result = await PreKitService.recalculatePreKit(preKitRepo, slotRepo, { preKitId, userId: session.user.id, restockThreshold })
    return { success: true, data: result }
  } catch (error) {
    console.error("Error recalculating pre-kit:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to recalculate pre-kit" }
  }
}

export async function orderShortItems(preKitId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const preKitRepo = new PreKitRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const productRepo = new ProductRepository(db)
    const orderRepo = new OrderRepository(db)

    const items = await preKitRepo.getItems(preKitId)

    // Aggregate total units needed per product across all slots
    const totalNeeded = new Map<string, number>()
    for (const item of items) {
      totalNeeded.set(item.productId, (totalNeeded.get(item.productId) ?? 0) + item.quantity)
    }

    const inventoryList = await inventoryRepo.findByOrganizationId(organizationId)
    const stockMap = new Map(inventoryList.map((inv) => [inv.productId, inv.storage]))

    let addedCount = 0
    for (const [productId, needed] of totalNeeded) {
      const inStock = stockMap.get(productId) ?? 0
      const deficit = needed - inStock
      if (deficit <= 0) continue

      const product = await productRepo.findById(productId)
      if (!product) continue

      const casesNeeded = Math.ceil(deficit / product.caseSize)
      await OrderService.addItemToCurrentOrder(orderRepo, productRepo, {
        organizationId,
        productId,
        quantity: casesNeeded,
        userId: session.user.id,
      })
      addedCount++
    }

    return { success: true, addedCount }
  } catch (error) {
    console.error("Error ordering short items:", error)
    return { success: false, error: "Failed to add items to order" }
  }
}

export async function updatePreKitItemQuantities(
  preKitId: string,
  items: { id: string; slotId: string; productId: string; quantity: number }[]
) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const preKitRepo = new PreKitRepository(db)
    await PreKitService.updatePreKitItems(preKitRepo, { id: preKitId, userId: session.user.id, items })
    return { success: true }
  } catch (error) {
    console.error("Error updating pre-kit items:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to update items" }
  }
}

export async function deletePreKit(preKitId: string) {
  try {
    const preKitRepo = new PreKitRepository(db)
    await PreKitService.deletePreKit(preKitRepo, preKitId)
    return { success: true }
  } catch (error) {
    console.error("Error deleting pre-kit:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete pre-kit" }
  }
}

"use server"

import { db } from "@/infrastructure/database"
import { OrderRepository } from "@/infrastructure/repositories/OrderRepository"
import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import { InventoryRepository } from "@/infrastructure/repositories/InventoryRepository"
import { InventoryTransactionRepository } from "@/infrastructure/repositories/InventoryTransactionRepository"
import { PreKitRepository } from "@/infrastructure/repositories/PreKitRepository"
import { SlotRepository } from "@/infrastructure/repositories/SlotRepository"
import { TransactionRepository } from "@/infrastructure/repositories/TransactionRepository"
import * as OrderService from "@/domains/Order/OrderService"
import * as PreKitService from "@/domains/PreKit/PreKitService"
import { PlaceCurrentOrderRequestDTO } from "@/domains/Order/schemas/orderDTOs"
import { auth } from "@/lib/auth"
import {
  PROJECTED_LOW_WINDOW_DAYS,
  PAD_WINDOW_DAYS,
  MIN_ORDER_TOTAL,
  weightedAvgDailySales,
  daysUntilOut,
  classifyPrimaryReason,
  basePrimaryCases,
  shelfLifeCappedCases,
  sellsThroughBeforeExpiry,
} from "@/domains/Inventory/inventoryForecast"
import { projectSlotQuantities } from "@/domains/Inventory/projection"

export async function testAddItemToOrder() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const orderRepo = new OrderRepository(db)
    const productRepo = new ProductRepository(db)
    const result = await OrderService.addItemToCurrentOrder(orderRepo, productRepo, {
      organizationId,
      productId: "1",
      quantity: 1,
      userId: session.user.id,
    })
    return { success: true, data: result }
  } catch (error) {
    console.error("Error adding test item to order:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to add test item" }
  }
}

export async function addProductToNextOrder(productId: string, quantity = 1) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const orderRepo = new OrderRepository(db)
    const productRepo = new ProductRepository(db)
    const result = await OrderService.addItemToCurrentOrder(orderRepo, productRepo, {
      organizationId,
      productId,
      quantity,
      userId: session.user.id,
    })
    return { success: true, data: result }
  } catch (error) {
    console.error("Error adding product to order:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to add product to order" }
  }
}

export async function getCurrentOrder() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const orderRepo = new OrderRepository(db)
    const productRepo = new ProductRepository(db)
    const result = await OrderService.getCurrentOrder(orderRepo, productRepo, organizationId)
    return { success: true, order: result }
  } catch (error) {
    console.error("Error getting current order:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to get current order" }
  }
}

export async function getCurrentOrderWithInventory() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const orderRepo = new OrderRepository(db)
    const productRepo = new ProductRepository(db)
    const inventoryRepo = new InventoryRepository(db)

    const [order, inventoryList] = await Promise.all([
      OrderService.getCurrentOrder(orderRepo, productRepo, organizationId),
      inventoryRepo.findByOrganizationId(organizationId),
    ])

    const inventoryMap = new Map(inventoryList.map((inv) => [inv.productId, { storage: inv.storage, machines: inv.machines }]))

    return {
      success: true,
      order,
      inventory: inventoryMap,
    }
  } catch (error) {
    console.error("Error getting current order with inventory:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to get order", order: null, inventory: new Map() }
  }
}

export async function updateOrderItemQuantity(orderItemId: string, orderId: string, quantity: number) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const orderRepo = new OrderRepository(db)
    const result = await OrderService.updateOrderItemQuantity(orderRepo, { orderItemId, orderId, quantity, userId: session.user.id })
    return { success: true, data: result }
  } catch (error) {
    console.error("Error updating order item quantity:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to update quantity" }
  }
}

export async function removeOrderItem(orderItemId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const orderRepo = new OrderRepository(db)
    await OrderService.removeOrderItem(orderRepo, { orderItemId, userId: session.user.id })
    return { success: true }
  } catch (error) {
    console.error("Error removing order item:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to remove item" }
  }
}

export async function placeCurrentOrder(request: PlaceCurrentOrderRequestDTO) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const orderRepo = new OrderRepository(db)
    const productRepo = new ProductRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const inventoryTransactionRepo = new InventoryTransactionRepository(db)
    const order = await OrderService.placeCurrentOrder(orderRepo, productRepo, inventoryRepo, inventoryTransactionRepo, request)
    return { success: true, order }
  } catch (error) {
    console.error("Error placing order:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to place order" }
  }
}

export async function getOrderHistory() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const orderRepo = new OrderRepository(db)
    const allOrders = await orderRepo.findByOrganizationId(organizationId)
    const placedOrders = allOrders.filter((o) => o.status !== "draft")

    const result = await Promise.all(
      placedOrders.map(async (order) => {
        const items = await orderRepo.findOrderItems(order.id)
        return {
          id: order.id,
          date: order.orderPlacedDate
            ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(order.orderPlacedDate)
            : new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(order.createdAt),
          status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
          items: items.length,
          total: order.totalAmount,
        }
      })
    )

    // Most recent first
    result.sort((a, b) => b.id.localeCompare(a.id))
    return { success: true, orders: result }
  } catch (error) {
    console.error("Error fetching order history:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch order history", orders: [] }
  }
}

export async function getOrderById(orderId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const orderRepo = new OrderRepository(db)
    const productRepo = new ProductRepository(db)

    const order = await orderRepo.findById(orderId)
    if (!order) return { success: false, error: "Order not found", order: null }

    const items = await orderRepo.findOrderItems(orderId)

    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await productRepo.findById(item.productId)
        return {
          id: item.id,
          productId: item.productId,
          name: product?.name ?? "Unknown Product",
          image: product?.image ?? "",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          caseSize: product?.caseSize ?? 1,
        }
      })
    )

    const subtotal = itemsWithProducts.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: `ORD-${order.id.slice(0, 8).toUpperCase()}`,
        date: order.orderPlacedDate
          ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(order.orderPlacedDate)
          : new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(order.createdAt),
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
        items: itemsWithProducts,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: order.taxPaid ?? 0,
        shipping: order.shippingCost ?? 0,
        total: order.totalAmount,
      },
    }
  } catch (error) {
    console.error("Error fetching order:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch order", order: null }
  }
}

export async function getInventoryOrderSuggestions() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  try {
    const slotRepo = new SlotRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const productRepo = new ProductRepository(db)
    const orderRepo = new OrderRepository(db)
    const txRepo = new TransactionRepository(db)

    const now = new Date()
    const start35Days = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000)
    const start7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [allSlots, inventoryList, allProducts, txData, currentOrder] = await Promise.all([
      slotRepo.findByOrganizationId(organizationId),
      inventoryRepo.findByOrganizationId(organizationId),
      productRepo.findByOrganizationId(organizationId),
      txRepo.findByOrganizationIdWithItems(organizationId, start35Days, now),
      OrderService.getCurrentOrder(orderRepo, productRepo, organizationId).catch(() => null),
    ])

    const inventoryMap = new Map(inventoryList.map((inv) => [inv.productId, inv]))
    const productMap = new Map(allProducts.map((p) => [p.id, p]))
    // Map productId → cases already in the current draft order
    const existingOrderQtyMap = new Map<string, number>(
      (currentOrder?.orderItems ?? []).map((i) => [i.product.id, i.quantity])
    )

    // Two sales windows: last 35 days (trend) and last 7 days (recent velocity)
    const salesMap35 = new Map<string, number>()
    const salesMap7 = new Map<string, number>()
    for (const tx of txData) {
      for (const item of tx.items) {
        if (item.productId) {
          salesMap35.set(item.productId, (salesMap35.get(item.productId) ?? 0) + item.quantity)
          if (new Date(tx.createdAt) >= start7Days) {
            salesMap7.set(item.productId, (salesMap7.get(item.productId) ?? 0) + item.quantity)
          }
        }
      }
    }

    // Project current slot quantities (depletes since last count) so deficits +
    // on-hand reflect reality between restocks.
    const velocityByProduct = new Map<string, number>()
    for (const pid of new Set([...salesMap35.keys(), ...salesMap7.keys()])) {
      velocityByProduct.set(pid, weightedAvgDailySales(salesMap7.get(pid) ?? 0, salesMap35.get(pid) ?? 0))
    }
    const projectedQtyById = projectSlotQuantities(allSlots, velocityByProduct, now)

    const slotsByProduct = new Map<string, { totalCapacity: number; totalCurrentQty: number; machineIds: Set<string> }>()
    for (const slot of allSlots) {
      if (!slot.productId) continue
      const projQty = projectedQtyById.get(slot.id) ?? slot.currentQuantity
      const existing = slotsByProduct.get(slot.productId)
      if (existing) {
        existing.totalCapacity += slot.capacity
        existing.totalCurrentQty += projQty
        existing.machineIds.add(slot.machineId)
      } else {
        slotsByProduct.set(slot.productId, {
          totalCapacity: slot.capacity,
          totalCurrentQty: projQty,
          machineIds: new Set([slot.machineId]),
        })
      }
    }

    const suggestions: {
      productId: string
      productName: string
      productImage: string
      caseCost: number
      caseSize: number
      totalSlotDeficit: number
      unitsToOrder: number
      machineCount: number
      storageQty: number
      machinesQty: number
      avgWeeklySales: number
      daysUntilStorageOut: number | null
      reason: "out_of_stock" | "insufficient_stock" | "projected_low"
      recommendedCases: number
      casesAlreadyInOrder: number
    }[] = []

    for (const [productId, slotData] of slotsByProduct.entries()) {
      const product = productMap.get(productId)
      if (!product) continue

      const inv = inventoryMap.get(productId)
      const storageQty = inv?.storage ?? 0
      // Projected units currently in machines (slots are the source of truth)
      const machinesQty = slotData.totalCurrentQty
      const currentInventory = storageQty + machinesQty
      const caseSize = Number(product.caseSize) || 1

      const totalSlotDeficit = Math.max(0, slotData.totalCapacity - slotData.totalCurrentQty)
      const unitsToOrder = Math.max(0, totalSlotDeficit - storageQty)

      const avgDailySales = weightedAvgDailySales(salesMap7.get(productId) ?? 0, salesMap35.get(productId) ?? 0)
      const avgWeeklySales = avgDailySales * 7
      const daysUntilStorageOut = daysUntilOut(storageQty, avgDailySales)

      const reason = classifyPrimaryReason({ storageQty, totalSlotDeficit, unitsToOrder, daysUntilStorageOut })
      if (!reason) continue

      // Cap to what can sell before expiry (mirrors auto-populate so the two never disagree)
      const baseCases = basePrimaryCases({ reason, unitsToOrder, avgDailySales, caseSize })
      const totalRecommendedCases = shelfLifeCappedCases({
        baseCases,
        avgDailySales,
        currentInventory,
        caseSize,
        shelfLifeDays: product.shelfLifeDays,
      })
      if (totalRecommendedCases === 0) continue

      const casesAlreadyInOrder = existingOrderQtyMap.get(productId) ?? 0
      const recommendedCases = Math.max(0, totalRecommendedCases - casesAlreadyInOrder)

      // Skip if the current order already covers the full recommendation
      if (recommendedCases === 0) continue

      suggestions.push({
        productId,
        productName: product.name,
        productImage: product.image ?? "",
        caseCost: Number(product.caseCost ?? 0),
        caseSize,
        totalSlotDeficit,
        unitsToOrder,
        machineCount: slotData.machineIds.size,
        storageQty,
        machinesQty,
        avgWeeklySales: Math.round(avgWeeklySales * 10) / 10,
        daysUntilStorageOut,
        reason,
        recommendedCases,
        casesAlreadyInOrder,
      })
    }

    const urgencyOrder = { out_of_stock: 0, insufficient_stock: 1, projected_low: 2 }
    suggestions.sort(
      (a, b) => urgencyOrder[a.reason] - urgencyOrder[b.reason] || a.productName.localeCompare(b.productName)
    )

    return { success: true as const, suggestions }
  } catch (error) {
    console.error("getInventoryOrderSuggestions:", error)
    return { success: false as const, error: "Failed to get suggestions", suggestions: [] }
  }
}

export async function getRestockOrderSuggestions() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  try {
    const preKitRepo = new PreKitRepository(db)
    const productRepo = new ProductRepository(db)
    const orderRepo = new OrderRepository(db)
    const inventoryRepo = new InventoryRepository(db)

    const [allPreKits, currentOrder, inventoryList] = await Promise.all([
      PreKitService.getOrgPreKits(preKitRepo, organizationId),
      OrderService.getCurrentOrder(orderRepo, productRepo, organizationId).catch(() => null),
      inventoryRepo.findByOrganizationId(organizationId),
    ])
    const inventoryMap = new Map(inventoryList.map((inv) => [inv.productId, { storage: inv.storage, machines: inv.machines }]))

    const activePrekits = allPreKits.filter((pk) => pk.status !== "STOCKED")

    // Aggregate unit needs by productId across all active prekit items
    const needsMap = new Map<string, { totalUnits: number; machineCount: number }>()
    for (const pk of activePrekits) {
      const seenProducts = new Set<string>()
      for (const item of pk.items) {
        const existing = needsMap.get(item.productId)
        const isNewMachine = !seenProducts.has(item.productId)
        seenProducts.add(item.productId)
        if (existing) {
          existing.totalUnits += item.quantity
          if (isNewMachine) existing.machineCount++
        } else {
          needsMap.set(item.productId, { totalUnits: item.quantity, machineCount: 1 })
        }
      }
    }

    if (needsMap.size === 0) {
      return { success: true as const, suggestions: [], activePrekitCount: 0 }
    }

    const existingProductIds = new Set(
      (currentOrder?.orderItems ?? []).map((i) => i.product.id)
    )

    const suggestions = await Promise.all(
      Array.from(needsMap.entries()).map(async ([productId, needs]) => {
        const product = await productRepo.findById(productId)
        if (!product) return null
        const caseSize = Number(product.caseSize) || 1
        const recommendedCases = Math.ceil(needs.totalUnits / caseSize)
        const inv = inventoryMap.get(productId)
        return {
          productId,
          productName: product.name,
          productImage: product.image ?? "",
          caseCost: Number(product.caseCost ?? 0),
          caseSize,
          totalUnitsNeeded: needs.totalUnits,
          machineCount: needs.machineCount,
          recommendedCases,
          alreadyInOrder: existingProductIds.has(productId),
          storageQty: inv?.storage ?? 0,
          machinesQty: inv?.machines ?? 0,
          coveredByStorage: (inv?.storage ?? 0) >= needs.totalUnits,
        }
      })
    )

    const filtered = suggestions
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => a.productName.localeCompare(b.productName))

    return { success: true as const, suggestions: filtered, activePrekitCount: activePrekits.length }
  } catch (error) {
    console.error("getRestockOrderSuggestions:", error)
    return { success: false as const, error: "Failed to get suggestions", suggestions: [], activePrekitCount: 0 }
  }
}

export async function getOrderItemsContext(productIds: string[]): Promise<{
  success: boolean
  context: Record<string, {
    reason: "out_of_stock" | "insufficient_stock" | "projected_low" | "pad_to_minimum" | null
    daysUntilStorageOut: number | null
    storageQty: number
    unitsShort: number
  }>
}> {
  if (productIds.length === 0) return { success: true, context: {} }
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  try {
    const slotRepo = new SlotRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const txRepo = new TransactionRepository(db)

    const now = new Date()
    const start35Days = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000)
    const start7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [allSlots, inventoryList, txData] = await Promise.all([
      slotRepo.findByOrganizationId(organizationId),
      inventoryRepo.findByOrganizationId(organizationId),
      txRepo.findByOrganizationIdWithItems(organizationId, start35Days, now),
    ])

    const inventoryMap = new Map(inventoryList.map((inv) => [inv.productId, inv]))

    const salesMap35 = new Map<string, number>()
    const salesMap7 = new Map<string, number>()
    for (const tx of txData) {
      for (const item of tx.items) {
        if (item.productId && productIds.includes(item.productId)) {
          salesMap35.set(item.productId, (salesMap35.get(item.productId) ?? 0) + item.quantity)
          if (new Date(tx.createdAt) >= start7Days) {
            salesMap7.set(item.productId, (salesMap7.get(item.productId) ?? 0) + item.quantity)
          }
        }
      }
    }

    const slotsByProduct = new Map<string, { totalCapacity: number; totalCurrentQty: number }>()
    for (const slot of allSlots) {
      if (!slot.productId || !productIds.includes(slot.productId)) continue
      const existing = slotsByProduct.get(slot.productId)
      if (existing) {
        existing.totalCapacity += slot.capacity
        existing.totalCurrentQty += slot.currentQuantity
      } else {
        slotsByProduct.set(slot.productId, { totalCapacity: slot.capacity, totalCurrentQty: slot.currentQuantity })
      }
    }

    const context: Record<string, { reason: "out_of_stock" | "insufficient_stock" | "projected_low" | "pad_to_minimum" | null; daysUntilStorageOut: number | null; storageQty: number; unitsShort: number }> = {}

    for (const productId of productIds) {
      const inv = inventoryMap.get(productId)
      const storageQty = inv?.storage ?? 0
      const slotData = slotsByProduct.get(productId)

      const avgDailySales = weightedAvgDailySales(salesMap7.get(productId) ?? 0, salesMap35.get(productId) ?? 0)
      const daysUntilStorageOut = daysUntilOut(storageQty, avgDailySales)

      let reason: "out_of_stock" | "insufficient_stock" | "projected_low" | "pad_to_minimum" | null = null
      let unitsShort = 0

      if (slotData) {
        const totalSlotDeficit = Math.max(0, slotData.totalCapacity - slotData.totalCurrentQty)
        unitsShort = Math.max(0, totalSlotDeficit - storageQty)

        reason = classifyPrimaryReason({ storageQty, totalSlotDeficit, unitsToOrder: unitsShort, daysUntilStorageOut })
        // Display-only: an item not yet urgent but trending toward a run-out within the pad window
        if (!reason && daysUntilStorageOut !== null && daysUntilStorageOut < PAD_WINDOW_DAYS) {
          reason = "pad_to_minimum"
        }
      }

      context[productId] = { reason, daysUntilStorageOut, storageQty, unitsShort }
    }

    return { success: true, context }
  } catch (error) {
    console.error("getOrderItemsContext:", error)
    return { success: true, context: {} }
  }
}

export async function getUnorderedRestockCount() {
  try {
    // Derive the count from the same source as the "Add Missing" dialog so the
    // banner number and the dialog contents can never diverge.
    const result = await getInventoryOrderSuggestions()
    if (!result.success) {
      return { success: false as const, unorderedCount: 0 }
    }
    return { success: true as const, unorderedCount: result.suggestions.length }
  } catch {
    return { success: false as const, unorderedCount: 0 }
  }
}

export async function addMultipleProductsToOrder(items: { productId: string; quantity: number }[]) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  try {
    const orderRepo = new OrderRepository(db)
    const productRepo = new ProductRepository(db)

    await OrderService.consolidateDraftOrders(orderRepo, productRepo, organizationId, session.user.id)

    for (const item of items) {
      await OrderService.addItemToCurrentOrder(orderRepo, productRepo, {
        organizationId,
        productId: item.productId,
        quantity: item.quantity,
        userId: session.user.id,
      })
    }

    return { success: true }
  } catch (error) {
    console.error("addMultipleProductsToOrder:", error)
    return { success: false, error: "Failed to add items to order" }
  }
}

// Org-parameterized variant for API clients (mobile) authenticated via getApiUser,
// mirroring addMultipleProductsToOrder which relies on the web auth() session.
export async function addProductsToOrderForOrg(
  organizationId: string,
  userId: string,
  items: { productId: string; quantity: number }[]
) {
  try {
    const orderRepo = new OrderRepository(db)
    const productRepo = new ProductRepository(db)

    await OrderService.consolidateDraftOrders(orderRepo, productRepo, organizationId, userId)

    // Each item's quantity is the desired total on the order; only top up the
    // shortfall so re-adding (or products already on the order) doesn't double up.
    const currentOrder = await orderRepo.findDraftOrderByOrganizationId(organizationId)
    const existingItems = currentOrder ? await orderRepo.findOrderItems(currentOrder.id) : []
    const onOrderByProduct = new Map<string, number>()
    for (const existing of existingItems) {
      onOrderByProduct.set(existing.productId, existing.quantity)
    }

    let added = 0
    for (const item of items) {
      const alreadyOnOrder = onOrderByProduct.get(item.productId) ?? 0
      const delta = item.quantity - alreadyOnOrder
      if (delta <= 0) continue
      await OrderService.addItemToCurrentOrder(orderRepo, productRepo, {
        organizationId,
        productId: item.productId,
        quantity: delta,
        userId,
      })
      added++
    }

    return { success: true as const, added }
  } catch (error) {
    console.error("addProductsToOrderForOrg:", error)
    return { success: false as const, error: "Failed to add items to order" }
  }
}

export async function getAllProducts() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const productRepo = new ProductRepository(db)
    const products = await productRepo.findByOrganizationId(organizationId)
    return {
      success: true,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        image: p.image,
        caseCost: p.caseCost,
        caseSize: p.caseSize,
        category: p.category,
        recommendedPrice: p.recommendedPrice,
      })),
    }
  } catch (error) {
    console.error("Error getting products:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to get products", products: [] }
  }
}

// ---------------------------------------------------------------------------
// Auto-populate draft order — runs daily via cron
// ---------------------------------------------------------------------------

export async function autoPopulateOrder(
  organizationId: string,
  userId: string
): Promise<{
  success: boolean
  primaryCount: number
  paddedCount: number
  skippedCount: number
  totalCost: number
  reachedMinimum: boolean
  error?: string
}> {
  try {
    const slotRepo = new SlotRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const productRepo = new ProductRepository(db)
    const orderRepo = new OrderRepository(db)
    const txRepo = new TransactionRepository(db)

    const now = new Date()
    const start35Days = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000)
    const start7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [allSlots, inventoryList, allProducts, txData] = await Promise.all([
      slotRepo.findByOrganizationId(organizationId),
      inventoryRepo.findByOrganizationId(organizationId),
      productRepo.findByOrganizationId(organizationId),
      txRepo.findByOrganizationIdWithItems(organizationId, start35Days, now),
    ])

    // Consolidate any orphaned draft orders first
    await OrderService.consolidateDraftOrders(orderRepo, productRepo, organizationId, userId)

    const inventoryMap = new Map(inventoryList.map((inv) => [inv.productId, inv]))
    const productMap = new Map(allProducts.map((p) => [p.id, p]))

    // Weighted sales maps: 60% recent-7-day rate, 40% 35-day rate
    const salesMap35 = new Map<string, number>()
    const salesMap7 = new Map<string, number>()
    for (const tx of txData) {
      for (const item of tx.items) {
        if (item.productId) {
          salesMap35.set(item.productId, (salesMap35.get(item.productId) ?? 0) + item.quantity)
          if (new Date(tx.createdAt) >= start7Days) {
            salesMap7.set(item.productId, (salesMap7.get(item.productId) ?? 0) + item.quantity)
          }
        }
      }
    }

    // Project current slot quantities (depletes since last count)
    const velocityByProduct = new Map<string, number>()
    for (const pid of new Set([...salesMap35.keys(), ...salesMap7.keys()])) {
      velocityByProduct.set(pid, weightedAvgDailySales(salesMap7.get(pid) ?? 0, salesMap35.get(pid) ?? 0))
    }
    const projectedQtyById = projectSlotQuantities(allSlots, velocityByProduct, now)

    // Build slot aggregates per product (using projected on-hand)
    const slotsByProduct = new Map<string, { totalCapacity: number; totalCurrentQty: number }>()
    for (const slot of allSlots) {
      if (!slot.productId) continue
      const projQty = projectedQtyById.get(slot.id) ?? slot.currentQuantity
      const existing = slotsByProduct.get(slot.productId)
      if (existing) {
        existing.totalCapacity += slot.capacity
        existing.totalCurrentQty += projQty
      } else {
        slotsByProduct.set(slot.productId, {
          totalCapacity: slot.capacity,
          totalCurrentQty: projQty,
        })
      }
    }

    type OrderCandidate = {
      productId: string
      casesToAdd: number
      caseCost: number
      daysUntilStorageOut: number | null
      reason: "out_of_stock" | "insufficient_stock" | "projected_low" | "pad_to_minimum"
    }

    const primaryItems: OrderCandidate[] = []
    const padCandidates: OrderCandidate[] = []
    let skippedCount = 0

    for (const [productId, slotData] of slotsByProduct.entries()) {
      const product = productMap.get(productId)
      if (!product) continue

      const inv = inventoryMap.get(productId)
      const storageQty = inv?.storage ?? 0
      const currentInventory = storageQty + slotData.totalCurrentQty
      const caseSize = Number(product.caseSize) || 1
      const caseCost = Number(product.caseCost) || 0

      const avgDailySales = weightedAvgDailySales(salesMap7.get(productId) ?? 0, salesMap35.get(productId) ?? 0)
      const daysUntilStorageOut = daysUntilOut(storageQty, avgDailySales)

      const totalSlotDeficit = Math.max(0, slotData.totalCapacity - slotData.totalCurrentQty)
      const unitsToOrder = Math.max(0, totalSlotDeficit - storageQty)

      const primaryReason = classifyPrimaryReason({ storageQty, totalSlotDeficit, unitsToOrder, daysUntilStorageOut })

      if (primaryReason) {
        const baseCases = basePrimaryCases({ reason: primaryReason, unitsToOrder, avgDailySales, caseSize })
        const cappedCases = shelfLifeCappedCases({
          baseCases,
          avgDailySales,
          currentInventory,
          caseSize,
          shelfLifeDays: product.shelfLifeDays,
        })
        if (cappedCases === 0) {
          skippedCount++
          continue
        }

        primaryItems.push({ productId, casesToAdd: cappedCases, caseCost, daysUntilStorageOut, reason: primaryReason })
      } else if (
        avgDailySales > 0 &&
        daysUntilStorageOut !== null &&
        daysUntilStorageOut >= PROJECTED_LOW_WINDOW_DAYS &&
        daysUntilStorageOut < PAD_WINDOW_DAYS
      ) {
        // Pad candidate: will need ordering within 30 days but not urgent yet
        if (!sellsThroughBeforeExpiry({ avgDailySales, caseSize, shelfLifeDays: product.shelfLifeDays })) {
          continue // Would expire before selling
        }
        const padCases = shelfLifeCappedCases({
          baseCases: Math.max(1, Math.ceil((avgDailySales * 14) / caseSize)),
          avgDailySales,
          currentInventory,
          caseSize,
          shelfLifeDays: product.shelfLifeDays,
        })
        if (padCases === 0) continue

        padCandidates.push({ productId, casesToAdd: padCases, caseCost, daysUntilStorageOut, reason: "pad_to_minimum" })
      }
    }

    // Sort pad candidates by urgency (soonest running out first)
    padCandidates.sort((a, b) => (a.daysUntilStorageOut ?? 999) - (b.daysUntilStorageOut ?? 999))

    const itemsToAdd = [...primaryItems]
    const primaryTotal = primaryItems.reduce((sum, i) => sum + i.casesToAdd * i.caseCost, 0)
    let paddedCount = 0

    if (primaryTotal < MIN_ORDER_TOTAL) {
      let runningTotal = primaryTotal
      const primaryIds = new Set(primaryItems.map((i) => i.productId))

      for (const candidate of padCandidates) {
        if (runningTotal >= MIN_ORDER_TOTAL) break
        if (primaryIds.has(candidate.productId)) continue

        // Only add as many cases as needed to reach $50
        const remaining = MIN_ORDER_TOTAL - runningTotal
        const casesNeeded = Math.ceil(remaining / candidate.caseCost)
        const casesToAdd = Math.min(candidate.casesToAdd, Math.max(1, casesNeeded))

        itemsToAdd.push({ ...candidate, casesToAdd, reason: "pad_to_minimum" })
        runningTotal += casesToAdd * candidate.caseCost
        paddedCount++
      }

      // If we still didn't reach $50, discard the pad items — keep only primary
      if (runningTotal < MIN_ORDER_TOTAL && paddedCount > 0) {
        itemsToAdd.splice(primaryItems.length)
        paddedCount = 0
      }
    }

    const totalCost = itemsToAdd.reduce((sum, i) => sum + i.casesToAdd * i.caseCost, 0)

    // Add all selected items to the draft order
    for (const item of itemsToAdd) {
      await OrderService.addItemToCurrentOrder(orderRepo, productRepo, {
        organizationId,
        productId: item.productId,
        quantity: item.casesToAdd,
        userId,
      })
    }

    return {
      success: true,
      primaryCount: primaryItems.length,
      paddedCount,
      skippedCount,
      totalCost,
      reachedMinimum: totalCost >= MIN_ORDER_TOTAL,
    }
  } catch (error) {
    console.error("autoPopulateOrder error:", error)
    return {
      success: false,
      primaryCount: 0,
      paddedCount: 0,
      skippedCount: 0,
      totalCost: 0,
      reachedMinimum: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

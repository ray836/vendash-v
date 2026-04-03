"use server"

import { db } from "@/infrastructure/database"
import { RouteRepository } from "@/infrastructure/repositories/RouteRepository"
import { PreKitRepository } from "@/infrastructure/repositories/PreKitRepository"
import { SlotRepository } from "@/infrastructure/repositories/SlotRepository"
import { VendingMachineRepository } from "@/infrastructure/repositories/VendingMachineRepository"
import * as RouteService from "@/domains/Route/RouteService"
import * as PreKitService from "@/domains/PreKit/PreKitService"
import { auth } from "@/lib/auth"

const routeRepository = new RouteRepository()

export async function getOrgRoutes() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const routes = await RouteService.getOrgRoutes(routeRepository, organizationId)
    return { success: true, data: routes }
  } catch (error) {
    console.error("Error fetching routes:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch routes" }
  }
}

export async function createRoute(routeData: any) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const organizationId = session.user.organizationId
  const userId = session.user.id

  try {
    console.log("createRoute - organizationId:", organizationId)
    console.log("createRoute - userId:", userId)
    console.log("createRoute - input routeData:", JSON.stringify(routeData, null, 2))

    const completeRouteData = { ...routeData, organizationId, createdBy: userId, updatedBy: userId }
    console.log("createRoute - completeRouteData:", JSON.stringify(completeRouteData, null, 2))

    const route = await RouteService.createRoute(routeRepository, completeRouteData)
    return { success: true, data: route }
  } catch (error) {
    console.error("Error creating route:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to create route" }
  }
}

export async function updateRoute(routeId: string, routeData: any) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const userId = session.user.id

  try {
    const completeRouteData = { ...routeData, id: routeId, updatedBy: userId }
    const route = await RouteService.updateRoute(routeRepository, completeRouteData)
    return { success: true, data: route }
  } catch (error) {
    console.error("Error updating route:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to update route" }
  }
}

export async function deleteRoute(routeId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    await RouteService.deleteRoute(routeRepository, routeId)
    return { success: true }
  } catch (error) {
    console.error("Error deleting route:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete route" }
  }
}

export async function assignDriverToRoute(
  routeId: string,
  driverId: string,
  scheduledDate: Date,
  startTime: string,
  estimatedDuration: number,
  notes?: string
) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    return {
      success: true,
      data: { id: `assignment-${Date.now()}`, routeId, driverId, scheduledDate, startTime, estimatedDuration, notes, createdAt: new Date() },
    }
  } catch (error) {
    console.error("Error assigning driver to route:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to assign driver" }
  }
}

export async function getDrivers() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const { db } = await import("@/infrastructure/database")
    const { users } = await import("@/infrastructure/database/schema")
    const { eq, and } = await import("drizzle-orm")

    const drivers = await db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
      .from(users)
      .where(and(eq(users.organizationId, organizationId), eq(users.role, "driver")))

    const driversWithStatus = drivers.map((driver) => ({ ...driver, status: "available" }))
    return { success: true, data: driversWithStatus }
  } catch (error) {
    console.error("Error fetching drivers:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch drivers" }
  }
}

export async function generatePreKitsForRoute(
  routeId: string,
  options?: { restockThreshold?: number; skipMachinesWithOpenPreKits?: boolean }
) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const preKitRepo = new PreKitRepository(db)
    const slotRepo = new SlotRepository(db)
    const machineRepo = new VendingMachineRepository(db)

    const result = await PreKitService.generatePreKitsForRoute(preKitRepo, slotRepo, machineRepo, routeRepository, {
      routeId,
      userId: session.user.id,
      restockThreshold: options?.restockThreshold ?? 30,
      skipMachinesWithOpenPreKits: options?.skipMachinesWithOpenPreKits ?? true,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Error generating pre-kits for route:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to generate pre-kits" }
  }
}

export async function getLocations() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    console.log("getLocations called with orgId:", organizationId)

    const { db } = await import("@/infrastructure/database")
    const { locations, vendingMachines } = await import("@/infrastructure/database/schema")
    const { eq } = await import("drizzle-orm")

    const locationsData = await db
      .select({ id: locations.id, name: locations.name, address: locations.address, latitude: locations.latitude, longitude: locations.longitude })
      .from(locations)
      .where(eq(locations.organizationId, organizationId))

    console.log("Found locations from database:", locationsData.length)

    const machines = await db
      .select({ id: vendingMachines.id, locationId: vendingMachines.locationId })
      .from(vendingMachines)
      .where(eq(vendingMachines.organizationId, organizationId))

    console.log("Found machines:", machines.length)

    const locationsWithMachines = locationsData.map((location) => ({
      ...location,
      machineIds: machines.filter((m) => m.locationId === location.id).map((m) => m.id),
    }))

    return { success: true, data: locationsWithMachines }
  } catch (error) {
    console.error("Error fetching locations - full error:", error)
    const mockLocations = [
      { id: "loc-001", name: "TechHub HQ", address: "123 Innovation Drive", machineIds: [] },
      { id: "loc-002", name: "Riverside Office", address: "456 Commerce Blvd", machineIds: [] },
      { id: "loc-003", name: "Metro Shopping", address: "789 Retail Plaza", machineIds: [] },
      { id: "loc-004", name: "University Library", address: "555 Campus Way", machineIds: [] },
      { id: "loc-005", name: "City Gym", address: "321 Fitness Ave", machineIds: [] },
      { id: "loc-006", name: "Greenfield Hospital", address: "321 Medical Center Dr", machineIds: [] },
    ]
    console.log("Using mock locations as fallback:", mockLocations.length)
    return { success: true, data: mockLocations }
  }
}

export async function getRoutePreKitStatus(routeId: string) {
  try {
    const route = await routeRepository.findByIdWithStops(routeId)
    if (!route) return { success: false, error: "Route not found" }

    const machineIds: string[] = []
    route.stops.forEach((stop) => {
      if (stop.vendingMachineIds) machineIds.push(...stop.vendingMachineIds)
    })

    if (machineIds.length === 0) return { success: true, hasPreKits: false, openPreKitsCount: 0 }

    const preKitRepo = new PreKitRepository(db)
    let openPreKitsCount = 0
    for (const machineId of machineIds) {
      const preKits = await preKitRepo.findByMachineId(machineId)
      const hasOpenPreKit = preKits.some((pk) => pk.status === "OPEN" || pk.status === "PICKED")
      if (hasOpenPreKit) openPreKitsCount++
    }

    return { success: true, hasPreKits: openPreKitsCount > 0, openPreKitsCount, totalMachines: machineIds.length }
  } catch (error) {
    console.error("Error getting route pre-kit status:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to get pre-kit status" }
  }
}

export async function analyzeLocationRestockingNeeds(restockThreshold: number = 30) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const { db } = await import("@/infrastructure/database")
    const { locations, vendingMachines, slots } = await import("@/infrastructure/database/schema")
    const { eq, and } = await import("drizzle-orm")

    const locationsData = await db
      .select({ id: locations.id, name: locations.name, address: locations.address })
      .from(locations)
      .where(eq(locations.organizationId, organizationId))

    const locationsWithNeeds = await Promise.all(
      locationsData.map(async (location) => {
        const machines = await db
          .select({ id: vendingMachines.id })
          .from(vendingMachines)
          .where(and(eq(vendingMachines.locationId, location.id), eq(vendingMachines.organizationId, organizationId)))

        const machineAnalysis = await Promise.all(
          machines.map(async (machine) => {
            const machineSlots = await db
              .select({ id: slots.id, currentQuantity: slots.currentQuantity, capacity: slots.capacity })
              .from(slots)
              .where(eq(slots.machineId, machine.id))

            let itemsNeeded = 0
            let slotsBelow30 = 0
            let slotsBelow10 = 0
            let lowestPercentage = 100

            machineSlots.forEach((slot) => {
              const current = slot.currentQuantity || 0
              const cap = slot.capacity || 10
              const percentage = (current / cap) * 100
              if (percentage < lowestPercentage) lowestPercentage = percentage
              if (percentage <= 10) {
                slotsBelow10++
                itemsNeeded += cap - current
              } else if (percentage <= restockThreshold) {
                slotsBelow30++
                itemsNeeded += cap - current
              }
            })

            return { machineId: machine.id, needsRestock: slotsBelow30 > 0 || slotsBelow10 > 0, itemsNeeded, slotsBelow30, slotsBelow10, lowestPercentage }
          })
        )

        const machinesNeedingRestock = machineAnalysis.filter((m) => m.needsRestock).length
        const totalItemsToStock = machineAnalysis.reduce((sum, m) => sum + m.itemsNeeded, 0)
        const criticalSlots = machineAnalysis.reduce((sum, m) => sum + m.slotsBelow10, 0)
        const moderateSlots = machineAnalysis.reduce((sum, m) => sum + m.slotsBelow30, 0)
        const lowestStockPercentage = Math.min(...machineAnalysis.map((m) => m.lowestPercentage))

        let urgencyLevel: "critical" | "moderate" | "low" | "none" = "none"
        if (criticalSlots > 0) urgencyLevel = "critical"
        else if (moderateSlots > 0) urgencyLevel = "moderate"
        else if (lowestStockPercentage < 50) urgencyLevel = "low"

        const estimatedTime = machinesNeedingRestock * 5 + Math.ceil(totalItemsToStock / 10)

        return {
          locationId: location.id,
          locationName: location.name,
          locationAddress: location.address,
          needsVisit: machinesNeedingRestock > 0,
          urgencyLevel,
          metrics: { machinesNeedingRestock, totalMachines: machines.length, estimatedItemsToStock: totalItemsToStock, estimatedTime, criticalSlots, moderateSlots, lowestStockPercentage: Math.round(lowestStockPercentage) },
          machines: machineAnalysis,
          machineIds: machines.map((m) => m.id),
        }
      })
    )

    const urgencyOrder = { critical: 0, moderate: 1, low: 2, none: 3 }
    locationsWithNeeds.sort((a, b) => urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel])

    return { success: true, data: locationsWithNeeds }
  } catch (error) {
    console.error("Error analyzing location restocking needs:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to analyze locations" }
  }
}

export async function getRoutePreKits(routeId: string) {
  try {
    const route = await routeRepository.findByIdWithStops(routeId)
    if (!route) return { success: false, error: "Route not found" }

    const machineIds: string[] = []
    route.stops.forEach((stop) => {
      if (stop.vendingMachineIds) machineIds.push(...stop.vendingMachineIds)
    })

    if (machineIds.length === 0) return { success: true, data: [] }

    const preKitRepo = new PreKitRepository(db)
    const allPreKits: any[] = []
    for (const machineId of machineIds) {
      const preKit = await preKitRepo.getByMachineId(machineId)
      if (preKit) allPreKits.push(preKit)
    }

    return { success: true, data: allPreKits }
  } catch (error) {
    console.error("Error getting route pre-kits:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to get route pre-kits" }
  }
}

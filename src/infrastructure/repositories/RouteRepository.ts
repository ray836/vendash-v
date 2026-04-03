import { db } from "@/infrastructure/database"
import { routes, routeStops, routeAssignments, users, locations, vendingMachines, preKits, preKitItems } from "@/infrastructure/database/schema"
import { Route, RouteStop, RouteAssignment } from "@/domains/Route/entities/Route"
import { eq, and, desc, asc, inArray } from "drizzle-orm"
import { nanoid } from "nanoid"

export class RouteRepository {
  async create(route: Route): Promise<Route> {
    return await db.transaction(async (tx) => {
      // Create the route
      const [createdRoute] = await tx
        .insert(routes)
        .values({
          id: route.id,
          organizationId: route.organizationId,
          name: route.name,
          description: route.description,
          isActive: route.isActive,
          assignedToUserId: route.assignedToUserId,
          scheduledDate: route.scheduledDate,
          estimatedDuration: route.estimatedDuration,
          recurringPattern: route.recurringPattern,
          createdAt: route.createdAt,
          createdBy: route.createdBy,
          updatedAt: route.updatedAt,
          updatedBy: route.updatedBy,
        })
        .returning()

      // Create route stops if any
      if (route.stops && route.stops.length > 0) {
        const stopValues = route.stops.map(stop => ({
          id: stop.id,
          routeId: route.id,
          locationId: stop.locationId,
          order: stop.order,
          notes: stop.notes,
          estimatedTime: stop.estimatedTime,
          createdAt: stop.createdAt,
        }))

        await tx.insert(routeStops).values(stopValues)
      }

      return (await this.findById(route.id))!
    })
  }

  async update(route: Route): Promise<Route> {
    return await db.transaction(async (tx) => {
      // Update the route
      await tx
        .update(routes)
        .set({
          name: route.name,
          description: route.description,
          isActive: route.isActive,
          assignedToUserId: route.assignedToUserId,
          scheduledDate: route.scheduledDate,
          estimatedDuration: route.estimatedDuration,
          recurringPattern: route.recurringPattern,
          updatedAt: route.updatedAt,
          updatedBy: route.updatedBy,
        })
        .where(eq(routes.id, route.id))

      // Delete existing stops and recreate them
      await tx.delete(routeStops).where(eq(routeStops.routeId, route.id))

      // Create new stops
      if (route.stops && route.stops.length > 0) {
        const stopValues = route.stops.map(stop => ({
          id: stop.id || nanoid(),
          routeId: route.id,
          locationId: stop.locationId,
          order: stop.order,
          notes: stop.notes,
          estimatedTime: stop.estimatedTime,
          createdAt: stop.createdAt || new Date(),
        }))

        await tx.insert(routeStops).values(stopValues)
      }

      return (await this.findById(route.id))!
    })
  }

  async findByIdWithStops(id: string): Promise<Route & { stops: RouteStop[] } | null> {
    return this.findById(id) as Promise<Route & { stops: RouteStop[] } | null>
  }

  async findById(id: string): Promise<Route | null> {
    const result = await db
      .select({
        route: routes,
        assignedUser: users,
        stop: routeStops,
        location: locations,
      })
      .from(routes)
      .leftJoin(users, eq(routes.assignedToUserId, users.id))
      .leftJoin(routeStops, eq(routes.id, routeStops.routeId))
      .leftJoin(locations, eq(routeStops.locationId, locations.id))
      .where(eq(routes.id, id))

    if (result.length === 0) {
      return null
    }

    // Group results by route and build the Route entity
    const routeData = result[0].route
    const assignedUser = result[0].assignedUser

    // Collect unique stops
    const stopsMap = new Map<string, RouteStop>()
    for (const row of result) {
      if (row.stop && row.location) {
        const stopId = row.stop.id
        if (!stopsMap.has(stopId)) {
          stopsMap.set(stopId, {
            id: row.stop.id,
            routeId: row.stop.routeId,
            locationId: row.stop.locationId,
            locationName: row.location.name,
            locationAddress: row.location.address || "",
            locationLatitude: row.location.latitude,
            locationLongitude: row.location.longitude,
            order: row.stop.order,
            notes: row.stop.notes || "",
            estimatedTime: row.stop.estimatedTime,
            isComplete: row.stop.isComplete || false,
            vendingMachineIds: [], // Will be populated separately if needed
            createdAt: row.stop.createdAt,
          })
        }
      }
    }

    // Get vending machines for each location if stops exist
    const stops = Array.from(stopsMap.values())
    if (stops.length > 0) {
      const locationIds = stops.map(s => s.locationId)
      const machines = await db
        .select()
        .from(vendingMachines)
        .where(inArray(vendingMachines.locationId, locationIds))

      // Group machines by location
      for (const stop of stops) {
        stop.vendingMachineIds = machines
          .filter(m => m.locationId === stop.locationId)
          .map(m => m.id)
      }
    }

    return {
      id: routeData.id,
      organizationId: routeData.organizationId,
      name: routeData.name,
      description: routeData.description || "",
      isActive: routeData.isActive,
      assignedToUserId: routeData.assignedToUserId,
      assignedToUser: assignedUser ? {
        id: assignedUser.id,
        firstName: assignedUser.firstName || "",
        lastName: assignedUser.lastName || "",
        email: assignedUser.email,
      } : undefined,
      scheduledDate: routeData.scheduledDate,
      estimatedDuration: routeData.estimatedDuration || 0,
      recurringPattern: routeData.recurringPattern,
      stops: stops.sort((a, b) => a.order - b.order),
      createdAt: routeData.createdAt,
      createdBy: routeData.createdBy,
      updatedAt: routeData.updatedAt,
      updatedBy: routeData.updatedBy,
    }
  }

  async findByAssignedUserId(userId: string): Promise<Route[]> {
    return this.findByDriverId(userId)
  }

  async findByOrganizationId(organizationId: string): Promise<Route[]> {
    const result = await db
      .select({
        route: routes,
        assignedUser: users,
      })
      .from(routes)
      .leftJoin(users, eq(routes.assignedToUserId, users.id))
      .where(eq(routes.organizationId, organizationId))
      .orderBy(desc(routes.createdAt))

    // Get all route IDs
    const routeIds = result.map(r => r.route.id)

    // Get all stops for these routes
    const allStops = routeIds.length > 0
      ? await db
          .select({
            stop: routeStops,
            location: locations,
          })
          .from(routeStops)
          .leftJoin(locations, eq(routeStops.locationId, locations.id))
          .where(inArray(routeStops.routeId, routeIds))
          .orderBy(asc(routeStops.order))
      : []

    // Get all vending machines for the locations
    const locationIds = [...new Set(allStops.map(s => s.stop.locationId).filter(Boolean))]
    const machines = locationIds.length > 0
      ? await db
          .select()
          .from(vendingMachines)
          .where(inArray(vendingMachines.locationId, locationIds))
      : []

    // Group stops by route
    const stopsByRoute = new Map<string, RouteStop[]>()
    for (const row of allStops) {
      if (row.stop && row.location) {
        const routeId = row.stop.routeId
        if (!stopsByRoute.has(routeId)) {
          stopsByRoute.set(routeId, [])
        }

        const locationMachines = machines
          .filter(m => m.locationId === row.stop.locationId)
          .map(m => m.id)

        stopsByRoute.get(routeId)!.push({
          id: row.stop.id,
          routeId: row.stop.routeId,
          locationId: row.stop.locationId,
          locationName: row.location.name,
          locationAddress: row.location.address || "",
          locationLatitude: row.location.latitude,
          locationLongitude: row.location.longitude,
          order: row.stop.order,
          notes: row.stop.notes || "",
          estimatedTime: row.stop.estimatedTime,
          isComplete: row.stop.isComplete || false,
          vendingMachineIds: locationMachines,
          createdAt: row.stop.createdAt,
        })
      }
    }

    // Build Route entities
    return result.map(row => ({
      id: row.route.id,
      organizationId: row.route.organizationId,
      name: row.route.name,
      description: row.route.description || "",
      isActive: row.route.isActive,
      assignedToUserId: row.route.assignedToUserId,
      assignedToUser: row.assignedUser ? {
        id: row.assignedUser.id,
        firstName: row.assignedUser.firstName || "",
        lastName: row.assignedUser.lastName || "",
        email: row.assignedUser.email,
      } : undefined,
      scheduledDate: row.route.scheduledDate,
      estimatedDuration: row.route.estimatedDuration || 0,
      recurringPattern: row.route.recurringPattern,
      stops: stopsByRoute.get(row.route.id) || [],
      createdAt: row.route.createdAt,
      createdBy: row.route.createdBy,
      updatedAt: row.route.updatedAt,
      updatedBy: row.route.updatedBy,
    }))
  }

  async findByDriverId(driverId: string): Promise<Route[]> {
    const result = await db
      .select({
        route: routes,
        assignedUser: users,
      })
      .from(routes)
      .leftJoin(users, eq(routes.assignedToUserId, users.id))
      .where(eq(routes.assignedToUserId, driverId))
      .orderBy(desc(routes.scheduledDate))

    // Similar logic to findByOrganizationId for populating stops
    const routeIds = result.map(r => r.route.id)

    const allStops = routeIds.length > 0
      ? await db
          .select({
            stop: routeStops,
            location: locations,
          })
          .from(routeStops)
          .leftJoin(locations, eq(routeStops.locationId, locations.id))
          .where(inArray(routeStops.routeId, routeIds))
          .orderBy(asc(routeStops.order))
      : []

    const locationIds = [...new Set(allStops.map(s => s.stop.locationId).filter(Boolean))]
    const machines = locationIds.length > 0
      ? await db
          .select()
          .from(vendingMachines)
          .where(inArray(vendingMachines.locationId, locationIds))
      : []

    const stopsByRoute = new Map<string, RouteStop[]>()
    for (const row of allStops) {
      if (row.stop && row.location) {
        const routeId = row.stop.routeId
        if (!stopsByRoute.has(routeId)) {
          stopsByRoute.set(routeId, [])
        }

        const locationMachines = machines
          .filter(m => m.locationId === row.stop.locationId)
          .map(m => m.id)

        stopsByRoute.get(routeId)!.push({
          id: row.stop.id,
          routeId: row.stop.routeId,
          locationId: row.stop.locationId,
          locationName: row.location.name,
          locationAddress: row.location.address || "",
          locationLatitude: row.location.latitude,
          locationLongitude: row.location.longitude,
          order: row.stop.order,
          notes: row.stop.notes || "",
          estimatedTime: row.stop.estimatedTime,
          isComplete: row.stop.isComplete || false,
          vendingMachineIds: locationMachines,
          createdAt: row.stop.createdAt,
        })
      }
    }

    return result.map(row => ({
      id: row.route.id,
      organizationId: row.route.organizationId,
      name: row.route.name,
      description: row.route.description || "",
      isActive: row.route.isActive,
      assignedToUserId: row.route.assignedToUserId,
      assignedToUser: row.assignedUser ? {
        id: row.assignedUser.id,
        firstName: row.assignedUser.firstName || "",
        lastName: row.assignedUser.lastName || "",
        email: row.assignedUser.email,
      } : undefined,
      scheduledDate: row.route.scheduledDate,
      estimatedDuration: row.route.estimatedDuration || 0,
      recurringPattern: row.route.recurringPattern,
      stops: stopsByRoute.get(row.route.id) || [],
      createdAt: row.route.createdAt,
      createdBy: row.route.createdBy,
      updatedAt: row.route.updatedAt,
      updatedBy: row.route.updatedBy,
    }))
  }

  async delete(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get all route stops for this route
      const stops = await tx
        .select({ id: routeStops.id })
        .from(routeStops)
        .where(eq(routeStops.routeId, id))

      const stopIds = stops.map(s => s.id)

      // Delete pre-kit items for pre-kits associated with these route stops
      if (stopIds.length > 0) {
        // Get all pre-kits for these stops
        const routePreKits = await tx
          .select({ id: preKits.id })
          .from(preKits)
          .where(inArray(preKits.routeStopId, stopIds))

        const preKitIds = routePreKits.map(pk => pk.id)

        // Delete pre-kit items first
        if (preKitIds.length > 0) {
          await tx.delete(preKitItems).where(inArray(preKitItems.preKitId, preKitIds))
        }

        // Delete pre-kits
        await tx.delete(preKits).where(inArray(preKits.routeStopId, stopIds))
      }

      // Delete route stops
      await tx.delete(routeStops).where(eq(routeStops.routeId, id))

      // Delete route assignments
      await tx.delete(routeAssignments).where(eq(routeAssignments.routeId, id))

      // Delete the route
      await tx.delete(routes).where(eq(routes.id, id))
    })
  }

  async createAssignment(assignment: RouteAssignment): Promise<RouteAssignment> {
    const [created] = await db
      .insert(routeAssignments)
      .values({
        id: assignment.id,
        routeId: assignment.routeId,
        assignedToUserId: assignment.assignedToUserId,
        scheduledDate: assignment.scheduledDate,
        estimatedDuration: assignment.estimatedDuration,
        status: assignment.status,
        notes: assignment.notes,
        createdAt: assignment.createdAt,
        createdBy: assignment.createdBy,
      })
      .returning()

    return created as RouteAssignment
  }

  async updateAssignmentStatus(
    assignmentId: string,
    status: "pending" | "in_progress" | "completed" | "cancelled"
  ): Promise<void> {
    await db
      .update(routeAssignments)
      .set({
        status,
      })
      .where(eq(routeAssignments.id, assignmentId))
  }

  async findAssignmentsByDriverId(
    driverId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<RouteAssignment[]> {
    const results = await db
      .select()
      .from(routeAssignments)
      .where(eq(routeAssignments.assignedToUserId, driverId))
      .orderBy(desc(routeAssignments.scheduledDate))
    return results as RouteAssignment[]
  }

  async checkDriverConflicts(
    driverId: string,
    scheduledDate: Date,
    duration: number
  ): Promise<boolean> {
    // Check if driver has any conflicting assignments
    const assignments = await db
      .select()
      .from(routeAssignments)
      .where(
        and(
          eq(routeAssignments.assignedToUserId, driverId),
          eq(routeAssignments.status, "pending")
        )
      )

    // Check for time conflicts
    for (const assignment of assignments) {
      const assignmentStart = new Date(assignment.scheduledDate)
      const assignmentEnd = new Date(assignmentStart.getTime() + (assignment.estimatedDuration ?? 0) * 60000)

      const newStart = scheduledDate
      const newEnd = new Date(scheduledDate.getTime() + duration * 60000)

      // Check if times overlap
      if (
        (newStart >= assignmentStart && newStart < assignmentEnd) ||
        (newEnd > assignmentStart && newEnd <= assignmentEnd) ||
        (newStart <= assignmentStart && newEnd >= assignmentEnd)
      ) {
        return true // Conflict found
      }
    }

    return false // No conflicts
  }
}
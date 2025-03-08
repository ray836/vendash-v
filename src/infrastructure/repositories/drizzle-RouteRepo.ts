import { RouteRepository } from "@/core/domain/interfaces/RouteRepository"
import { Route } from "@/core/domain/entities/Route"
import { RouteDTO } from "@/core/domain/interfaces/dtos/RouteDTO"
import { eq } from "drizzle-orm"
import {
  locations,
  routes,
  routeStops,
  vendingMachines,
} from "../database/schema"
import { db } from "../database"
import { RouteStopDTO } from "@/core/domain/interfaces/dtos/RouteStopDTO"
import { LocationDTO } from "@/core/domain/interfaces/dtos/LocationDTO"

export class DrizzleRouteRepo implements RouteRepository {
  constructor(private readonly database: typeof db) {}

  async createRoute(route: Route, createdBy: string): Promise<RouteDTO> {
    const routeData = await this.database
      .insert(routes)
      .values({
        ...route,
        createdBy: createdBy ?? "",
      })
      .returning()
    if (routeData.length === 0) {
      throw new Error("Failed to create route")
    }
    const routeStopsData = await this.database
      .insert(routeStops)
      .values(
        route.stops.map((stop) => ({
          ...stop,
          routeId: routeData[0].id,
          locationId: stop.location.id,
        }))
      )
      .returning()
    if (routeStopsData.length === 0) {
      throw new Error("Failed to create route stops")
    }
    const routeDTO = new RouteDTO(
      routeData[0].id,
      routeData[0].name,
      [],
      routeData[0].organizationId,
      routeData[0].isActive
    )
    return routeDTO
  }

  async getRoute(id: string): Promise<RouteDTO> {
    // also get route stops
    const routeData = await db.select().from(routes).where(eq(routes.id, id))
    if (routeData.length === 0) {
      throw new Error("Route not found")
    }
    const routeStopsData = await db
      .select()
      .from(routeStops)
      .where(eq(routeStops.routeId, id))

    const stops = routeStopsData.map(async (stop) => {
      const location = await db
        .select()
        .from(locations)
        .where(eq(locations.id, stop.locationId))
      if (location.length === 0) {
        throw new Error("Location not found")
      }
      const locationData = location[0]
      const locationDTO = new LocationDTO(
        locationData.id,
        locationData.name,
        locationData.address
      )
      const vendingMachinesData = await db
        .select()
        .from(vendingMachines)
        .where(eq(vendingMachines.locationId, stop.locationId))
      const vendingMachineIds = vendingMachinesData.map((vm) => vm.id)
      return new RouteStopDTO(
        stop.id,
        locationDTO,
        vendingMachineIds,
        stop.order,
        stop.notes ?? undefined,
        stop.isComplete
      )
    })
    const routeDTO = new RouteDTO(
      routeData[0].id,
      routeData[0].name,
      await Promise.all(stops),
      routeData[0].organizationId,
      routeData[0].isActive
    )
    return routeDTO
  }

  async updateRoute(route: Route): Promise<RouteDTO> {
    const routeData = await db
      .update(routes)
      .set(route)
      .where(eq(routes.id, route.id))
      .returning()
    if (routeData.length === 0) {
      throw new Error("Failed to update route")
    }
    const routeDTO = new RouteDTO(
      routeData[0].id,
      routeData[0].name,
      [],
      routeData[0].organizationId,
      routeData[0].isActive
    )
    return routeDTO
  }

  async deleteRoute(id: string): Promise<void> {
    await db.delete(routes).where(eq(routes.id, id))
  }

  async getRoutesByOrganizationId(organizationId: string): Promise<RouteDTO[]> {
    const routeData = await db
      .select()
      .from(routes)
      .where(eq(routes.organizationId, organizationId))
    if (routeData.length === 0) {
      throw new Error("No routes found")
    }
    const routeDTOs = routeData.map(
      (route) =>
        new RouteDTO(
          route.id,
          route.name,
          [],
          route.organizationId,
          route.isActive
        )
    )
    return routeDTOs
  }
}

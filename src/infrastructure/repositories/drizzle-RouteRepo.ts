import { RouteRepository } from "@/core/domain/interfaces/RouteRepository"
import { Route } from "@/core/domain/entities/Route"
import { RouteDTO } from "@/core/domain/interfaces/dtos/RouteDTO"
import { RouteStopDTO } from "@/core/domain/interfaces/dtos/RouteStopDTO"
import { eq } from "drizzle-orm"
import { locations, routes, routeStops } from "../database/schema"
import { db } from "../database"
import { PublicLocationDTO } from "@/domains/Location/schemas/locationDTOs"

export class DrizzleRouteRepo implements RouteRepository {
  constructor(private readonly database: typeof db) {}

  async createRoute(route: Route, createdBy: string): Promise<RouteDTO> {
    const routeData = await this.database
      .insert(routes)
      .values({
        id: route.id,
        name: route.name,
        organizationId: route.organizationId,
        isActive: route.isActive,
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
          id: stop.id,
          routeId: routeData[0].id,
          locationId: stop.location.id,
          order: stop.sequence,
          notes: "",
          isComplete: false,
          vendingMachineIds: [],
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
    const routeData = await this.database
      .select()
      .from(routes)
      .where(eq(routes.id, id))

    if (routeData.length === 0) {
      throw new Error("Route not found")
    }

    const routeStopsData = await this.database
      .select()
      .from(routeStops)
      .where(eq(routeStops.routeId, id))

    const stops = await Promise.all(
      routeStopsData.map(async (stop) => {
        const location = await this.database
          .select()
          .from(locations)
          .where(eq(locations.id, stop.locationId))

        if (location.length === 0) {
          throw new Error("Location not found")
        }

        const locationData = location[0]
        const locationDTO: PublicLocationDTO = {
          id: locationData.id,
          name: locationData.name,
          address: locationData.address,
          organizationId: locationData.organizationId,
          createdAt: locationData.createdAt,
          updatedAt: locationData.createdAt, // Use createdAt as updatedAt since it's not in the schema
        }

        return new RouteStopDTO(
          stop.id,
          stop.routeId,
          locationDTO,
          stop.order,
          new Date(), // estimatedArrivalTime
          stop.isComplete ? new Date() : undefined, // actualArrivalTime
          stop.isComplete ? "completed" : "pending" // status
        )
      })
    )

    const routeDTO = new RouteDTO(
      routeData[0].id,
      routeData[0].name,
      stops,
      routeData[0].organizationId,
      routeData[0].isActive
    )
    return routeDTO
  }

  async updateRoute(route: Route): Promise<RouteDTO> {
    const routeData = await this.database
      .update(routes)
      .set({
        name: route.name,
        isActive: route.isActive,
      })
      .where(eq(routes.id, route.id))
      .returning()

    if (routeData.length === 0) {
      throw new Error("Failed to update route")
    }

    // Delete existing stops
    await this.database
      .delete(routeStops)
      .where(eq(routeStops.routeId, route.id))

    // Insert new stops
    await this.database.insert(routeStops).values(
      route.stops.map((stop) => ({
        id: stop.id,
        routeId: route.id,
        locationId: stop.location.id,
        order: stop.sequence,
        notes: "",
        isComplete: false,
        vendingMachineIds: [],
      }))
    )

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
    await this.database.delete(routes).where(eq(routes.id, id))
  }

  async getRoutesByOrganizationId(organizationId: string): Promise<RouteDTO[]> {
    const routeData = await this.database
      .select()
      .from(routes)
      .where(eq(routes.organizationId, organizationId))

    if (routeData.length === 0) {
      throw new Error("No routes found")
    }

    const routeDTOs = await Promise.all(
      routeData.map((route) => this.getRoute(route.id))
    )
    return routeDTOs
  }
}

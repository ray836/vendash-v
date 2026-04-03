import { nanoid } from "nanoid"
import { Route } from "./entities/Route"
import { RouteRepository } from "@/infrastructure/repositories/RouteRepository"

export async function getOrgRoutes(repo: RouteRepository, organizationId: string): Promise<Route[]> {
  return repo.findByOrganizationId(organizationId)
}

export async function getRouteById(repo: RouteRepository, id: string): Promise<Route | null> {
  return repo.findById(id)
}

export async function createRoute(repo: RouteRepository, input: any): Promise<Route> {
  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Route name is required")
  }
  if (!input.stops || input.stops.length === 0) {
    throw new Error("At least one stop is required")
  }

  const sortedStops = [...input.stops].sort((a: any, b: any) => a.order - b.order)
  const orderNums = new Set<number>()
  for (const stop of sortedStops) {
    if (orderNums.has(stop.order)) throw new Error("Duplicate stop order numbers are not allowed")
    orderNums.add(stop.order)
  }

  const routeId = nanoid()
  const stopsWithIds = sortedStops.map((stop: any) => ({
    ...stop,
    id: stop.id || nanoid(),
    routeId,
    createdAt: new Date(),
  }))

  const routeData: Route = {
    id: routeId,
    organizationId: input.organizationId,
    name: input.name,
    description: input.description || "",
    isActive: input.isActive ?? true,
    assignedToUserId: input.assignedToUserId || null,
    assignedToUser: undefined,
    scheduledDate: input.scheduledDate || null,
    estimatedDuration: input.estimatedDuration || 0,
    recurringPattern: input.recurringPattern || null,
    stops: stopsWithIds,
    createdAt: new Date(),
    createdBy: input.createdBy,
    updatedAt: new Date(),
    updatedBy: input.createdBy,
  }

  return repo.create(routeData)
}

export async function updateRoute(repo: RouteRepository, input: any): Promise<Route> {
  const existingRoute = await repo.findById(input.id)
  if (!existingRoute) throw new Error("Route not found")

  if (input.name !== undefined && input.name.trim().length === 0) {
    throw new Error("Route name cannot be empty")
  }

  let sortedStops = existingRoute.stops
  if (input.stops) {
    if (input.stops.length === 0) throw new Error("At least one stop is required")

    sortedStops = [...input.stops].sort((a: any, b: any) => a.order - b.order)
    const orderNums = new Set<number>()
    for (const stop of sortedStops) {
      if (orderNums.has(stop.order)) throw new Error("Duplicate stop order numbers are not allowed")
      orderNums.add(stop.order)
    }

    sortedStops = sortedStops.map((stop: any) => ({
      ...stop,
      id: stop.id || nanoid(),
      routeId: input.id,
      createdAt: stop.createdAt || new Date(),
    }))
  }

  const updatedRoute: Route = {
    ...existingRoute,
    ...input,
    stops: sortedStops,
    updatedAt: new Date(),
    updatedBy: input.updatedBy,
  }

  return repo.update(updatedRoute)
}

export async function deleteRoute(repo: RouteRepository, id: string): Promise<void> {
  await repo.delete(id)
}

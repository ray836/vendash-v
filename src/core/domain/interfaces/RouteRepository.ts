import { Route } from "../entities/Route"
import { RouteDTO } from "./dtos/RouteDTO"

export interface RouteRepository {
  createRoute(route: Route, createdBy: string): Promise<RouteDTO>
  getRoute(id: string): Promise<RouteDTO>
  updateRoute(route: Route): Promise<RouteDTO>
  deleteRoute(id: string): Promise<void>
  getRoutesByOrganizationId(organizationId: string): Promise<RouteDTO[]>
}

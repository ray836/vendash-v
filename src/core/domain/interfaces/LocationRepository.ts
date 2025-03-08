import { LocationSite } from "../entities/LocationSite"
import { LocationDTO } from "./dtos/LocationDTO"
import { CreateLocationDTO } from "@/core/use-cases/Location/dtos/CreateLocationDTO"
export interface LocationRepository {
  createLocation(location: CreateLocationDTO): Promise<LocationDTO>
  updateLocation(location: LocationSite): Promise<LocationDTO>
  deleteLocation(id: string): Promise<void>
  getLocations(organizationId: string): Promise<LocationDTO[]>
}

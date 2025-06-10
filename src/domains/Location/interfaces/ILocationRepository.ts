import { Location } from "../entities/Location"

export interface ILocationRepository {
  findById(id: string): Promise<Location | null>
  findByOrganizationId(organizationId: string): Promise<Location[]>
  create(location: Location): Promise<Location>
  update(location: Location): Promise<Location>
  delete(id: string): Promise<void>
}

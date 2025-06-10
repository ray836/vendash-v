import { ILocationRepository } from "../interfaces/ILocationRepository"
import { PublicLocationDTO } from "../schemas/locationDTOs"

export class GetLocationsUseCase {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async execute(organizationId: string): Promise<PublicLocationDTO[]> {
    const locations = await this.locationRepository.findByOrganizationId(
      organizationId
    )
    return locations.map((location) => ({
      id: location.id,
      name: location.name,
      address: location.address,
      organizationId: location.organizationId,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    }))
  }
}

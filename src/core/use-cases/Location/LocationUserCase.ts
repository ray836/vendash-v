import { LocationSite } from "@/core/domain/entities/LocationSite"
import { LocationRepository } from "@/core/domain/interfaces/LocationRepository"
import { LocationDTO } from "@/core/domain/interfaces/dtos/LocationDTO"
import { CreateLocationDTO } from "./dtos/CreateLocationDTO"

export class LocationUseCase {
  constructor(private readonly locationRepository: LocationRepository) {}

  async getLocations(organizationId: string): Promise<LocationDTO[]> {
    return this.locationRepository.getLocations(organizationId)
  }

  async createLocation(location: CreateLocationDTO): Promise<LocationDTO> {
    return this.locationRepository.createLocation(location)
  }

  async updateLocation(location: LocationSite): Promise<LocationDTO> {
    return this.locationRepository.updateLocation(location)
  }

  async deleteLocation(id: string): Promise<void> {
    return this.locationRepository.deleteLocation(id)
  }
}

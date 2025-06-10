import { Location } from "../entities/Location"
import { ILocationRepository } from "../interfaces/ILocationRepository"
import { UpdateLocationRequestDTO } from "../schemas/locationDTOs"

export class UpdateLocationUseCase {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async execute(id: string, data: UpdateLocationRequestDTO): Promise<Location> {
    const existingLocation = await this.locationRepository.findById(id)
    if (!existingLocation) {
      throw new Error("Location not found")
    }

    const updatedLocation = existingLocation.update({
      name: data.name,
      address: data.address,
      organizationId: data.organizationId,
    })

    return await this.locationRepository.update(updatedLocation)
  }
}

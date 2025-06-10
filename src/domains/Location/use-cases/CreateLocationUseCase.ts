import { Location } from "../entities/Location"
import { ILocationRepository } from "../interfaces/ILocationRepository"
import { CreateLocationRequestDTO } from "../schemas/locationDTOs"

export class CreateLocationUseCase {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async execute(data: CreateLocationRequestDTO): Promise<Location> {
    const location = Location.create({
      name: data.name,
      address: data.address,
      organizationId: data.organizationId,
    })

    return await this.locationRepository.create(location)
  }
}

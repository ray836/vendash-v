import { ILocationRepository } from "../interfaces/ILocationRepository"

export class DeleteLocationUseCase {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async execute(id: string): Promise<void> {
    const existingLocation = await this.locationRepository.findById(id)
    if (!existingLocation) {
      throw new Error("Location not found")
    }

    await this.locationRepository.delete(id)
  }
}

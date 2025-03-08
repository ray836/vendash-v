import { LocationSite } from "@/core/domain/entities/LocationSite"
import { LocationDTO } from "@/core/domain/interfaces/dtos/LocationDTO"
import { LocationRepository } from "@/core/domain/interfaces/LocationRepository"
import { db } from "../database"
import { locations } from "../database/schema"
import { eq } from "drizzle-orm"
import { CreateLocationDTO } from "@/core/use-cases/Location/dtos/CreateLocationDTO"
import { randomUUID } from "node:crypto"

export class DrizzleLocationRepo implements LocationRepository {
  constructor(private readonly database: typeof db) {}
  async createLocation(location: CreateLocationDTO): Promise<LocationDTO> {
    const result = await this.database
      .insert(locations)
      .values({
        id: randomUUID(),
        name: location.name,
        address: location.address,
        organizationId: location.organizationId,
      })
      .returning()
    if (!result[0]) {
      throw new Error("Location not found")
    }
    const newLocation = result[0]
    return new LocationDTO(
      newLocation.id,
      newLocation.name,
      newLocation.address
    )
  }

  async updateLocation(location: LocationSite): Promise<LocationDTO> {
    const result = await this.database
      .update(locations)
      .set({
        name: location.name,
        address: location.address,
      })
      .where(eq(locations.id, location.id))
      .returning()
    if (!result[0]) {
      throw new Error("Location not found")
    }
    const updatedLocation = result[0]
    return new LocationDTO(
      updatedLocation.id,
      updatedLocation.name,
      updatedLocation.address
    )
  }

  async deleteLocation(id: string): Promise<void> {
    await this.database.delete(locations).where(eq(locations.id, id))
  }

  async getLocations(organizationId: string): Promise<LocationDTO[]> {
    const result = await this.database
      .select()
      .from(locations)
      .where(eq(locations.organizationId, organizationId))
    return result.map(
      (location) =>
        new LocationDTO(location.id, location.name, location.address)
    )
  }
}

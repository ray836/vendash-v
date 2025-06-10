import { Location } from "@/domains/Location/entities/Location"
import { ILocationRepository } from "@/domains/Location/interfaces/ILocationRepository"
import { db } from "../database"
import { locations } from "../database/schema"
import { eq } from "drizzle-orm"

export class DrizzleLocationRepository implements ILocationRepository {
  constructor(private readonly database: typeof db) {}

  async findById(id: string): Promise<Location | null> {
    const result = await this.database
      .select()
      .from(locations)
      .where(eq(locations.id, id))

    if (!result[0]) {
      return null
    }

    return this.toEntity(result[0])
  }

  async findByOrganizationId(organizationId: string): Promise<Location[]> {
    const result = await this.database
      .select()
      .from(locations)
      .where(eq(locations.organizationId, organizationId))

    return result.map(this.toEntity)
  }

  async create(location: Location): Promise<Location> {
    const result = await this.database
      .insert(locations)
      .values({
        id: location.id,
        name: location.name,
        address: location.address,
        organizationId: location.organizationId,
      })
      .returning()

    if (!result[0]) {
      throw new Error("Failed to create location")
    }

    return this.toEntity(result[0])
  }

  async update(location: Location): Promise<Location> {
    const result = await this.database
      .update(locations)
      .set({
        name: location.name,
        address: location.address,
        organizationId: location.organizationId,
      })
      .where(eq(locations.id, location.id))
      .returning()

    if (!result[0]) {
      throw new Error("Location not found")
    }

    return this.toEntity(result[0])
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(locations).where(eq(locations.id, id))
  }

  private toEntity(data: typeof locations.$inferSelect): Location {
    return new Location({
      id: data.id,
      name: data.name,
      address: data.address,
      organizationId: data.organizationId,
      createdAt: data.createdAt,
      updatedAt: data.createdAt,
      createdBy: "system",
      updatedBy: "system",
    })
  }
}

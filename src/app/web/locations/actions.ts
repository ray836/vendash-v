"use server"

import { db } from "@/infrastructure/database"
import { locations } from "@/infrastructure/database/schema"
import { eq } from "drizzle-orm"
import { DrizzleLocationRepo } from "@/infrastructure/repositories/drizzle-LocationRepo"
import { LocationUseCase } from "@/core/use-cases/Location/LocationUserCase"
import { CreateLocationDTO } from "@/core/use-cases/Location/dtos/CreateLocationDTO"
export async function getLocations(): Promise<string> {
  const drizzleLocationRepo = new DrizzleLocationRepo(db)
  const locationUseCase = new LocationUseCase(drizzleLocationRepo)
  const locations = await locationUseCase.getLocations("1")
  return JSON.stringify(locations)
}

export async function createLocation(location: {
  name: string
  address: string
}): Promise<string> {
  // TODO: Get organizationId from session
  const organizationId = "1" // Temporary
  const createLocationDTO = new CreateLocationDTO(
    location.name,
    location.address,
    organizationId
  )

  const drizzleLocationRepo = new DrizzleLocationRepo(db)
  const locationUseCase = new LocationUseCase(drizzleLocationRepo)
  const result = await locationUseCase.createLocation(createLocationDTO)
  return JSON.stringify(result)
}

export async function deleteLocation(id: string): Promise<void> {
  await db.delete(locations).where(eq(locations.id, id))
}

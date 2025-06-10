"use server"

import { CreateLocationUseCase } from "@/domains/Location/use-cases/CreateLocationUseCase"
import { DeleteLocationUseCase } from "@/domains/Location/use-cases/DeleteLocationUseCase"
import { GetLocationsUseCase } from "@/domains/Location/use-cases/GetLocationsUseCase"
import { db } from "@/infrastructure/database"
import { DrizzleLocationRepository } from "@/infrastructure/repositories/DrizzleLocationRepository"

const organizationId = "1"

export async function getLocations(): Promise<string> {
  const drizzleLocationRepository = new DrizzleLocationRepository(db)
  const getLocationsUseCase = new GetLocationsUseCase(drizzleLocationRepository)
  const locations = await getLocationsUseCase.execute(organizationId)
  return JSON.stringify(locations)
}

export async function createLocation(location: {
  name: string
  address: string
}): Promise<string> {
  const drizzleLocationRepository = new DrizzleLocationRepository(db)
  const createLocationUseCase = new CreateLocationUseCase(
    drizzleLocationRepository
  )
  const result = await createLocationUseCase.execute({
    name: location.name,
    address: location.address,
    organizationId: organizationId,
  })
  return JSON.stringify(result)
}

export async function deleteLocation(id: string): Promise<void> {
  const drizzleLocationRepository = new DrizzleLocationRepository(db)
  const deleteLocationUseCase = new DeleteLocationUseCase(
    drizzleLocationRepository
  )
  await deleteLocationUseCase.execute(id)
}

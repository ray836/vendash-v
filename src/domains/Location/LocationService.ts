import { Location } from "./entities/Location"
import { LocationRepository } from "@/infrastructure/repositories/LocationRepository"
import {
  PublicLocationDTO,
  CreateLocationRequestDTO,
  UpdateLocationRequestDTO,
} from "./schemas/locationDTOs"

export async function getLocations(
  repo: LocationRepository,
  organizationId: string
): Promise<PublicLocationDTO[]> {
  const locations = await repo.findByOrganizationId(organizationId)
  return locations.map((location) => ({
    id: location.id,
    name: location.name,
    address: location.address,
    latitude: location.latitude,
    longitude: location.longitude,
    organizationId: location.organizationId,
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
  }))
}

export async function createLocation(
  repo: LocationRepository,
  data: CreateLocationRequestDTO
): Promise<Location> {
  const location = Location.create({
    name: data.name,
    address: data.address,
    organizationId: data.organizationId,
    latitude: data.latitude,
    longitude: data.longitude,
  })
  return await repo.create(location)
}

export async function updateLocation(
  repo: LocationRepository,
  id: string,
  data: UpdateLocationRequestDTO
): Promise<Location> {
  const existing = await repo.findById(id)
  if (!existing) {
    throw new Error("Location not found")
  }
  const updated = existing.update({
    name: data.name,
    address: data.address,
    organizationId: data.organizationId,
  })
  return await repo.update(updated)
}

export async function deleteLocation(
  repo: LocationRepository,
  id: string
): Promise<void> {
  const existing = await repo.findById(id)
  if (!existing) {
    throw new Error("Location not found")
  }
  await repo.delete(id)
}

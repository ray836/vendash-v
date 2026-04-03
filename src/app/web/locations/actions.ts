"use server"

import * as LocationService from "@/domains/Location/LocationService"
import { db } from "@/infrastructure/database"
import { LocationRepository } from "@/infrastructure/repositories/LocationRepository"
import { auth } from "@/lib/auth"

export async function getLocations(): Promise<string> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const repo = new LocationRepository(db)
  const locations = await LocationService.getLocations(repo, organizationId)
  return JSON.stringify(locations)
}

export async function createLocation(location: {
  name: string
  address: string
  latitude?: number
  longitude?: number
}): Promise<string> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const repo = new LocationRepository(db)
  const result = await LocationService.createLocation(repo, {
    name: location.name,
    address: location.address,
    organizationId,
    latitude: location.latitude,
    longitude: location.longitude,
  })
  return JSON.stringify(result)
}

export async function updateLocation(
  id: string,
  data: { name?: string; address?: string; latitude?: number | null; longitude?: number | null }
): Promise<string> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const repo = new LocationRepository(db)
  const result = await LocationService.updateLocation(repo, id, {
    ...data,
    organizationId,
    latitude: data.latitude ?? undefined,
    longitude: data.longitude ?? undefined,
  })
  return JSON.stringify(result)
}

export async function deleteLocation(id: string): Promise<void> {
  const repo = new LocationRepository(db)
  await LocationService.deleteLocation(repo, id)
}

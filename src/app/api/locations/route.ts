import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/infrastructure/database'
import { LocationRepository } from '@/infrastructure/repositories/LocationRepository'
import * as LocationService from '@/domains/Location/LocationService'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET() {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const repo = new LocationRepository(db)
    const locations = await LocationService.getLocations(repo, user.organizationId)
    return NextResponse.json({ success: true, data: locations }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch locations' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { name, address, latitude, longitude } = body

    if (!name || !address) {
      return NextResponse.json(
        { success: false, error: 'name and address are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const repo = new LocationRepository(db)
    const location = await LocationService.createLocation(repo, {
      name,
      address,
      organizationId: user.organizationId,
      latitude,
      longitude,
    })

    return NextResponse.json({ success: true, data: location }, { status: 201, headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create location' },
      { status: 500, headers: corsHeaders }
    )
  }
}

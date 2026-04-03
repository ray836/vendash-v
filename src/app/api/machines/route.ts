import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/infrastructure/database'
import { VendingMachineRepository } from '@/infrastructure/repositories/VendingMachineRepository'
import { LocationRepository } from '@/infrastructure/repositories/LocationRepository'
import * as VendingMachineService from '@/domains/VendingMachine/VendingMachineService'
import { MachineType } from '@/domains/VendingMachine/entities/VendingMachine'
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
    const machineRepo = new VendingMachineRepository(db)
    const locationRepo = new LocationRepository(db)
    const machines = await VendingMachineService.getMachines(machineRepo, locationRepo, user.organizationId)
    return NextResponse.json({ success: true, data: machines }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch machines' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { type, locationId, model, notes, cardReaderId } = body

    if (!type || !locationId || !model) {
      return NextResponse.json(
        { success: false, error: 'type, locationId, and model are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const machineRepo = new VendingMachineRepository(db)
    const machine = await VendingMachineService.createMachine(machineRepo, {
      type: type as MachineType,
      locationId,
      model,
      notes,
      organizationId: user.organizationId,
      cardReaderId,
    })

    return NextResponse.json({ success: true, data: machine }, { status: 201, headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create machine' },
      { status: 500, headers: corsHeaders }
    )
  }
}

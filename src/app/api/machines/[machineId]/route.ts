import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/infrastructure/database'
import { VendingMachineRepository } from '@/infrastructure/repositories/VendingMachineRepository'
import { SlotRepository } from '@/infrastructure/repositories/SlotRepository'
import { LocationRepository } from '@/infrastructure/repositories/LocationRepository'
import * as VendingMachineService from '@/domains/VendingMachine/VendingMachineService'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const { machineId } = await params

    const machineRepo = new VendingMachineRepository(db)
    const slotRepo = new SlotRepository(db)
    const locationRepo = new LocationRepository(db)

    const machine = await VendingMachineService.getMachineWithSlots(
      machineRepo,
      slotRepo,
      locationRepo,
      machineId
    )

    if (!machine) {
      return NextResponse.json(
        { success: false, error: 'Machine not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json({ success: true, data: machine }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch machine' },
      { status: 500, headers: corsHeaders }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/infrastructure/database'
import { SlotRepository } from '@/infrastructure/repositories/SlotRepository'
import { VendingMachineRepository } from '@/infrastructure/repositories/VendingMachineRepository'
import * as SlotService from '@/domains/Slot/SlotService'
import { PublicSlotDTO } from '@/domains/Slot/schemas/SlotSchemas'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const slotRepo = new SlotRepository(db)
    const machineSlots = await slotRepo.findByMachineId(machineId)
    const data = machineSlots
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .map((s) => ({ id: s.id, labelCode: s.labelCode, ccReaderCode: s.ccReaderCode }))
    return NextResponse.json({ success: true, data }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch slots' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const { machineId } = await params
    const body = await request.json()
    const { slots, ccReaderId } = body as { slots: PublicSlotDTO[]; ccReaderId: string }

    if (!slots || !Array.isArray(slots)) {
      return NextResponse.json(
        { success: false, error: 'slots array is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!ccReaderId) {
      return NextResponse.json(
        { success: false, error: 'ccReaderId is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const slotRepo = new SlotRepository(db)
    const machineRepo = new VendingMachineRepository(db)

    await SlotService.saveSlots(slotRepo, machineRepo, {
      machineId,
      slots,
      userId: user.id,
      ccReaderId,
      organizationId: user.organizationId,
    })

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save slots' },
      { status: 500, headers: corsHeaders }
    )
  }
}

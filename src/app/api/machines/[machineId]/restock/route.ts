import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/infrastructure/database'
import { VendingMachineRepository } from '@/infrastructure/repositories/VendingMachineRepository'
import { SlotRepository } from '@/infrastructure/repositories/SlotRepository'
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository'
import { InventoryRepository } from '@/infrastructure/repositories/InventoryRepository'
import { TransactionRepository } from '@/infrastructure/repositories/TransactionRepository'
import * as RestockService from '@/domains/Inventory/RestockService'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// Slots (with product info) for the restock count screen, plus whether the
// machine has card-reader telemetry (telemetry machines skip inferred sales).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const { machineId } = await params
    const result = await RestockService.getRestockSlots(
      {
        machineRepo: new VendingMachineRepository(db),
        slotRepo: new SlotRepository(db),
        productRepo: new ProductRepository(db),
      },
      user.organizationId,
      machineId
    )
    const status = result.success ? 200 : 404
    return NextResponse.json({ success: result.success, data: result, error: result.error }, { status, headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load restock slots' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Record a restock. Body: { entries: { slotId, leftNow, refillTo }[] }.
// Updates counts and (for non-telemetry machines) writes inferred sales.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const { machineId } = await params
    const body = await request.json()
    const entries = body?.entries

    if (
      !Array.isArray(entries) ||
      entries.some(
        (e) =>
          typeof e?.slotId !== 'string' ||
          typeof e?.leftNow !== 'number' ||
          typeof e?.refillTo !== 'number'
      )
    ) {
      return NextResponse.json(
        { success: false, error: 'entries ({ slotId, leftNow, refillTo }[]) is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const result = await RestockService.recordRestockCounts(
      {
        machineRepo: new VendingMachineRepository(db),
        slotRepo: new SlotRepository(db),
        productRepo: new ProductRepository(db),
        inventoryRepo: new InventoryRepository(db),
        txRepo: new TransactionRepository(db),
      },
      user.organizationId,
      machineId,
      entries
    )
    const status = result.success ? 200 : 404
    return NextResponse.json({ success: result.success, data: result, error: result.error }, { status, headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to record restock' },
      { status: 500, headers: corsHeaders }
    )
  }
}

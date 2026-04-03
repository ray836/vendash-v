import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/infrastructure/database'
import { VendingMachineRepository } from '@/infrastructure/repositories/VendingMachineRepository'
import { sql } from 'drizzle-orm'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

/**
 * GET /api/machines/[machineId]/linking/pending?cardReaderId=VK1001863385
 *
 * Returns the most recent approved transaction item for the given card reader
 * that has not yet been consumed by the linking flow. The iOS app polls this
 * every 2–3 seconds during slot-linking mode.
 *
 * cardReaderId query param is optional — falls back to the ccReaderId stored
 * on the machine record if omitted.
 *
 * Response:
 *   { pending: { selectionCode: "001", receivedAt: "..." } }  — transaction waiting
 *   { pending: null }                                          — nothing waiting
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const { machineId } = await params
    const { searchParams } = new URL(request.url)
    let cardReaderId = searchParams.get('cardReaderId')

    // Fall back to the machine's stored card reader ID if not provided
    if (!cardReaderId) {
      const machineRepo = new VendingMachineRepository(db)
      const machine = await machineRepo.findById(machineId)
      if (!machine) {
        return NextResponse.json(
          { success: false, error: 'Machine not found' },
          { status: 404, headers: corsHeaders }
        )
      }
      cardReaderId = machine.cardReaderId ?? null
    }

    if (!cardReaderId) {
      return NextResponse.json(
        { success: false, error: 'No cardReaderId available — provide it as a query param or save it to the machine first' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Find the most recent transaction_item for this card reader that hasn't been consumed
    const rows = await db.execute(sql`
      SELECT
        ti.id          AS item_id,
        ti.slot_code   AS selection_code,
        t.created_at   AS received_at
      FROM transaction_items ti
      JOIN transactions t ON t.id = ti.transaction_id
      WHERE t.card_reader_id = ${cardReaderId}
        AND ti.id NOT IN (
          SELECT transaction_item_id
          FROM linking_consumed_transactions
          WHERE card_reader_id = ${cardReaderId}
        )
      ORDER BY t.created_at DESC
      LIMIT 1
    `)

    const row = rows.rows[0] as { item_id: string; selection_code: string; received_at: string } | undefined

    if (!row) {
      return NextResponse.json({ pending: null }, { headers: corsHeaders })
    }

    return NextResponse.json(
      {
        pending: {
          transactionItemId: row.item_id,
          selectionCode: row.selection_code,
          receivedAt: row.received_at,
        },
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch pending transaction' },
      { status: 500, headers: corsHeaders }
    )
  }
}

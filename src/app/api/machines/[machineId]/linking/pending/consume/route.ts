import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/infrastructure/database'
import { VendingMachineRepository } from '@/infrastructure/repositories/VendingMachineRepository'
import { linkingConsumedTransactions } from '@/infrastructure/database/schema'
import { sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

/**
 * POST /api/machines/[machineId]/linking/pending/consume
 * Body: { cardReaderId?: string }
 *
 * Called by the iOS app after it successfully maps a received selection code to
 * a slot. Marks the most recent pending transaction item as consumed so the
 * next poll returns null until a new purchase arrives.
 *
 * cardReaderId in the body is optional — falls back to the machine's stored one.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const { machineId } = await params
    const body = await request.json().catch(() => ({}))
    let cardReaderId: string | null = body.cardReaderId ?? null

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
        { success: false, error: 'No cardReaderId available — provide it in the request body or save it to the machine first' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Find the current pending item (same query as the polling endpoint)
    const rows = await db.execute(sql`
      SELECT ti.id AS item_id
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

    const row = rows.rows[0] as { item_id: string } | undefined

    if (!row) {
      // Nothing pending — idempotent success (already consumed or never existed)
      return NextResponse.json({ success: true, consumed: false }, { headers: corsHeaders })
    }

    // Mark it consumed
    await db.insert(linkingConsumedTransactions).values({
      id: randomUUID(),
      transactionItemId: row.item_id,
      cardReaderId,
    })

    return NextResponse.json({ success: true, consumed: true }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to consume transaction' },
      { status: 500, headers: corsHeaders }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/infrastructure/database'
import { slots } from '@/infrastructure/database/schema'
import { eq } from 'drizzle-orm'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ machineId: string; slotId: string }> }
) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const { slotId } = await params
    const body = await request.json()
    const { ccReaderCode } = body as { ccReaderCode: string }

    if (!ccReaderCode) {
      return NextResponse.json(
        { success: false, error: 'ccReaderCode is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    await db
      .update(slots)
      .set({ ccReaderCode, updatedAt: new Date(), updatedBy: 'api' })
      .where(eq(slots.id, slotId))

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update slot' },
      { status: 500, headers: corsHeaders }
    )
  }
}

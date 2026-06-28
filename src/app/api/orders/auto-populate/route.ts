import { NextResponse } from 'next/server'
import { autoPopulateOrder } from '@/app/web/orders/actions'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// One-click reorder: auto-populate the draft order from current reorder needs
// (projected on-hand vs. reorder points / velocity). Returns counts + total cost.
// autoPopulateOrder is already org-parameterized (also used by the cron job).
export async function POST() {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const result = await autoPopulateOrder(user.organizationId, user.id)
    const status = result.success ? 200 : 500
    return NextResponse.json({ success: result.success, data: result, error: result.error }, { status, headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to auto-populate order' },
      { status: 500, headers: corsHeaders }
    )
  }
}

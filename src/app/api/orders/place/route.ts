import { NextResponse } from 'next/server'
import { placeDraftOrderForOrg } from '@/app/web/orders/actions'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// Place the current draft order. Admin only.
export async function POST() {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  if (user.role?.toLowerCase() !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403, headers: corsHeaders }
    )
  }

  const result = await placeDraftOrderForOrg(user.organizationId, user.id)
  return NextResponse.json(
    {
      success: result.success,
      data: result.success ? { total: result.total, itemCount: result.itemCount } : undefined,
      error: result.success ? undefined : result.error,
    },
    { status: result.success ? 200 : 400, headers: corsHeaders }
  )
}

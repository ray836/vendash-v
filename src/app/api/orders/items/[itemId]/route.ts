import { NextResponse } from 'next/server'
import { updateDraftOrderItemForOrg, removeDraftOrderItemForOrg } from '@/app/web/orders/actions'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// Set a draft order item's quantity. Body: { quantity: number } (<= 0 removes it).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  const { itemId } = await params
  try {
    const body = await request.json()
    const quantity = Number(body?.quantity)
    if (!Number.isFinite(quantity)) {
      return NextResponse.json({ success: false, error: 'Invalid quantity' }, { status: 400, headers: corsHeaders })
    }
    const result = await updateDraftOrderItemForOrg(user.organizationId, user.id, itemId, quantity)
    return NextResponse.json(
      { success: result.success, error: result.success ? undefined : result.error },
      { status: result.success ? 200 : 400, headers: corsHeaders }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update item' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Remove an item from the draft order.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  const { itemId } = await params
  const result = await removeDraftOrderItemForOrg(user.organizationId, user.id, itemId)
  return NextResponse.json(
    { success: result.success, error: result.success ? undefined : result.error },
    { status: result.success ? 200 : 400, headers: corsHeaders }
  )
}

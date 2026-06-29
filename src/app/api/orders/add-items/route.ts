import { NextResponse } from 'next/server'
import { addProductsToOrderForOrg } from '@/app/web/orders/actions'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// Add specific products (with case quantities) to the current draft order.
// Admin only. Body: { items: { productId: string; quantity: number }[] }
export async function POST(request: Request) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  if (user.role?.toLowerCase() !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403, headers: corsHeaders }
    )
  }

  try {
    const body = await request.json()
    const items = body?.items as { productId: string; quantity: number }[] | undefined
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items provided' },
        { status: 400, headers: corsHeaders }
      )
    }

    const result = await addProductsToOrderForOrg(user.organizationId, user.id, items)
    const status = result.success ? 200 : 500
    return NextResponse.json(
      { success: result.success, data: result, error: result.success ? undefined : result.error },
      { status, headers: corsHeaders }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to add items to order' },
      { status: 500, headers: corsHeaders }
    )
  }
}

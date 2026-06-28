import { NextResponse } from 'next/server'
import { db } from '@/infrastructure/database'
import { OrderRepository } from '@/infrastructure/repositories/OrderRepository'
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository'
import * as OrderService from '@/domains/Order/OrderService'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// The org's current draft order (the reorder shopping list / cart) with its items.
export async function GET() {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const order = await OrderService.getCurrentOrder(
      new OrderRepository(db),
      new ProductRepository(db),
      user.organizationId
    )
    return NextResponse.json({ success: true, data: order }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch current order' },
      { status: 500, headers: corsHeaders }
    )
  }
}

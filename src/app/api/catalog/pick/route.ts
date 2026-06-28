import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/infrastructure/database'
import { StandardProductRepository } from '@/infrastructure/repositories/StandardProductRepository'
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository'
import * as StandardProductService from '@/domains/Product/StandardProductService'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// Clone the given catalog products into this org (idempotent — already-added are
// skipped). Body: { standardIds: string[] }. Returns { added }.
export async function POST(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const standardIds = body?.standardIds

    if (!Array.isArray(standardIds) || standardIds.some((id) => typeof id !== 'string')) {
      return NextResponse.json(
        { success: false, error: 'standardIds (string[]) is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const result = await StandardProductService.pickStandardProducts(
      new StandardProductRepository(db),
      new ProductRepository(db),
      user.organizationId,
      standardIds
    )
    return NextResponse.json({ success: true, data: result }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to add catalog products' },
      { status: 500, headers: corsHeaders }
    )
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/infrastructure/database'
import { StandardProductRepository } from '@/infrastructure/repositories/StandardProductRepository'
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository'
import * as StandardProductService from '@/domains/Product/StandardProductService'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// The shared product catalog for this org: every standard product, each flagged
// with whether the org has already added (cloned) it.
export async function GET() {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const catalog = await StandardProductService.getStandardCatalog(
      new StandardProductRepository(db),
      new ProductRepository(db),
      user.organizationId
    )
    return NextResponse.json({ success: true, data: catalog }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch catalog' },
      { status: 500, headers: corsHeaders }
    )
  }
}

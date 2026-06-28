import { NextResponse } from 'next/server'
import { db } from '@/infrastructure/database'
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository'
import { SlotRepository } from '@/infrastructure/repositories/SlotRepository'
import * as ProductService from '@/domains/Product/ProductService'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// Org-wide product metrics for the owner overview: per-product sales, revenue,
// profit, velocity, projected days-left, and reorder flags. (Org-wide, not per
// machine — a per-machine breakdown can be added later if multi-machine owners
// need it.) Mirrors the web getOrgProductDataMetrics action.
export async function GET() {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const productRepo = new ProductRepository(db)
    const slotRepo = new SlotRepository(db)
    const slots = await slotRepo.findByOrganizationId(user.organizationId)
    const products = await ProductService.getOrgProductDataMetrics(
      productRepo,
      user.organizationId,
      slots.map((s) => ({
        id: s.id,
        productId: s.productId,
        currentQuantity: s.currentQuantity,
        lastCountedAt: s.lastCountedAt,
      }))
    )
    return NextResponse.json({ success: true, data: products }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch metrics' },
      { status: 500, headers: corsHeaders }
    )
  }
}

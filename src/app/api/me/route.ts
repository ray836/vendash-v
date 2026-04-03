import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET() {
  const user = await getApiUser()
  if (!user) {
    return NextResponse.json({ user: null }, { headers: corsHeaders })
  }

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role,
      },
    },
    { headers: corsHeaders }
  )
}

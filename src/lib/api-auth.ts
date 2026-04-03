import { auth as clerkAuth } from '@clerk/nextjs/server'
import { db } from '@/infrastructure/database'
import { users } from '@/infrastructure/database/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export interface ApiUser {
  id: string
  email: string
  organizationId: string
  role: string
  clerkId: string
}

/**
 * Validates the Clerk JWT from the Authorization header (Bearer token) or
 * the active web session cookie. Returns the local DB user, or null.
 *
 * Use this in API route handlers that are called by the iOS app or web.
 */
export async function getApiUser(): Promise<ApiUser | null> {
  try {
    const { userId } = await clerkAuth()
    if (!userId) return null

    const result = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1)

    if (!result[0]) return null

    return {
      id: result[0].id,
      email: result[0].email,
      organizationId: result[0].organizationId,
      role: result[0].role,
      clerkId: userId,
    }
  } catch {
    return null
  }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  )
}

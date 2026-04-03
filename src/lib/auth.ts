import { auth as clerkAuth } from '@clerk/nextjs/server'
import { db } from '@/infrastructure/database'
import { users } from '@/infrastructure/database/schema'
import { eq } from 'drizzle-orm'

export interface Session {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    organizationId: string
    role: string
  }
}

/**
 * Server-side auth helper. Returns the session if the user is authenticated
 * and exists in the local database, otherwise null.
 *
 * Call this in Server Actions and Server Components.
 */
export async function auth(): Promise<Session | null> {
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
      user: {
        id: result[0].id,
        email: result[0].email,
        firstName: result[0].firstName,
        lastName: result[0].lastName ?? '',
        organizationId: result[0].organizationId,
        role: result[0].role,
      },
    }
  } catch {
    return null
  }
}

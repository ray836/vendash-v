'use server'

import { auth as clerkAuth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/infrastructure/database'
import { organizations, users } from '@/infrastructure/database/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { redirect } from 'next/navigation'

type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>

export async function createOrganization(formData: FormData) {
  const { userId: clerkId } = await clerkAuth()
  if (!clerkId) redirect('/sign-in')

  const name = (formData.get('name') as string)?.trim()
  const address = (formData.get('address') as string)?.trim() || null

  if (!name) throw new Error('Organization name is required')

  // Check if this Clerk user already has a DB record
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1)

  if (existing[0]) {
    // Already onboarded — just go to dashboard
    redirect('/web/dashboard')
  }

  // Get user profile from Clerk
  const clerkUser = await currentUser()
  if (!clerkUser) redirect('/sign-in')

  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )
  if (!primaryEmail) throw new Error('No primary email found')

  const orgId = `org-${nanoid()}`
  const userId = nanoid()

  // Create org and user atomically
  await db.transaction(async (tx) => {
    await tx.insert(organizations).values({
      id: orgId,
      name,
      address,
      createdAt: new Date(),
    })

    await tx.insert(users).values({
      id: userId,
      clerkId,
      firstName: clerkUser.firstName ?? '',
      lastName: clerkUser.lastName ?? '',
      email: primaryEmail.emailAddress,
      password: null,
      role: 'admin',
      organizationId: orgId,
      createdAt: new Date(),
    })
  })

  redirect('/web/dashboard')
}

export async function acceptInvitation(
  clerkId: string,
  clerkUser: ClerkUser,
  organizationId: string,
  role: string
) {
  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )
  if (!primaryEmail) throw new Error('No primary email found')

  await db.insert(users).values({
    id: nanoid(),
    clerkId,
    firstName: clerkUser.firstName ?? '',
    lastName: clerkUser.lastName ?? '',
    email: primaryEmail.emailAddress,
    password: null,
    role,
    organizationId,
    createdAt: new Date(),
  })
}

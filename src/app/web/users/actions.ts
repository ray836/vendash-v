"use server"

import { UserRole } from "@/domains/User/entities/User"
import * as UserService from "@/domains/User/UserService"
import { db } from "@/infrastructure/database"
import { UserRepository } from "@/infrastructure/repositories/UserRepository"
import { auth } from "@/lib/auth"

export async function createUser(user: {
  firstName: string
  lastName: string
  email: string
  role: string
}) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const repo = new UserRepository(db)
  const result = await UserService.createUser(repo, {
    organizationId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role as UserRole,
    password: crypto.randomUUID(),
  })
  return JSON.stringify(result)
}

export async function getUsers() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const repo = new UserRepository(db)
  return await UserService.getUsers(repo, organizationId)
}

export async function deleteUser(userId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  // Fetch clerkId before deleting so we can remove them from Clerk too
  const { users: usersTable } = await import('@/infrastructure/database/schema')
  const { eq } = await import('drizzle-orm')
  const [row] = await db.select({ clerkId: usersTable.clerkId }).from(usersTable).where(eq(usersTable.id, userId))

  const repo = new UserRepository(db)
  await UserService.deleteUser(repo, userId)

  // Delete from Clerk if they have an account
  if (row?.clerkId) {
    try {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      await client.users.deleteUser(row.clerkId)
    } catch (err) {
      console.error('[deleteUser] Failed to delete from Clerk:', err)
      // Non-fatal — local record is already deleted
    }
  }
}

export async function updateUserRole(userId: string, role: UserRole) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const repo = new UserRepository(db)
  await UserService.updateUser(repo, userId, { role }, session.user.id)
}

export async function inviteUser(email: string, role: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const { db } = await import('@/infrastructure/database')
  const { invitations } = await import('@/infrastructure/database/schema')
  const { eq, and } = await import('drizzle-orm')
  const { nanoid } = await import('nanoid')

  const { clerkClient } = await import('@clerk/nextjs/server')
  const client = await clerkClient()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const sendInvite = () =>
    client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${appUrl}/onboarding`,
      publicMetadata: { organizationId, role },
    })

  let invitation: Awaited<ReturnType<typeof sendInvite>>

  try {
    invitation = await sendInvite()
  } catch (err: unknown) {
    const clerkErr = err as { errors?: { code?: string; message?: string; longMessage?: string }[] }
    const detail = clerkErr?.errors?.[0]

    if (detail?.code === 'duplicate_record') {
      const { data: allInvites } = await client.invitations.getInvitationList({ limit: 100 })
      const existing = allInvites.filter(
        (inv) => inv.emailAddress === email && inv.status === 'pending'
      )
      for (const inv of existing) await client.invitations.revokeInvitation(inv.id)
      try {
        invitation = await sendInvite()
      } catch (resendErr: unknown) {
        const e = resendErr as { errors?: { code?: string; message?: string; longMessage?: string }[] }
        const d = e?.errors?.[0]
        console.error('[inviteUser] Resend error after revoke:', d)
        // If the email already belongs to a Clerk user, we can't invite them again
        // but we can still store our local invitation so they'll join the org on next sign-in
        if (d?.code === 'form_identifier_exists' || d?.code === 'duplicate_record') {
          // Store local invitation only — they'll get picked up at onboarding
          await db
            .delete(invitations)
            .where(and(eq(invitations.email, email), eq(invitations.organizationId, organizationId)))
          await db.insert(invitations).values({
            id: (await import('nanoid')).nanoid(),
            email,
            organizationId,
            role,
            clerkInvitationId: null,
            status: 'pending',
            createdAt: new Date(),
          })
          return { success: true, inviteUrl: null }
        }
        throw new Error(d?.longMessage ?? d?.message ?? 'Failed to resend invitation')
      }
    } else {
      const message = detail?.longMessage ?? detail?.message ?? 'Clerk invitation failed'
      console.error('[inviteUser] Clerk error:', detail)
      throw new Error(message)
    }
  }

  // Upsert our local invitation record (revoke old one first if exists)
  await db
    .delete(invitations)
    .where(and(eq(invitations.email, email), eq(invitations.organizationId, organizationId)))

  await db.insert(invitations).values({
    id: nanoid(),
    email,
    organizationId,
    role,
    clerkInvitationId: invitation.id,
    status: 'pending',
    createdAt: new Date(),
  })

  return { success: true, inviteUrl: invitation.url }
}

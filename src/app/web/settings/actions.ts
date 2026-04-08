'use server'

import { auth } from '@/lib/auth'
import { db } from '@/infrastructure/database'
import { organizations, integrationLogs } from '@/infrastructure/database/schema'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'

export async function getOrganization() {
  const session = await auth()
  if (!session) return null

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, session.user.organizationId))
    .limit(1)

  return org ?? null
}

export async function getIntegrationSettings() {
  const session = await auth()
  if (!session) return null

  const [org] = await db
    .select({ id: organizations.id, apiKey: organizations.apiKey })
    .from(organizations)
    .where(eq(organizations.id, session.user.organizationId))
    .limit(1)

  if (!org) return null

  // Generate and persist an API key if one doesn't exist yet
  let apiKey = org.apiKey
  if (!apiKey) {
    apiKey = nanoid(32)
    await db
      .update(organizations)
      .set({ apiKey })
      .where(eq(organizations.id, session.user.organizationId))
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const recentLogs = await db
    .select()
    .from(integrationLogs)
    .where(eq(integrationLogs.organizationId, session.user.organizationId))
    .orderBy(desc(integrationLogs.createdAt))
    .limit(5)

  return {
    endpointUrl: `${appUrl}/api/transactions/ingest?key=${apiKey}`,
    apiKey,
    logs: recentLogs,
    isLocalhost: appUrl.includes('localhost'),
  }
}

export async function updateOrganization(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const name = (formData.get('name') as string)?.trim()
  const address = (formData.get('address') as string)?.trim() || null

  if (!name) throw new Error('Organization name is required')

  await db
    .update(organizations)
    .set({ name, address })
    .where(eq(organizations.id, session.user.organizationId))

  revalidatePath('/web/settings')
}

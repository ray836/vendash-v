'use server'

import { auth } from '@/lib/auth'
import { db } from '@/infrastructure/database'
import { organizations } from '@/infrastructure/database/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

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

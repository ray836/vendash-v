'use server'

import { auth } from '@/lib/auth'
import { db } from '@/infrastructure/database'
import { organizations, integrationLogs } from '@/infrastructure/database/schema'
import { eq, desc, gt, and, or, isNull } from 'drizzle-orm'
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

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentLogs = await db
    .select()
    .from(integrationLogs)
    .where(and(
      or(
        eq(integrationLogs.organizationId, session.user.organizationId),
        isNull(integrationLogs.organizationId)
      ),
      gt(integrationLogs.createdAt, since),
      isNull(integrationLogs.cardReaderId)
    ))
    .orderBy(desc(integrationLogs.createdAt))
    .limit(20)

  return {
    endpointUrl: `${appUrl}/api/transactions/ingest?key=${apiKey}`,
    apiKey,
    logs: recentLogs,
    isLocalhost: appUrl.includes('localhost'),
  }
}

export async function getIntegrationLogs() {
  const session = await auth()
  if (!session) return null

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return db
    .select()
    .from(integrationLogs)
    .where(and(
      or(
        eq(integrationLogs.organizationId, session.user.organizationId),
        isNull(integrationLogs.organizationId)
      ),
      gt(integrationLogs.createdAt, since),
      isNull(integrationLogs.cardReaderId)
    ))
    .orderBy(desc(integrationLogs.createdAt))
    .limit(20)
}

export async function sendTestEmail() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, session.user.organizationId))
    .limit(1)

  if (!org?.notificationEmail) {
    return { success: false, error: 'No notification email saved yet' }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY is not configured in environment variables' }
  }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vendash-v.vercel.app'

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'VendorPro <onboarding@resend.dev>',
    to: org.notificationEmail,
    subject: 'Test notification — VendorPro',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 16px;">
    <div style="margin-bottom:24px;">
      <span style="font-size:20px;font-weight:700;color:#fff;">VendorPro</span>
    </div>
    <div style="background:#141414;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">
      <div style="padding:28px;">
        <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#666;">Test notification</p>
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#fff;">Your notifications are working!</h1>
        <p style="margin:0;font-size:14px;color:#aaa;line-height:1.6;">
          This is a test email from VendorPro. When your inventory is running low and an order should be placed, you'll receive an email like this at <strong style="color:#fff;">${org.notificationEmail}</strong>.
        </p>
      </div>
      <div style="padding:20px 28px;border-top:1px solid #2a2a2a;">
        <a href="${appUrl}/web/orders"
           style="display:block;text-align:center;background:#fff;color:#000;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:600;font-size:15px;">
          Go to Orders →
        </a>
      </div>
    </div>
    <p style="margin:24px 0 0;font-size:12px;color:#555;text-align:center;">
      Sent from VendorPro · <a href="${appUrl}/web/settings" style="color:#666;">Manage notifications</a>
    </p>
  </div>
</body>
</html>`,
  })

  if (error) {
    console.error('Resend test email error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updateNotificationEmail(email: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const trimmed = email.trim() || null

  await db
    .update(organizations)
    .set({ notificationEmail: trimmed })
    .where(eq(organizations.id, session.user.organizationId))

  revalidatePath('/web/settings')
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

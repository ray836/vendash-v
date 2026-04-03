import { auth as clerkAuth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/infrastructure/database'
import { users } from '@/infrastructure/database/schema'
import { eq } from 'drizzle-orm'
import { createOrganization } from './actions'

export default async function OnboardingPage() {
  const { userId: clerkId } = await clerkAuth()
  if (!clerkId) redirect('/sign-in')

  // Already onboarded? Go straight to dashboard
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1)

  if (existing[0]) redirect('/web/dashboard')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Set up your organization</h1>
          <p className="text-muted-foreground">
            You&apos;re almost there. Tell us about your business to get started.
          </p>
        </div>

        <form action={createOrganization} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">
              Company name <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Acme Vending Co."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="address" className="text-sm font-medium">
              Business address{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              id="address"
              name="address"
              type="text"
              placeholder="123 Main St, City, State"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Create organization
          </button>
        </form>
      </div>
    </div>
  )
}

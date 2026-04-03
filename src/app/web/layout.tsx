import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function WebLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Clerk session exists (middleware guarantees this) but user hasn't
  // completed onboarding (no DB record / no org yet)
  if (!session) {
    redirect('/onboarding')
  }

  return <>{children}</>
}

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Header } from '@/app/web/components/header'
import { RoleProvider } from '@/lib/role-context'
import { UserRole } from '@/domains/User/entities/User'

export default async function WebLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect('/onboarding')
  }

  const role: UserRole =
    session?.user?.role && Object.values(UserRole).includes(session.user.role as UserRole)
      ? (session.user.role as UserRole)
      : UserRole.OPERATOR

  return (
    <RoleProvider initialRole={role}>
      <div className="relative flex min-h-screen flex-col">
        <div className="w-full border-b">
          <div className="container mx-auto">
            <Header />
          </div>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </RoleProvider>
  )
}

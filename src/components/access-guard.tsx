"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShieldX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRole } from "@/lib/role-context"
import { UserRole } from "@/domains/User/entities/User"

interface AccessGuardProps {
  allowedRoles: UserRole[]
  /** If set, redirects instead of showing the denied screen */
  redirectTo?: string
  children: React.ReactNode
}

export function AccessGuard({ allowedRoles, redirectTo, children }: AccessGuardProps) {
  const { role } = useRole()
  const router = useRouter()
  const allowed = allowedRoles.includes(role)

  useEffect(() => {
    if (!allowed && redirectTo) {
      router.replace(redirectTo)
    }
  }, [allowed, redirectTo, router])

  if (!allowed && redirectTo) return null

  if (!allowed) {
    return (
      <div className="container mx-auto py-24 flex flex-col items-center justify-center gap-4 text-center">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
          <ShieldX className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Access Restricted</h2>
        <p className="text-muted-foreground max-w-sm">
          Your current role ({role}) doesn&apos;t have permission to view this page.
        </p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return <>{children}</>
}

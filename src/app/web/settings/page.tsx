"use client"

import { Settings } from "./settings"
import { AccessGuard } from "@/components/access-guard"
import { UserRole } from "@/domains/User/entities/User"

export default function SettingsPage() {
  return (
    <AccessGuard allowedRoles={[UserRole.ADMIN, UserRole.OPERATOR]}>
      <div className="container mx-auto py-6">
        <Settings />
      </div>
    </AccessGuard>
  )
}

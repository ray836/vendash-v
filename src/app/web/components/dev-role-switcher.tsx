"use client"

import { useRole } from "@/lib/role-context"
import { UserRole } from "@/domains/User/entities/User"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function DevRoleSwitcher() {
  if (process.env.NODE_ENV !== "development") return null

  const { role, setRole } = useRole()

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-yellow-500 font-mono hidden sm:inline">DEV</span>
      <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
        <SelectTrigger className="h-7 text-xs w-[100px] border-yellow-500/50 text-yellow-500">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
          <SelectItem value={UserRole.OPERATOR}>Operator</SelectItem>
          <SelectItem value={UserRole.DRIVER}>Driver</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

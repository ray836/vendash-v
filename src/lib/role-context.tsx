"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { UserRole } from "@/domains/User/entities/User"

interface RoleContextValue {
  role: UserRole
  setRole: (role: UserRole) => void
}

const RoleContext = createContext<RoleContextValue>({
  role: UserRole.OPERATOR,
  setRole: () => {},
})

const DEV_OVERRIDE_KEY = "dev_role_override"

export function RoleProvider({
  children,
  initialRole,
}: {
  children: React.ReactNode
  initialRole?: UserRole
}) {
  const [role, setRoleState] = useState<UserRole>(initialRole ?? UserRole.OPERATOR)

  useEffect(() => {
    // In development, allow localStorage override for testing
    if (process.env.NODE_ENV === "development") {
      const stored = localStorage.getItem(DEV_OVERRIDE_KEY) as UserRole | null
      if (stored && Object.values(UserRole).includes(stored)) {
        setRoleState(stored)
        return
      }
    }

    // Sync with server role (handles session changes)
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        const serverRole = data?.user?.role as UserRole | undefined
        if (serverRole && Object.values(UserRole).includes(serverRole)) {
          setRoleState(serverRole)
        }
      })
      .catch(() => {/* silently fail */})
  }, [])

  function setRole(newRole: UserRole) {
    setRoleState(newRole)
    if (process.env.NODE_ENV === "development") {
      localStorage.setItem(DEV_OVERRIDE_KEY, newRole)
    }
  }

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}

/** Returns true if the current role has access based on the allowed list */
export function useHasAccess(allowedRoles: UserRole[]) {
  const { role } = useRole()
  return allowedRoles.includes(role)
}

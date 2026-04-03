"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { UserRole } from "@/domains/User/entities/User"

interface RoleContextValue {
  role: UserRole
  setRole: (role: UserRole) => void
}

const RoleContext = createContext<RoleContextValue>({
  role: UserRole.ADMIN,
  setRole: () => {},
})

const STORAGE_KEY = "dev_role_override"

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(UserRole.ADMIN)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as UserRole | null
    if (stored && Object.values(UserRole).includes(stored)) {
      setRoleState(stored)
    }
  }, [])

  function setRole(newRole: UserRole) {
    setRoleState(newRole)
    localStorage.setItem(STORAGE_KEY, newRole)
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

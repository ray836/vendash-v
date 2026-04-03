'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

export interface SessionUser {
  id: string
  email: string
  organizationId: string
  role: string
}

export interface Session {
  user: SessionUser
}

export function useSession(): { data: Session | null; isLoading: boolean } {
  const { isLoaded, isSignedIn } = useAuth()
  const [data, setData] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      setData(null)
      setIsLoading(false)
      return
    }

    fetch('/api/me')
      .then((r) => r.json())
      .then((json) => {
        setData(json.user ? { user: json.user } : null)
      })
      .catch(() => setData(null))
      .finally(() => setIsLoading(false))
  }, [isLoaded, isSignedIn])

  return { data, isLoading }
}

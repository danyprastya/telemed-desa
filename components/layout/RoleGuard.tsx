'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { UserRole } from '@/types/app.types'

interface RoleGuardProps {
  /** The role(s) allowed to view this content */
  allowedRoles: UserRole[]
  /** Content to render if authorized */
  children: React.ReactNode
}

/**
 * Client component that redirects if the current user's role doesn't match.
 * Shows a loading spinner while checking auth state.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { profile, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && profile) {
      if (!allowedRoles.includes(profile.role)) {
        router.replace(`/${profile.role}`)
      }
    }
  }, [isLoading, profile, allowedRoles, router])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <LoadingSpinner />
  }

  return <>{children}</>
}

'use client'

import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/app.types'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  /** The Supabase auth user */
  user: User | null
  /** The user's profile from the profiles table */
  profile: Profile | null
  /** Whether auth state is still loading */
  isLoading: boolean
  /** Sign out the current user */
  signOut: () => Promise<void>
  /** Refresh the profile from the database */
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

/**
 * Auth provider component that wraps the app and provides auth state.
 * Fetches the current user and their profile on mount.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data as Profile | null)
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)
      if (authUser) {
        await fetchProfile(authUser.id)
      }
      setIsLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const authUser = session?.user ?? null
        setUser(authUser)
        if (authUser) {
          await fetchProfile(authUser.id)
        } else {
          setProfile(null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      // Force clear all local storage and session storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        
        // Force clear all cookies to prevent middleware from reusing a stale session
        const cookies = document.cookie.split(';')
        for (const cookie of cookies) {
          const eqPos = cookie.indexOf('=')
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
        }
      }

      setUser(null)
      setProfile(null)
      window.location.href = '/login'
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access the current auth state.
 * Must be used within an AuthProvider.
 * @returns Auth context with user, profile, loading state, and auth actions.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

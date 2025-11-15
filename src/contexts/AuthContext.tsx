'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { createClient } from '@/db/supabase.client'

/**
 * Authentication Context Type
 *
 * Provides user state and loading indicator throughout the app.
 */
interface AuthContextType {
  /**
   * Current authenticated user or null if not logged in
   */
  user: User | null

  /**
   * Loading state during initial session check
   * Prevents flash of login screen while checking session
   */
  loading: boolean
}

/**
 * Authentication Context
 *
 * Global state for user authentication accessible via useAuth() hook.
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

/**
 * Authentication Provider Component
 *
 * Wraps the application to provide authentication state to all child components.
 * Automatically syncs with Supabase auth state changes (login, logout, session refresh).
 *
 * Features:
 * - Initial session check on mount
 * - Real-time auth state synchronization
 * - Automatic cleanup of subscriptions
 *
 * Usage:
 * Wrap your app in RootLayout:
 *
 * ```tsx
 * <AuthProvider>
 *   <YourApp />
 * </AuthProvider>
 * ```
 *
 * Then use in any component:
 *
 * ```tsx
 * const { user, loading } = useAuth()
 * ```
 *
 * @param children - Child components to wrap
 */
export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // 1. Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 2. Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 3. Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

/**
 * Hook: useAuth
 *
 * Access authentication state from any component.
 *
 * @returns Current user and loading state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading } = useAuth()
 *
 *   if (loading) return <Spinner />
 *   if (!user) return <LoginPrompt />
 *
 *   return <div>Welcome, {user.email}</div>
 * }
 * ```
 *
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

/**
 * Supabase Client - SERVER (Cookie-based)
 *
 * Use this client in:
 * - Server Components
 * - Server Actions (login, logout, etc.)
 * - Middleware
 *
 * Authentication is handled via HTTP-only cookies.
 *
 * DO NOT use in:
 * - React components (use supabase.client.ts)
 * - API Routes (use supabase.api.ts)
 *
 * @see supabase.client.ts - for browser/React components
 * @see supabase.api.ts - for API Routes with Bearer token auth
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from './database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options: Record<string, unknown>
          }>
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

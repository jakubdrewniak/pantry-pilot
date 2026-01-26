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
 * - API Routes (use authenticateRequest from @/lib/api-auth)
 *
 * @see supabase.client.ts - for browser/React components
 * @see src/lib/api-auth.ts - for API Routes authentication
 */
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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

/**
 * Create an admin Supabase client with service role key
 *
 * This client bypasses RLS and has full database access.
 * Use ONLY for operations that require admin privileges:
 * - Fetching user information from auth.users
 * - Admin operations that need to bypass RLS
 *
 * IMPORTANT: Never expose this client to the browser
 * IMPORTANT: Always validate user permissions before using this client
 *
 * @returns Supabase client with admin privileges
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

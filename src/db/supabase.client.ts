/**
 * Supabase Client - BROWSER ONLY
 *
 * Use this client in React components (client-side).
 * Authentication is handled via cookies set by the server.
 *
 * DO NOT use in:
 * - Server Components
 * - Server Actions
 * - API Routes
 * - Middleware
 *
 * @see supabase.server.ts - for Server Components, Actions, Middleware
 * @see src/lib/api-auth.ts - for API Routes authentication
 */
import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

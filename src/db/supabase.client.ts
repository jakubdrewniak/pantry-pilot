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
 * @see supabase.api.ts - for API Routes with Bearer token auth
 */
import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './database.types'

// TODO: Remove after households are implemented
export const DEFAULT_USER_ID = '7d2cf57a-a623-447b-9b8c-c9c764a958d5'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Supabase Client - API ROUTES (Bearer Token)
 *
 * Use this client ONLY in API Routes (/api/*).
 * Authentication is handled via Bearer token in Authorization header.
 *
 * DO NOT use in:
 * - Server Components (use supabase.server.ts)
 * - Server Actions (use supabase.server.ts)
 * - Middleware (use supabase.server.ts)
 * - React components (use supabase.client.ts)
 *
 * @see supabase.client.ts - for browser/React components
 * @see supabase.server.ts - for Server Components, Actions, Middleware
 * @see src/lib/api-auth.ts - helper for authenticating API requests
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from './database.types'

/**
 * Creates a Supabase client for API routes
 *
 * @returns Supabase client configured for API routes (no session persistence)
 *
 * @example
 * ```typescript
 * import { authenticateRequest } from '@/lib/api-auth'
 *
 * export async function POST(request: NextRequest) {
 *   const { user, supabase, errorResponse } = await authenticateRequest(request)
 *   if (errorResponse) return errorResponse
 *
 *   // user is authenticated, supabase client is ready
 * }
 * ```
 */
export function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

/**
 * API Authentication Helper
 *
 * Centralized authentication logic for API routes.
 * Uses cookie-based authentication - reads session from HTTP cookies automatically.
 *
 * How it works:
 * 1. Middleware refreshes the session on each request (if needed)
 * 2. This helper reads the session from cookies
 * 3. No need for clients to send Authorization headers
 *
 * Usage:
 * ```typescript
 * import { authenticateRequest } from '@/lib/api-auth'
 *
 * export async function POST(request: NextRequest) {
 *   const { user, supabase, errorResponse } = await authenticateRequest(request)
 *   if (errorResponse) return errorResponse
 *
 *   // user is authenticated, proceed with business logic
 *   // supabase client is ready for database operations
 * }
 * ```
 */
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

import type { Database } from '@/db/database.types'

type TypedSupabaseClient = ReturnType<typeof createServerClient<Database>>

/**
 * Result of authenticateRequest function
 */
interface AuthResult {
  /** Authenticated user (null if authentication failed) */
  user: User | null
  /** Supabase client for database operations */
  supabase: TypedSupabaseClient
  /** Error response to return if authentication failed (null if success) */
  errorResponse: NextResponse | null
}

/**
 * Creates a Supabase client for API routes using cookies from the request
 *
 * @param request - Next.js API request
 * @returns Supabase client configured with cookies from the request
 */
function createApiClient(request: NextRequest): TypedSupabaseClient {
  // We need a mutable response to potentially set cookies
  let response = NextResponse.next({ request })

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options: Record<string, unknown>
          }>
        ) {
          // Set cookies on the request for subsequent operations
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Also prepare to set them on the response
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
}

/**
 * Authenticates an API request using cookies
 *
 * @param request - Next.js API request
 * @returns AuthResult with user, supabase client, and optional error response
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const { user, supabase, errorResponse } = await authenticateRequest(request)
 *   if (errorResponse) return errorResponse
 *
 *   // Use user.id and supabase for operations
 *   const recipe = await recipeService.create(user.id, data)
 * }
 * ```
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const supabase = createApiClient(request)

  // Get user from session (reads from cookies)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    console.error('[api-auth] Authentication failed:', {
      error: error?.message,
    })

    return {
      user: null,
      supabase,
      errorResponse: NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required. Please log in.',
        },
        { status: 401 }
      ),
    }
  }

  // Success - return user and supabase client
  return {
    user,
    supabase,
    errorResponse: null,
  }
}

/**
 * Type guard to check if authentication was successful
 *
 * @example
 * ```typescript
 * const auth = await authenticateRequest(request)
 * if (!isAuthenticated(auth)) return auth.errorResponse
 *
 * // TypeScript now knows auth.user is not null
 * console.log(auth.user.id)
 * ```
 */
export function isAuthenticated(
  result: AuthResult
): result is AuthResult & { user: User; errorResponse: null } {
  return result.user !== null && result.errorResponse === null
}

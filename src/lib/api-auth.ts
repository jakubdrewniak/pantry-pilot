/**
 * API Authentication Helper
 *
 * Centralized authentication logic for API routes.
 * Extracts Bearer token from Authorization header and verifies it with Supabase.
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
import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

import { createClient } from '@/db/supabase.api'

type TypedSupabaseClient = ReturnType<typeof createClient>

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
 * Authenticates an API request using Bearer token from Authorization header
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
  const supabase = createClient()

  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return {
      user: null,
      supabase,
      errorResponse: NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication token is required',
        },
        { status: 401 }
      ),
    }
  }

  // Verify token with Supabase
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    console.error('[api-auth] Token verification failed:', {
      hasToken: true,
      error: error?.message,
    })

    return {
      user: null,
      supabase,
      errorResponse: NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Invalid or expired token',
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

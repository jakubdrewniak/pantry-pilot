/**
 * Shopping List API Routes - Get or Create Shopping List
 *
 * Endpoint: GET /api/households/{householdId}/shopping-list
 *
 * Retrieves the active shopping list for a household. If no list exists, creates one automatically.
 * Each household has one active shopping list.
 *
 * Authentication: Cookie-based (handled by authenticateRequest)
 * Authorization: User must be a member of the household
 *
 * Returns:
 * - 200 OK: Shopping list with items array
 * - 400 Bad Request: Invalid UUID format
 * - 401 Unauthorized: Authentication required
 * - 403 Forbidden: User not a member of household
 * - 500 Internal Server Error: Unexpected error
 */
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/api-auth'
import { ShoppingListService, ShoppingListNotFoundError } from '@/lib/services/shoppingList.service'
import { householdIdParamSchema } from '@/lib/validation/shoppingList'
import type { GetShoppingListResponse } from '@/types/types'
import type { Database } from '@/db/database.types'

/**
 * Route parameters interface
 * Next.js 15+ uses Promise<T> for params
 */
interface RouteParams {
  params: Promise<{
    householdId: string
  }>
}

/**
 * GET /api/households/{householdId}/shopping-list
 *
 * Get or create active shopping list for a household
 *
 * @param request - Next.js request object
 * @param params - Route parameters (householdId)
 * @returns JSON response with shopping list and items
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<GetShoppingListResponse | { error: string; message?: string }>> {
  try {
    // SECTION 1: Authentication
    // Validate user session from cookies (no Authorization header needed)
    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>

    // SECTION 2: Validate path parameters
    // Extract householdId from route parameters
    const { householdId } = await params

    // Validate householdId is a valid UUID
    const paramValidation = householdIdParamSchema.safeParse({ householdId })
    if (!paramValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid household ID format',
        },
        { status: 400 }
      )
    }

    // SECTION 3: Business logic
    // Initialize service with authenticated Supabase client
    const shoppingListService = new ShoppingListService(
      supabase as unknown as SupabaseClient<Database>
    )

    // Get or create shopping list with authorization check (throws if not authorized)
    const shoppingList = await shoppingListService.getOrCreateShoppingList(householdId, user!.id)

    // SECTION 4: Success response
    return NextResponse.json(shoppingList, { status: 200 })
  } catch (error) {
    // SECTION 5: Error handling - Map service errors to HTTP status codes

    // Shopping list not found or user not authorized
    if (error instanceof ShoppingListNotFoundError) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: error.message,
        },
        { status: 403 }
      )
    }

    // SECTION 6: Global error handler
    // Log unexpected errors with context
    console.error('[GET /api/households/{householdId}/shopping-list] Unexpected error:', {
      householdId: (await params).householdId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

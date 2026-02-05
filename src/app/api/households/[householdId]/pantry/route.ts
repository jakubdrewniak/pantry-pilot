/**
 * Pantry API Routes - Get Pantry by Household
 *
 * Endpoint: GET /api/households/{householdId}/pantry
 *
 * Retrieves the pantry and all its items for a specific household.
 *
 * Authentication: Cookie-based (handled by authenticateRequest)
 * Authorization: User must be a member of the household
 *
 * Returns:
 * - 200 OK: Pantry with items array
 * - 400 Bad Request: Invalid UUID format
 * - 401 Unauthorized: Authentication required
 * - 404 Not Found: Pantry not found or user not authorized
 * - 500 Internal Server Error: Unexpected error
 */
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/api-auth'
import { PantryService, PantryNotFoundError } from '@/lib/services/pantry.service'
import { UUIDSchema } from '@/lib/validation/pantry'
import type { GetPantryResponse } from '@/types/types'
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
 * GET /api/households/{householdId}/pantry
 *
 * Retrieve pantry with all items for a household
 *
 * @param request - Next.js request object
 * @param params - Route parameters (householdId)
 * @returns JSON response with pantry and items
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<GetPantryResponse | { error: string; message?: string }>> {
  try {
    // SECTION 1: Authentication
    // Validate user session from cookies (no Authorization header needed)
    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>

    // SECTION 2: Validate path parameters
    // Extract householdId from route parameters
    const { householdId } = await params

    // Validate householdId is a valid UUID
    const uuidValidation = UUIDSchema.safeParse(householdId)
    if (!uuidValidation.success) {
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
    const pantryService = new PantryService(supabase as unknown as SupabaseClient<Database>)

    // Get pantry with authorization check (throws if not authorized)
    const pantry = await pantryService.getPantryByHousehold(householdId, user!.id)

    // SECTION 4: Success response
    return NextResponse.json(pantry, { status: 200 })
  } catch (error) {
    // SECTION 5: Error handling - Map service errors to HTTP status codes

    // Pantry not found or user not authorized
    if (error instanceof PantryNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
        },
        { status: 404 }
      )
    }

    // SECTION 6: Global error handler
    // Log unexpected errors with context
    console.error('[GET /api/households/{householdId}/pantry] Unexpected error:', {
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

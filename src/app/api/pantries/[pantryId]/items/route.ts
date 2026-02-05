/**
 * Pantry Items API Routes - List Items
 *
 * Endpoint: GET /api/pantries/{pantryId}/items
 *
 * Retrieves all items from a specific pantry.
 *
 * Authentication: Cookie-based (handled by authenticateRequest)
 * Authorization: User must have access to pantry (via household membership)
 *
 * Returns:
 * - 200 OK: Array of items wrapped in data object
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
import type { ListPantryItemsResponse } from '@/types/types'
import type { Database } from '@/db/database.types'

/**
 * Route parameters interface
 * Next.js 15+ uses Promise<T> for params
 */
interface RouteParams {
  params: Promise<{
    pantryId: string
  }>
}

/**
 * GET /api/pantries/{pantryId}/items
 *
 * List all items in a specific pantry
 *
 * @param request - Next.js request object
 * @param params - Route parameters (pantryId)
 * @returns JSON response with items array
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ListPantryItemsResponse | { error: string; message?: string }>> {
  try {
    // SECTION 1: Authentication
    // Validate user session from cookies (no Authorization header needed)
    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>

    // SECTION 2: Validate path parameters
    // Extract pantryId from route parameters
    const { pantryId } = await params

    // Validate pantryId is a valid UUID
    const uuidValidation = UUIDSchema.safeParse(pantryId)
    if (!uuidValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid pantry ID format',
        },
        { status: 400 }
      )
    }

    // SECTION 3: Business logic
    // Initialize service with authenticated Supabase client
    const pantryService = new PantryService(supabase as unknown as SupabaseClient<Database>)

    // Get items with authorization check (throws if not authorized)
    const items = await pantryService.listItems(pantryId, user!.id)

    // SECTION 4: Success response
    // Return items wrapped in data object for consistency with other list endpoints
    return NextResponse.json({ data: items }, { status: 200 })
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
    console.error('[GET /api/pantries/{pantryId}/items] Unexpected error:', {
      pantryId: (await params).pantryId,
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

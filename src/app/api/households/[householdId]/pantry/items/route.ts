/**
 * Pantry Items API Routes - Add Items (Batch)
 *
 * Endpoint: POST /api/households/{householdId}/pantry/items
 *
 * Adds multiple items to a household's pantry in a single atomic operation.
 *
 * Authentication: Cookie-based (handled by authenticateRequest)
 * Authorization: User must be a member of the household
 *
 * Request Body:
 * {
 *   "items": [
 *     { "name": "Rice", "quantity": 2, "unit": "kg" },
 *     { "name": "Beans", "quantity": 1, "unit": "kg" }
 *   ]
 * }
 *
 * Returns:
 * - 201 Created: Array of created items
 * - 400 Bad Request: Invalid UUID, JSON, or validation failure
 * - 401 Unauthorized: Authentication required
 * - 404 Not Found: Pantry not found or user not authorized
 * - 409 Conflict: Duplicate item name (entire batch rejected)
 * - 500 Internal Server Error: Unexpected error
 */
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/api-auth'
import {
  PantryService,
  PantryNotFoundError,
  DuplicateItemError,
} from '@/lib/services/pantry.service'
import { UUIDSchema, AddPantryItemsSchema } from '@/lib/validation/pantry'
import type { AddPantryItemsResponse } from '@/types/types'
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
 * POST /api/households/{householdId}/pantry/items
 *
 * Add multiple items to pantry (batch operation)
 *
 * @param request - Next.js request object
 * @param params - Route parameters (householdId)
 * @returns JSON response with created items
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<
  NextResponse<AddPantryItemsResponse | { error: string; message?: string; details?: unknown }>
> {
  try {
    // SECTION 1: Authentication
    // Validate user session from cookies (no Authorization header needed)
    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse)
      return errorResponse as NextResponse<{ error: string; message?: string; details?: unknown }>

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

    // SECTION 3: Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid JSON in request body',
        },
        { status: 400 }
      )
    }

    // Validate body against schema
    const validation = AddPantryItemsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Invalid request data',
          details: validation.error.format(),
        },
        { status: 400 }
      )
    }

    // SECTION 4: Business logic
    // Initialize service with authenticated Supabase client
    const pantryService = new PantryService(supabase as unknown as SupabaseClient<Database>)

    // Add items with authorization check (throws if not authorized or duplicates)
    const items = await pantryService.addItems(householdId, user!.id, validation.data.items)

    // SECTION 5: Success response
    return NextResponse.json({ items }, { status: 201 })
  } catch (error) {
    // SECTION 6: Error handling - Map service errors to HTTP status codes

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

    // Duplicate item names found (case-insensitive)
    if (error instanceof DuplicateItemError) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: error.message,
          details: {
            duplicateNames: error.duplicateNames,
          },
        },
        { status: 409 }
      )
    }

    // Zod validation error (shouldn't happen if we validated above, but safety check)
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Invalid request data',
          details: error.format(),
        },
        { status: 400 }
      )
    }

    // SECTION 7: Global error handler
    // Log unexpected errors with context
    console.error('[POST /api/households/{householdId}/pantry/items] Unexpected error:', {
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

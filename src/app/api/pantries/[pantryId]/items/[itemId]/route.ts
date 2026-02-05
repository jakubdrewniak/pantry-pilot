/**
 * Pantry Item API Routes - Update & Delete Item
 *
 * Endpoints:
 * - PATCH /api/pantries/{pantryId}/items/{itemId} - Update item quantity or unit
 * - DELETE /api/pantries/{pantryId}/items/{itemId} - Delete item from pantry
 *
 * Authentication: Cookie-based (handled by authenticateRequest)
 * Authorization: User must have access to pantry (via household membership)
 *
 * PATCH Request Body:
 * {
 *   "quantity": 3,     // Optional (but at least one field required)
 *   "unit": "kg"       // Optional (but at least one field required)
 * }
 *
 * PATCH Returns:
 * - 200 OK: Updated item object
 * - 400 Bad Request: Invalid UUID, JSON, validation failure, or no fields provided
 * - 401 Unauthorized: Authentication required
 * - 404 Not Found: Pantry/item not found or user not authorized
 * - 500 Internal Server Error: Unexpected error
 *
 * DELETE Returns:
 * - 204 No Content: Item successfully deleted
 * - 400 Bad Request: Invalid UUID format
 * - 401 Unauthorized: Authentication required
 * - 404 Not Found: Pantry/item not found or user not authorized
 * - 500 Internal Server Error: Unexpected error
 */
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/api-auth'
import {
  PantryService,
  PantryNotFoundError,
  ItemNotFoundError,
  EmptyUpdateError,
} from '@/lib/services/pantry.service'
import { UUIDSchema, UpdatePantryItemSchema } from '@/lib/validation/pantry'
import type { UpdatePantryItemResponse } from '@/types/types'
import type { Database } from '@/db/database.types'

/**
 * Route parameters interface
 * Next.js 15+ uses Promise<T> for params
 */
interface RouteParams {
  params: Promise<{
    pantryId: string
    itemId: string
  }>
}

/**
 * PATCH /api/pantries/{pantryId}/items/{itemId}
 *
 * Update quantity or unit for a specific pantry item
 *
 * @param request - Next.js request object
 * @param params - Route parameters (pantryId, itemId)
 * @returns JSON response with updated item
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<
  NextResponse<UpdatePantryItemResponse | { error: string; message?: string; details?: unknown }>
> {
  try {
    // SECTION 1: Authentication
    // Validate user session from cookies (no Authorization header needed)
    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse)
      return errorResponse as NextResponse<{ error: string; message?: string; details?: unknown }>

    // SECTION 2: Validate path parameters
    // Extract pantryId and itemId from route parameters
    const { pantryId, itemId } = await params

    // Validate pantryId is a valid UUID
    const pantryIdValidation = UUIDSchema.safeParse(pantryId)
    if (!pantryIdValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid pantry ID format',
        },
        { status: 400 }
      )
    }

    // Validate itemId is a valid UUID
    const itemIdValidation = UUIDSchema.safeParse(itemId)
    if (!itemIdValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid item ID format',
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
    const validation = UpdatePantryItemSchema.safeParse(body)
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

    // Update item with authorization check (throws if not authorized)
    const updatedItem = await pantryService.updateItem(pantryId, itemId, user!.id, validation.data)

    // SECTION 5: Success response
    return NextResponse.json(updatedItem, { status: 200 })
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

    // Item not found
    if (error instanceof ItemNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
        },
        { status: 404 }
      )
    }

    // No fields provided for update
    if (error instanceof EmptyUpdateError) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: error.message,
        },
        { status: 400 }
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
    console.error('[PATCH /api/pantries/{pantryId}/items/{itemId}] Unexpected error:', {
      pantryId: (await params).pantryId,
      itemId: (await params).itemId,
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

/**
 * DELETE /api/pantries/{pantryId}/items/{itemId}
 *
 * Delete a specific item from the pantry
 *
 * @param request - Next.js request object
 * @param params - Route parameters (pantryId, itemId)
 * @returns 204 No Content on success, or error response
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<never | { error: string; message?: string }>> {
  try {
    // SECTION 1: Authentication
    // Validate user session from cookies (no Authorization header needed)
    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>

    // SECTION 2: Validate path parameters
    // Extract pantryId and itemId from route parameters
    const { pantryId, itemId } = await params

    // Validate pantryId is a valid UUID
    const pantryIdValidation = UUIDSchema.safeParse(pantryId)
    if (!pantryIdValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid pantry ID format',
        },
        { status: 400 }
      )
    }

    // Validate itemId is a valid UUID
    const itemIdValidation = UUIDSchema.safeParse(itemId)
    if (!itemIdValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid item ID format',
        },
        { status: 400 }
      )
    }

    // SECTION 3: Business logic
    // Initialize service with authenticated Supabase client
    const pantryService = new PantryService(supabase as unknown as SupabaseClient<Database>)

    // Delete item with authorization check (throws if not authorized)
    await pantryService.deleteItem(pantryId, itemId, user!.id)

    // SECTION 4: Success response
    // Return 204 No Content (no response body)
    return new NextResponse(null, { status: 204 })
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

    // Item not found
    if (error instanceof ItemNotFoundError) {
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
    console.error('[DELETE /api/pantries/{pantryId}/items/{itemId}] Unexpected error:', {
      pantryId: (await params).pantryId,
      itemId: (await params).itemId,
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

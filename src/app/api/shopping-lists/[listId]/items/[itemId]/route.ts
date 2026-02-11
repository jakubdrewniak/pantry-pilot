/**
 * Shopping List Item API Routes - Single Item Operations
 *
 * Endpoints:
 * - PATCH /api/shopping-lists/{listId}/items/{itemId} - Update item (quantity, unit, purchase status)
 * - DELETE /api/shopping-lists/{listId}/items/{itemId} - Delete item
 *
 * Authentication: Cookie-based (handled by authenticateRequest)
 * Authorization: User must be a member of the household that owns the shopping list
 *
 * PATCH Returns:
 * - 200 OK: Updated item (+ pantryItem if purchased)
 * - 400 Bad Request: Invalid UUID or validation errors
 * - 401 Unauthorized: Authentication required
 * - 404 Not Found: Item or list not found
 * - 500 Internal Server Error: Unexpected error
 *
 * DELETE Returns:
 * - 204 No Content: Item deleted successfully
 * - 400 Bad Request: Invalid UUID
 * - 401 Unauthorized: Authentication required
 * - 404 Not Found: Item or list not found
 * - 500 Internal Server Error: Unexpected error
 */
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/api-auth'
import {
  ShoppingListService,
  ShoppingListNotFoundError,
  ShoppingListItemNotFoundError,
  EmptyUpdateError,
  PantryNotFoundError,
  TransferToPantryError,
} from '@/lib/services/shoppingList.service'
import {
  listIdParamSchema,
  itemIdParamSchema,
  updateItemSchema,
} from '@/lib/validation/shoppingList'
import type { UpdateShoppingListItemResponse } from '@/types/types'
import type { Database } from '@/db/database.types'

/**
 * Route parameters interface
 * Next.js 15+ uses Promise<T> for params
 */
interface RouteParams {
  params: Promise<{
    listId: string
    itemId: string
  }>
}

/**
 * PATCH /api/shopping-lists/{listId}/items/{itemId}
 *
 * Update a shopping list item (quantity, unit, or purchase status)
 *
 * When isPurchased is set to true:
 * - Item is transferred to pantry (merged if exists)
 * - Item is deleted from shopping list
 * - Response includes both item and pantryItem
 *
 * Request body (all fields optional, but at least one required):
 * {
 *   "quantity": 3,
 *   "unit": "L",
 *   "isPurchased": true
 * }
 *
 * @param request - Next.js request object
 * @param params - Route parameters (listId, itemId)
 * @returns JSON response with updated item (+ pantryItem if purchased)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<
  NextResponse<
    UpdateShoppingListItemResponse | { error: string; message?: string; details?: unknown }
  >
> {
  try {
    // SECTION 1: Authentication
    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>

    // SECTION 2: Validate path parameters
    const { listId, itemId } = await params

    const listIdValidation = listIdParamSchema.safeParse({ listId })
    const itemIdValidation = itemIdParamSchema.safeParse({ itemId })

    if (!listIdValidation.success || !itemIdValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid list ID or item ID format',
        },
        { status: 400 }
      )
    }

    // SECTION 3: Validate request body
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

    const bodyValidation = updateItemSchema.safeParse(body)
    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Validation failed',
          details: bodyValidation.error.format(),
        },
        { status: 400 }
      )
    }

    const updates = bodyValidation.data

    // SECTION 4: Business logic
    const shoppingListService = new ShoppingListService(
      supabase as unknown as SupabaseClient<Database>
    )

    const result = await shoppingListService.updateItem(listId, itemId, user!.id, updates)

    // SECTION 5: Success response
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    // SECTION 6: Error handling

    if (error instanceof ShoppingListNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
        },
        { status: 404 }
      )
    }

    if (error instanceof ShoppingListItemNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
        },
        { status: 404 }
      )
    }

    if (error instanceof EmptyUpdateError) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: error.message,
        },
        { status: 400 }
      )
    }

    if (error instanceof PantryNotFoundError) {
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: 'Pantry not found for household',
        },
        { status: 500 }
      )
    }

    if (error instanceof TransferToPantryError) {
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: error.message,
        },
        { status: 500 }
      )
    }

    // SECTION 7: Global error handler
    console.error('[PATCH /api/shopping-lists/{listId}/items/{itemId}] Unexpected error:', {
      listId: (await params).listId,
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
 * DELETE /api/shopping-lists/{listId}/items/{itemId}
 *
 * Delete a shopping list item
 *
 * @param request - Next.js request object
 * @param params - Route parameters (listId, itemId)
 * @returns 204 No Content on success
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<void | { error: string; message?: string }>> {
  try {
    // SECTION 1: Authentication
    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>

    // SECTION 2: Validate path parameters
    const { listId, itemId } = await params

    const listIdValidation = listIdParamSchema.safeParse({ listId })
    const itemIdValidation = itemIdParamSchema.safeParse({ itemId })

    if (!listIdValidation.success || !itemIdValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid list ID or item ID format',
        },
        { status: 400 }
      )
    }

    // SECTION 3: Business logic
    const shoppingListService = new ShoppingListService(
      supabase as unknown as SupabaseClient<Database>
    )

    await shoppingListService.deleteItem(listId, itemId, user!.id)

    // SECTION 4: Success response (204 No Content)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    // SECTION 5: Error handling

    if (error instanceof ShoppingListNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
        },
        { status: 404 }
      )
    }

    if (error instanceof ShoppingListItemNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
        },
        { status: 404 }
      )
    }

    // SECTION 6: Global error handler
    console.error('[DELETE /api/shopping-lists/{listId}/items/{itemId}] Unexpected error:', {
      listId: (await params).listId,
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

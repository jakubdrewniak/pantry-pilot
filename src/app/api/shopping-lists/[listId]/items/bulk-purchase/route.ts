/**
 * Shopping List Bulk Purchase API Route
 *
 * Endpoint: POST /api/shopping-lists/{listId}/items/bulk-purchase
 *
 * Mark multiple items as purchased and transfer them to pantry in one operation.
 * Uses "partial success" pattern - some items may succeed while others fail.
 *
 * Authentication: Cookie-based (handled by authenticateRequest)
 * Authorization: User must be a member of the household that owns the shopping list
 *
 * Returns:
 * - 200 OK: Detailed results with purchased, transferred, failed arrays and summary
 * - 400 Bad Request: Invalid UUID or validation errors
 * - 401 Unauthorized: Authentication required
 * - 404 Not Found: Shopping list not found or access denied
 * - 500 Internal Server Error: Unexpected error
 *
 * Note: Returns 200 even if all items fail (check summary.successful for actual success count)
 */
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/api-auth'
import {
  ShoppingListService,
  ShoppingListNotFoundError,
  PantryNotFoundError,
} from '@/lib/services/shoppingList.service'
import { listIdParamSchema, bulkPurchaseSchema } from '@/lib/validation/shoppingList'
import type { BulkPurchaseItemsResponse } from '@/types/types'
import type { Database } from '@/db/database.types'

/**
 * Route parameters interface
 * Next.js 15+ uses Promise<T> for params
 */
interface RouteParams {
  params: Promise<{
    listId: string
  }>
}

/**
 * POST /api/shopping-lists/{listId}/items/bulk-purchase
 *
 * Mark multiple items as purchased and transfer to pantry
 *
 * Request body:
 * {
 *   "itemIds": ["uuid1", "uuid2", "uuid3"]
 * }
 *
 * Response (partial success pattern):
 * {
 *   "purchased": ["uuid1", "uuid2"],
 *   "transferred": [
 *     { "itemId": "uuid1", "pantryItemId": "pantry-uuid1" },
 *     { "itemId": "uuid2", "pantryItemId": "pantry-uuid2" }
 *   ],
 *   "failed": [
 *     { "itemId": "uuid3", "reason": "Item not found" }
 *   ],
 *   "summary": {
 *     "total": 3,
 *     "successful": 2,
 *     "failed": 1
 *   }
 * }
 *
 * @param request - Next.js request object
 * @param params - Route parameters (listId)
 * @returns JSON response with detailed results
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<
  NextResponse<BulkPurchaseItemsResponse | { error: string; message?: string; details?: unknown }>
> {
  try {
    // SECTION 1: Authentication
    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>

    // SECTION 2: Validate path parameters
    const { listId } = await params

    const paramValidation = listIdParamSchema.safeParse({ listId })
    if (!paramValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid list ID format',
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

    const bodyValidation = bulkPurchaseSchema.safeParse(body)
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

    const { itemIds } = bodyValidation.data

    // SECTION 4: Business logic
    const shoppingListService = new ShoppingListService(
      supabase as unknown as SupabaseClient<Database>
    )

    const result = await shoppingListService.bulkPurchase(listId, itemIds, user!.id)

    // SECTION 5: Success response
    // Note: Returns 200 even if some/all items failed (partial success pattern)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    // SECTION 6: Error handling

    // Shopping list not found or user not authorized
    if (error instanceof ShoppingListNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
        },
        { status: 404 }
      )
    }

    // Pantry not found (should not happen in normal flow)
    if (error instanceof PantryNotFoundError) {
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: 'Pantry not found for household',
        },
        { status: 500 }
      )
    }

    // SECTION 7: Global error handler
    console.error('[POST /api/shopping-lists/{listId}/items/bulk-purchase] Unexpected error:', {
      listId: (await params).listId,
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

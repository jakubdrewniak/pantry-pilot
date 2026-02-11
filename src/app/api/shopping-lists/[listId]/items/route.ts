/**
 * Shopping List Items API Routes
 *
 * Endpoints:
 * - GET /api/shopping-lists/{listId}/items - List items with filtering and sorting
 * - POST /api/shopping-lists/{listId}/items - Add multiple items to shopping list
 *
 * Authentication: Cookie-based (handled by authenticateRequest)
 * Authorization: User must be a member of the household that owns the shopping list
 *
 * GET Returns:
 * - 200 OK: Array of shopping list items
 * - 400 Bad Request: Invalid UUID or query parameters
 * - 401 Unauthorized: Authentication required
 * - 404 Not Found: Shopping list not found or access denied
 * - 500 Internal Server Error: Unexpected error
 *
 * POST Returns:
 * - 201 Created: Array of created items
 * - 400 Bad Request: Invalid request body or validation errors
 * - 401 Unauthorized: Authentication required
 * - 404 Not Found: Shopping list not found or access denied
 * - 409 Conflict: Duplicate item names
 * - 500 Internal Server Error: Unexpected error
 */
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/api-auth'
import {
  ShoppingListService,
  ShoppingListNotFoundError,
  DuplicateItemError,
} from '@/lib/services/shoppingList.service'
import {
  listIdParamSchema,
  listItemsQuerySchema,
  addItemsSchema,
} from '@/lib/validation/shoppingList'
import type { ListShoppingListItemsResponse, AddShoppingListItemsResponse } from '@/types/types'
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
 * GET /api/shopping-lists/{listId}/items
 *
 * List items in a shopping list with optional filtering and sorting
 *
 * Query parameters:
 * - isPurchased: Filter by purchase status (true/false)
 * - sort: Sort field (createdAt, name, isPurchased) - default: createdAt
 *
 * @param request - Next.js request object
 * @param params - Route parameters (listId)
 * @returns JSON response with array of items
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ListShoppingListItemsResponse | { error: string; message?: string }>> {
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

    // SECTION 3: Validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      isPurchased: searchParams.get('isPurchased') || undefined,
      sort: searchParams.get('sort') || undefined,
    }

    const queryValidation = listItemsQuerySchema.safeParse(queryParams)
    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid query parameters',
        },
        { status: 400 }
      )
    }

    const { isPurchased, sort } = queryValidation.data

    // SECTION 4: Business logic
    const shoppingListService = new ShoppingListService(
      supabase as unknown as SupabaseClient<Database>
    )

    const items = await shoppingListService.listItems(
      listId,
      user!.id,
      isPurchased !== undefined ? { isPurchased } : undefined,
      sort
    )

    // SECTION 5: Success response
    return NextResponse.json({ data: items }, { status: 200 })
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

    // SECTION 7: Global error handler
    console.error('[GET /api/shopping-lists/{listId}/items] Unexpected error:', {
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

/**
 * POST /api/shopping-lists/{listId}/items
 *
 * Add multiple items to a shopping list
 *
 * Request body:
 * {
 *   "items": [
 *     { "name": "Milk", "quantity": 2, "unit": "L" },
 *     { "name": "Eggs", "quantity": 12, "unit": "pcs" }
 *   ]
 * }
 *
 * @param request - Next.js request object
 * @param params - Route parameters (listId)
 * @returns JSON response with created items
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<
  NextResponse<
    AddShoppingListItemsResponse | { error: string; message?: string; details?: unknown }
  >
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

    const bodyValidation = addItemsSchema.safeParse(body)
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

    const { items } = bodyValidation.data

    // SECTION 4: Business logic
    const shoppingListService = new ShoppingListService(
      supabase as unknown as SupabaseClient<Database>
    )

    const createdItems = await shoppingListService.addItems(listId, user!.id, items)

    // SECTION 5: Success response
    return NextResponse.json({ items: createdItems }, { status: 201 })
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

    if (error instanceof DuplicateItemError) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: error.message,
          details: { duplicates: error.duplicateNames },
        },
        { status: 409 }
      )
    }

    // SECTION 7: Global error handler
    console.error('[POST /api/shopping-lists/{listId}/items] Unexpected error:', {
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

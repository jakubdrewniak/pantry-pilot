/**
 * Generate Shopping List from Recipes API Route
 *
 * Endpoint: POST /api/shopping-lists/generate
 *
 * Populates the household's shopping list with ingredients from selected recipes.
 * Combines duplicate ingredients by summing quantities. Merges with existing list items.
 * Triggers Supabase Realtime INSERT events for all connected household members.
 *
 * Authentication: Cookie-based (handled by authenticateRequest)
 * Authorization: Recipes must belong to user's household
 *
 * Returns:
 * - 201 Created: Array of created/updated shopping list items
 * - 400 Bad Request: Invalid JSON, missing recipeIds, > 20 recipes, invalid UUIDs
 * - 401 Unauthorized: Authentication required
 * - 404 Not Found: Recipe not found or doesn't belong to user's household
 * - 500 Internal Server Error: Unexpected error
 */
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/api-auth'
import {
  ShoppingListService,
  ShoppingListNotFoundError,
  RecipeNotFoundError,
} from '@/lib/services/shoppingList.service'
import { generateShoppingListSchema } from '@/lib/validation/shoppingList'
import type { GenerateShoppingListResponse } from '@/types/types'
import type { Database } from '@/db/database.types'

/**
 * POST /api/shopping-lists/generate
 *
 * Generate shopping list items from selected recipes
 *
 * Request body:
 * {
 *   "recipeIds": ["uuid1", "uuid2"]
 * }
 *
 * @param request - Next.js request object
 * @returns JSON response with generated items
 */
export async function POST(
  request: NextRequest
): Promise<
  NextResponse<
    GenerateShoppingListResponse | { error: string; message?: string; details?: unknown }
  >
> {
  try {
    // SECTION 1: Authentication
    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>

    // SECTION 2: Validate request body
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

    const bodyValidation = generateShoppingListSchema.safeParse(body)
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

    const { recipeIds } = bodyValidation.data

    // SECTION 3: Business logic
    const shoppingListService = new ShoppingListService(
      supabase as unknown as SupabaseClient<Database>
    )

    const items = await shoppingListService.generateFromRecipes(user!.id, recipeIds)

    // SECTION 4: Success response
    return NextResponse.json({ items }, { status: 201 })
  } catch (error) {
    // SECTION 5: Error handling

    if (error instanceof RecipeNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
        },
        { status: 404 }
      )
    }

    if (error instanceof ShoppingListNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
        },
        { status: 404 }
      )
    }

    // SECTION 6: Global error handler
    console.error('[POST /api/shopping-lists/generate] Unexpected error:', {
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

import { NextRequest, NextResponse } from 'next/server'

import { authenticateRequest } from '@/lib/api-auth'
import { RecipeService } from '@/lib/services/recipe.service'
import {
  CreateRecipeSchema,
  ListRecipesQuerySchema,
  parseSortParam,
  BulkDeleteRecipesSchema,
} from '@/lib/validation/recipes'
import type { RecipeFilters } from '@/lib/validation/recipes'
import type {
  CreateRecipeResponse,
  RecipesListResponse,
  BulkDeleteRecipesResponse,
} from '@/types/types'

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Validates if a string is a valid UUID v4 format
 */
function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

/**
 * POST /api/recipes
 *
 * Creates a new manual recipe for the authenticated user.
 * The recipe is associated with the user's household and marked with creation_method: 'manual'.
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Request Body:
 * - title: string (3-100 characters)
 * - ingredients: array of {name, quantity, unit?}
 * - instructions: string
 * - prepTime?: number (minutes, >= 0)
 * - cookTime?: number (minutes, >= 0)
 * - mealType?: 'breakfast' | 'lunch' | 'dinner'
 *
 * Response:
 * - 201 Created: Returns the created Recipe with Location header
 * - 400 Bad Request: Invalid input data
 * - 401 Unauthorized: Missing or invalid authentication
 * - 500 Internal Server Error: Unexpected server error
 *
 * @see src/lib/api-auth.ts - authentication helper
 */
export async function POST(
  request: NextRequest
): Promise<
  NextResponse<CreateRecipeResponse | { error: string; message?: string; details?: unknown }>
> {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>
    // After this point, user and supabase are guaranteed to be non-null

    // ========================================================================
    // 2. PARSE & VALIDATE REQUEST BODY
    // ========================================================================

    // Parse JSON body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid JSON format',
        },
        { status: 400 }
      )
    }

    // Validate with Zod schema
    const validationResult = CreateRecipeSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const validatedInput = validationResult.data

    // ========================================================================
    // 3. BUSINESS LOGIC - CREATE RECIPE
    // ========================================================================

    const recipeService = new RecipeService(supabase)
    const recipe = await recipeService.createManualRecipe(user!.id, validatedInput)

    // ========================================================================
    // 4. SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(recipe, {
      status: 201,
      headers: {
        Location: `/api/recipes/${recipe.id}`,
      },
    })
  } catch (error) {
    // ========================================================================
    // 5. GLOBAL ERROR HANDLER
    // ========================================================================

    console.error('[POST /api/recipes] Unexpected error:', error)

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
 * GET /api/recipes
 *
 * Lists recipes with optional filtering, search, and pagination.
 * Returns recipes from the authenticated user's household.
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Query Parameters:
 * - search?: string (max 200 chars) - Full-text search across title/ingredients
 * - mealType?: 'breakfast' | 'lunch' | 'dinner'
 * - creationMethod?: 'manual' | 'ai_generated' | 'ai_generated_modified'
 * - page?: number (min 1, default 1)
 * - pageSize?: number (min 1, max 100, default 20)
 * - sort?: string (default '-createdAt')
 *
 * Response:
 * - 200 OK: Returns RecipesListResponse with data and pagination
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing or invalid authentication
 * - 500 Internal Server Error: Unexpected server error
 *
 * @see src/lib/api-auth.ts - authentication helper
 */
export async function GET(
  request: NextRequest
): Promise<
  NextResponse<RecipesListResponse | { error: string; message?: string; details?: unknown }>
> {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>
    // After this point, user and supabase are guaranteed to be non-null

    // ========================================================================
    // 2. PARSE & VALIDATE QUERY PARAMETERS
    // ========================================================================

    const { searchParams } = new URL(request.url)
    const rawQuery = {
      search: searchParams.get('search') || undefined,
      mealType: searchParams.get('mealType') || undefined,
      creationMethod: searchParams.get('creationMethod') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      sort: searchParams.get('sort') || undefined,
    }

    // Validate with Zod schema
    const validationResult = ListRecipesQuerySchema.safeParse(rawQuery)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const validatedQuery = validationResult.data

    // ========================================================================
    // 3. TRANSFORM TO SERVICE FILTERS
    // ========================================================================

    const { field, direction } = parseSortParam(validatedQuery.sort)

    const filters: RecipeFilters = {
      search: validatedQuery.search,
      mealType: validatedQuery.mealType,
      creationMethod: validatedQuery.creationMethod,
      page: validatedQuery.page,
      pageSize: validatedQuery.pageSize,
      sortField: field,
      sortDirection: direction,
    }

    // ========================================================================
    // 4. BUSINESS LOGIC - LIST RECIPES
    // ========================================================================

    const recipeService = new RecipeService(supabase)
    const result = await recipeService.listRecipes(user!.id, filters)

    // ========================================================================
    // 5. SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    // ========================================================================
    // 6. GLOBAL ERROR HANDLER
    // ========================================================================

    console.error('[GET /api/recipes] Unexpected error:', error)

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
 * DELETE /api/recipes
 *
 * Deletes multiple recipes in a single request (bulk delete).
 * Returns detailed results including successful deletions and failures.
 * Partial success is normal - some recipes may be deleted while others fail.
 *
 * Headers:
 * - Authorization: Bearer <token>
 * - Content-Type: application/json
 *
 * Request Body:
 * - ids: string[] (1-50 UUIDs)
 *
 * Response:
 * - 200 OK: Returns BulkDeleteRecipesResponse (even if all failed!)
 * - 400 Bad Request: Invalid body, invalid UUIDs, or out of range (1-50)
 * - 401 Unauthorized: Missing or invalid authentication
 * - 500 Internal Server Error: Unexpected server error
 *
 * Important:
 * - Returns 200 even if ALL deletions fail (check response.failed array)
 * - Partial success is expected and reported in response
 * - Each recipe is processed independently (no transaction)
 * - Maximum 50 recipes per request to prevent abuse
 * - Failed items don't reveal if recipe exists or user has no access
 *
 * Response Structure:
 * {
 *   deleted: ["id1", "id3"],           // Successfully deleted
 *   failed: [                          // Failed to delete
 *     { id: "id2", reason: "..." }
 *   ],
 *   summary: {
 *     total: 3,
 *     successful: 2,
 *     failed: 1
 *   }
 * }
 *
 * Use Cases:
 * - Delete multiple recipes from UI (multi-select)
 * - "Delete all" functionality
 * - Cleanup operations
 *
 * Security:
 * - Same authorization as single delete
 * - Cannot delete recipes from other households
 * - Limit of 50 prevents abuse/DoS
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/recipe.service.ts - business logic
 * @see src/lib/validation/recipes.ts - BulkDeleteRecipesSchema
 */
export async function DELETE(
  request: NextRequest
): Promise<
  NextResponse<BulkDeleteRecipesResponse | { error: string; message?: string; details?: unknown }>
> {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>
    // After this point, user and supabase are guaranteed to be non-null

    // ========================================================================
    // 2. PARSE & VALIDATE REQUEST BODY
    // ========================================================================

    // Parse JSON body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid JSON format',
        },
        { status: 400 }
      )
    }

    // Validate with Zod schema (checks array length 1-50)
    const validationResult = BulkDeleteRecipesSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const { ids } = validationResult.data

    // ========================================================================
    // 3. VALIDATE UUID FORMATS
    // ========================================================================

    // Check each ID is valid UUID format before proceeding
    const invalidUUIDs: Array<{ field: string; message: string }> = []

    ids.forEach((id, index) => {
      if (!isValidUUID(id)) {
        invalidUUIDs.push({
          field: `ids.${index}`,
          message: `Invalid UUID format: ${id}`,
        })
      }
    })

    if (invalidUUIDs.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: invalidUUIDs,
        },
        { status: 400 }
      )
    }

    // ========================================================================
    // 4. BUSINESS LOGIC - BULK DELETE RECIPES
    // ========================================================================

    const recipeService = new RecipeService(supabase)

    // bulkDeleteRecipes never throws - it returns results for all IDs
    const result = await recipeService.bulkDeleteRecipes(user!.id, ids)

    // ========================================================================
    // 5. SUCCESS RESPONSE
    // ========================================================================

    // Always return 200 OK with detailed results
    // Even if all deletions failed, the request was processed successfully
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    // ========================================================================
    // 6. GLOBAL ERROR HANDLER
    // ========================================================================

    console.error('[DELETE /api/recipes] Bulk delete unexpected error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

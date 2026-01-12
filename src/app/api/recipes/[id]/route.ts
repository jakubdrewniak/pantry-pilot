import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

import { authenticateRequest } from '@/lib/api-auth'
import { RecipeService, NoHouseholdError } from '@/lib/services/recipe.service'
import { CreateRecipeSchema } from '@/lib/validation/recipes'
import type { GetRecipeResponse, UpdateRecipeResponse } from '@/types/types'
import type { Database } from '@/db/database.types'

// UUID v4 validation regex
// This validates the format before passing to database to prevent injection
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Validates if a string is a valid UUID v4 format
 *
 * @param id - String to validate
 * @returns true if valid UUID v4, false otherwise
 */
function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

/**
 * GET /api/recipes/{id}
 *
 * Retrieves a single recipe by ID.
 * The recipe must belong to the authenticated user's household.
 *
 * Path Parameters:
 * - id: UUID of the recipe to retrieve
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Response:
 * - 200 OK: Returns the Recipe object
 * - 400 Bad Request: Invalid UUID format
 * - 401 Unauthorized: Missing or invalid authentication
 * - 404 Not Found: Recipe not found or user has no access
 * - 500 Internal Server Error: Unexpected server error
 *
 * Security:
 * - Returns 404 for both "not exists" and "no access" cases
 * - This prevents leaking information about other users' recipes
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/recipe.service.ts - business logic
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<GetRecipeResponse | { error: string; message?: string }>> {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>
    // After this point, user and supabase are guaranteed to be non-null

    // ========================================================================
    // 2. VALIDATE PATH PARAMETER
    // ========================================================================

    // In Next.js 15, params is a Promise and must be awaited
    const { id: recipeId } = await params

    // Validate UUID format before database query
    // This prevents potential SQL injection and provides better error messages
    if (!isValidUUID(recipeId)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid recipe ID format',
        },
        { status: 400 }
      )
    }

    // ========================================================================
    // 3. BUSINESS LOGIC - FETCH RECIPE
    // ========================================================================

    // Cast server client to generic SupabaseClient for service layer compatibility
    // Server client from @supabase/ssr and generic client are compatible at runtime
    const recipeService = new RecipeService(supabase as unknown as SupabaseClient<Database>)

    let recipe: GetRecipeResponse
    try {
      // RecipeService handles authorization check internally
      // It verifies that recipe belongs to user's household
      recipe = await recipeService.getRecipeById(user!.id, recipeId)
    } catch (error) {
      // Check if this is a "not found" error (either recipe doesn't exist or no access)
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Not Found',
            message: 'Recipe not found',
          },
          { status: 404 }
        )
      }

      // For any other error, re-throw to be caught by global handler
      throw error
    }

    // ========================================================================
    // 4. SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(recipe, { status: 200 })
  } catch (error) {
    // ========================================================================
    // 5. ERROR HANDLING - MAP SERVICE ERRORS TO HTTP STATUS CODES
    // ========================================================================

    if (error instanceof NoHouseholdError) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: error.message,
        },
        { status: 403 }
      )
    }

    // ========================================================================
    // 6. GLOBAL ERROR HANDLER
    // ========================================================================

    // Log the error for debugging, but don't expose details to client
    console.error('[GET /api/recipes/[id]] Unexpected error:', error)

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
 * PUT /api/recipes/{id}
 *
 * Updates an existing recipe with new content.
 * Completely replaces the recipe content (title, ingredients, instructions, etc.)
 * Does NOT change: id, household_id, creation_method.
 * The recipe must belong to the authenticated user's household.
 *
 * Path Parameters:
 * - id: UUID of the recipe to update
 *
 * Headers:
 * - Authorization: Bearer <token>
 * - Content-Type: application/json
 *
 * Request Body:
 * - title: string (3-100 characters)
 * - ingredients: array of {name, quantity, unit?} (min 1)
 * - instructions: string (non-empty)
 * - prepTime?: number (>= 0, in minutes)
 * - cookTime?: number (>= 0, in minutes)
 * - mealType?: 'breakfast' | 'lunch' | 'dinner'
 *
 * Response:
 * - 200 OK: Returns the updated Recipe object
 * - 400 Bad Request: Invalid UUID format or validation errors
 * - 401 Unauthorized: Missing or invalid authentication
 * - 404 Not Found: Recipe not found or user has no access
 * - 500 Internal Server Error: Unexpected server error
 *
 * Security:
 * - Returns 404 for both "not exists" and "no access" cases
 * - Validates all input through Zod schema
 * - Cannot change household_id or creation_method
 *
 * Similar to HTTP PUT semantics - full replacement of resource.
 * Compare with PATCH (partial update) which we might implement later.
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/recipe.service.ts - business logic
 * @see src/lib/validation/recipes.ts - Zod validation schemas
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<UpdateRecipeResponse | { error: string; message?: string; details?: unknown }>
> {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>
    // After this point, user and supabase are guaranteed to be non-null

    // ========================================================================
    // 2. VALIDATE PATH PARAMETER
    // ========================================================================

    // In Next.js 15, params is a Promise and must be awaited
    const { id: recipeId } = await params

    // Validate UUID format before proceeding
    if (!isValidUUID(recipeId)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid recipe ID format',
        },
        { status: 400 }
      )
    }

    // ========================================================================
    // 3. PARSE & VALIDATE REQUEST BODY
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
    // This ensures all business rules are met (lengths, types, constraints)
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
    // 4. BUSINESS LOGIC - UPDATE RECIPE
    // ========================================================================

    // Cast server client to generic SupabaseClient for service layer compatibility
    // Server client from @supabase/ssr and generic client are compatible at runtime
    const recipeService = new RecipeService(supabase as unknown as SupabaseClient<Database>)

    let recipe: UpdateRecipeResponse
    try {
      // RecipeService handles:
      // - Authorization check (household_id match)
      // - Existence verification
      // - Data transformation (camelCase → snake_case)
      // - Database update
      recipe = await recipeService.updateRecipe(user!.id, recipeId, validatedInput)
    } catch (error) {
      // Check if this is a "not found" error
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Not Found',
            message: 'Recipe not found',
          },
          { status: 404 }
        )
      }

      // For any other error, re-throw to be caught by global handler
      throw error
    }

    // ========================================================================
    // 5. SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(recipe, { status: 200 })
  } catch (error) {
    // ========================================================================
    // 6. ERROR HANDLING - MAP SERVICE ERRORS TO HTTP STATUS CODES
    // ========================================================================

    if (error instanceof NoHouseholdError) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: error.message,
        },
        { status: 403 }
      )
    }

    // ========================================================================
    // 7. GLOBAL ERROR HANDLER
    // ========================================================================

    console.error('[PUT /api/recipes/[id]] Unexpected error:', error)

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
 * DELETE /api/recipes/{id}
 *
 * Permanently deletes a recipe.
 * The recipe must belong to the authenticated user's household.
 * This is a hard delete - the recipe cannot be recovered.
 *
 * Path Parameters:
 * - id: UUID of the recipe to delete
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Response:
 * - 204 No Content: Recipe deleted successfully (no response body)
 * - 400 Bad Request: Invalid UUID format
 * - 401 Unauthorized: Missing or invalid authentication
 * - 404 Not Found: Recipe not found or user has no access
 * - 500 Internal Server Error: Unexpected server error
 *
 * Security:
 * - Returns 404 for both "not exists" and "no access" cases
 * - Verification step prevents accidental deletion
 * - Cannot delete recipes from other households
 *
 * Important:
 * - This is a PERMANENT deletion (hard delete)
 * - CASCADE constraints in database may delete related data
 * - Frontend should prompt user for confirmation before calling
 * - For soft delete pattern, consider adding a deleted_at field instead
 *
 * REST Semantics:
 * - DELETE is idempotent (deleting twice has same effect as once)
 * - First call: Returns 204 (deleted)
 * - Second call: Returns 404 (already gone)
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/recipe.service.ts - business logic
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<void | { error: string; message?: string }>> {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>
    // After this point, user and supabase are guaranteed to be non-null

    // ========================================================================
    // 2. VALIDATE PATH PARAMETER
    // ========================================================================

    // In Next.js 15, params is a Promise and must be awaited
    const { id: recipeId } = await params

    // Validate UUID format before proceeding
    if (!isValidUUID(recipeId)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid recipe ID format',
        },
        { status: 400 }
      )
    }

    // ========================================================================
    // 3. BUSINESS LOGIC - DELETE RECIPE
    // ========================================================================

    // Cast server client to generic SupabaseClient for service layer compatibility
    // Server client from @supabase/ssr and generic client are compatible at runtime
    const recipeService = new RecipeService(supabase as unknown as SupabaseClient<Database>)

    try {
      // RecipeService handles:
      // - Authorization check (household_id match)
      // - Existence verification
      // - Permanent deletion from database
      await recipeService.deleteRecipe(user!.id, recipeId)
    } catch (error) {
      // Check if this is a "not found" error
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Not Found',
            message: 'Recipe not found',
          },
          { status: 404 }
        )
      }

      // For any other error, re-throw to be caught by global handler
      throw error
    }

    // ========================================================================
    // 4. SUCCESS RESPONSE
    // ========================================================================

    // 204 No Content - successful deletion, no response body
    // Note: We use new NextResponse(null) instead of NextResponse.json()
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    // ========================================================================
    // 5. ERROR HANDLING - MAP SERVICE ERRORS TO HTTP STATUS CODES
    // ========================================================================

    if (error instanceof NoHouseholdError) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: error.message,
        },
        { status: 403 }
      )
    }

    // ========================================================================
    // 6. GLOBAL ERROR HANDLER
    // ========================================================================

    console.error('[DELETE /api/recipes/[id]] Unexpected error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

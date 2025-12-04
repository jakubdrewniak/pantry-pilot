import { NextRequest, NextResponse } from 'next/server'

import { authenticateRequest } from '@/lib/api-auth'
import { RecipeService } from '@/lib/services/recipe.service'
import { CreateRecipeSchema } from '@/lib/validation/recipes'
import type { CreateRecipeResponse } from '@/types/types'

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
    if (errorResponse) return errorResponse

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
    const recipe = await recipeService.createManualRecipe(user.id, validatedInput)

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

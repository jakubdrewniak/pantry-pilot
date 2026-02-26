import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/api-auth'
import { openRouter } from '@/lib/openrouter'
import {
  OpenRouterError,
  OpenRouterAuthError,
  OpenRouterNetworkError,
  OpenRouterServerError,
} from '@/lib/openrouter-service'
import { RECIPE_GENERATION_SYSTEM_PROMPT, buildRecipeGenerationPrompt } from '@/lib/prompts'
import { createRecipeResponseFormat } from '@/lib/recipe-schema-helper'
import { PantryService, PantryNotFoundError } from '@/lib/services/pantry.service'
import { RecipeSchema, GenerateRecipeRequestSchema } from '@/lib/validation/recipes'
import type { Database } from '@/db/database.types'
import type { GenerateRecipeResponse, Recipe } from '@/types/types'

/**
 * POST /api/recipes/generate
 *
 * Generates a new recipe using AI based on user hint and optionally pantry items.
 * Returns 202 Accepted with the generated recipe and any warnings.
 *
 * @see src/lib/api-auth.ts - authentication helper
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<GenerateRecipeResponse | { error: string }>> {
  try {
    // 1. Authentication
    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string }>

    // 2. Validate request body
    const body = await request.json()
    const validationResult = GenerateRecipeRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            'Invalid request body: ' + validationResult.error.errors.map(e => e.message).join(', '),
        },
        { status: 400 }
      )
    }

    const { hint, usePantryItems } = validationResult.data

    // 3. Resolve user's household
    const typedSupabase = supabase as unknown as SupabaseClient<Database>

    const { data: membership, error: membershipError } = await typedSupabase
      .from('user_households')
      .select('household_id')
      .eq('user_id', user!.id)
      .maybeSingle()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'User does not belong to any household' }, { status: 404 })
    }

    const householdId = membership.household_id

    // 4. Get pantry items if requested
    let pantryItems: Array<{ name: string; quantity: number; unit: string | null }> = []

    if (usePantryItems) {
      const pantryService = new PantryService(typedSupabase)
      const pantry = await pantryService.getPantryByHousehold(householdId, user!.id)
      pantryItems = pantry.items.map(({ name, quantity, unit }) => ({ name, quantity, unit }))
    }

    // 4. Build prompts
    const systemPrompt = RECIPE_GENERATION_SYSTEM_PROMPT
    const userPrompt = buildRecipeGenerationPrompt(
      hint,
      pantryItems.length > 0 ? pantryItems : undefined
    )

    // 5. Call OpenRouter API
    let completion
    try {
      completion = await openRouter.generateChatCompletion(
        {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          responseFormat: createRecipeResponseFormat(),
          params: {
            temperature: 0.7,
            max_tokens: 2048,
          },
        },
        RecipeSchema
      )
    } catch (error) {
      // Handle OpenRouter errors
      if (error instanceof OpenRouterAuthError) {
        console.error('OpenRouter authentication error:', error.message)
        return NextResponse.json({ error: 'AI service authentication failed' }, { status: 503 })
      }

      if (error instanceof OpenRouterNetworkError || error instanceof OpenRouterServerError) {
        console.error('OpenRouter service error:', error.message)
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again later.' },
          { status: 503 }
        )
      }

      // Re-throw other errors
      throw error
    }

    // 6. Extract and validate recipe from response
    const messageContent = completion.choices[0]?.message?.content

    if (!messageContent) {
      console.error('No content in OpenRouter response')
      return NextResponse.json({ error: 'AI service returned invalid response' }, { status: 503 })
    }

    let recipeData: unknown
    try {
      recipeData = JSON.parse(messageContent)
    } catch (parseError) {
      console.error('Failed to parse recipe JSON:', parseError)
      return NextResponse.json(
        { error: 'AI service returned invalid recipe format' },
        { status: 503 }
      )
    }

    // Validate with Zod schema
    const recipeValidation = RecipeSchema.safeParse(recipeData)

    if (!recipeValidation.success) {
      console.error('Recipe validation failed:', recipeValidation.error.errors)
      return NextResponse.json(
        {
          error:
            'AI generated invalid recipe: ' +
            recipeValidation.error.errors.map(e => e.message).join(', '),
        },
        { status: 503 }
      )
    }

    const validatedRecipe = recipeValidation.data

    // 7. Map to Recipe interface
    const recipe: Recipe = {
      id: crypto.randomUUID(),
      title: validatedRecipe.title,
      ingredients: validatedRecipe.ingredients,
      instructions: validatedRecipe.instructions,
      mealType: validatedRecipe.mealType,
      prepTime: validatedRecipe.prepTime,
      cookTime: validatedRecipe.cookTime,
      creationMethod: 'ai_generated',
      createdAt: new Date().toISOString(),
      householdId,
    }

    // 8. Build warnings
    const warnings: string[] | undefined = undefined

    // 9. Return response
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    return NextResponse.json(
      {
        recipe,
        warnings,
      },
      {
        status: 202,
        headers,
      }
    )
  } catch (error) {
    console.error('Error in recipe generation:', error)

    if (error instanceof PantryNotFoundError) {
      return NextResponse.json({ error: 'Household or pantry not found' }, { status: 404 })
    }

    if (error instanceof OpenRouterError) {
      return NextResponse.json({ error: 'AI service error occurred' }, { status: 503 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

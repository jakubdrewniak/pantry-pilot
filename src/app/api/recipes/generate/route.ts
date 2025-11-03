import { NextRequest, NextResponse } from 'next/server'
import { RecipeSchema } from '@/lib/validation/recipes'
import { openRouter } from '@/lib/openrouter'
import { RECIPE_GENERATION_SYSTEM_PROMPT, buildRecipeGenerationPrompt } from '@/lib/prompts'
import { createRecipeResponseFormat } from '@/lib/recipe-schema-helper'
import { GenerateRecipeRequestSchema } from '@/lib/validation/recipes'
import type { GenerateRecipeResponse, Recipe } from '@/types/types'
import {
  OpenRouterError,
  OpenRouterAuthError,
  OpenRouterNetworkError,
  OpenRouterServerError,
} from '@/lib/openrouter-service'

/**
 * Predefined pantry items for development/testing
 * TODO: Replace with actual database query when database is ready
 */
const MOCK_PANTRY_ITEMS: Array<{ name: string; quantity: number; unit: string | null }> = [
  { name: 'Eggs', quantity: 6, unit: 'pieces' },
  { name: 'Tomatoes', quantity: 4, unit: 'pieces' },
  { name: 'Basil', quantity: 1, unit: 'bunch' },
  { name: 'Olive oil', quantity: 200, unit: 'ml' },
  { name: 'Garlic', quantity: 3, unit: 'cloves' },
  { name: 'Onion', quantity: 1, unit: 'piece' },
  { name: 'Pasta', quantity: 500, unit: 'g' },
  { name: 'Salt', quantity: 1, unit: 'pinch' },
  { name: 'Black pepper', quantity: 1, unit: 'pinch' },
]

/**
 * POST /api/recipes/generate
 *
 * Generates a new recipe using AI based on user hint and optionally pantry items.
 * Returns 202 Accepted with the generated recipe and any warnings.
 *
 * @note This is a development version without database integration.
 * TODO: Add authentication and database queries when database is ready.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<GenerateRecipeResponse | { error: string }>> {
  try {
    // TODO: handle auth

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

    // 2. Get pantry items if requested (using mock data for now)
    let pantryItems: Array<{ name: string; quantity: number; unit: string | null }> = []

    if (usePantryItems) {
      pantryItems = MOCK_PANTRY_ITEMS
    }

    // 3. Build prompts
    const systemPrompt = RECIPE_GENERATION_SYSTEM_PROMPT
    const userPrompt = buildRecipeGenerationPrompt(
      hint,
      pantryItems.length > 0 ? pantryItems : undefined
    )

    // 4. Call OpenRouter API
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

    // 5. Extract and validate recipe from response
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

    // 6. Map to Recipe interface
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
      householdId: 'mock-household-id', // TODO: Replace with actual householdId when database is ready
    }

    // 7. Build warnings (none for mock data)
    const warnings: string[] | undefined = undefined

    // 8. Return response
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

    // Handle unexpected errors
    if (error instanceof OpenRouterError) {
      return NextResponse.json({ error: 'AI service error occurred' }, { status: 503 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

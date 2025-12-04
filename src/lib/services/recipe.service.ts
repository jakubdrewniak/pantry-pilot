import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { CreateRecipeInput } from '@/lib/validation/recipes'
import type { Recipe } from '@/types/types'

/**
 * Type alias for Supabase client with database types
 * Used for dependency injection in service layer
 */
type TypedSupabaseClient = SupabaseClient<Database>

/**
 * TEMPORARY: Default household ID for development
 * TODO: Remove this once household management is fully implemented.
 * For now, we have only one user in the database and need a mock household.
 */
const DEFAULT_HOUSEHOLD_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Database representation of recipe content (JSONB column)
 * This matches the structure stored in the recipes.content column
 */
interface RecipeContent {
  title: string
  ingredients: Array<{
    name: string
    quantity: number
    unit?: string
  }>
  instructions: string
  meal_type?: string
  prep_time?: number
  cook_time?: number
}

/**
 * RecipeService
 *
 * Business logic layer for recipe operations.
 * Handles data transformation between API DTOs and database models.
 *
 * Similar to Angular services - encapsulates business logic and data access.
 */
export class RecipeService {
  constructor(private supabase: TypedSupabaseClient) {}

  /**
   * Retrieves the household_id for a given user
   *
   * @param userId - The user's UUID
   * @returns The household_id if user is a member, null otherwise
   *
   * TODO: This query will work once households are implemented.
   * For now, returns null which will trigger a 404 response.
   */
  async getUserHouseholdId(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('user_households')
      .select('household_id')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return data.household_id
  }

  /**
   * Creates a new manual recipe
   *
   * @param userId - The user creating the recipe
   * @param input - Validated recipe input from CreateRecipeSchema
   * @returns The created Recipe DTO
   * @throws Error if database operation fails
   *
   * Flow:
   * 1. Get user's household_id (or use default for development)
   * 2. Transform input to JSONB format
   * 3. Insert to database
   * 4. Transform database response to Recipe DTO
   *
   * TEMPORARY: Currently uses DEFAULT_HOUSEHOLD_ID as fallback for development.
   * TODO: Once households are implemented, remove the fallback and throw error
   * when user is not a member of any household.
   */
  async createManualRecipe(userId: string, input: CreateRecipeInput): Promise<Recipe> {
    // Try to get user's household_id from database
    let householdId = await this.getUserHouseholdId(userId)

    // TEMPORARY WORKAROUND: Use default household for single-user development
    // TODO: Remove this fallback once household management is fully implemented
    if (!householdId) {
      console.warn(
        `[RecipeService] User ${userId} has no household. Using DEFAULT_HOUSEHOLD_ID for development.`
      )
      householdId = DEFAULT_HOUSEHOLD_ID
    }

    // Transform API input (camelCase) to database format (snake_case in JSONB)
    const recipeContent: RecipeContent = {
      title: input.title,
      ingredients: input.ingredients,
      instructions: input.instructions,
      ...(input.prepTime !== undefined && { prep_time: input.prepTime }),
      ...(input.cookTime !== undefined && { cook_time: input.cookTime }),
      ...(input.mealType !== undefined && { meal_type: input.mealType }),
    }

    // Insert to database with creation_method: 'manual'
    const { data, error } = await this.supabase
      .from('recipes')
      .insert({
        household_id: householdId,
        content: recipeContent,
        creation_method: 'manual',
      })
      .select()
      .single()

    if (error) {
      console.error('[RecipeService] Database error creating recipe:', error)
      throw new Error('Failed to create recipe')
    }

    // Transform database record to Recipe DTO
    return this.mapDbRecipeToDto(data)
  }

  /**
   * Maps database recipe record to Recipe DTO
   *
   * Transforms:
   * - JSONB content field to flat structure
   * - snake_case to camelCase
   * - Database types to DTO types
   *
   * @param dbRecipe - Recipe record from database
   * @returns Recipe DTO for API response
   *
   * @private
   */
  private mapDbRecipeToDto(dbRecipe: Database['public']['Tables']['recipes']['Row']): Recipe {
    // Parse JSONB content
    const content = dbRecipe.content as RecipeContent

    return {
      id: dbRecipe.id,
      title: content.title,
      ingredients: content.ingredients,
      instructions: content.instructions,
      creationMethod: dbRecipe.creation_method,
      prepTime: content.prep_time,
      cookTime: content.cook_time,
      mealType: content.meal_type,
      createdAt: dbRecipe.created_at,
      updatedAt: dbRecipe.updated_at,
      householdId: dbRecipe.household_id,
    }
  }
}

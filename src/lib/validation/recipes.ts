import { z } from 'zod'

/**
 * Zod schema for recipe ingredients
 */
export const IngredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name cannot be empty'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().optional(),
})

/**
 * Zod schema for validating LLM-generated recipe output
 * Used to validate the JSON response from the AI model before storing
 */
export const RecipeSchema = z.object({
  title: z.string().min(1, 'Recipe title cannot be empty').max(200, 'Title too long'),
  ingredients: z.array(IngredientSchema).min(1, 'Recipe must have at least one ingredient'),
  instructions: z.string().min(10, 'Instructions too short').max(5000, 'Instructions too long'),
  mealType: z.string().optional(),
  prepTime: z.number().int().min(0).max(1440).optional(), // Max 24 hours
  cookTime: z.number().int().min(0).max(1440).optional(), // Max 24 hours
})

/**
 * Zod schema for generating a recipe via AI
 * Validates the request body for the POST /api/recipes/generate endpoint
 */
export const GenerateRecipeRequestSchema = z.object({
  hint: z
    .string()
    .min(1, 'Hint cannot be empty')
    .max(200, 'Hint cannot exceed 200 characters')
    .regex(/^[^<>&]*$/, 'Hint contains invalid characters'), // Sanitize against HTML/script injection
  usePantryItems: z.boolean({
    required_error: 'usePantryItems is required',
    invalid_type_error: 'usePantryItems must be a boolean',
  }),
})

/**
 * Zod schema for creating a manual recipe
 * Validates the request body for the POST /api/recipes endpoint
 * More restrictive than RecipeSchema (used for AI-generated recipes)
 */
export const CreateRecipeSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  ingredients: z.array(IngredientSchema).min(1, 'At least one ingredient is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  prepTime: z
    .number()
    .int('Prep time must be an integer')
    .min(0, 'Prep time must be non-negative')
    .optional(),
  cookTime: z
    .number()
    .int('Cook time must be an integer')
    .min(0, 'Cook time must be non-negative')
    .optional(),
  mealType: z
    .enum(['breakfast', 'lunch', 'dinner'], {
      errorMap: () => ({ message: "Meal type must be 'breakfast', 'lunch', or 'dinner'" }),
    })
    .optional(),
})

export type GenerateRecipeRequest = z.infer<typeof GenerateRecipeRequestSchema>
export type RecipeValidation = z.infer<typeof RecipeSchema>
export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>

/**
 * Zod schema for bulk deleting recipes
 * Validates the request body for the DELETE /api/recipes endpoint
 */
export const BulkDeleteRecipesSchema = z.object({
  ids: z
    .array(z.string())
    .min(1, 'Must provide at least 1 recipe ID')
    .max(50, 'Cannot delete more than 50 recipes at once'),
})

export type BulkDeleteRecipesInput = z.infer<typeof BulkDeleteRecipesSchema>

// ============================================================================
// LIST RECIPES QUERY PARAMETERS (GET /api/recipes)
// ============================================================================

/**
 * Allowed sort values for recipe listing
 * Prefix '-' indicates descending order
 */
const ALLOWED_SORT_VALUES = [
  'createdAt',
  '-createdAt',
  'title',
  '-title',
  'updatedAt',
  '-updatedAt',
] as const

/**
 * Zod schema for GET /api/recipes query parameters
 * Validates and parses query parameters from URL
 *
 * Query parameters come as strings from URL, so we use
 * .transform() to convert to proper types (string → number)
 */
export const ListRecipesQuerySchema = z.object({
  search: z
    .string()
    .max(200, 'Search query must be at most 200 characters')
    .optional()
    .transform(val => val?.trim()), // Trim whitespace

  mealType: z
    .enum(['breakfast', 'lunch', 'dinner'], {
      errorMap: () => ({
        message: "Meal type must be 'breakfast', 'lunch', or 'dinner'",
      }),
    })
    .optional(),

  creationMethod: z
    .enum(['manual', 'ai_generated', 'ai_generated_modified'], {
      errorMap: () => ({
        message: "Creation method must be 'manual', 'ai_generated', or 'ai_generated_modified'",
      }),
    })
    .optional(),

  page: z
    .string()
    .optional()
    .default('1')
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int('Page must be an integer').min(1, 'Page must be at least 1')),

  pageSize: z
    .string()
    .optional()
    .default('20')
    .transform(val => parseInt(val, 10))
    .pipe(
      z
        .number()
        .int('Page size must be an integer')
        .min(1, 'Page size must be at least 1')
        .max(100, 'Page size must be at most 100')
    ),

  sort: z
    .enum(ALLOWED_SORT_VALUES, {
      errorMap: () => ({
        message: 'Sort must be one of: createdAt, -createdAt, title, -title, updatedAt, -updatedAt',
      }),
    })
    .optional()
    .default('-createdAt'),
})

/**
 * TypeScript type inferred from schema
 */
export type ListRecipesQuery = z.infer<typeof ListRecipesQuerySchema>

/**
 * Filters for recipe listing (used internally in service layer)
 * Transformed version of ListRecipesQuery with parsed sort field
 */
export interface RecipeFilters {
  search?: string
  mealType?: string
  creationMethod?: string
  page: number
  pageSize: number
  sortField: string
  sortDirection: 'asc' | 'desc'
}

/**
 * Parses sort parameter into field and direction
 *
 * Converts camelCase API parameter to snake_case database column.
 * Prefix '-' indicates descending order.
 *
 * @param sort - Sort string (e.g., 'createdAt', '-createdAt')
 * @returns Object with field name and direction
 *
 * @example
 * parseSortParam('createdAt')   // { field: 'created_at', direction: 'asc' }
 * parseSortParam('-createdAt')  // { field: 'created_at', direction: 'desc' }
 * parseSortParam('title')       // { field: 'title', direction: 'asc' }
 */
export function parseSortParam(sort: string): {
  field: string
  direction: 'asc' | 'desc'
} {
  const isDescending = sort.startsWith('-')
  const fieldName = isDescending ? sort.slice(1) : sort

  // Map camelCase to snake_case for database columns
  // 'title' is special - it's in JSONB content, handled separately in query
  const fieldMapping: Record<string, string> = {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    title: 'title', // Will use 'content->title' in Supabase query
  }

  return {
    field: fieldMapping[fieldName] || fieldName,
    direction: isDescending ? 'desc' : 'asc',
  }
}

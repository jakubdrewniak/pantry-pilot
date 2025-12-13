import { z } from 'zod'
import type { RecipeFormData, RecipeFormErrors, IngredientFormData } from '@/types/types'

/**
 * Validation schemas for recipe editor form.
 *
 * These schemas are used for client-side validation and match
 * the server-side validation requirements in API routes.
 */

// ============================================================================
// FIELD SCHEMAS
// ============================================================================

/**
 * Title validation
 * - Required
 * - Min 3 characters
 * - Max 100 characters
 */
const titleSchema = z
  .string()
  .min(1, 'Title is required')
  .min(3, 'Title must be at least 3 characters')
  .max(100, 'Title must be at most 100 characters')

/**
 * Single ingredient validation
 * - Name: required
 * - Quantity: required, must be > 0
 * - Unit: optional
 */
const ingredientSchema = z.object({
  id: z.string(), // temporary ID for React keys
  name: z.string().min(1, 'Ingredient name is required'),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .positive('Quantity must be greater than 0'),
  unit: z.string().optional(),
})

/**
 * Ingredients list validation
 * - Minimum 1 ingredient required
 */
const ingredientsSchema = z
  .array(ingredientSchema)
  .min(1, 'Recipe must contain at least one ingredient')

/**
 * Instructions validation
 * - Required
 * - Must not be empty after trim
 */
const instructionsSchema = z
  .string()
  .min(1, 'Instructions are required')
  .refine(val => val.trim().length > 0, {
    message: 'Instructions are required',
  })

/**
 * Time validation (prepTime, cookTime)
 * - Optional
 * - If provided, must be >= 0
 */
const timeSchema = z
  .number({ invalid_type_error: 'Time must be a number' })
  .int('Time must be an integer')
  .nonnegative('Time cannot be negative')
  .optional()

/**
 * Meal type validation
 * - Optional
 * - Must be one of: breakfast, lunch, dinner
 */
const mealTypeSchema = z
  .enum(['breakfast', 'lunch', 'dinner'], {
    errorMap: () => ({ message: 'Invalid meal type' }),
  })
  .optional()

// ============================================================================
// FULL FORM SCHEMA
// ============================================================================

/**
 * Complete recipe form validation schema
 */
export const recipeFormSchema = z.object({
  title: titleSchema,
  ingredients: ingredientsSchema,
  instructions: instructionsSchema,
  prepTime: timeSchema,
  cookTime: timeSchema,
  mealType: mealTypeSchema,
})

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates the title field
 * @param value - Title value to validate
 * @returns Error message or undefined if valid
 */
export const validateTitle = (value: string): string | undefined => {
  const result = titleSchema.safeParse(value)
  return result.success ? undefined : result.error.errors[0]?.message
}

/**
 * Validates a single ingredient
 * @param ingredient - Ingredient to validate
 * @returns Object with field-specific errors or undefined if valid
 */
export const validateIngredientItem = (
  ingredient: IngredientFormData
): { name?: string; quantity?: string } | undefined => {
  const result = ingredientSchema.safeParse(ingredient)

  if (result.success) {
    return undefined
  }

  const errors: { name?: string; quantity?: string } = {}

  result.error.errors.forEach(err => {
    const field = err.path[0] as 'name' | 'quantity'
    if (field === 'name' || field === 'quantity') {
      errors[field] = err.message
    }
  })

  return Object.keys(errors).length > 0 ? errors : undefined
}

/**
 * Validates the ingredients list
 * @param ingredients - Array of ingredients to validate
 * @returns Error message for the list or undefined if valid
 */
export const validateIngredients = (ingredients: IngredientFormData[]): string | undefined => {
  const result = ingredientsSchema.safeParse(ingredients)
  return result.success ? undefined : result.error.errors[0]?.message
}

/**
 * Validates the instructions field
 * @param value - Instructions value to validate
 * @returns Error message or undefined if valid
 */
export const validateInstructions = (value: string): string | undefined => {
  const result = instructionsSchema.safeParse(value)
  return result.success ? undefined : result.error.errors[0]?.message
}

/**
 * Validates a time field (prepTime or cookTime)
 * @param value - Time value to validate
 * @returns Error message or undefined if valid
 */
export const validateTime = (value: number | undefined): string | undefined => {
  if (value === undefined) {
    return undefined
  }
  const result = timeSchema.safeParse(value)
  return result.success ? undefined : result.error.errors[0]?.message
}

/**
 * Validates the entire recipe form
 * @param formData - Complete form data to validate
 * @returns Object with all validation errors
 */
export const validateForm = (formData: RecipeFormData): RecipeFormErrors => {
  const result = recipeFormSchema.safeParse(formData)

  if (result.success) {
    return {}
  }

  const errors: RecipeFormErrors = {}

  result.error.errors.forEach(err => {
    const field = err.path[0] as keyof RecipeFormData

    if (field === 'title') {
      errors.title = err.message
    } else if (field === 'ingredients') {
      // Check if it's a list-level error (e.g., minimum length)
      if (err.path.length === 1) {
        errors.ingredients = err.message
      } else {
        // It's an error for a specific ingredient
        const index = err.path[1] as number
        const ingredientField = err.path[2] as 'name' | 'quantity'
        const ingredientId = formData.ingredients[index]?.id

        if (ingredientId) {
          if (!errors.ingredientItems) {
            errors.ingredientItems = {}
          }
          if (!errors.ingredientItems[ingredientId]) {
            errors.ingredientItems[ingredientId] = {}
          }
          errors.ingredientItems[ingredientId][ingredientField] = err.message
        }
      }
    } else if (field === 'instructions') {
      errors.instructions = err.message
    } else if (field === 'prepTime') {
      errors.prepTime = err.message
    } else if (field === 'cookTime') {
      errors.cookTime = err.message
    }
  })

  return errors
}

/**
 * Maps API validation errors to form errors
 * @param apiErrors - Array of errors from API
 * @returns RecipeFormErrors object
 */
export const mapApiErrors = (
  apiErrors: Array<{ field: string; message: string }>
): RecipeFormErrors => {
  const errors: RecipeFormErrors = {}

  apiErrors.forEach(err => {
    const field = err.field as keyof RecipeFormErrors
    if (
      field === 'title' ||
      field === 'instructions' ||
      field === 'prepTime' ||
      field === 'cookTime'
    ) {
      errors[field] = err.message
    } else if (field === 'ingredients') {
      errors.ingredients = err.message
    } else {
      // General error
      errors.general = err.message
    }
  })

  return errors
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type RecipeFormInput = z.infer<typeof recipeFormSchema>
export type IngredientInput = z.infer<typeof ingredientSchema>

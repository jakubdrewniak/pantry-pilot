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

export type GenerateRecipeRequest = z.infer<typeof GenerateRecipeRequestSchema>
export type RecipeValidation = z.infer<typeof RecipeSchema>

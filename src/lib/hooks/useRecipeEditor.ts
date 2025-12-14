import { useState, useEffect, useCallback } from 'react'
import type {
  RecipeEditorMode,
  Recipe,
  UseRecipeEditorReturn,
  RecipeFormData,
  RecipeFormErrors,
  IngredientFormData,
  CreateRecipeRequest,
  Ingredient,
} from '@/types/types'
import {
  validateTitle,
  validateIngredients,
  validateInstructions,
  validateTime,
  validateForm,
} from '@/lib/validation/recipe-form'
import { RecipeApiService, RecipeApiErrorHandler } from '@/lib/services/recipe-api.service'

/**
 * Custom hook for managing recipe editor form state and logic
 *
 * This hook encapsulates all form logic including:
 * - State management (formData, errors, isDirty, isSubmitting)
 * - Data conversion (Recipe ↔ RecipeFormData)
 * - Validation (progressive: onBlur → onChange → onSubmit)
 * - API calls (create/update)
 * - Error handling
 *
 * Similar to Angular's FormGroup with reactive forms pattern.
 *
 * @param mode - Editor mode: 'create', 'edit', or 'save-generated'
 * @param initialData - Initial recipe data (for edit and save-generated modes)
 * @param onSuccess - Callback when recipe is successfully saved
 * @returns Form state and handlers
 */
export const useRecipeEditor = (
  mode: RecipeEditorMode,
  initialData?: Recipe,
  onSuccess?: (recipe: Recipe) => void
): UseRecipeEditorReturn => {
  // ========================================================================
  // STATE
  // ========================================================================

  const [formData, setFormData] = useState<RecipeFormData>(() =>
    initialData ? convertFromApiFormat(initialData) : getEmptyFormDataSSR()
  )
  const [errors, setErrors] = useState<RecipeFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  // ========================================================================
  // EFFECTS
  // ========================================================================

  /**
   * Initialize client-side only data (fixes hydration mismatch)
   * This runs only on the client after hydration is complete
   */
  useEffect(() => {
    if (!initialData && mode === 'create') {
      setFormData(prev => {
        return {
          ...prev,
          ingredients: [
            {
              id: crypto.randomUUID(),
              name: '',
              quantity: 0,
              unit: '',
            },
          ],
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount, initialData and mode are stable

  /**
   * Update form data when initialData changes (e.g., after fetching recipe)
   */
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData(convertFromApiFormat(initialData))
      setIsDirty(false)
      setTouchedFields(new Set())
      setErrors({})
    }
  }, [initialData, mode])

  // ========================================================================
  // HANDLERS
  // ========================================================================

  /**
   * Validates a single field and updates errors
   */
  const validateField = useCallback(
    (field: string): void => {
      // Mark field as touched
      setTouchedFields(prev => new Set(prev).add(field))

      let fieldError: string | undefined

      switch (field) {
        case 'title':
          fieldError = validateTitle(formData.title)
          break
        case 'ingredients':
          fieldError = validateIngredients(formData.ingredients)
          break
        case 'instructions':
          fieldError = validateInstructions(formData.instructions)
          break
        case 'prepTime':
          fieldError = validateTime(formData.prepTime)
          break
        case 'cookTime':
          fieldError = validateTime(formData.cookTime)
          break
        default:
          return
      }

      setErrors(prev => ({
        ...prev,
        [field]: fieldError,
      }))
    },
    [formData]
  )

  /**
   * Handles changes to form fields (title, prepTime, cookTime, mealType, instructions)
   */
  const handleFieldChange = useCallback(
    (field: string, value: string | number | undefined): void => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }))
      setIsDirty(true)

      // Progressive validation: validate if field was already touched
      if (touchedFields.has(field)) {
        validateField(field)
      }
    },
    [touchedFields, validateField]
  )

  /**
   * Handles changes to ingredients list
   */
  const handleIngredientsChange = useCallback(
    (ingredients: IngredientFormData[]): void => {
      setFormData(prev => ({
        ...prev,
        ingredients,
      }))
      setIsDirty(true)

      // Validate ingredients if section was touched
      if (touchedFields.has('ingredients')) {
        const ingredientsError = validateIngredients(ingredients)
        setErrors(prev => ({
          ...prev,
          ingredients: ingredientsError,
        }))
      }
    },
    [touchedFields]
  )

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault()

      // Full validation before submit
      const validationErrors = validateForm(formData)

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        // Scroll to first error (optional)
        const firstErrorField = Object.keys(validationErrors)[0]
        const element = document.querySelector(`[name="${firstErrorField}"]`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }

      setIsSubmitting(true)
      setErrors({})

      try {
        // Convert form data to API format
        const requestData = convertToApiFormat(formData)

        let recipe: Recipe

        if (mode === 'edit' && initialData) {
          // Update existing recipe
          recipe = await RecipeApiService.updateRecipe(initialData.id, requestData)
        } else {
          // Create new recipe (mode: 'create' or 'save-generated')
          recipe = await RecipeApiService.createRecipe(requestData)
        }

        setIsDirty(false)
        onSuccess?.(recipe)
      } catch (error) {
        handleApiError(error, setErrors)
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, mode, initialData, onSuccess]
  )

  /**
   * Resets form to initial state
   */
  const resetForm = useCallback((): void => {
    if (initialData) {
      setFormData(convertFromApiFormat(initialData))
    } else {
      setFormData(getEmptyFormDataSSR())
    }
    setErrors({})
    setIsDirty(false)
    setTouchedFields(new Set())
  }, [initialData])

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    formData,
    errors,
    isSubmitting,
    isDirty,
    handleFieldChange,
    handleIngredientsChange,
    handleSubmit,
    validateField,
    resetForm,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Returns empty form data for new recipe (SSR-safe version)
 * Note: ingredients array is empty to avoid hydration mismatch
 * The first ingredient will be added on the client side in useEffect
 */
function getEmptyFormDataSSR(): RecipeFormData {
  return {
    title: '',
    ingredients: [], // Empty on SSR, will be populated on client
    instructions: '',
  }
}

/**
 * Converts Recipe (from API) to RecipeFormData (view model)
 * Adds temporary IDs to ingredients for React keys
 */
function convertFromApiFormat(recipe: Recipe): RecipeFormData {
  return {
    title: recipe.title,
    ingredients: recipe.ingredients.map(ing => ({
      id: crypto.randomUUID(), // temporary ID for React keys
      ...ing,
    })),
    instructions: recipe.instructions,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    mealType: recipe.mealType as 'breakfast' | 'lunch' | 'dinner' | undefined,
  }
}

/**
 * Converts RecipeFormData (view model) to CreateRecipeRequest (API format)
 * Removes temporary IDs from ingredients
 */
function convertToApiFormat(formData: RecipeFormData): CreateRecipeRequest {
  return {
    title: formData.title,
    ingredients: formData.ingredients.map(({ id: _id, ...ingredient }): Ingredient => ingredient),
    instructions: formData.instructions,
    prepTime: formData.prepTime,
    cookTime: formData.cookTime,
    mealType: formData.mealType,
  }
}

/**
 * Handles API errors and updates form errors
 *
 * @param error - The error from API call
 * @param setErrors - State setter for form errors
 */
function handleApiError(
  error: unknown,
  setErrors: React.Dispatch<React.SetStateAction<RecipeFormErrors>>
): void {
  console.error('[useRecipeEditor] API error:', error)

  // Check if user needs to log in
  if (RecipeApiErrorHandler.shouldRedirectToLogin(error)) {
    window.location.href = '/auth/login'
    return
  }

  // Try to extract validation errors from API
  const validationErrors = RecipeApiErrorHandler.getValidationErrors(error)
  if (validationErrors) {
    setErrors(validationErrors)
    return
  }

  // Set general error message
  const userMessage = RecipeApiErrorHandler.getUserMessage(error)
  setErrors({ general: userMessage })
}

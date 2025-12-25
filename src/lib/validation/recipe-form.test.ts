import { describe, it, expect } from 'vitest'
import {
  validateTitle,
  validateIngredientItem,
  validateIngredients,
  validateInstructions,
  validateTime,
  validateForm,
  mapApiErrors,
  recipeFormSchema,
  type RecipeFormInput,
  type IngredientInput,
} from './recipe-form'
import type { RecipeFormData, IngredientFormData } from '@/types/types'

/**
 * Recipe Form Validation Test Suite
 *
 * Tests Zod validation schemas and helper functions for recipe editor form.
 * These ensure data integrity before submitting to the API.
 *
 * Test Structure:
 * - Arrange: Set up test data
 * - Act: Validate data with schema or helper function
 * - Assert: Verify success or failure with correct error messages
 */

describe('Recipe Form Validation', () => {
  describe('validateTitle', () => {
    describe('valid inputs', () => {
      it('should accept valid title with 3 characters', () => {
        // Arrange
        const title = 'ABC'

        // Act
        const error = validateTitle(title)

        // Assert
        expect(error).toBeUndefined()
      })

      it('should accept valid title with 100 characters', () => {
        // Arrange
        const title = 'A'.repeat(100)

        // Act
        const error = validateTitle(title)

        // Assert
        expect(error).toBeUndefined()
      })

      it('should accept title with special characters', () => {
        // Arrange
        const title = "Babcia's Pierogi & Gołąbki!"

        // Act
        const error = validateTitle(title)

        // Assert
        expect(error).toBeUndefined()
      })
    })

    describe('invalid inputs', () => {
      it('should reject empty title', () => {
        // Arrange
        const title = ''

        // Act
        const error = validateTitle(title)

        // Assert
        expect(error).toBe('Title is required')
      })

      it('should reject title with less than 3 characters', () => {
        // Arrange
        const title = 'AB'

        // Act
        const error = validateTitle(title)

        // Assert
        expect(error).toBe('Title must be at least 3 characters')
        expect(error).toBe('NON EXISTING')
      })

      it('should reject title with more than 100 characters', () => {
        // Arrange
        const title = 'A'.repeat(101)

        // Act
        const error = validateTitle(title)

        // Assert
        expect(error).toBe('Title must be at most 100 characters')
      })
    })
  })

  describe('validateIngredientItem', () => {
    describe('valid inputs', () => {
      it('should accept valid ingredient with all fields', () => {
        // Arrange
        const ingredient: IngredientFormData = {
          id: 'test-id-1',
          name: 'Mąka',
          quantity: 500,
          unit: 'g',
        }

        // Act
        const errors = validateIngredientItem(ingredient)

        // Assert
        expect(errors).toBeUndefined()
      })

      it('should accept ingredient without unit', () => {
        // Arrange
        const ingredient: IngredientFormData = {
          id: 'test-id-2',
          name: 'Jajka',
          quantity: 3,
        }

        // Act
        const errors = validateIngredientItem(ingredient)

        // Assert
        expect(errors).toBeUndefined()
      })

      it('should accept fractional quantity', () => {
        // Arrange
        const ingredient: IngredientFormData = {
          id: 'test-id-3',
          name: 'Masło',
          quantity: 0.5,
          unit: 'kg',
        }

        // Act
        const errors = validateIngredientItem(ingredient)

        // Assert
        expect(errors).toBeUndefined()
      })
    })

    describe('invalid inputs', () => {
      it('should reject ingredient with empty name', () => {
        // Arrange
        const ingredient: IngredientFormData = {
          id: 'test-id-4',
          name: '',
          quantity: 100,
          unit: 'g',
        }

        // Act
        const errors = validateIngredientItem(ingredient)

        // Assert
        expect(errors).toBeDefined()
        expect(errors?.name).toBe('Ingredient name is required')
      })

      it('should reject ingredient with zero quantity', () => {
        // Arrange
        const ingredient: IngredientFormData = {
          id: 'test-id-5',
          name: 'Sól',
          quantity: 0,
          unit: 'g',
        }

        // Act
        const errors = validateIngredientItem(ingredient)

        // Assert
        expect(errors).toBeDefined()
        expect(errors?.quantity).toBe('Quantity must be greater than 0')
      })

      it('should reject ingredient with negative quantity', () => {
        // Arrange
        const ingredient: IngredientFormData = {
          id: 'test-id-6',
          name: 'Cukier',
          quantity: -10,
          unit: 'g',
        }

        // Act
        const errors = validateIngredientItem(ingredient)

        // Assert
        expect(errors).toBeDefined()
        expect(errors?.quantity).toBe('Quantity must be greater than 0')
      })

      it('should reject ingredient with multiple errors', () => {
        // Arrange
        const ingredient: IngredientFormData = {
          id: 'test-id-7',
          name: '',
          quantity: -5,
          unit: 'g',
        }

        // Act
        const errors = validateIngredientItem(ingredient)

        // Assert
        expect(errors).toBeDefined()
        expect(errors?.name).toBeDefined()
        expect(errors?.quantity).toBeDefined()
      })
    })
  })

  describe('validateIngredients', () => {
    describe('valid inputs', () => {
      it('should accept list with one ingredient', () => {
        // Arrange
        const ingredients: IngredientFormData[] = [
          {
            id: 'test-id-1',
            name: 'Mąka',
            quantity: 500,
            unit: 'g',
          },
        ]

        // Act
        const error = validateIngredients(ingredients)

        // Assert
        expect(error).toBeUndefined()
      })

      it('should accept list with multiple ingredients', () => {
        // Arrange
        const ingredients: IngredientFormData[] = [
          {
            id: 'test-id-1',
            name: 'Mąka',
            quantity: 500,
            unit: 'g',
          },
          {
            id: 'test-id-2',
            name: 'Jajka',
            quantity: 3,
          },
          {
            id: 'test-id-3',
            name: 'Mleko',
            quantity: 250,
            unit: 'ml',
          },
        ]

        // Act
        const error = validateIngredients(ingredients)

        // Assert
        expect(error).toBeUndefined()
      })
    })

    describe('invalid inputs', () => {
      it('should reject empty list', () => {
        // Arrange
        const ingredients: IngredientFormData[] = []

        // Act
        const error = validateIngredients(ingredients)

        // Assert
        expect(error).toBe('Recipe must contain at least one ingredient')
      })
    })
  })

  describe('validateInstructions', () => {
    describe('valid inputs', () => {
      it('should accept non-empty instructions', () => {
        // Arrange
        const instructions = 'Wymieszaj składniki i piecz przez 30 minut.'

        // Act
        const error = validateInstructions(instructions)

        // Assert
        expect(error).toBeUndefined()
      })

      it('should accept instructions with markdown', () => {
        // Arrange
        const instructions = `
# Przygotowanie
1. Wymieszaj składniki
2. Piecz w 180°C

**Ważne:** Nie przesusz!
        `

        // Act
        const error = validateInstructions(instructions)

        // Assert
        expect(error).toBeUndefined()
      })
    })

    describe('invalid inputs', () => {
      it('should reject empty instructions', () => {
        // Arrange
        const instructions = ''

        // Act
        const error = validateInstructions(instructions)

        // Assert
        expect(error).toBe('Instructions are required')
      })

      it('should reject whitespace-only instructions', () => {
        // Arrange
        const instructions = '   \n\t  '

        // Act
        const error = validateInstructions(instructions)

        // Assert
        expect(error).toBe('Instructions are required')
      })
    })
  })

  describe('validateTime', () => {
    describe('valid inputs', () => {
      it('should accept undefined time', () => {
        // Arrange
        const time = undefined

        // Act
        const error = validateTime(time)

        // Assert
        expect(error).toBeUndefined()
      })

      it('should accept zero time', () => {
        // Arrange
        const time = 0

        // Act
        const error = validateTime(time)

        // Assert
        expect(error).toBeUndefined()
      })

      it('should accept positive time', () => {
        // Arrange
        const time = 30

        // Act
        const error = validateTime(time)

        // Assert
        expect(error).toBeUndefined()
      })
    })

    describe('invalid inputs', () => {
      it('should reject negative time', () => {
        // Arrange
        const time = -10

        // Act
        const error = validateTime(time)

        // Assert
        expect(error).toBe('Time cannot be negative')
      })

      it('should reject fractional time', () => {
        // Arrange
        const time = 15.5

        // Act
        const error = validateTime(time)

        // Assert
        expect(error).toBe('Time must be an integer')
      })
    })
  })

  describe('validateForm', () => {
    describe('valid inputs', () => {
      it('should accept valid complete form', () => {
        // Arrange
        const formData: RecipeFormData = {
          title: 'Pierogi z kapustą',
          ingredients: [
            {
              id: 'test-id-1',
              name: 'Mąka',
              quantity: 500,
              unit: 'g',
            },
            {
              id: 'test-id-2',
              name: 'Kapusta',
              quantity: 300,
              unit: 'g',
            },
          ],
          instructions: 'Zrób ciasto, nałóż farsz, ugotuj.',
          prepTime: 30,
          cookTime: 20,
          mealType: 'lunch',
        }

        // Act
        const errors = validateForm(formData)

        // Assert
        expect(errors).toEqual({})
      })

      it('should accept form without optional fields', () => {
        // Arrange
        const formData: RecipeFormData = {
          title: 'Prosty przepis',
          ingredients: [
            {
              id: 'test-id-1',
              name: 'Składnik',
              quantity: 1,
            },
          ],
          instructions: 'Zrób to.',
        }

        // Act
        const errors = validateForm(formData)

        // Assert
        expect(errors).toEqual({})
      })
    })

    describe('invalid inputs', () => {
      it('should collect multiple field errors', () => {
        // Arrange
        const formData: RecipeFormData = {
          title: 'AB', // too short
          ingredients: [], // empty
          instructions: '', // empty
          prepTime: -5, // negative
          cookTime: 10.5, // fractional
        }

        // Act
        const errors = validateForm(formData)

        // Assert
        expect(errors.title).toBeDefined()
        expect(errors.ingredients).toBeDefined()
        expect(errors.instructions).toBeDefined()
        expect(errors.prepTime).toBeDefined()
        expect(errors.cookTime).toBeDefined()
      })

      it('should map ingredient item errors correctly', () => {
        // Arrange
        const formData: RecipeFormData = {
          title: 'Valid Title',
          ingredients: [
            {
              id: 'test-id-1',
              name: '', // invalid
              quantity: 100,
            },
            {
              id: 'test-id-2',
              name: 'Valid',
              quantity: -5, // invalid
            },
          ],
          instructions: 'Valid instructions',
        }

        // Act
        const errors = validateForm(formData)

        // Assert
        expect(errors.ingredientItems).toBeDefined()
        expect(errors.ingredientItems?.['test-id-1']?.name).toBeDefined()
        expect(errors.ingredientItems?.['test-id-2']?.quantity).toBeDefined()
      })
    })
  })

  describe('mapApiErrors', () => {
    it('should map title error', () => {
      // Arrange
      const apiErrors = [{ field: 'title', message: 'Title too long' }]

      // Act
      const errors = mapApiErrors(apiErrors)

      // Assert
      expect(errors.title).toBe('Title too long')
    })

    it('should map ingredients error', () => {
      // Arrange
      const apiErrors = [{ field: 'ingredients', message: 'At least one ingredient required' }]

      // Act
      const errors = mapApiErrors(apiErrors)

      // Assert
      expect(errors.ingredients).toBe('At least one ingredient required')
    })

    it('should map multiple errors', () => {
      // Arrange
      const apiErrors = [
        { field: 'title', message: 'Title error' },
        { field: 'instructions', message: 'Instructions error' },
        { field: 'prepTime', message: 'Time error' },
      ]

      // Act
      const errors = mapApiErrors(apiErrors)

      // Assert
      expect(errors.title).toBe('Title error')
      expect(errors.instructions).toBe('Instructions error')
      expect(errors.prepTime).toBe('Time error')
    })

    it('should map unknown field to general error', () => {
      // Arrange
      const apiErrors = [{ field: 'unknown', message: 'Unknown error' }]

      // Act
      const errors = mapApiErrors(apiErrors)

      // Assert
      expect(errors.general).toBe('Unknown error')
    })
  })

  describe('recipeFormSchema', () => {
    describe('valid inputs', () => {
      it('should parse valid form data', () => {
        // Arrange
        const validData: RecipeFormInput = {
          title: 'Test Recipe',
          ingredients: [
            {
              id: 'test-id-1',
              name: 'Ingredient',
              quantity: 100,
              unit: 'g',
            },
          ],
          instructions: 'Do something',
          prepTime: 10,
          cookTime: 20,
          mealType: 'dinner',
        }

        // Act
        const result = recipeFormSchema.safeParse(validData)

        // Assert
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validData)
        }
      })
    })

    describe('invalid inputs', () => {
      it('should reject invalid meal type', () => {
        // Arrange
        const invalidData = {
          title: 'Test Recipe',
          ingredients: [
            {
              id: 'test-id-1',
              name: 'Ingredient',
              quantity: 100,
            },
          ],
          instructions: 'Do something',
          mealType: 'invalid-type',
        }

        // Act
        const result = recipeFormSchema.safeParse(invalidData)

        // Assert
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Type Inference', () => {
    it('should correctly infer RecipeFormInput type', () => {
      // Arrange & Act
      const data: RecipeFormInput = {
        title: 'Test',
        ingredients: [
          {
            id: 'id-1',
            name: 'Ingredient',
            quantity: 100,
          },
        ],
        instructions: 'Instructions',
      }

      // Assert - TypeScript compilation ensures type correctness
      expect(data.title).toBeDefined()
      expect(data.ingredients).toBeDefined()
      expect(data.instructions).toBeDefined()
    })

    it('should correctly infer IngredientInput type', () => {
      // Arrange & Act
      const data: IngredientInput = {
        id: 'test-id',
        name: 'Flour',
        quantity: 500,
        unit: 'g',
      }

      // Assert - TypeScript compilation ensures type correctness
      expect(data.id).toBeDefined()
      expect(data.name).toBeDefined()
      expect(data.quantity).toBeDefined()
      expect(data.unit).toBeDefined()
    })
  })
})

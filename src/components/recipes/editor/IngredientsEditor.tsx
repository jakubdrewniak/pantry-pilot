import { Plus } from 'lucide-react'
import type { IngredientFormData } from '@/types/types'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { IngredientItem } from './IngredientItem'

interface IngredientsEditorProps {
  ingredients: IngredientFormData[]
  errors?: {
    general?: string
    items?: Record<string, { name?: string; quantity?: string }>
  }
  onChange: (ingredients: IngredientFormData[]) => void
  onBlur: () => void
}

/**
 * IngredientsEditor Component
 *
 * Manages the list of ingredients in the recipe editor.
 * Allows adding, editing, and removing ingredients.
 *
 * Features:
 * - Dynamic list of IngredientItem components
 * - Add new ingredient button
 * - Minimum 1 ingredient validation
 * - Individual ingredient validation
 *
 * Similar to Angular's FormArray pattern.
 */
export const IngredientsEditor = ({
  ingredients,
  errors,
  onChange,
  onBlur,
}: IngredientsEditorProps): JSX.Element => {
  /**
   * Adds a new empty ingredient to the list
   */
  const handleAddIngredient = (): void => {
    const newIngredient: IngredientFormData = {
      id: crypto.randomUUID(),
      name: '',
      quantity: 0,
      unit: '',
    }

    onChange([...ingredients, newIngredient])

    // Focus on the new ingredient's name field after a short delay
    setTimeout(() => {
      const newInput = document.querySelector(
        `input[name="ingredient-name-${newIngredient.id}"]`
      ) as HTMLInputElement
      newInput?.focus()
    }, 100)
  }

  /**
   * Removes an ingredient from the list
   */
  const handleRemoveIngredient = (id: string): void => {
    // Don't allow removing the last ingredient
    if (ingredients.length <= 1) {
      return
    }

    const updatedIngredients = ingredients.filter(ing => ing.id !== id)
    onChange(updatedIngredients)
  }

  /**
   * Updates a single ingredient field
   */
  const handleIngredientChange = (
    id: string,
    field: keyof IngredientFormData,
    value: string | number
  ): void => {
    const updatedIngredients = ingredients.map(ing =>
      ing.id === id ? { ...ing, [field]: value } : ing
    )
    onChange(updatedIngredients)
  }

  /**
   * Handles blur event for validation
   */
  const handleIngredientBlur = (_id: string): void => {
    onBlur()
  }

  // Check if user can remove ingredients (must have at least 1)
  const canRemove = ingredients.length > 1

  return (
    <div className="space-y-4">
      {/* Section label */}
      <div>
        <Label className="text-base">
          Ingredients <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Add ingredients needed to prepare the recipe
        </p>
      </div>

      {/* List of ingredients */}
      <div className="space-y-3">
        {ingredients.map(ingredient => (
          <IngredientItem
            key={ingredient.id}
            ingredient={ingredient}
            errors={errors?.items?.[ingredient.id]}
            onChange={handleIngredientChange}
            onRemove={handleRemoveIngredient}
            onBlur={handleIngredientBlur}
            canRemove={canRemove}
          />
        ))}
      </div>

      {/* Add ingredient button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddIngredient}
        className="w-full sm:w-auto"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add ingredient
      </Button>
    </div>
  )
}

import { X } from 'lucide-react'
import type { IngredientFormData } from '@/types/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface IngredientItemProps {
  ingredient: IngredientFormData
  errors?: { name?: string; quantity?: string }
  onChange: (id: string, field: keyof IngredientFormData, value: string | number) => void
  onRemove: (id: string) => void
  onBlur: (id: string) => void
  canRemove: boolean
}

/**
 * IngredientItem Component
 *
 * Represents a single ingredient row in the recipe editor.
 * Contains inputs for name, quantity, unit, and a remove button.
 *
 * Layout: Grid with 4 columns (name, quantity, unit, remove button)
 * Validation: Shows errors below each field
 * Accessibility: Proper labels, aria-labels, keyboard navigation
 */
export const IngredientItem = ({
  ingredient,
  errors,
  onChange,
  onRemove,
  onBlur,
  canRemove,
}: IngredientItemProps): JSX.Element => {
  /**
   * Handles input change for text fields (name, unit)
   */
  const handleTextChange = (field: 'name' | 'unit', value: string): void => {
    onChange(ingredient.id, field, value)
  }

  /**
   * Handles input change for quantity (number field)
   */
  const handleQuantityChange = (value: string): void => {
    const test;
    const numValue = parseFloat(value)
    // Allow empty string or valid numbers
    if (value === '' || !isNaN(numValue)) {
      onChange(ingredient.id, 'quantity', value === '' ? 0 : numValue)
    }
  }

  /**
   * Handles blur event for validation
   */
  const handleBlur = (): void => {
    onBlur(ingredient.id)
  }

  return (
    <div className="space-y-2" data-testid={`ingredient-item-${ingredient.id}`}>
      {/* Grid layout for ingredient fields */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
        {/* Name input */}
        <div className="flex flex-col">
          <Input
            type="text"
            name={`ingredient-name-${ingredient.id}`}
            placeholder="Ingredient name"
            value={ingredient.name}
            onChange={e => handleTextChange('name', e.target.value)}
            onBlur={handleBlur}
            className={cn(errors?.name && 'border-destructive')}
            aria-label="Ingredient name"
            aria-invalid={!!errors?.name}
            aria-describedby={errors?.name ? `ingredient-name-error-${ingredient.id}` : undefined}
          />
        </div>

        {/* Quantity input */}
        <div className="flex flex-col">
          <Input
            type="number"
            name={`ingredient-quantity-${ingredient.id}`}
            placeholder="Quantity"
            value={ingredient.quantity || ''}
            onChange={e => handleQuantityChange(e.target.value)}
            onBlur={handleBlur}
            min="0"
            step="any"
            className={cn(errors?.quantity && 'border-destructive')}
            aria-label="Quantity"
            aria-invalid={!!errors?.quantity}
            aria-describedby={
              errors?.quantity ? `ingredient-quantity-error-${ingredient.id}` : undefined
            }
          />
        </div>

        {/* Unit input */}
        <div className="flex flex-col">
          <Input
            type="text"
            name={`ingredient-unit-${ingredient.id}`}
            placeholder="Unit (optional)"
            value={ingredient.unit || ''}
            onChange={e => handleTextChange('unit', e.target.value)}
            onBlur={handleBlur}
            aria-label="Unit"
          />
        </div>

        {/* Remove button */}
        <div className="flex items-start">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(ingredient.id)}
            disabled={!canRemove}
            className="h-10 w-10"
            aria-label="Remove ingredient"
            title={canRemove ? 'Remove ingredient' : 'Recipe must contain at least one ingredient'}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error messages */}
      {(errors?.name || errors?.quantity) && (
        <div className="space-y-1">
          {errors.name && (
            <p id={`ingredient-name-error-${ingredient.id}`} className="text-sm text-destructive">
              {errors.name}
            </p>
          )}
          {errors.quantity && (
            <p
              id={`ingredient-quantity-error-${ingredient.id}`}
              className="text-sm text-destructive"
            >
              {errors.quantity}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

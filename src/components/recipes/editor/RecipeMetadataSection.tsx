import type { RecipeFormErrors } from '@/types/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface RecipeMetadataSectionProps {
  title: string
  prepTime?: number
  cookTime?: number
  mealType?: 'breakfast' | 'lunch' | 'dinner'
  errors: Pick<RecipeFormErrors, 'title' | 'prepTime' | 'cookTime'>
  onChange: (field: string, value: string | number | undefined) => void
  onBlur: (field: string) => void
}

/**
 * RecipeMetadataSection Component
 *
 * Contains metadata fields for the recipe:
 * - Title (required)
 * - Prep time (optional)
 * - Cook time (optional)
 * - Meal type (optional)
 *
 * Layout: Responsive grid - single column on mobile, 2 columns on tablet+
 */
export const RecipeMetadataSection = ({
  title,
  prepTime,
  cookTime,
  mealType,
  errors,
  onChange,
  onBlur,
}: RecipeMetadataSectionProps): JSX.Element => {
  /**
   * Handles text input changes (title)
   */
  const handleTextChange = (field: string, value: string): void => {
    onChange(field, value)
  }

  /**
   * Handles number input changes (prepTime, cookTime)
   */
  const handleNumberChange = (field: string, value: string): void => {
    if (value === '') {
      onChange(field, undefined)
    } else {
      const numValue = parseInt(value, 10)
      if (!isNaN(numValue)) {
        onChange(field, numValue)
      }
    }
  }

  /**
   * Handles select change (mealType)
   */
  const handleSelectChange = (value: string): void => {
    if (value === '') {
      onChange('mealType', undefined)
    } else {
      onChange('mealType', value)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title field - full width */}
      <div className="space-y-2">
        <Label htmlFor="recipe-title">
          Recipe title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="recipe-title"
          name="title"
          type="text"
          placeholder="e.g. Grandma's Apple Pie"
          value={title}
          onChange={e => handleTextChange('title', e.target.value)}
          onBlur={() => onBlur('title')}
          className={cn(errors.title && 'border-destructive')}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
          required
        />
        {errors.title && (
          <p id="title-error" className="text-sm text-destructive">
            {errors.title}
          </p>
        )}
      </div>

      {/* Grid for time and meal type fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Prep time */}
        <div className="space-y-2">
          <Label htmlFor="recipe-prep-time">Prep time (min)</Label>
          <Input
            id="recipe-prep-time"
            name="prepTime"
            type="number"
            placeholder="30"
            value={prepTime ?? ''}
            onChange={e => handleNumberChange('prepTime', e.target.value)}
            onBlur={() => onBlur('prepTime')}
            min="0"
            step="1"
            className={cn(errors.prepTime && 'border-destructive')}
            aria-invalid={!!errors.prepTime}
            aria-describedby={errors.prepTime ? 'prep-time-error' : undefined}
          />
          {errors.prepTime && (
            <p id="prep-time-error" className="text-sm text-destructive">
              {errors.prepTime}
            </p>
          )}
        </div>

        {/* Cook time */}
        <div className="space-y-2">
          <Label htmlFor="recipe-cook-time">Cook time (min)</Label>
          <Input
            id="recipe-cook-time"
            name="cookTime"
            type="number"
            placeholder="45"
            value={cookTime ?? ''}
            onChange={e => handleNumberChange('cookTime', e.target.value)}
            onBlur={() => onBlur('cookTime')}
            min="0"
            step="1"
            className={cn(errors.cookTime && 'border-destructive')}
            aria-invalid={!!errors.cookTime}
            aria-describedby={errors.cookTime ? 'cook-time-error' : undefined}
          />
          {errors.cookTime && (
            <p id="cook-time-error" className="text-sm text-destructive">
              {errors.cookTime}
            </p>
          )}
        </div>

        {/* Meal type */}
        <div className="space-y-2">
          <Label htmlFor="recipe-meal-type">Meal type</Label>
          <select
            id="recipe-meal-type"
            name="mealType"
            value={mealType ?? ''}
            onChange={e => handleSelectChange(e.target.value)}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            aria-label="Meal type"
          >
            <option value="">Select meal type</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>
      </div>
    </div>
  )
}

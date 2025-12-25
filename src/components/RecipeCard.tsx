import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Clock, Trash2, Pencil } from 'lucide-react'
import type { Recipe } from '@/types/types'

/**
 * RecipeCard Props
 */
interface RecipeCardProps {
  recipe: Recipe
  isSelected: boolean
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

/**
 * RecipeCard Component
 *
 * Card displaying recipe preview with title, ingredients preview, and action buttons.
 * Shows meal type badge and creation method badge.
 * Includes checkbox for multi-selection functionality.
 * Handles click for navigation to details, edit, and delete actions.
 */
export function RecipeCard({
  recipe,
  isSelected,
  onSelect,
  onToggle,
  onEdit,
  onDelete,
}: RecipeCardProps): JSX.Element {
  // Format meal type badge
  const getMealTypeBadge = (mealType?: string): JSX.Element | null => {
    if (!mealType) return null

    const labels = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
    }

    return (
      <Badge variant="outline" className="text-xs">
        {labels[mealType as keyof typeof labels] || mealType}
      </Badge>
    )
  }

  // Format creation method badge
  const getCreationMethodBadge = (method: string): JSX.Element => {
    const badgeVariants = {
      manual: 'default',
      ai_generated: 'secondary',
      ai_generated_modified: 'outline',
    } as const

    const labels = {
      manual: 'Manual',
      ai_generated: 'AI',
      ai_generated_modified: 'AI Modified',
    }

    return (
      <Badge
        variant={badgeVariants[method as keyof typeof badgeVariants] || 'default'}
        className="text-xs"
      >
        {labels[method as keyof typeof labels] || method}
      </Badge>
    )
  }

  // Create ingredients preview (first 3 ingredients)
  const ingredientsPreview = recipe.ingredients
    .slice(0, 3)
    .map(ingredient => `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`)
    .join(', ')

  const hasMoreIngredients = recipe.ingredients.length > 3
  const ingredientsText = hasMoreIngredients ? `${ingredientsPreview}...` : ingredientsPreview

  const handleCardClick = (): void => {
    onSelect(recipe.id)
  }

  const handleCheckboxChange = (event: React.MouseEvent): void => {
    event.stopPropagation() // Prevent card click
    onToggle(recipe.id)
  }

  const handleEditClick = (event: React.MouseEvent): void => {
    event.stopPropagation() // Prevent card click
    onEdit(recipe.id)
  }

  const handleDeleteClick = (event: React.MouseEvent): void => {
    event.stopPropagation() // Prevent card click
    onDelete(recipe.id)
  }

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleCardClick()
        }
      }}
      data-testid="recipe-card"
      data-recipe-id={recipe.id}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {/* Checkbox for selection */}
          <div className="mt-0.5 shrink-0" onClick={handleCheckboxChange}>
            <Checkbox
              checked={isSelected}
              aria-label={`Select recipe ${recipe.title}`}
              data-testid="recipe-card-checkbox"
            />
          </div>

          <CardTitle
            className="text-lg leading-tight line-clamp-2 flex-1"
            data-testid="recipe-card-title"
          >
            {recipe.title}
          </CardTitle>

          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditClick}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              aria-label={`Edit recipe ${recipe.title}`}
              data-testid="recipe-card-edit-button"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              aria-label={`Delete recipe ${recipe.title}`}
              data-testid="recipe-card-delete-button"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {getMealTypeBadge(recipe.mealType)}
          {getCreationMethodBadge(recipe.creationMethod)}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Ingredients preview */}
          <div>
            <p className="text-sm text-muted-foreground line-clamp-2">{ingredientsText}</p>
          </div>

          {/* Time information */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {recipe.prepTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Prep: {recipe.prepTime}min</span>
              </div>
            )}
            {!!recipe.cookTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Cook: {recipe.cookTime}min</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

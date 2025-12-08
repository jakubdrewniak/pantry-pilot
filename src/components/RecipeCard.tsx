import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Trash2 } from 'lucide-react'
import type { Recipe } from '@/types/types'

/**
 * RecipeCard Props
 */
interface RecipeCardProps {
  recipe: Recipe
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

/**
 * RecipeCard Component
 *
 * Card displaying recipe preview with title, ingredients preview, and action buttons.
 * Shows meal type badge and creation method badge.
 * Handles click for navigation to details and delete action.
 */
export function RecipeCard({ recipe, onSelect, onDelete }: RecipeCardProps): JSX.Element {
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

  const handleDeleteClick = (event: React.MouseEvent): void => {
    event.stopPropagation() // Prevent card click
    onDelete(recipe.id)
  }

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleCardClick()
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight line-clamp-2">{recipe.title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
            aria-label={`Delete recipe ${recipe.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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

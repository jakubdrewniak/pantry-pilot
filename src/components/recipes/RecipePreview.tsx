import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Recipe } from '@/types/types'

interface RecipePreviewProps {
  recipe: Recipe
}

/**
 * RecipePreview displays a minimal preview of the AI-generated recipe:
 * - Title with "AI-original" badge
 * - Ingredients list
 * - Instructions excerpt
 *
 * Full editing/saving happens outside this modal.
 *
 * Accessibility:
 * - Semantic HTML structure with proper headings
 * - ARIA labels for generated content indicator
 * - Semantic lists for ingredients
 */
export const RecipePreview = ({ recipe }: RecipePreviewProps): JSX.Element | null => {
  // Validation: ensure recipe has valid content
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return null
  }

  if (!recipe.instructions || recipe.instructions.length < 10) {
    return null
  }

  // Truncate instructions for preview (first 200 chars)
  const instructionsPreview =
    recipe.instructions.length > 200
      ? `${recipe.instructions.slice(0, 200)}...`
      : recipe.instructions

  return (
    <Card role="article" aria-label="Generated recipe preview" data-testid="ai-recipe-preview">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle data-testid="ai-recipe-preview-title">{recipe.title}</CardTitle>
          <Badge variant="secondary" aria-label="AI generated recipe">
            AI-original
          </Badge>
        </div>
        {recipe.mealType && (
          <CardDescription className="capitalize">{recipe.mealType}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timing info */}
        {(recipe.prepTime || recipe.cookTime) && (
          <div className="flex gap-4 text-sm text-muted-foreground" aria-label="Recipe timing">
            {recipe.prepTime && (
              <span>
                Prep: <time>{recipe.prepTime} min</time>
              </span>
            )}
            {recipe.cookTime && (
              <span>
                Cook: <time>{recipe.cookTime} min</time>
              </span>
            )}
          </div>
        )}

        {/* Ingredients */}
        <section aria-labelledby="ingredients-heading">
          <h3 id="ingredients-heading" className="font-medium mb-2">
            Ingredients
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm" role="list">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>
                {ingredient.quantity} {ingredient.unit || ''} {ingredient.name}
              </li>
            ))}
          </ul>
        </section>

        {/* Instructions preview */}
        <section aria-labelledby="instructions-heading">
          <h3 id="instructions-heading" className="font-medium mb-2">
            Instructions
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{instructionsPreview}</p>
        </section>
      </CardContent>
    </Card>
  )
}

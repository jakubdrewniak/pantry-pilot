import { RecipeCard } from './RecipeCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { Recipe } from '@/types/types'

/**
 * RecipeGrid Props
 */
interface RecipeGridProps {
  recipes: Recipe[]
  loading: boolean
  onRecipeSelect: (id: string) => void
  onDeleteRecipe: (id: string) => void
}

/**
 * LoadingSkeleton Component
 *
 * Skeleton loader for recipe cards during loading state.
 */
function LoadingSkeleton(): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * EmptyState Component
 *
 * Display when no recipes are found.
 */
function EmptyState(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-6xl mb-4">🍽️</div>
      <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Try adjusting your search terms or filters, or create your first recipe.
      </p>
    </div>
  )
}

/**
 * RecipeGrid Component
 *
 * Grid displaying recipe cards with loading and empty states.
 * Responsive layout: 1 column on mobile, 2 on tablet, 3 on desktop.
 */
export function RecipeGrid({
  recipes,
  loading,
  onRecipeSelect,
  onDeleteRecipe,
}: RecipeGridProps): JSX.Element {
  // Show loading skeleton
  if (loading) {
    return <LoadingSkeleton />
  }

  // Show empty state when no recipes
  if (recipes.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map(recipe => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onSelect={onRecipeSelect}
          onDelete={onDeleteRecipe}
        />
      ))}
    </div>
  )
}

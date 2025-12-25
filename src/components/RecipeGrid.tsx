import { RecipeCard } from './RecipeCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import type { Recipe } from '@/types/types'

/**
 * RecipeGrid Props
 */
interface RecipeGridProps {
  recipes: Recipe[]
  loading: boolean
  selectedRecipeIds: Set<string>
  allSelected: boolean
  someSelected: boolean
  onRecipeSelect: (id: string) => void
  onRecipeToggle: (id: string) => void
  onSelectAll: () => void
  onEditRecipe: (id: string) => void
  onDeleteRecipe: (id: string) => void
}

/**
 * LoadingSkeleton Component
 *
 * Skeleton loader for recipe cards during loading state.
 */
function LoadingSkeleton(): JSX.Element {
  return (
    <div className="space-y-4" data-testid="recipes-loading-skeleton">
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
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="recipes-empty-state"
    >
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
 * Includes "Select All" checkbox for multi-selection functionality.
 * Responsive layout: 1 column on mobile, 2 on tablet, 3 on desktop.
 */
export function RecipeGrid({
  recipes,
  loading,
  selectedRecipeIds,
  allSelected,
  someSelected,
  onRecipeSelect,
  onRecipeToggle,
  onSelectAll,
  onEditRecipe,
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
    <div className="space-y-4">
      {/* Select All Toolbar */}
      <div className="flex items-center gap-2 py-2 px-1">
        <Checkbox
          id="select-all-recipes"
          // Radix UI Checkbox accepts "indeterminate" as a string value for checked prop
          checked={someSelected ? 'indeterminate' : allSelected}
          onCheckedChange={onSelectAll}
          aria-label="Select all recipes"
        />
        <label
          htmlFor="select-all-recipes"
          className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Select all recipes on this page
        </label>
        {selectedRecipeIds.size > 0 && (
          <span className="text-sm text-muted-foreground ml-2">
            ({selectedRecipeIds.size} selected)
          </span>
        )}
      </div>

      {/* Recipe Cards Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        data-testid="recipes-grid"
      >
        {recipes.map(recipe => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isSelected={selectedRecipeIds.has(recipe.id)}
            onSelect={onRecipeSelect}
            onToggle={onRecipeToggle}
            onEdit={onEditRecipe}
            onDelete={onDeleteRecipe}
          />
        ))}
      </div>
    </div>
  )
}

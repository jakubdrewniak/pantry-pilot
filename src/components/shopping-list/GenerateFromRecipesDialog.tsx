'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChefHat, Loader2, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useGenerateShoppingList } from '@/lib/hooks/useGenerateShoppingList'
import type { Recipe } from '@/types/types'

const MAX_RECIPES = 20

interface GenerateFromRecipesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

/**
 * Dialog for generating shopping list items from selected recipes.
 * Fetches available recipes, allows searching and multi-selection (max 20),
 * then calls POST /api/shopping-lists/generate on confirm.
 */
export function GenerateFromRecipesDialog({
  open,
  onOpenChange,
  onSuccess,
}: GenerateFromRecipesDialogProps): JSX.Element {
  const { generateFromRecipes, isLoading: isGenerating } = useGenerateShoppingList()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Fetch all recipes when dialog opens
  useEffect(() => {
    if (!open) return

    const fetchRecipes = async () => {
      setIsLoadingRecipes(true)
      setFetchError(null)

      try {
        const response = await fetch('/api/recipes?pageSize=100&sort=-createdAt')
        if (!response.ok) throw new Error('Failed to load recipes')
        const data = await response.json()
        setRecipes(data.data ?? [])
      } catch {
        setFetchError('Could not load recipes. Please try again.')
      } finally {
        setIsLoadingRecipes(false)
      }
    }

    fetchRecipes()
  }, [open])

  // Reset local state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setSelectedRecipeIds([])
      setSubmitError(null)
    }
  }, [open])

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes
    const query = searchQuery.toLowerCase()
    return recipes.filter(recipe => recipe.title.toLowerCase().includes(query))
  }, [recipes, searchQuery])

  const isAtLimit = selectedRecipeIds.length >= MAX_RECIPES

  const handleToggleRecipe = (recipeId: string) => {
    setSelectedRecipeIds(prev => {
      if (prev.includes(recipeId)) return prev.filter(id => id !== recipeId)
      if (prev.length >= MAX_RECIPES) return prev
      return [...prev, recipeId]
    })
  }

  const handleGenerate = async () => {
    if (selectedRecipeIds.length === 0) return

    setSubmitError(null)

    try {
      await generateFromRecipes(selectedRecipeIds)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to generate shopping list. Please try again.'
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Generate from Recipes
          </DialogTitle>
          <DialogDescription>
            Select recipes to add their ingredients to your shopping list. You can select up to{' '}
            {MAX_RECIPES} recipes at once.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search recipes"
            />
          </div>

          {/* Selection counter */}
          {selectedRecipeIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedRecipeIds.length} / {MAX_RECIPES} selected
              </Badge>
              {isAtLimit && (
                <span className="text-sm text-amber-600">Maximum recipes selected</span>
              )}
            </div>
          )}

          {/* Error alerts */}
          {fetchError && (
            <Alert variant="destructive">
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          )}
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Recipe list */}
          <div
            className="min-h-0 flex-1 overflow-y-auto rounded-md border"
            role="list"
            aria-label="Available recipes"
          >
            {isLoadingRecipes ? (
              <div className="space-y-3 p-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            ) : filteredRecipes.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                {recipes.length === 0
                  ? 'No recipes found. Create some recipes first.'
                  : 'No recipes match your search.'}
              </p>
            ) : (
              <div className="space-y-0.5 p-2" role="none">
                {filteredRecipes.map(recipe => {
                  const isSelected = selectedRecipeIds.includes(recipe.id)
                  const isDisabled = !isSelected && isAtLimit

                  return (
                    <div
                      key={recipe.id}
                      role="listitem"
                      className={`flex items-center gap-3 rounded-md p-2 transition-colors ${
                        isSelected
                          ? 'bg-accent'
                          : isDisabled
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:bg-muted'
                      }`}
                    >
                      <Checkbox
                        id={`recipe-${recipe.id}`}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() => handleToggleRecipe(recipe.id)}
                        aria-describedby={recipe.mealType ? `recipe-type-${recipe.id}` : undefined}
                      />
                      <Label
                        htmlFor={`recipe-${recipe.id}`}
                        className={`flex flex-1 items-baseline gap-2 text-sm font-normal leading-tight ${
                          isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        {recipe.title}
                        {recipe.mealType && (
                          <span
                            id={`recipe-type-${recipe.id}`}
                            className="text-xs capitalize text-muted-foreground"
                          >
                            {recipe.mealType}
                          </span>
                        )}
                      </Label>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={selectedRecipeIds.length === 0 || isGenerating}
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

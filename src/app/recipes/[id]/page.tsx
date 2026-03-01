'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog'
import {
  RecipeApiService,
  RecipeApiError,
  RecipeApiErrorHandler,
} from '@/lib/services/recipe-api.service'
import type { Recipe } from '@/types/types'

export default function RecipeViewPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const recipeId = params.id as string

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchRecipe = async (): Promise<void> => {
      try {
        setLoading(true)
        setError(null)
        const data = await RecipeApiService.getRecipe(recipeId)
        setRecipe(data)
      } catch (err) {
        if (RecipeApiErrorHandler.shouldRedirectToLogin(err)) {
          router.push('/login')
          return
        }
        setError(RecipeApiErrorHandler.getUserMessage(err))
        if (err instanceof RecipeApiError && err.status === 404) {
          setTimeout(() => router.push('/recipes'), 3000)
        }
      } finally {
        setLoading(false)
      }
    }

    if (recipeId) {
      fetchRecipe()
    }
  }, [recipeId, router])

  const handleEdit = (): void => {
    router.push(`/recipes/${recipeId}/edit`)
  }

  const handleConfirmDelete = async (): Promise<void> => {
    setIsDeleting(true)
    try {
      await RecipeApiService.deleteRecipe(recipeId)
      router.push('/recipes')
    } catch (err) {
      if (RecipeApiErrorHandler.shouldRedirectToLogin(err)) {
        router.push('/login')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // ========================================================================
  // RENDER - Loading state
  // ========================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner className="h-8 w-8 mb-4" />
            <p className="text-muted-foreground">Loading recipe...</p>
          </div>
        </div>
      </div>
    )
  }

  // ========================================================================
  // RENDER - Error state
  // ========================================================================

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/recipes')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to recipes
          </Button>

          <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">Error</h2>
            <p className="text-sm text-destructive/90">{error || 'Recipe not found'}</p>
            <p className="text-sm text-muted-foreground mt-2">Redirecting to recipes list...</p>
          </div>
        </div>
      </div>
    )
  }

  // ========================================================================
  // RENDER - Recipe view
  // ========================================================================

  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => router.push('/recipes')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to recipes
        </Button>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{recipe.title}</h1>
            <div className="flex flex-wrap gap-2">
              {recipe.mealType && (
                <Badge variant="secondary" className="capitalize">
                  {recipe.mealType}
                </Badge>
              )}
              {recipe.creationMethod === 'ai_generated' && (
                <Badge variant="outline">AI generated</Badge>
              )}
              {recipe.creationMethod === 'ai_generated_modified' && (
                <Badge variant="outline">AI generated (modified)</Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Recipe content */}
        <div className="rounded-lg border bg-card p-6 space-y-6">
          {/* Timing info */}
          {(recipe.prepTime || recipe.cookTime) && (
            <div
              className="flex flex-wrap gap-6 text-sm text-muted-foreground pb-4 border-b"
              aria-label="Recipe timing"
            >
              {recipe.prepTime && (
                <div>
                  <span className="font-medium text-foreground">Prep time</span>
                  <p>
                    <time>{recipe.prepTime} min</time>
                  </p>
                </div>
              )}
              {recipe.cookTime && (
                <div>
                  <span className="font-medium text-foreground">Cook time</span>
                  <p>
                    <time>{recipe.cookTime} min</time>
                  </p>
                </div>
              )}
              {totalTime > 0 && (
                <div>
                  <span className="font-medium text-foreground">Total time</span>
                  <p>
                    <time>{totalTime} min</time>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Ingredients */}
          <section aria-labelledby="ingredients-heading">
            <h2 id="ingredients-heading" className="text-xl font-semibold mb-3">
              Ingredients
            </h2>
            <ul className="space-y-1" role="list">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex gap-2 text-sm">
                  <span className="font-medium">{ingredient.name}</span>
                  <span>
                    {ingredient.quantity}
                    {ingredient.unit ? ` ${ingredient.unit}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Instructions */}
          <section aria-labelledby="instructions-heading">
            <h2 id="instructions-heading" className="text-xl font-semibold mb-3">
              Instructions
            </h2>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {/* TODO: recipe instruction should support markdown */}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{recipe.instructions}</p>
            </div>
          </section>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        title="Delete Recipe"
        description={`Are you sure you want to delete "${recipe.title}"? This action cannot be undone.`}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  )
}

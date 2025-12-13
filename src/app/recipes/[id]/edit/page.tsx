'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecipeEditorForm } from '@/components/recipes/editor/RecipeEditorForm'
import { Spinner } from '@/components/ui/spinner'
import type { Recipe } from '@/types/types'

/**
 * EditRecipePage
 *
 * Page for editing an existing recipe.
 * Uses RecipeEditorForm in 'edit' mode.
 *
 * Flow:
 * 1. Fetch recipe by ID on mount
 * 2. Display loading state while fetching
 * 3. Show form with pre-filled data
 * 4. On success: redirect to /recipes with success toast
 * 5. On cancel: redirect back to /recipes
 * 6. On 404: show error and redirect
 *
 * Features:
 * - Loading state
 * - Error handling (404, network errors)
 * - Breadcrumb navigation
 * - Unsaved changes warning (handled by form)
 */
export default function EditRecipePage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const recipeId = params.id as string

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetches recipe data on mount
   */
  useEffect(() => {
    const fetchRecipe = async (): Promise<void> => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/recipes/${recipeId}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError('Recipe not found')
            // Redirect to recipes list after 2 seconds
            setTimeout(() => {
              router.push('/recipes')
            }, 3000)
            return
          }
          throw new Error('Failed to fetch recipe')
        }

        const data: Recipe = await response.json()
        setRecipe(data)
      } catch (err) {
        console.error('Error fetching recipe:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while fetching the recipe')
      } finally {
        setLoading(false)
      }
    }

    if (recipeId) {
      fetchRecipe()
    }
  }, [recipeId, router])

  /**
   * Handles successful recipe update
   * Redirects to recipes list
   */
  const handleSuccess = (updatedRecipe: Recipe): void => {
    // TODO: Add toast notification "Przepis zaktualizowany pomyślnie"
    console.log('Recipe updated:', updatedRecipe)
    router.push('/recipes')
  }

  /**
   * Handles cancel action
   * Returns to recipes list
   */
  const handleCancel = (): void => {
    router.push('/recipes')
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
  // RENDER - Success state (recipe loaded)
  // ========================================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => router.push('/recipes')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to recipes
        </Button>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Edit recipe</h1>
          <p className="text-muted-foreground mt-2">Make changes to &quot;{recipe.title}&quot;</p>
        </div>

        {/* Recipe editor form */}
        <div className="rounded-lg border bg-card p-6">
          <RecipeEditorForm
            mode="edit"
            initialData={recipe}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  )
}

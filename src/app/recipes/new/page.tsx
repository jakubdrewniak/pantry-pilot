'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecipeEditorForm } from '@/components/recipes/editor/RecipeEditorForm'
import type { Recipe } from '@/types/types'

/**
 * NewRecipePage
 *
 * Page for creating a new recipe manually.
 * Uses RecipeEditorForm in 'create' mode.
 *
 * Flow:
 * 1. User fills in the form
 * 2. On success: redirect to /recipes with success toast
 * 3. On cancel: redirect back to /recipes
 *
 * Features:
 * - Breadcrumb navigation
 * - Unsaved changes warning (handled by form)
 * - Responsive layout
 */
export default function NewRecipePage(): JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [aiGeneratedRecipe, setAiGeneratedRecipe] = useState<Recipe | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // Check if we're in edit AI-generated recipe mode
  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'edit-ai-generated') {
      setIsEditMode(true)

      // Try to get the AI-generated recipe from localStorage
      try {
        const storedData = localStorage.getItem('aiRecipeToEdit')
        if (storedData) {
          const editData = JSON.parse(storedData)
          if (editData.aiGeneratedRecipe) {
            setAiGeneratedRecipe(editData.aiGeneratedRecipe)
          }
          // Clean up localStorage
          localStorage.removeItem('aiRecipeToEdit')
        }
      } catch (error) {
        console.error('Error parsing AI recipe data from localStorage:', error)
      }
    }
  }, [searchParams])

  /**
   * Handles successful recipe creation
   * Redirects to recipes list
   */
  const handleSuccess = (recipe: Recipe): void => {
    // TODO: Add toast notification "Recipe created successfully"
    console.log('Recipe created:', recipe)
    router.push('/recipes')
  }

  /**
   * Handles cancel action
   * Returns to recipes list
   */
  const handleCancel = (): void => {
    router.push('/recipes')
  }

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
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit AI Recipe' : 'New recipe'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isEditMode
              ? aiGeneratedRecipe
                ? `Modify the AI-generated recipe "${aiGeneratedRecipe.title}" before saving`
                : 'Modify the AI-generated recipe before saving'
              : 'Create a new recipe manually by filling out the form below'}
          </p>
        </div>

        {/* Recipe editor form */}
        <div className="rounded-lg border bg-card p-6">
          {isEditMode && aiGeneratedRecipe ? (
            <RecipeEditorForm
              mode="save-generated"
              initialData={aiGeneratedRecipe}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          ) : (
            <RecipeEditorForm mode="create" onSuccess={handleSuccess} onCancel={handleCancel} />
          )}
        </div>
      </div>
    </div>
  )
}

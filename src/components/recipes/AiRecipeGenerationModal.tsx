'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AiRecipeGenerationForm } from './AiRecipeGenerationForm'
import { LoadingState } from './LoadingState'
import { WarningsPanel } from './WarningsPanel'
import { RecipePreview } from './RecipePreview'
import { RecipeApiService, RecipeApiErrorHandler } from '@/lib/services/recipe-api.service'
import type { GenerateRecipeResponse, Recipe, CreateRecipeRequest } from '@/types/types'

interface AiRecipeGenerationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecipeSaved?: (recipe: Recipe) => void
}

/**
 * AI Recipe Generation Modal
 *
 * A dialog that allows users to generate recipes using AI based on:
 * - A text hint describing desired recipe
 * - Optionally, ingredients from their pantry
 *
 * Flow:
 * 1. User enters hint and selects pantry option
 * 2. Shows loading state during generation
 * 3. Displays warnings if any (e.g., empty pantry)
 * 4. Shows recipe preview with "AI-original" badge
 * 5. User can save the recipe directly or edit it before saving
 *
 * Features:
 * - ARIA role="dialog" for accessibility
 * - Focus trap and ESC key support (provided by Radix Dialog)
 * - Backdrop click to close (can be prevented during loading)
 * - Responsive design (full screen on mobile, modal on desktop)
 * - Direct save or edit generated recipe
 */
export const AiRecipeGenerationModal = ({
  open,
  onOpenChange,
  onRecipeSaved,
}: AiRecipeGenerationModalProps): JSX.Element => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [recipe, setRecipe] = useState<Recipe | undefined>()
  const router = useRouter()
  const [warnings, setWarnings] = useState<string[]>([])
  const [pantryEmpty, setPantryEmpty] = useState(false)
  const [saveError, setSaveError] = useState<string | undefined>()

  const handleGenerationStart = () => {
    setIsGenerating(true)
    setSaveError(undefined)
  }

  const handleSuccess = (response: GenerateRecipeResponse, pantryEmptyHeader?: boolean) => {
    setIsGenerating(false)
    setRecipe(response.recipe)
    setWarnings(response.warnings || [])
    setPantryEmpty(pantryEmptyHeader || false)
    setSaveError(undefined)
  }

  const handleError = () => {
    setIsGenerating(false)
  }

  /**
   * Saves the generated recipe to the database using RecipeApiService
   */
  /**
   * Opens the recipe editor to edit the generated recipe
   * This will create a recipe marked as 'ai_generated_modified' when saved
   */
  const handleEditRecipe = () => {
    if (!recipe) return

    // Close the modal
    onOpenChange(false)

    // Store the AI-generated recipe in localStorage for the edit page
    const editData = {
      aiGeneratedRecipe: recipe,
      timestamp: Date.now(), // For cleanup
    }
    localStorage.setItem('aiRecipeToEdit', JSON.stringify(editData))

    // Navigate to new recipe page with special mode
    router.push('/recipes/new?mode=edit-ai-generated')
  }

  const handleSaveRecipe = async () => {
    if (!recipe) return

    setIsSaving(true)
    setSaveError(undefined)

    try {
      // Prepare request data - use the AI-generated recipe as-is
      // Mark it as 'ai_generated' since it hasn't been modified
      const requestData: CreateRecipeRequest = {
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        mealType: recipe.mealType,
        creationMethod: 'ai_generated',
      }

      // Use RecipeApiService for consistent API communication
      const savedRecipe = await RecipeApiService.createRecipe(requestData)

      // Notify parent component that recipe was saved
      if (onRecipeSaved) {
        onRecipeSaved(savedRecipe)
      }
      setRecipe(undefined)
      // Close modal after successful save
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving recipe:', error)

      // Use RecipeApiErrorHandler for consistent error messages
      const errorMessage = RecipeApiErrorHandler.getUserMessage(error)
      setSaveError(errorMessage)

      // Redirect to login if unauthorized
      if (RecipeApiErrorHandler.shouldRedirectToLogin(error)) {
        setTimeout(() => {
          window.location.href = '/auth/login'
        }, 2000) // Give user time to see the error message
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Only allow closing if not generating or saving
    if (!isGenerating && !isSaving) {
      onOpenChange(false)
    }
  }

  const handleClose = (newOpen: boolean) => {
    // Prevent closing while generating or saving
    if ((isGenerating || isSaving) && !newOpen) {
      return
    }
    onOpenChange(newOpen)

    // Reset state when closing
    if (!newOpen) {
      resetState()
    }
  }

  const onClose = () => {
    resetState()
    onOpenChange(false)
  }

  const resetState = () => {
    setRecipe(undefined)
    setWarnings([])
    setPantryEmpty(false)
    setIsGenerating(false)
    setIsSaving(false)
    setSaveError(undefined)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={e => {
          // Prevent closing by clicking outside while generating or saving
          if (isGenerating || isSaving) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={e => {
          // Prevent ESC close while generating or saving
          if (isGenerating || isSaving) {
            e.preventDefault()
          }
        }}
        data-testid="ai-recipe-generation-modal"
      >
        <DialogHeader>
          <DialogTitle>Generate Recipe with AI</DialogTitle>
          <DialogDescription>
            Describe the recipe &apos;d like, and optionally use ingredients from your pantry.
          </DialogDescription>
        </DialogHeader>

        {/* Show form when not yet generated */}
        {!recipe && (
          <>
            <LoadingState loading={isGenerating} />
            {!isGenerating && (
              <AiRecipeGenerationForm
                onStart={handleGenerationStart}
                onSuccess={handleSuccess}
                onError={handleError}
                onCancel={handleCancel}
              />
            )}
          </>
        )}

        {/* Show results when recipe is generated */}
        {recipe && (
          <div className="space-y-4">
            <WarningsPanel warnings={warnings} pantryEmpty={pantryEmpty} />
            <RecipePreview recipe={recipe} />

            {/* Show save error if any */}
            {saveError && (
              <div
                className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md"
                role="alert"
                data-testid="ai-recipe-save-error"
              >
                <p className="font-medium">Failed to save recipe</p>
                <p className="mt-1">{saveError}</p>
              </div>
            )}

            {/* Actions after generation */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
                data-testid="ai-recipe-close-button"
              >
                Close
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleEditRecipe}
                disabled={isSaving}
                data-testid="ai-recipe-edit-button"
              >
                Edit Recipe
              </Button>
              <Button
                type="button"
                onClick={handleSaveRecipe}
                disabled={isSaving}
                className="min-w-[120px]"
                data-testid="ai-recipe-save-button"
              >
                {isSaving ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  'Save Recipe'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

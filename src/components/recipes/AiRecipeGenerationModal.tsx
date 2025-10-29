'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AiRecipeGenerationForm } from './AiRecipeGenerationForm'
import { LoadingState } from './LoadingState'
import { WarningsPanel } from './WarningsPanel'
import { RecipePreview } from './RecipePreview'
import type { GenerateRecipeResponse, Recipe } from '@/types/types'

interface AiRecipeGenerationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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
 *
 * Features:
 * - ARIA role="dialog" for accessibility
 * - Focus trap and ESC key support (provided by Radix Dialog)
 * - Backdrop click to close (can be prevented during loading)
 * - Responsive design (full screen on mobile, modal on desktop)
 */
export const AiRecipeGenerationModal = ({
  open,
  onOpenChange,
}: AiRecipeGenerationModalProps): JSX.Element => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [recipe, setRecipe] = useState<Recipe | undefined>()
  const [warnings, setWarnings] = useState<string[]>([])
  const [pantryEmpty, setPantryEmpty] = useState(false)

  const handleSuccess = (response: GenerateRecipeResponse, pantryEmptyHeader?: boolean) => {
    setIsGenerating(false)
    setRecipe(response.recipe)
    setWarnings(response.warnings || [])
    setPantryEmpty(pantryEmptyHeader || false)
  }

  const handleCancel = () => {
    // Only allow closing if not generating
    if (!isGenerating) {
      onOpenChange(false)
    }
  }

  const handleClose = (newOpen: boolean) => {
    // Prevent closing while generating
    if (isGenerating && !newOpen) {
      return
    }
    onOpenChange(newOpen)

    // Reset state when closing
    if (!newOpen) {
      setRecipe(undefined)
      setWarnings([])
      setPantryEmpty(false)
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={e => {
          // Prevent closing by clicking outside while generating
          if (isGenerating) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={e => {
          // Prevent ESC close while generating
          if (isGenerating) {
            e.preventDefault()
          }
        }}
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
              <AiRecipeGenerationForm onSuccess={handleSuccess} onCancel={handleCancel} />
            )}
          </>
        )}

        {/* Show results when recipe is generated */}
        {recipe && (
          <div className="space-y-4">
            <WarningsPanel warnings={warnings} pantryEmpty={pantryEmpty} />
            <RecipePreview recipe={recipe} />

            {/* Actions after generation */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {/* TODO: Add "Save Recipe" and "Edit Recipe" buttons in future implementation */}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

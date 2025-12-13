import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { RecipeEditorMode, Recipe } from '@/types/types'
import { useRecipeEditor } from '@/lib/hooks/useRecipeEditor'
import { RecipeMetadataSection } from './RecipeMetadataSection'
import { IngredientsEditor } from './IngredientsEditor'
import { MarkdownInstructionsEditor } from './MarkdownInstructionsEditor'
import { RecipeFormActions } from './RecipeFormActions'

interface RecipeEditorFormProps {
  mode: RecipeEditorMode
  initialData?: Recipe
  onSuccess: (recipe: Recipe) => void
  onCancel: () => void
}

/**
 * RecipeEditorForm Component
 *
 * Main form for creating and editing recipes.
 * Integrates all editor subcomponents and manages form state via useRecipeEditor hook.
 *
 * Features:
 * - Three modes: create, edit, save-generated
 * - Progressive validation (onBlur → onChange → onSubmit)
 * - Unsaved changes warning (beforeunload)
 * - Responsive layout
 * - Accessibility support
 *
 * Architecture:
 * - Smart component (manages state via hook)
 * - Delegates rendering to presentation components
 * - Similar to Angular's container/presentation pattern
 */
export const RecipeEditorForm = ({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: RecipeEditorFormProps): JSX.Element => {
  const router = useRouter()

  // ========================================================================
  // HOOK - Form state and logic
  // ========================================================================

  const {
    formData,
    errors,
    isSubmitting,
    isDirty,
    handleFieldChange,
    handleIngredientsChange,
    handleSubmit,
    validateField,
  } = useRecipeEditor(mode, initialData, onSuccess)

  // ========================================================================
  // EFFECTS
  // ========================================================================

  /**
   * Warn user about unsaved changes when leaving page (browser close/refresh)
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (isDirty && !isSubmitting) {
        e.preventDefault()
        // Modern browsers ignore custom message, but we still need to set returnValue
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty, isSubmitting])

  /**
   * Warn user about unsaved changes when navigating away (internal navigation)
   * This handles programmatic navigation (router.push, links)
   */
  useEffect(() => {
    // Store original router.push
    const originalPush = router.push

    // Override router.push to check for unsaved changes
    router.push = function (href: string, options?: Parameters<typeof originalPush>[1]) {
      if (isDirty && !isSubmitting) {
        const confirmed = window.confirm(
          'You have unsaved changes. Are you sure you want to leave?'
        )
        if (!confirmed) {
          return Promise.resolve(true)
        }
      }
      return originalPush.call(this, href, options)
    }

    // Cleanup: restore original method
    return () => {
      router.push = originalPush
    }
  }, [isDirty, isSubmitting, router])

  /**
   * Warn user about unsaved changes when using browser back button
   * This uses the History API to detect back navigation
   */
  useEffect(() => {
    if (!isDirty || isSubmitting) {
      return
    }

    // Push a dummy state to history when form becomes dirty
    // This allows us to intercept the back button
    const currentState = window.history.state
    window.history.pushState({ ...currentState, formDirty: true }, '')

    const handlePopState = (): void => {
      if (isDirty && !isSubmitting) {
        const confirmed = window.confirm(
          'You have unsaved changes. Are you sure you want to leave?'
        )
        if (!confirmed) {
          // User cancelled - push state back to stay on page
          window.history.pushState({ ...currentState, formDirty: true }, '')
        } else {
          // User confirmed - allow navigation
          // Remove the listener to prevent multiple prompts
          window.removeEventListener('popstate', handlePopState)
        }
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isDirty, isSubmitting])

  // ========================================================================
  // HANDLERS
  // ========================================================================

  /**
   * Handles cancel with confirmation if there are unsaved changes
   */
  const handleCancel = (): void => {
    if (isDirty && !isSubmitting) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?')
      if (!confirmed) {
        return
      }
    }
    onCancel()
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Metadata section (title, times, meal type) */}
      <RecipeMetadataSection
        title={formData.title}
        prepTime={formData.prepTime}
        cookTime={formData.cookTime}
        mealType={formData.mealType}
        errors={{
          title: errors.title,
          prepTime: errors.prepTime,
          cookTime: errors.cookTime,
        }}
        onChange={handleFieldChange}
        onBlur={validateField}
      />

      {/* Ingredients section */}
      <IngredientsEditor
        ingredients={formData.ingredients}
        errors={{
          general: errors.ingredients,
          items: errors.ingredientItems,
        }}
        onChange={handleIngredientsChange}
        onBlur={() => validateField('ingredients')}
      />

      {/* Instructions section */}
      <MarkdownInstructionsEditor
        instructions={formData.instructions}
        error={errors.instructions}
        onChange={value => handleFieldChange('instructions', value)}
        onBlur={() => validateField('instructions')}
      />

      {/* Form actions (cancel, submit) */}
      <RecipeFormActions
        isSubmitting={isSubmitting}
        isDirty={isDirty}
        onCancel={handleCancel}
        cancelLabel="Cancel"
        submitLabel={mode === 'edit' ? 'Save changes' : 'Create recipe'}
      />
    </form>
  )
}

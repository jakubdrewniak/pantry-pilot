import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useAiRecipeGeneration } from '@/lib/hooks/useAiRecipeGeneration'
import type { GenerateRecipeResponse } from '@/types/types'

interface AiRecipeGenerationFormProps {
  onSuccess: (response: GenerateRecipeResponse, pantryEmpty?: boolean) => void
  onCancel: () => void
}

/**
 * Form for AI recipe generation.
 *
 * Features:
 * - Text input for hint (min 1, max 200 chars, no <, >, & characters)
 * - Checkbox for usePantryItems
 * - Client-side validation matching server Zod schema
 * - Disables inputs while submitting
 * - Displays inline errors
 *
 * Props:
 * - onSuccess: Called with response when generation succeeds
 * - onCancel: Called when user clicks cancel
 */
export const AiRecipeGenerationForm = ({
  onSuccess,
  onCancel,
}: AiRecipeGenerationFormProps): JSX.Element => {
  const [hint, setHint] = useState('')
  const [usePantryItems, setUsePantryItems] = useState(false)
  const [validationError, setValidationError] = useState<string>()

  const { generate, isLoading, error: apiError } = useAiRecipeGeneration()

  /**
   * Client-side validation matching server Zod schema:
   * - hint: min 1, max 200, regex ^[^<>&]*$
   * - usePantryItems: boolean (always valid)
   */
  const validateForm = (): boolean => {
    setValidationError(undefined)

    if (!hint || hint.length === 0) {
      setValidationError('Please provide a hint for the recipe.')
      return false
    }

    if (hint.length > 200) {
      setValidationError('Hint must be 200 characters or less.')
      return false
    }

    // Check for disallowed characters: <, >, &
    if (/[<>&]/.test(hint)) {
      setValidationError('Hint cannot contain <, >, or & characters.')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const result = await generate({ hint, usePantryItems })

    if (result.data) {
      onSuccess(result.data, result.pantryEmptyHeader)
    }
    // Errors are handled by the hook and displayed below
  }

  const errorMessage = validationError || apiError

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Hint Input */}
      <div className="space-y-2">
        <Label htmlFor="hint">
          Recipe Hint <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="hint"
          placeholder="e.g., Italian pasta with tomatoes, vegetarian pizza, quick breakfast..."
          value={hint}
          onChange={e => setHint(e.target.value)}
          disabled={isLoading}
          maxLength={200}
          rows={3}
          aria-describedby="hint-description"
          aria-invalid={!!errorMessage}
        />
        <p id="hint-description" className="text-xs text-muted-foreground">
          Describe what kind of recipe you&apos;d like. {hint.length}/200 characters.
        </p>
      </div>

      {/* Use Pantry Items Checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="usePantryItems"
          checked={usePantryItems}
          onCheckedChange={checked => setUsePantryItems(checked === true)}
          disabled={isLoading}
        />
        <Label htmlFor="usePantryItems" className="text-sm font-normal cursor-pointer">
          Use ingredients from my pantry
        </Label>
      </div>

      {/* Error Display */}
      {errorMessage && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Recipe'}
        </Button>
      </div>
    </form>
  )
}

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RecipeFormActionsProps {
  isSubmitting: boolean
  isDirty: boolean
  onCancel: () => void
  cancelLabel?: string
  submitLabel?: string
}

/**
 * RecipeFormActions Component
 *
 * Contains form action buttons and status indicators:
 * - Cancel button (secondary)
 * - Submit button (primary) with loading spinner
 * - Unsaved changes indicator
 *
 * Layout: Flex with space-between
 * - Left: Unsaved changes indicator
 * - Right: Action buttons
 */
export const RecipeFormActions = ({
  isSubmitting,
  isDirty,
  onCancel,
  cancelLabel = 'Cancel',
  submitLabel = 'Save',
}: RecipeFormActionsProps): JSX.Element => {
  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Unsaved changes indicator */}
      <div className="flex items-center">
        {isDirty && !isSubmitting && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Unsaved changes</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        {/* Cancel button */}
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {cancelLabel}
        </Button>

        {/* Submit button */}
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </div>
  )
}

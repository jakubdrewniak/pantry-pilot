import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

/**
 * DeleteConfirmationDialog Props
 */
interface DeleteConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Dialog title */
  title: string
  /** Description/message explaining what will be deleted */
  description: string
  /** Whether deletion is in progress */
  isDeleting: boolean
  /** Called when user confirms deletion */
  onConfirm: () => void
  /** Called when user cancels or closes the dialog */
  onCancel: () => void
}

/**
 * DeleteConfirmationDialog Component
 *
 * A reusable confirmation dialog for destructive actions like deletion.
 * Shows loading state during deletion and displays errors if they occur.
 *
 * Accessibility:
 * - Uses DialogTitle and DialogDescription for screen readers
 * - Focus is trapped within the dialog when open
 * - Escape key closes the dialog (when not deleting)
 *
 * @example
 * ```tsx
 * <DeleteConfirmationDialog
 *   open={isOpen}
 *   title="Delete Recipe"
 *   description="Are you sure you want to delete this recipe?"
 *   isDeleting={loading}
 *   error={errorMessage}
 *   onConfirm={handleDelete}
 *   onCancel={() => setIsOpen(false)}
 * />
 * ```
 */
export function DeleteConfirmationDialog({
  open,
  title,
  description,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps): JSX.Element {
  // Prevent closing while deleting
  const handleOpenChange = (newOpen: boolean): void => {
    if (!isDeleting && !newOpen) {
      onCancel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

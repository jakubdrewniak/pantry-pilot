'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert } from '@/components/ui/alert'
import { useDeletePantryItem } from '@/lib/hooks/useDeletePantryItem'
import type { PantryItem } from '@/types/types'
import { Loader2 } from 'lucide-react'

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: PantryItem | null
  pantryId: string
  onSuccess: () => void
}

/**
 * DeleteConfirmationDialog Component
 *
 * Alert dialog for confirming deletion of a pantry item.
 * Shows item name and asks for confirmation before deletion.
 *
 * Features:
 * - Confirmation message with item name
 * - Loading state during deletion
 * - Error handling with inline messages
 * - Focus on Cancel button (safer default)
 * - Handles case where item is already deleted (404)
 *
 * @param open - Whether dialog is open
 * @param onOpenChange - Callback when dialog open state changes
 * @param item - Item to delete (null if dialog closed, always present when open)
 * @param pantryId - UUID of the pantry
 * @param onSuccess - Callback after successful item deletion
 */
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  item,
  pantryId,
  onSuccess,
}: DeleteConfirmationDialogProps) {
  const { deleteItem } = useDeletePantryItem(pantryId)

  // Track deletion state
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handles deletion of the item
   */
  const handleDelete = async () => {
    // Guard clause: item should always be present when dialog is open
    if (!item) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      await deleteItem(item.id)

      // Success - close dialog and notify parent
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      // Handle errors
      let errorMessage = 'Failed to delete item. Please try again.'

      if (err instanceof Error) {
        // Check if item was already deleted (404)
        if (err.message.includes('already deleted') || err.message.includes('not found')) {
          errorMessage = 'This item has already been deleted.'
          // Auto-close after showing message for 2 seconds
          setTimeout(() => {
            onOpenChange(false)
            onSuccess() // Refresh list to reflect current state
          }, 2000)
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Item</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{item?.name}</strong>? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Error message */}
        {error && (
          <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
            {error}
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={e => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

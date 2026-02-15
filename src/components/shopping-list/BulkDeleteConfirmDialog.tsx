'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { useBulkDelete } from '@/lib/hooks/useBulkDelete'
import type { ShoppingListItem } from '@/types/types'
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react'

interface BulkDeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedItems: ShoppingListItem[]
  listId: string
  onSuccess: (successCount: number, failedCount: number) => void
}

/**
 * BulkDeleteConfirmDialog Component
 *
 * Confirmation dialog for deleting multiple shopping list items at once.
 *
 * Features:
 * - Displays list of selected items
 * - Warning about irreversible operation
 * - Handles partial success (some items may fail)
 * - Loading states during operation
 * - Error handling with user-friendly messages
 *
 * @param open - Whether dialog is open
 * @param onOpenChange - Callback when dialog open state changes
 * @param selectedItems - Items to delete
 * @param listId - UUID of the shopping list
 * @param onSuccess - Callback with success/failed counts after operation
 */
export function BulkDeleteConfirmDialog({
  open,
  onOpenChange,
  selectedItems,
  listId,
  onSuccess,
}: BulkDeleteConfirmDialogProps) {
  const { bulkDelete, isLoading } = useBulkDelete(listId)
  const [error, setError] = useState<string | null>(null)

  const itemCount = selectedItems.length

  // Validate limits
  const exceedsLimit = itemCount > 100
  const hasItems = itemCount > 0

  /**
   * Handles bulk delete confirmation
   */
  const handleConfirm = async () => {
    if (!hasItems || exceedsLimit) {
      return
    }

    setError(null)

    try {
      const itemIds = selectedItems.map(item => item.id)
      const result = await bulkDelete(itemIds)

      // Close dialog
      onOpenChange(false)

      // Notify parent with results
      onSuccess(result.summary.successful, result.summary.failed)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete items'
      setError(errorMessage)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Delete Items
          </DialogTitle>
          <DialogDescription>
            Confirm deleting {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning message */}
          <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-medium">This action cannot be undone</p>
          </Alert>

          {/* Error message */}
          {error && (
            <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
              {error}
            </Alert>
          )}

          {/* Limit exceeded warning */}
          {exceedsLimit && (
            <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
              You can only delete up to 100 items at once. Please select fewer items.
            </Alert>
          )}

          {/* Items list */}
          {!exceedsLimit && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Items to delete ({itemCount}):
              </h4>
              <div className="max-h-[200px] overflow-y-auto border rounded-md p-3 space-y-1">
                {selectedItems.map(item => (
                  <div
                    key={item.id}
                    className="text-sm py-1 px-2 rounded hover:bg-muted transition-colors"
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground ml-2">
                      ({item.quantity} {item.unit || 'pcs'})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !hasItems || exceedsLimit}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

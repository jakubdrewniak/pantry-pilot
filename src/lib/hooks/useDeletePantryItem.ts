import { useState, useCallback } from 'react'
import type { UseDeletePantryItemReturn } from '@/types/types'

/**
 * useDeletePantryItem Hook
 *
 * Hook for deleting items from pantry.
 *
 * Features:
 * - Deletes item from pantry via API
 * - Loading state management
 * - Error handling with detailed messages
 * - Handles case where item is already deleted (404)
 *
 * Note: For cache invalidation, the parent component should call refetch on usePantry hook.
 *
 * @param pantryId - UUID of the pantry
 * @returns UseDeletePantryItemReturn - deleteItem function, loading state, and error
 */
export function useDeletePantryItem(
  pantryId: string | null | undefined
): UseDeletePantryItemReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Deletes a pantry item
   *
   * @param itemId - UUID of the item to delete
   * @returns Promise that resolves when item is deleted
   * @throws Error if API call fails
   */
  const deleteItem = useCallback(
    async (itemId: string): Promise<void> => {
      if (!pantryId) {
        throw new Error('Pantry ID is required')
      }

      if (!itemId) {
        throw new Error('Item ID is required')
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/pantries/${pantryId}/items/${itemId}`, {
          method: 'DELETE',
          credentials: 'include',
        })

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 401) {
            throw new Error('Session expired. Please log in again.')
          }

          if (response.status === 404) {
            // Item already deleted or doesn't exist
            // We can treat this as success (idempotent operation)
            console.warn('[useDeletePantryItem] Item not found, may have been already deleted:', {
              pantryId,
              itemId,
            })
            setError(null)
            return
          }

          if (response.status === 400) {
            throw new Error('Invalid item ID.')
          }

          throw new Error(`Failed to delete item (${response.status})`)
        }

        // Success - 204 No Content
        setError(null)
      } catch (err) {
        console.error('[useDeletePantryItem] Failed to delete item:', {
          pantryId,
          itemId,
          error: err,
        })

        const errorObj = err instanceof Error ? err : new Error('Network error. Please try again.')
        setError(errorObj)
        throw errorObj
      } finally {
        setIsLoading(false)
      }
    },
    [pantryId]
  )

  return {
    deleteItem,
    isLoading,
    error,
  }
}

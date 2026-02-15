import { useState, useCallback } from 'react'

/**
 * Return type for useDeleteShoppingListItem hook
 */
export interface UseDeleteShoppingListItemReturn {
  deleteItem: (itemId: string) => Promise<void>
  isLoading: boolean
  error: Error | null
}

/**
 * useDeleteShoppingListItem Hook
 *
 * Hook for deleting shopping list items.
 *
 * Features:
 * - Deletes single item from shopping list via API
 * - Loading state management
 * - Error handling with detailed messages
 *
 * Note: For real-time updates in the UI, the parent component should
 * listen to Supabase real-time events (DELETE).
 *
 * @param listId - UUID of the shopping list
 * @returns UseDeleteShoppingListItemReturn - deleteItem function, loading state, and error
 */
export function useDeleteShoppingListItem(
  listId: string | null | undefined
): UseDeleteShoppingListItemReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Deletes a shopping list item
   *
   * @param itemId - UUID of the item to delete
   * @returns Promise that resolves when item is deleted
   * @throws Error if API call fails
   */
  const deleteItem = useCallback(
    async (itemId: string): Promise<void> => {
      if (!listId) {
        throw new Error('Shopping list ID is required')
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
          method: 'DELETE',
          credentials: 'include',
        })

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 401) {
            throw new Error('Session expired. Please log in again.')
          }

          if (response.status === 404) {
            throw new Error('Item not found.')
          }

          if (response.status === 400) {
            throw new Error('Invalid item ID.')
          }

          throw new Error(`Failed to delete item (${response.status})`)
        }

        setError(null)
      } catch (err) {
        console.error('[useDeleteShoppingListItem] Failed to delete item:', {
          listId,
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
    [listId]
  )

  return {
    deleteItem,
    isLoading,
    error,
  }
}

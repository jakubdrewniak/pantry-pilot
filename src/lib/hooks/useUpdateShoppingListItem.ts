import { useState, useCallback } from 'react'
import type { UpdateShoppingListItemRequest, UpdateShoppingListItemResponse } from '@/types/types'

/**
 * Return type for useUpdateShoppingListItem hook
 */
export interface UseUpdateShoppingListItemReturn {
  updateItem: (
    itemId: string,
    updates: UpdateShoppingListItemRequest
  ) => Promise<UpdateShoppingListItemResponse>
  isLoading: boolean
  error: Error | null
}

/**
 * useUpdateShoppingListItem Hook
 *
 * Hook for updating shopping list items (quantity, unit, purchase status).
 *
 * Features:
 * - Updates item via API (quantity, unit, isPurchased)
 * - When isPurchased=true, item is transferred to pantry and removed from list
 * - Loading state management
 * - Error handling with detailed messages
 *
 * Note: For real-time updates in the UI, the parent component should
 * listen to Supabase real-time events (UPDATE or DELETE for purchased items).
 *
 * @param listId - UUID of the shopping list
 * @returns UseUpdateShoppingListItemReturn - updateItem function, loading state, and error
 */
export function useUpdateShoppingListItem(
  listId: string | null | undefined
): UseUpdateShoppingListItemReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Updates a shopping list item
   *
   * @param itemId - UUID of the item to update
   * @param updates - Fields to update (quantity, unit, isPurchased)
   * @returns Promise with updated item and optional pantry item (if purchased)
   * @throws Error if API call fails
   */
  const updateItem = useCallback(
    async (
      itemId: string,
      updates: UpdateShoppingListItemRequest
    ): Promise<UpdateShoppingListItemResponse> => {
      if (!listId) {
        throw new Error('Shopping list ID is required')
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updates),
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
            // Validation error
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || 'Invalid update data.')
          }

          throw new Error(`Failed to update item (${response.status})`)
        }

        const data: UpdateShoppingListItemResponse = await response.json()
        setError(null)
        return data
      } catch (err) {
        console.error('[useUpdateShoppingListItem] Failed to update item:', {
          listId,
          itemId,
          updates,
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
    updateItem,
    isLoading,
    error,
  }
}

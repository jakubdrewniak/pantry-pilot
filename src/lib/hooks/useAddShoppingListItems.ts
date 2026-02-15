import { useState, useCallback } from 'react'
import type { ShoppingListItem, AddShoppingListItemsRequest } from '@/types/types'

/**
 * Return type for useAddShoppingListItems hook
 */
export interface UseAddShoppingListItemsReturn {
  addItems: (items: AddShoppingListItemsRequest['items']) => Promise<ShoppingListItem[]>
  isLoading: boolean
  error: Error | null
}

/**
 * useAddShoppingListItems Hook
 *
 * Hook for adding items to shopping list.
 *
 * Features:
 * - Adds multiple items to shopping list via API
 * - Loading state management
 * - Error handling with detailed messages
 * - Returns created items from API
 *
 * Note: For real-time updates in the UI, the parent component should
 * listen to Supabase real-time events (INSERT).
 *
 * @param listId - UUID of the shopping list
 * @returns UseAddShoppingListItemsReturn - addItems function, loading state, and error
 */
export function useAddShoppingListItems(
  listId: string | null | undefined
): UseAddShoppingListItemsReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Adds items to shopping list
   *
   * @param items - Array of items to add
   * @returns Promise with created items
   * @throws Error if API call fails
   */
  const addItems = useCallback(
    async (items: AddShoppingListItemsRequest['items']): Promise<ShoppingListItem[]> => {
      if (!listId) {
        throw new Error('Shopping list ID is required')
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/shopping-lists/${listId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ items }),
        })

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 401) {
            throw new Error('Session expired. Please log in again.')
          }

          if (response.status === 404) {
            throw new Error('Shopping list not found.')
          }

          if (response.status === 409) {
            // Duplicate item error
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || 'Some items already exist in shopping list.')
          }

          if (response.status === 400) {
            // Validation error
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || 'Invalid item data.')
          }

          throw new Error(`Failed to add items (${response.status})`)
        }

        const data = await response.json()
        setError(null)
        return data.items
      } catch (err) {
        console.error('[useAddShoppingListItems] Failed to add items:', {
          listId,
          items,
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
    addItems,
    isLoading,
    error,
  }
}

import { useState, useCallback } from 'react'
import type { PantryItem, UpdatePantryItemRequest, UseUpdatePantryItemReturn } from '@/types/types'

/**
 * useUpdatePantryItem Hook
 *
 * Hook for updating pantry item quantity and/or unit.
 *
 * Features:
 * - Updates item quantity and/or unit via API
 * - Loading state management
 * - Error handling with detailed messages
 * - Returns updated item from API
 *
 * Note: At least one field (quantity or unit) must be provided in the update.
 * For cache invalidation, the parent component should call refetch on usePantry hook.
 *
 * @param pantryId - UUID of the pantry
 * @returns UseUpdatePantryItemReturn - updateItem function, loading state, and error
 */
export function useUpdatePantryItem(
  pantryId: string | null | undefined
): UseUpdatePantryItemReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Updates a pantry item
   *
   * @param itemId - UUID of the item to update
   * @param data - Update data (quantity and/or unit)
   * @returns Promise with updated item
   * @throws Error if API call fails or validation fails
   */
  const updateItem = useCallback(
    async (itemId: string, data: UpdatePantryItemRequest): Promise<PantryItem> => {
      if (!pantryId) {
        throw new Error('Pantry ID is required')
      }

      if (!itemId) {
        throw new Error('Item ID is required')
      }

      // Validate that at least one field is provided
      if (data.quantity === undefined && data.unit === undefined) {
        throw new Error('At least one field (quantity or unit) must be provided')
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/pantries/${pantryId}/items/${itemId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 401) {
            throw new Error('Session expired. Please log in again.')
          }

          if (response.status === 404) {
            throw new Error('Item not found or you do not have access.')
          }

          if (response.status === 400) {
            // Validation error
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || 'Invalid update data.')
          }

          throw new Error(`Failed to update item (${response.status})`)
        }

        const updatedItem: PantryItem = await response.json()
        setError(null)
        return updatedItem
      } catch (err) {
        console.error('[useUpdatePantryItem] Failed to update item:', {
          pantryId,
          itemId,
          data,
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
    updateItem,
    isLoading,
    error,
  }
}

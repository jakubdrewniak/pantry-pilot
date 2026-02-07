import { useState, useCallback } from 'react'
import type { PantryItem, AddPantryItemsRequest, UseAddPantryItemsReturn } from '@/types/types'

/**
 * useAddPantryItems Hook
 *
 * Hook for adding items to pantry with optimistic updates.
 *
 * Features:
 * - Adds items to pantry via API
 * - Loading state management
 * - Error handling with detailed messages
 * - Returns created items from API
 *
 * Note: For optimistic updates in the UI, the parent component should
 * handle cache invalidation (e.g., call refetch on usePantry hook).
 *
 * @param householdId - UUID of the household
 * @returns UseAddPantryItemsReturn - addItems function, loading state, and error
 */
export function useAddPantryItems(householdId: string | null | undefined): UseAddPantryItemsReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Adds items to pantry
   *
   * @param items - Array of items to add
   * @returns Promise with created items
   * @throws Error if API call fails
   */
  const addItems = useCallback(
    async (items: AddPantryItemsRequest['items']): Promise<PantryItem[]> => {
      if (!householdId) {
        throw new Error('Household ID is required')
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/households/${householdId}/pantry/items`, {
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
            throw new Error('Pantry not found or you do not have access.')
          }

          if (response.status === 409) {
            // Duplicate item error
            const errorData = await response.json().catch(() => ({}))
            const duplicateNames = errorData.details?.duplicateNames || []
            if (duplicateNames.length > 0) {
              throw new Error(
                `Item${duplicateNames.length > 1 ? 's' : ''} already exist${duplicateNames.length === 1 ? 's' : ''}: ${duplicateNames.join(', ')}`
              )
            }
            throw new Error('Some items already exist in pantry.')
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
        console.error('[useAddPantryItems] Failed to add items:', {
          householdId,
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
    [householdId]
  )

  return {
    addItems,
    isLoading,
    error,
  }
}

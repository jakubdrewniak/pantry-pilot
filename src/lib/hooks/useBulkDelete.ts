import { useState, useCallback } from 'react'
import type { BulkDeleteItemsResponse } from '@/types/types'

/**
 * Return type for useBulkDelete hook
 */
export interface UseBulkDeleteReturn {
  bulkDelete: (itemIds: string[]) => Promise<BulkDeleteItemsResponse>
  isLoading: boolean
  error: Error | null
}

/**
 * useBulkDelete Hook
 *
 * Hook for deleting multiple shopping list items at once.
 *
 * Features:
 * - Deletes multiple items from shopping list
 * - Supports partial success pattern (some items may fail)
 * - Loading state management
 * - Error handling with detailed messages
 * - Returns summary of successful and failed operations
 *
 * Note: For real-time updates in the UI, the parent component should
 * listen to Supabase real-time events (DELETE).
 *
 * @param listId - UUID of the shopping list
 * @returns UseBulkDeleteReturn - bulkDelete function, loading state, and error
 */
export function useBulkDelete(listId: string | null | undefined): UseBulkDeleteReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Deletes multiple items at once
   *
   * @param itemIds - Array of item IDs to delete
   * @returns Promise with operation results (successful, failed, summary)
   * @throws Error if API call fails completely
   */
  const bulkDelete = useCallback(
    async (itemIds: string[]): Promise<BulkDeleteItemsResponse> => {
      if (!listId) {
        throw new Error('Shopping list ID is required')
      }

      if (itemIds.length === 0) {
        throw new Error('At least one item must be selected')
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/shopping-lists/${listId}/items/bulk-delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ itemIds }),
        })

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 401) {
            throw new Error('Session expired. Please log in again.')
          }

          if (response.status === 404) {
            throw new Error('Shopping list not found.')
          }

          if (response.status === 400) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || 'Invalid request.')
          }

          throw new Error(`Failed to delete items (${response.status})`)
        }

        const result: BulkDeleteItemsResponse = await response.json()

        // Log warnings if some items failed
        if (result.failed.length > 0) {
          console.warn('[useBulkDelete] Some items failed to delete:', result.failed)
        }

        setError(null)
        return result
      } catch (err) {
        console.error('[useBulkDelete] Failed to delete items:', {
          listId,
          itemIds,
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
    bulkDelete,
    isLoading,
    error,
  }
}

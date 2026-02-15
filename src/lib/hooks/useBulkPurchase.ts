import { useState, useCallback } from 'react'
import type { BulkPurchaseItemsResponse } from '@/types/types'

/**
 * Return type for useBulkPurchase hook
 */
export interface UseBulkPurchaseReturn {
  bulkPurchase: (itemIds: string[]) => Promise<BulkPurchaseItemsResponse>
  isLoading: boolean
  error: Error | null
}

/**
 * useBulkPurchase Hook
 *
 * Hook for purchasing multiple shopping list items at once with transfer to pantry.
 *
 * Features:
 * - Purchases multiple items and transfers them to pantry
 * - Supports partial success pattern (some items may fail)
 * - Loading state management
 * - Error handling with detailed messages
 * - Returns summary of successful and failed operations
 *
 * Note: For real-time updates in the UI, the parent component should
 * listen to Supabase real-time events (DELETE for purchased items).
 *
 * @param listId - UUID of the shopping list
 * @returns UseBulkPurchaseReturn - bulkPurchase function, loading state, and error
 */
export function useBulkPurchase(listId: string | null | undefined): UseBulkPurchaseReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Purchases multiple items at once
   *
   * @param itemIds - Array of item IDs to purchase
   * @returns Promise with operation results (successful, failed, summary)
   * @throws Error if API call fails completely
   */
  const bulkPurchase = useCallback(
    async (itemIds: string[]): Promise<BulkPurchaseItemsResponse> => {
      if (!listId) {
        throw new Error('Shopping list ID is required')
      }

      if (itemIds.length === 0) {
        throw new Error('At least one item must be selected')
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/shopping-lists/${listId}/items/bulk-purchase`, {
          method: 'POST',
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

          throw new Error(`Failed to purchase items (${response.status})`)
        }

        const result: BulkPurchaseItemsResponse = await response.json()

        // Log warnings if some items failed
        if (result.failed.length > 0) {
          console.warn('[useBulkPurchase] Some items failed to purchase:', result.failed)
        }

        setError(null)
        return result
      } catch (err) {
        console.error('[useBulkPurchase] Failed to purchase items:', {
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
    bulkPurchase,
    isLoading,
    error,
  }
}

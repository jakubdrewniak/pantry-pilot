import { useState, useCallback, useEffect } from 'react'
import type { PantryWithItems, UsePantryReturn } from '@/types/types'

/**
 * usePantry Hook
 *
 * Hook for fetching and managing pantry data for a specific household.
 *
 * Features:
 * - Automatic data fetching on mount and when householdId changes
 * - Manual refetch capability
 * - Error handling with user-friendly messages
 * - Loading states
 *
 * @param householdId - UUID of the household
 * @returns UsePantryReturn - pantry data, loading state, error, and refetch function
 */
export function usePantry(householdId: string | null | undefined): UsePantryReturn {
  const [pantry, setPantry] = useState<PantryWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetches pantry data from API
   */
  const fetchPantry = useCallback(async () => {
    // Don't fetch if no householdId
    if (!householdId) {
      setPantry(null)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/households/${householdId}/pantry`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.')
        }
        if (response.status === 404) {
          throw new Error('Pantry not found or you do not have access.')
        }
        if (response.status === 400) {
          throw new Error('Invalid household ID.')
        }
        throw new Error(`Failed to fetch pantry data (${response.status})`)
      }

      const data: PantryWithItems = await response.json()
      setPantry(data)
      setError(null)
    } catch (err) {
      console.error('[usePantry] Failed to fetch pantry:', {
        householdId,
        error: err,
      })

      if (err instanceof Error) {
        setError(err)
      } else {
        setError(new Error('Network error. Please check your connection.'))
      }
      setPantry(null)
    } finally {
      setIsLoading(false)
    }
  }, [householdId])

  /**
   * Manual refetch function
   */
  const refetch = useCallback(async () => {
    await fetchPantry()
  }, [fetchPantry])

  // Auto-fetch on mount and when householdId changes
  useEffect(() => {
    fetchPantry()
  }, [fetchPantry])

  return {
    pantry,
    isLoading,
    error,
    refetch,
  }
}

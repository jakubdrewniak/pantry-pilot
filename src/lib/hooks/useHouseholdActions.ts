import { useCallback } from 'react'
import type { Household, CreateHouseholdResponse } from '@/types/types'

/**
 * Hook for performing household actions
 * Encapsulates API call logic for CRUD operations
 *
 * @param householdId - Household ID
 * @param onSuccess - Callback invoked after successful operation
 * @returns Action methods
 */
export function useHouseholdActions(householdId: string | null, onSuccess: () => void) {
  /**
   * Updates household name
   * Endpoint: PATCH /api/households/{householdId}
   */
  const updateName = useCallback(
    async (name: string): Promise<void> => {
      if (!householdId) {
        throw new Error('Household ID is required')
      }

      const response = await fetch(`/api/households/${householdId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 400) {
          throw new Error(errorData.message || 'Please check the entered data')
        }
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.')
        }
        if (response.status === 403) {
          throw new Error('You do not have permission to perform this action')
        }
        if (response.status === 404) {
          throw new Error('Household not found')
        }

        throw new Error('Failed to update household name')
      }

      onSuccess()
    },
    [householdId, onSuccess]
  )

  /**
   * Creates new own household
   * Endpoint: POST /api/households
   * Note: Automatically leaves previous household
   */
  const createOwnHousehold = useCallback(
    async (name: string): Promise<Household> => {
      const response = await fetch('/api/households', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 400) {
          throw new Error(errorData.message || 'Please check the entered data')
        }
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.')
        }
        if (response.status === 409) {
          throw new Error('You already own a household')
        }

        throw new Error('Failed to create household')
      }

      const data: CreateHouseholdResponse = await response.json()
      onSuccess()
      return data
    },
    [onSuccess]
  )

  return {
    updateName,
    createOwnHousehold,
  }
}

export interface UseHouseholdActionsReturn {
  updateName: (name: string) => Promise<void>
  createOwnHousehold: (name: string) => Promise<Household>
}

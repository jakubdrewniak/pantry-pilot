import { useState, useCallback, useEffect } from 'react'
import type {
  HouseholdDashboardViewModel,
  HouseholdsListResponse,
  GetHouseholdResponse,
  HouseholdRole,
} from '@/types/types'
import { determineUserRole } from '@/lib/utils/household'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Hook for managing household dashboard data
 * Fetches user's household and its details
 *
 * @returns State and methods for managing household
 */
export function useHouseholdDashboard() {
  const { user } = useAuth()
  const [viewModel, setViewModel] = useState<HouseholdDashboardViewModel>({
    household: null,
    userRole: null,
    ownedHousehold: null,
    hasOwnHousehold: false,
    isLoading: true,
    error: null,
  })

  /**
   * Fetches user's household and its details
   */
  const fetchHousehold = useCallback(async () => {
    if (!user?.id) {
      return
    }

    setViewModel(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Step 1: Fetch user's household
      const householdsResponse = await fetch('/api/households', {
        method: 'GET',
        credentials: 'include',
      })

      if (!householdsResponse.ok) {
        if (householdsResponse.status === 401) {
          throw new Error('Unauthorized')
        }
        throw new Error('Failed to fetch household')
      }

      const householdsData: HouseholdsListResponse = await householdsResponse.json()
      const household = householdsData.data[0] ?? null
      const ownedHouseholdId = householdsData.ownedHouseholdId

      // Fetch owned household details if user owns one
      let ownedHousehold = null
      if (ownedHouseholdId && ownedHouseholdId !== household?.id) {
        try {
          const ownedResponse = await fetch(`/api/households/${ownedHouseholdId}`, {
            method: 'GET',
            credentials: 'include',
          })
          if (ownedResponse.ok) {
            ownedHousehold = await ownedResponse.json()
          }
        } catch (error) {
          console.error('[useHouseholdDashboard] Failed to fetch owned household:', error)
        }
      }

      const hasOwnHousehold = ownedHouseholdId !== null && ownedHouseholdId !== household?.id

      // If user has no household
      if (!household) {
        setViewModel({
          household: null,
          userRole: null,
          ownedHousehold,
          hasOwnHousehold,
          isLoading: false,
          error: null,
        })
        return
      }

      // Step 2: Fetch household details with members
      const detailsResponse = await fetch(`/api/households/${household.id}`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!detailsResponse.ok) {
        if (detailsResponse.status === 401) {
          throw new Error('Unauthorized')
        }
        if (detailsResponse.status === 404) {
          throw new Error('Household not found')
        }
        throw new Error('Failed to fetch household details')
      }

      const householdDetails: GetHouseholdResponse = await detailsResponse.json()

      // Step 3: Determine user's role
      const userRole: HouseholdRole = determineUserRole(householdDetails, user.id)

      setViewModel({
        household: householdDetails,
        userRole,
        ownedHousehold,
        hasOwnHousehold,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error('[useHouseholdDashboard] Failed to fetch household:', error)

      let errorMessage = 'Failed to fetch household data'
      if (error instanceof Error) {
        if (error.message === 'Unauthorized') {
          errorMessage = 'Session expired. Please log in again.'
        } else if (error.message === 'Household not found') {
          errorMessage = 'Household not found'
        }
      }

      setViewModel({
        household: null,
        userRole: null,
        ownedHousehold: null,
        hasOwnHousehold: false,
        isLoading: false,
        error: errorMessage,
      })
    }
  }, [user?.id])

  /**
   * Refreshes household data
   */
  const refresh = useCallback(async () => {
    await fetchHousehold()
  }, [fetchHousehold])

  /**
   * Optimistically updates household name without full refresh
   */
  const updateHouseholdName = useCallback((newName: string) => {
    setViewModel(prev => {
      if (!prev.household) return prev
      return {
        ...prev,
        household: {
          ...prev.household,
          name: newName,
        },
      }
    })
  }, [])

  // Initialize on mount (wait for user to be loaded)
  useEffect(() => {
    if (user?.id) {
      fetchHousehold()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return {
    viewModel,
    refresh,
    fetchHousehold,
    updateHouseholdName,
  }
}

export interface UseHouseholdDashboardReturn {
  viewModel: HouseholdDashboardViewModel
  refresh: () => Promise<void>
  fetchHousehold: () => Promise<void>
  updateHouseholdName: (newName: string) => void
}

'use client'

import { useEffect, useState } from 'react'
import type {
  InvitationWithHousehold,
  CurrentUserInvitationsResponse,
  AcceptInvitationResponse,
} from '@/types/types'

/**
 * Hook for managing received invitations for the logged-in user
 * Used in: ReceivedInvitationsList
 * Provides: list of invitations with household context, loading state, error handling, and accept functionality
 */
export function useReceivedInvitations() {
  const [invitations, setInvitations] = useState<InvitationWithHousehold[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState<number>(0)

  useEffect(() => {
    const fetchInvitations = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/invitations/current')

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized')
          }
          throw new Error('Failed to fetch invitations')
        }

        const data: CurrentUserInvitationsResponse = await response.json()
        setInvitations(data.data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load invitations list'
        setError(errorMessage)
        console.error('Failed to fetch received invitations:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitations()
  }, [refreshKey])

  const acceptInvitation = async (
    token: string
  ): Promise<{ success: boolean; householdId?: string; error?: string }> => {
    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        let errorMessage = 'Failed to accept invitation'

        // Map API errors to user-friendly messages
        switch (response.status) {
          case 400:
            errorMessage = 'This invitation has expired'
            break
          case 403:
            errorMessage = 'This invitation is not for you'
            break
          case 404:
            errorMessage = 'Invitation not found'
            break
          case 409:
            errorMessage = 'You are already a member of this household'
            break
          default:
            errorMessage = errorData.error?.message || errorMessage
        }

        return { success: false, error: errorMessage }
      }

      const data: AcceptInvitationResponse = await response.json()

      // Refresh the list after successful acceptance
      setRefreshKey(prev => prev + 1)

      return { success: true, householdId: data.membership.householdId }
    } catch (err) {
      console.error('Failed to accept invitation:', err)
      return {
        success: false,
        error: 'An unexpected error occurred while accepting the invitation',
      }
    }
  }

  return {
    invitations,
    isLoading,
    error,
    acceptInvitation,
    refresh: () => setRefreshKey(prev => prev + 1),
  }
}

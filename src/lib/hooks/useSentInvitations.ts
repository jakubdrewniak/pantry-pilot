'use client'

import { useEffect, useState } from 'react'
import type { Invitation, InvitationsListResponse } from '@/types/types'

/**
 * Hook for managing sent invitations for a household
 * Used in: SentInvitationsList
 * Provides: list of invitations, loading state, error handling, and cancel functionality
 */
export function useSentInvitations(householdId: string) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState<number>(0)

  useEffect(() => {
    if (!householdId) {
      setIsLoading(false)
      return
    }

    const fetchInvitations = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/households/${householdId}/invitations`)

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized')
          }
          if (response.status === 403) {
            throw new Error('You do not have permission to view invitations')
          }
          if (response.status === 404) {
            throw new Error('Household not found')
          }
          throw new Error('Failed to fetch invitations')
        }

        const data: InvitationsListResponse = await response.json()
        setInvitations(data.data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load invitations list'
        setError(errorMessage)
        console.error('Failed to fetch sent invitations:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitations()
  }, [householdId, refreshKey])

  const cancelInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/households/${householdId}/invitations/${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to cancel invitations')
        }
        if (response.status === 404) {
          throw new Error('Invitation not found')
        }
        throw new Error('Failed to cancel invitation')
      }

      // Refresh the list after successful deletion
      setRefreshKey(prev => prev + 1)
      return true
    } catch (err) {
      console.error('Failed to cancel invitation:', err)
      return false
    }
  }

  return {
    invitations,
    isLoading,
    error,
    cancelInvitation,
    refresh: () => setRefreshKey(prev => prev + 1),
  }
}

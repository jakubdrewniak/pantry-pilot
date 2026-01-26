'use client'

import { useEffect, useState } from 'react'
import type { CurrentUserInvitationsResponse } from '@/types/types'

/**
 * Hook for fetching pending invitations count for the logged-in user
 * Used in: InvitationNotificationBadge
 * Fetches invitations once on mount
 */
export function useInvitationNotifications() {
  const [count, setCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchInvitations = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/invitations/current')

        if (!response.ok) {
          if (response.status === 401) {
            // User is not authenticated, set count to 0
            setCount(0)
            return
          }
          throw new Error('Failed to fetch invitations')
        }

        const data: CurrentUserInvitationsResponse = await response.json()
        setCount(data.data.length)
      } catch (error) {
        console.error('Failed to fetch invitations:', error)
        setCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitations()
  }, [])

  return { count, isLoading }
}

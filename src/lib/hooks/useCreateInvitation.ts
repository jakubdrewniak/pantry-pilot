'use client'

import { useState } from 'react'
import type { Invitation, CreateInvitationResponse } from '@/types/types'

/**
 * Hook for creating a new invitation for a household
 * Used in: CreateInvitationForm
 * Provides: create function, submission state, error handling with user-friendly messages
 */
export function useCreateInvitation(householdId: string) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const createInvitation = async (
    invitedEmail: string
  ): Promise<{ success: boolean; invitation?: Invitation }> => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/households/${householdId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitedEmail }),
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Map API errors to user-friendly messages
        let errorMessage = 'Failed to send invitation'
        switch (response.status) {
          case 403:
            errorMessage = 'You do not have permission to send invitations'
            break
          case 404:
            errorMessage = 'Household not found'
            break
          case 409:
            errorMessage =
              errorData.error?.message || 'Invitation already exists or user is already a member'
            break
          case 400:
            errorMessage = 'Invalid email address format'
            break
          default:
            errorMessage = errorData.error?.message || errorMessage
        }

        setError(errorMessage)
        return { success: false }
      }

      const data: CreateInvitationResponse = await response.json()
      return { success: true, invitation: data.invitation }
    } catch (err) {
      console.error('Failed to create invitation:', err)
      setError('An error occurred while sending the invitation')
      return { success: false }
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    createInvitation,
    isSubmitting,
    error,
    clearError: () => setError(null),
  }
}

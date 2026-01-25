'use client'

import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useCreateInvitation } from '@/lib/hooks/useCreateInvitation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail } from 'lucide-react'

interface CreateInvitationFormProps {
  householdId: string
  onInvitationCreated?: () => void
}

/**
 * Form component for creating new household invitations
 * Owner-only functionality for inviting new members via email
 * Includes frontend validation and API error handling
 * Used in: HouseholdInvitationsSection
 */
export function CreateInvitationForm({
  householdId,
  onInvitationCreated,
}: CreateInvitationFormProps): JSX.Element {
  const [invitedEmail, setInvitedEmail] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const {
    createInvitation,
    isSubmitting,
    error: apiError,
    clearError,
  } = useCreateInvitation(householdId)

  // Email validation regex (RFC 5322 simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return 'Email address is required'
    }

    if (email.length > 255) {
      return 'Email address must be at most 255 characters'
    }

    if (!emailRegex.test(email)) {
      return 'Invalid email address format'
    }

    return null
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInvitedEmail(value)

    // Clear errors on change
    setValidationError(null)
    if (apiError) {
      clearError()
    }
  }

  const handleBlur = () => {
    if (invitedEmail) {
      const error = validateEmail(invitedEmail)
      setValidationError(error)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Frontend validation
    const error = validateEmail(invitedEmail)
    if (error) {
      setValidationError(error)
      return
    }

    // Normalize email (trim and lowercase)
    const normalizedEmail = invitedEmail.trim().toLowerCase()

    // Call API
    const result = await createInvitation(normalizedEmail)

    if (result.success) {
      // Clear form on success
      setInvitedEmail('')
      setValidationError(null)

      // Notify parent component
      onInvitationCreated?.()
    }
  }

  const displayError = validationError || apiError
  const hasError = Boolean(displayError)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invitedEmail">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="invitedEmail"
            type="email"
            placeholder="friend@example.com"
            value={invitedEmail}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            maxLength={255}
            className={`pl-9 ${hasError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            aria-invalid={hasError}
            aria-describedby={hasError ? 'email-error' : undefined}
          />
        </div>

        {hasError && (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {displayError}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting || !invitedEmail.trim()} className="w-full">
        {isSubmitting ? 'Sending...' : 'Send Invitation'}
      </Button>
    </form>
  )
}

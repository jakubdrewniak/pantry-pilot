import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { ErrorAlert } from '@/components/ErrorAlert'
import type { CreateHouseholdResponse } from '@/types/types'

interface ReturnOrCreateHouseholdModalProps {
  open: boolean
  currentHouseholdName: string
  hasOwnHousehold: boolean
  ownHouseholdName?: string
  onOpenChange: (open: boolean) => void
  onSuccess: (household: CreateHouseholdResponse) => void
}

/**
 * Modal for returning to own household OR creating a new one
 * - Rejoin mode: Shows household name user will return to, no input needed
 * - Create mode: Shows form to create new household with validation
 */
export function ReturnOrCreateHouseholdModal({
  open,
  currentHouseholdName,
  hasOwnHousehold,
  ownHouseholdName,
  onOpenChange,
  onSuccess,
}: ReturnOrCreateHouseholdModalProps) {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const isRejoinMode = hasOwnHousehold

  const validateName = (value: string): boolean => {
    // Skip validation in rejoin mode
    if (isRejoinMode) return true

    const trimmed = value.trim()
    if (trimmed.length === 0) {
      setValidationError('Household name is required')
      return false
    }
    if (trimmed.length < 3) {
      setValidationError('Name must be at least 3 characters')
      return false
    }
    if (trimmed.length > 50) {
      setValidationError('Name must be at most 50 characters')
      return false
    }
    setValidationError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isRejoinMode && !validateName(name)) {
      return
    }

    setIsSubmitting(true)

    try {
      const body = isRejoinMode ? {} : { name: name.trim() }

      const response = await fetch('/api/households', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to process request')
      }

      const result: CreateHouseholdResponse = await response.json()
      onSuccess(result)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      if (!newOpen) {
        // Reset form when closing
        setName('')
        setError(null)
        setValidationError(null)
      }
      onOpenChange(newOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isRejoinMode ? 'Return to Your Household' : 'Create Your Own Household'}
          </DialogTitle>
          <DialogDescription>
            {isRejoinMode
              ? 'Rejoin your household and leave the current one.'
              : 'Create a new household where you will be the owner.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <p className="text-sm">
                <strong>Warning:</strong> {isRejoinMode ? 'Returning to' : 'Creating'} your own
                household will remove you from <strong>{currentHouseholdName}</strong>.
                {!isRejoinMode && ' This action cannot be undone.'}
              </p>
            </Alert>

            {isRejoinMode && ownHouseholdName && (
              <Alert variant="default" className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <p className="text-sm">
                  You will return to: <strong>{ownHouseholdName}</strong>
                </p>
              </Alert>
            )}

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            {!isRejoinMode && (
              <div className="space-y-2">
                <Label htmlFor="new-household-name">New Household Name</Label>
                <Input
                  id="new-household-name"
                  value={name}
                  onChange={e => {
                    setName(e.target.value)
                    validateName(e.target.value)
                  }}
                  onBlur={() => validateName(name)}
                  placeholder="Enter household name"
                  disabled={isSubmitting}
                  className={validationError ? 'border-destructive' : ''}
                />
                {validationError && <p className="text-sm text-destructive">{validationError}</p>}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || (!isRejoinMode && !!validationError)}>
              {isSubmitting
                ? isRejoinMode
                  ? 'Returning...'
                  : 'Creating...'
                : isRejoinMode
                  ? 'Return to My Household'
                  : 'Create Household'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

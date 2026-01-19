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
import { ErrorAlert } from '@/components/ErrorAlert'
import type { Household } from '@/types/types'

interface EditHouseholdNameModalProps {
  open: boolean
  currentName: string
  householdId: string
  onOpenChange: (open: boolean) => void
  onSuccess: (updatedHousehold: Household) => void
}

/**
 * Modal for editing household name
 * Validates name length (3-50 characters) and handles API submission
 */
export function EditHouseholdNameModal({
  open,
  currentName,
  householdId,
  onOpenChange,
  onSuccess,
}: EditHouseholdNameModalProps) {
  const [name, setName] = useState(currentName)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const validateName = (value: string): boolean => {
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

    if (!validateName(name)) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/households/${householdId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to update household name')
      }

      const updatedHousehold: Household = await response.json()
      onSuccess(updatedHousehold)
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
        setName(currentName)
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
          <DialogTitle>Edit Household Name</DialogTitle>
          <DialogDescription>
            Change the name of your household. This will be visible to all members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            <div className="space-y-2">
              <Label htmlFor="household-name">Household Name</Label>
              <Input
                id="household-name"
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
            <Button type="submit" disabled={isSubmitting || !!validationError}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

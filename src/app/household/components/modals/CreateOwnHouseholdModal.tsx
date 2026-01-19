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
import type { Household } from '@/types/types'

interface CreateOwnHouseholdModalProps {
  open: boolean
  currentHouseholdName: string
  onOpenChange: (open: boolean) => void
  onSuccess: (newHousehold: Household) => void
}

/**
 * Modal for creating own household
 * Warns user about leaving current household
 * Validates name and handles API submission
 */
export function CreateOwnHouseholdModal({
  open,
  currentHouseholdName,
  onOpenChange,
  onSuccess,
}: CreateOwnHouseholdModalProps) {
  const [name, setName] = useState('')
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
      const response = await fetch('/api/households', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to create household')
      }

      const newHousehold: Household = await response.json()
      onSuccess(newHousehold)
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
          <DialogTitle>Create Your Own Household</DialogTitle>
          <DialogDescription>Create a new household where you will be the owner.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <p className="text-sm">
                <strong>Warning:</strong> Creating your own household will remove you from{' '}
                <strong>{currentHouseholdName}</strong>. This action cannot be undone.
              </p>
            </Alert>

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

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
              {isSubmitting ? 'Creating...' : 'Create Household'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useEffect } from 'react'
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
import { useAddPantryItems } from '@/lib/hooks/useAddPantryItems'
import type { AddItemFormData, AddItemFormErrors } from '@/types/types'
import { Loader2 } from 'lucide-react'

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  householdId: string
  onSuccess: () => void
}

/**
 * AddItemDialog Component
 *
 * Modal dialog for adding new items to pantry.
 *
 * Features:
 * - Form validation using Zod schema
 * - Inline error messages
 * - Duplicate item detection (409 from API)
 * - Loading states during submission
 * - Focus management (auto-focus on name field)
 * - Optional "Add Another" button to add multiple items
 *
 * @param open - Whether dialog is open
 * @param onOpenChange - Callback when dialog open state changes
 * @param householdId - UUID of the household
 * @param onSuccess - Callback after successful item addition
 */
export function AddItemDialog({ open, onOpenChange, householdId, onSuccess }: AddItemDialogProps) {
  const { addItems } = useAddPantryItems(householdId)

  // Form state
  const [formData, setFormData] = useState<AddItemFormData>({
    name: '',
    quantity: 1,
    unit: '',
    isSubmitting: false,
    error: null,
  })

  // Validation errors
  const [errors, setErrors] = useState<AddItemFormErrors>({})

  /**
   * Resets form to initial state
   */
  const resetForm = () => {
    setFormData({
      name: '',
      quantity: 1,
      unit: '',
      isSubmitting: false,
      error: null,
    })
    setErrors({})
  }

  /**
   * Pure validation function - returns errors object without side effects
   * This is the single source of truth for validation logic
   */
  const getValidationErrors = (): AddItemFormErrors => {
    const errors: AddItemFormErrors = {}

    // Validate name
    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      errors.name = 'Item name is required'
    } else if (trimmedName.length > 100) {
      errors.name = 'Item name must be at most 100 characters'
    }

    // Validate quantity
    if (!formData.quantity || formData.quantity <= 0) {
      errors.quantity = 'Quantity must be positive'
    }

    // Validate unit
    if (formData.unit && formData.unit.trim().length > 20) {
      errors.unit = 'Unit must be at most 20 characters'
    }

    return errors
  }

  /**
   * Checks if form is valid without side effects
   * Used for real-time button state (disabled/enabled)
   */
  const isFormValid = (): boolean => {
    return Object.keys(getValidationErrors()).length === 0
  }

  /**
   * Validates form and sets error state
   * Used on form submission to show error messages
   */
  const validateForm = (): boolean => {
    const newErrors = getValidationErrors()
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handles form submission
   */
  const handleSubmit = async (addAnother: boolean = false) => {
    // Validate form
    if (!validateForm()) {
      return
    }

    setFormData(prev => ({ ...prev, isSubmitting: true, error: null }))

    try {
      await addItems([
        {
          name: formData.name.trim(),
          quantity: formData.quantity,
          unit: formData.unit.trim() || null,
        },
      ])

      // Success
      if (addAnother) {
        // Reset form but keep dialog open
        resetForm()
        // Focus on name field
        const nameInput = document.getElementById('add-item-name') as HTMLInputElement
        nameInput?.focus()
      } else {
        // Close dialog
        onOpenChange(false)
        resetForm()
      }

      // Notify parent to refetch data
      onSuccess()
    } catch (err) {
      // Handle errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item'

      // Check if it's a duplicate error (409)
      if (errorMessage.includes('already exist')) {
        setErrors({ general: errorMessage })
      } else {
        setFormData(prev => ({ ...prev, error: errorMessage }))
      }
    } finally {
      setFormData(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  /**
   * Handles field change
   */
  const handleFieldChange = (field: keyof AddItemFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (field in errors) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field as keyof AddItemFormErrors]
        return newErrors
      })
    }
  }

  /**
   * Reset form when dialog closes
   */
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Item</DialogTitle>
          <DialogDescription>Add a new item to your pantry</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={e => {
            e.preventDefault()
            handleSubmit(false)
          }}
          className="space-y-4"
        >
          {/* General error (duplicate) */}
          {errors.general && (
            <Alert variant="warning" className="bg-yellow-50 text-yellow-900 border-yellow-200">
              {errors.general}
            </Alert>
          )}

          {/* Form error */}
          {formData.error && (
            <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
              {formData.error}
            </Alert>
          )}

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="add-item-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="add-item-name"
              type="text"
              value={formData.name}
              onChange={e => handleFieldChange('name', e.target.value)}
              disabled={formData.isSubmitting}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="e.g., Milk"
              autoFocus
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Quantity field */}
          <div className="space-y-2">
            <Label htmlFor="add-item-quantity">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="add-item-quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={formData.quantity}
              onChange={e => handleFieldChange('quantity', parseFloat(e.target.value) || 0)}
              disabled={formData.isSubmitting}
              className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && <p className="text-sm text-red-600">{errors.quantity}</p>}
          </div>

          {/* Unit field */}
          <div className="space-y-2">
            <Label htmlFor="add-item-unit">Unit</Label>
            <Input
              id="add-item-unit"
              type="text"
              value={formData.unit}
              onChange={e => handleFieldChange('unit', e.target.value)}
              disabled={formData.isSubmitting}
              className={errors.unit ? 'border-red-500' : ''}
              placeholder="e.g., liters, kg, pieces"
            />
            {errors.unit && <p className="text-sm text-red-600">{errors.unit}</p>}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={formData.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSubmit(true)}
              disabled={formData.isSubmitting || !isFormValid()}
            >
              {formData.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Another
            </Button>
            <Button type="submit" disabled={formData.isSubmitting || !isFormValid()}>
              {formData.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

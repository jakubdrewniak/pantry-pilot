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
import { useUpdatePantryItem } from '@/lib/hooks/useUpdatePantryItem'
import type { PantryItem, EditItemFormData, EditItemFormErrors } from '@/types/types'
import { Loader2 } from 'lucide-react'

interface EditItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: PantryItem | null
  pantryId: string
  onSuccess: () => void
}

/**
 * EditItemDialog Component
 *
 * Modal dialog for editing pantry item quantity and unit.
 * Item name is displayed as readonly.
 *
 * Features:
 * - Form validation (at least one field must be changed)
 * - Inline error messages
 * - Loading states during submission
 * - Focus management (auto-focus on quantity field)
 *
 * @param open - Whether dialog is open
 * @param onOpenChange - Callback when dialog open state changes
 * @param item - Item to edit (null if dialog closed)
 * @param pantryId - UUID of the pantry
 * @param onSuccess - Callback after successful item update
 */
export function EditItemDialog({
  open,
  onOpenChange,
  item,
  pantryId,
  onSuccess,
}: EditItemDialogProps) {
  const { updateItem } = useUpdatePantryItem(pantryId)

  // Form state
  const [formData, setFormData] = useState<EditItemFormData>({
    itemId: '',
    itemName: '',
    quantity: 1,
    unit: '',
    isSubmitting: false,
    error: null,
  })

  // Original values (to check if changed)
  const [originalValues, setOriginalValues] = useState<{
    quantity: number
    unit: string
  }>({
    quantity: 1,
    unit: '',
  })

  // Validation errors
  const [errors, setErrors] = useState<EditItemFormErrors>({})

  /**
   * Initialize form with item data when dialog opens
   */
  useEffect(() => {
    if (open && item) {
      const unit = item.unit || ''
      setFormData({
        itemId: item.id,
        itemName: item.name,
        quantity: item.quantity,
        unit,
        isSubmitting: false,
        error: null,
      })
      setOriginalValues({
        quantity: item.quantity,
        unit,
      })
      setErrors({})
    }
  }, [open, item])

  /**
   * Validates form data
   * Returns true if valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: EditItemFormErrors = {}

    // Validate quantity
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be positive'
    }

    // Validate unit
    if (formData.unit && formData.unit.trim().length > 20) {
      newErrors.unit = 'Unit must be at most 20 characters'
    }

    // Check if at least one field changed
    const quantityChanged = formData.quantity !== originalValues.quantity
    const unitChanged = formData.unit.trim() !== originalValues.unit

    if (!quantityChanged && !unitChanged) {
      newErrors.general = 'You must change at least one field'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      return
    }

    if (!item) {
      return
    }

    setFormData(prev => ({ ...prev, isSubmitting: true, error: null }))

    try {
      // Build update payload (only include changed fields)
      const updateData: {
        quantity?: number
        unit?: string | null
      } = {}

      if (formData.quantity !== originalValues.quantity) {
        updateData.quantity = formData.quantity
      }

      if (formData.unit.trim() !== originalValues.unit) {
        updateData.unit = formData.unit.trim() || null
      }

      await updateItem(item.id, updateData)

      // Success - close dialog
      onOpenChange(false)

      // Notify parent to refetch data
      onSuccess()
    } catch (err) {
      // Handle errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item'
      setFormData(prev => ({ ...prev, error: errorMessage }))
    } finally {
      setFormData(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  /**
   * Handles field change
   */
  const handleFieldChange = (field: keyof EditItemFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (field in errors) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field as keyof EditItemFormErrors]
        return newErrors
      })
    }
    // Clear general error when field changes
    if (errors.general) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.general
        return newErrors
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>Update the quantity and unit for this item</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General error */}
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

          {/* Item name (readonly) */}
          <div className="space-y-2">
            <Label htmlFor="edit-item-name">Item Name</Label>
            <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">
              {formData.itemName}
            </div>
          </div>

          {/* Quantity field */}
          <div className="space-y-2">
            <Label htmlFor="edit-item-quantity">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-item-quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={formData.quantity}
              onChange={e => handleFieldChange('quantity', parseFloat(e.target.value) || 0)}
              disabled={formData.isSubmitting}
              className={errors.quantity ? 'border-red-500' : ''}
              autoFocus
            />
            {errors.quantity && <p className="text-sm text-red-600">{errors.quantity}</p>}
          </div>

          {/* Unit field */}
          <div className="space-y-2">
            <Label htmlFor="edit-item-unit">Unit</Label>
            <Input
              id="edit-item-unit"
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
            <Button type="submit" disabled={formData.isSubmitting}>
              {formData.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

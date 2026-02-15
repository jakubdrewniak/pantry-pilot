'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { useAddShoppingListItems } from '@/lib/hooks/useAddShoppingListItems'
import type { AddItemFormData, AddItemFormErrors } from '@/types/types'
import { Loader2, Plus, X, ShoppingCart } from 'lucide-react'

interface AddItemFormProps {
  listId: string
  onItemsAdded: () => void
}

/**
 * AddItemForm Component
 *
 * Inline form for adding items to shopping list with batch support.
 * Users can add multiple items to a local list before submitting all at once.
 *
 * Features:
 * - Add items to local list before submission
 * - Batch submission (up to 50 items at once)
 * - Form validation
 * - Inline error messages
 * - Loading states during submission
 * - Preview of items to be added
 *
 * @param listId - UUID of the shopping list
 * @param onItemsAdded - Callback after successful items addition
 */
export function AddItemForm({ listId, onItemsAdded }: AddItemFormProps): JSX.Element {
  const { addItems, isLoading } = useAddShoppingListItems(listId)

  // Form state
  const [formData, setFormData] = useState<AddItemFormData>({
    name: '',
    quantity: 1,
    unit: '',
    itemsToAdd: [],
    isSubmitting: false,
    error: null,
  })

  // Validation errors
  const [errors, setErrors] = useState<AddItemFormErrors>({})

  /**
   * Pure validation function for current input fields
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
    if (!formData.quantity || formData.quantity < 0) {
      errors.quantity = 'Quantity must be 0 or greater'
    }

    // Validate unit
    if (formData.unit && formData.unit.trim().length > 50) {
      errors.unit = 'Unit must be at most 50 characters'
    }

    return errors
  }

  /**
   * Validates current input and sets error state
   */
  const validateCurrentInput = (): boolean => {
    const newErrors = getValidationErrors()
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Adds current input to local items list
   */
  const handleAddToList = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate current input
    if (!validateCurrentInput()) {
      return
    }

    // Check limit
    if (formData.itemsToAdd.length >= 50) {
      setErrors({ general: 'Maximum 50 items can be added at once' })
      return
    }

    // Add to local list
    const newItem = {
      name: formData.name.trim(),
      quantity: formData.quantity,
      unit: formData.unit.trim() || null,
    }

    setFormData(prev => {
      return {
        ...prev,
        itemsToAdd: [...prev.itemsToAdd, newItem],
        name: '',
        quantity: 1,
        unit: '',
      }
    })

    setErrors({})

    // Focus back on name input
    const nameInput = document.getElementById('add-item-name') as HTMLInputElement
    nameInput?.focus()
  }

  /**
   * Removes item from local list
   */
  const handleRemoveFromList = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itemsToAdd: prev.itemsToAdd.filter((_, i) => i !== index),
    }))
    setErrors({})
  }

  /**
   * Submits all items to API
   */
  const handleSubmitAll = async () => {
    if (formData.itemsToAdd.length === 0) {
      setErrors({ general: 'Please add at least one item' })
      return
    }

    setFormData(prev => ({ ...prev, isSubmitting: true, error: null }))
    setErrors({})

    try {
      await addItems(formData.itemsToAdd)

      // Success - reset form
      setFormData({
        name: '',
        quantity: 1,
        unit: '',
        itemsToAdd: [],
        isSubmitting: false,
        error: null,
      })

      // Notify parent
      onItemsAdded()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add items'
      setFormData(prev => ({ ...prev, error: errorMessage }))
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

  const isAddButtonDisabled = !formData.name.trim() || formData.itemsToAdd.length >= 50 || isLoading

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plus className="h-5 w-5" />
          Add Items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Input form */}
        <form onSubmit={handleAddToList} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Name field */}
          <div className="sm:col-span-5 space-y-1">
            <Label htmlFor="add-item-name" className="text-sm">
              Item Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="add-item-name"
              type="text"
              value={formData.name}
              onChange={e => handleFieldChange('name', e.target.value)}
              disabled={isLoading}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="e.g., Milk"
              autoComplete="off"
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Quantity field */}
          <div className="sm:col-span-3 space-y-1">
            <Label htmlFor="add-item-quantity" className="text-sm">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="add-item-quantity"
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity}
              onChange={e => handleFieldChange('quantity', parseFloat(e.target.value) || 0)}
              disabled={isLoading}
              className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && <p className="text-xs text-red-600">{errors.quantity}</p>}
          </div>

          {/* Unit field */}
          <div className="sm:col-span-3 space-y-1">
            <Label htmlFor="add-item-unit" className="text-sm">
              Unit
            </Label>
            <Input
              id="add-item-unit"
              type="text"
              value={formData.unit}
              onChange={e => handleFieldChange('unit', e.target.value)}
              disabled={isLoading}
              className={errors.unit ? 'border-red-500' : ''}
              placeholder="e.g., L, kg"
              autoComplete="off"
            />
            {errors.unit && <p className="text-xs text-red-600">{errors.unit}</p>}
          </div>

          {/* Add button */}
          <div className="sm:col-span-1 flex items-end">
            <Button
              type="submit"
              size="icon"
              disabled={isAddButtonDisabled}
              className="w-full sm:w-10"
              title="Add to list"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Items to add preview */}
        {formData.itemsToAdd.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Items to add ({formData.itemsToAdd.length}/50):
              </Label>
              <Button
                type="button"
                onClick={handleSubmitAll}
                disabled={formData.isSubmitting || formData.itemsToAdd.length === 0}
                size="sm"
              >
                {formData.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add All to List
              </Button>
            </div>

            <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto">
              {formData.itemsToAdd.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <span className="font-medium text-sm">{item.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({item.quantity} {item.unit || 'pcs'})
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFromList(index)}
                    disabled={formData.isSubmitting}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

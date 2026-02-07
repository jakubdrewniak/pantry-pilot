'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AddItemDialog,
  EditItemDialog,
  DeleteConfirmationDialog,
  PantryItemsList,
} from '@/components/pantry'
import { usePantry } from '@/lib/hooks/usePantry'
import { useHouseholdDashboard } from '@/lib/hooks/useHouseholdDashboard'
import type { PantryItem } from '@/types/types'
import { Plus } from 'lucide-react'

/**
 * PantryPage
 *
 * Main page for pantry management view.
 *
 * Features:
 * - View all items in household pantry
 * - Add new items (single or multiple)
 * - Edit item quantity and unit
 * - Delete items with confirmation
 * - Responsive design (table → cards on mobile)
 * - Loading states and error handling
 * - Empty state with call-to-action
 *
 * Integrates with:
 * - usePantry hook (fetch pantry data)
 * - useHouseholdDashboard hook (get household ID)
 * - AddItemDialog (add items)
 * - EditItemDialog (edit items)
 * - DeleteConfirmationDialog (delete items)
 * - PantryItemsList (display items)
 */
export default function PantryPage() {
  const { viewModel: householdViewModel } = useHouseholdDashboard()
  const householdId = householdViewModel.household?.id

  const { pantry, isLoading, error, refetch } = usePantry(householdId)

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<PantryItem | null>(null)

  /**
   * Handles opening edit dialog with selected item
   */
  const handleEdit = (item: PantryItem) => {
    setEditingItem(item)
  }

  /**
   * Handles opening delete dialog with selected item
   */
  const handleDelete = (item: PantryItem) => {
    setDeletingItem(item)
  }

  /**
   * Handles successful add/edit/delete - refreshes pantry data
   */
  const handleSuccess = () => {
    refetch()
  }

  /**
   * Opens add dialog
   */
  const handleAddClick = () => {
    setIsAddDialogOpen(true)
  }

  // Handle error display
  const errorMessage = error?.message || null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pantry</h1>
            <p className="text-muted-foreground mt-1">
              Manage your pantry items and keep track of what you have
            </p>
          </div>

          {/* Add Item Button */}
          <Button onClick={handleAddClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>

        {/* Pantry Items List */}
        <PantryItemsList
          items={pantry?.items || []}
          isLoading={isLoading}
          error={errorMessage}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRetry={refetch}
          onAddClick={handleAddClick}
        />

        {/* Add Item Dialog */}
        <AddItemDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          householdId={householdId || ''}
          onSuccess={handleSuccess}
        />

        {/* Edit Item Dialog */}
        <EditItemDialog
          open={editingItem !== null}
          onOpenChange={open => {
            if (!open) setEditingItem(null)
          }}
          item={editingItem}
          pantryId={pantry?.id || ''}
          onSuccess={handleSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={deletingItem !== null}
          onOpenChange={open => {
            if (!open) setDeletingItem(null)
          }}
          item={deletingItem}
          pantryId={pantry?.id || ''}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  )
}

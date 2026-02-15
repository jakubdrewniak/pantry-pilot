'use client'

import { useState, useCallback } from 'react'
import { useHouseholdDashboard } from '@/lib/hooks/useHouseholdDashboard'
import { useShoppingList } from '@/lib/hooks/useShoppingList'
import { useShoppingListRealtime } from '@/lib/hooks/useShoppingListRealtime'
import { useUpdateShoppingListItem } from '@/lib/hooks/useUpdateShoppingListItem'
import { useDeleteShoppingListItem } from '@/lib/hooks/useDeleteShoppingListItem'
import {
  ShoppingListHeader,
  AddItemForm,
  ItemsFilterBar,
  ShoppingListItems,
  EditItemDialog,
  BulkPurchaseConfirmDialog,
  BulkDeleteConfirmDialog,
} from '@/components/shopping-list'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import type { ShoppingListItem } from '@/types/types'
import { AlertCircle, Wifi, WifiOff } from 'lucide-react'

/**
 * ShoppingListPage
 *
 * Main page for shopping list management view.
 *
 * Features:
 * - View all items in household shopping list
 * - Add items (batch adding with preview)
 * - Edit item quantity and unit
 * - Mark items as purchased (transfers to pantry)
 * - Delete items
 * - Bulk operations (purchase/delete multiple items)
 * - Filter and sort items
 * - Real-time collaboration (see changes from other users instantly)
 * - Optimistic updates for better UX
 * - Responsive design (table → cards on mobile)
 *
 * Integrates with:
 * - useShoppingList hook (main state management)
 * - useShoppingListRealtime hook (real-time updates)
 * - Various operation hooks (update, delete, bulk)
 * - All shopping list components
 */
export default function ShoppingListPage(): JSX.Element {
  // Get household ID
  const { viewModel: householdViewModel } = useHouseholdDashboard()
  const householdId = householdViewModel.household?.id

  // Main shopping list state
  const {
    shoppingList,
    filteredItems,
    selectedItemIds,
    filterStatus,
    sortBy,
    isLoading,
    error,
    setFilterStatus,
    setSortBy,
    toggleSelectItem,
    clearSelection,
    refetch,
    setShoppingList,
  } = useShoppingList(householdId)

  // Operation hooks
  const { updateItem } = useUpdateShoppingListItem(shoppingList?.id)
  const { deleteItem } = useDeleteShoppingListItem(shoppingList?.id)

  // Dialog states
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null)
  const [isBulkPurchaseDialogOpen, setIsBulkPurchaseDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

  // Get selected items for dialogs
  const selectedItems = filteredItems.filter(item => selectedItemIds.includes(item.id))

  /**
   * Real-time event handlers
   */
  const handleRealtimeInsert = useCallback(
    (item: ShoppingListItem) => {
      if (!shoppingList) return

      console.log('[Real-time] Item inserted:', item.name)

      setShoppingList({
        ...shoppingList,
        items: [...shoppingList.items, item],
      })
    },
    [shoppingList, setShoppingList]
  )

  const handleRealtimeUpdate = useCallback(
    (item: ShoppingListItem) => {
      if (!shoppingList) return

      console.log('[Real-time] Item updated:', item.name)

      setShoppingList({
        ...shoppingList,
        items: shoppingList.items.map(i => (i.id === item.id ? item : i)),
      })
    },
    [shoppingList, setShoppingList]
  )

  const handleRealtimeDelete = useCallback(
    (item: ShoppingListItem) => {
      if (!shoppingList) return

      console.log('[Real-time] Item deleted:', item.name)

      setShoppingList({
        ...shoppingList,
        items: shoppingList.items.filter(i => i.id !== item.id),
      })

      // Clear from selection if deleted
      if (selectedItemIds.includes(item.id)) {
        clearSelection()
      }
    },
    [shoppingList, setShoppingList, selectedItemIds, clearSelection]
  )

  // Subscribe to real-time updates
  const { isConnected, connectionStatus } = useShoppingListRealtime(
    shoppingList?.id,
    handleRealtimeInsert,
    handleRealtimeUpdate,
    handleRealtimeDelete
  )

  /**
   * Item action handlers
   */
  const handleEditItem = (itemId: string) => {
    const item = filteredItems.find(i => i.id === itemId)
    if (item) {
      setEditingItem(item)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      // Optimistic update
      if (shoppingList) {
        setShoppingList({
          ...shoppingList,
          items: shoppingList.items.filter(i => i.id !== itemId),
        })
      }

      await deleteItem(itemId)
      console.log('[Delete] Item deleted successfully')
    } catch (err) {
      console.error('[Delete] Failed to delete item:', err)
      // Revert on error
      refetch()
    }
  }

  const handlePurchaseItem = async (itemId: string) => {
    try {
      // Optimistic update
      if (shoppingList) {
        setShoppingList({
          ...shoppingList,
          items: shoppingList.items.map(i => (i.id === itemId ? { ...i, isPurchased: true } : i)),
        })
      }

      await updateItem(itemId, { isPurchased: true })
      console.log('[Purchase] Item purchased and transferred to pantry')

      // Item will be removed via real-time DELETE event
    } catch (err) {
      console.error('[Purchase] Failed to purchase item:', err)
      // Revert on error
      refetch()
    }
  }

  /**
   * Bulk action handlers
   */
  const handleBulkPurchaseSuccess = (successCount: number, failedCount: number) => {
    console.log(`[Bulk Purchase] Success: ${successCount}, Failed: ${failedCount}`)
    clearSelection()
    refetch()
  }

  const handleBulkDeleteSuccess = (successCount: number, failedCount: number) => {
    console.log(`[Bulk Delete] Success: ${successCount}, Failed: ${failedCount}`)
    clearSelection()
    refetch()
  }

  /**
   * Dialog handlers
   */
  const handleOpenBulkPurchase = () => {
    if (selectedItemIds.length > 0) {
      setIsBulkPurchaseDialogOpen(true)
    }
  }

  const handleOpenBulkDelete = () => {
    if (selectedItemIds.length > 0) {
      setIsBulkDeleteDialogOpen(true)
    }
  }

  const handleGenerateFromRecipes = () => {
    // TODO: Implement generate from recipes dialog
    console.log('[Generate] Open generate from recipes dialog')
  }

  // Handle error display
  const errorMessage = error?.message || null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <ShoppingListHeader
          selectedItemsCount={selectedItemIds.length}
          onGenerateFromRecipes={handleGenerateFromRecipes}
          onBulkPurchase={handleOpenBulkPurchase}
          onBulkDelete={handleOpenBulkDelete}
          isLoading={isLoading}
        />

        {/* Connection Status Badge */}
        {shoppingList && (
          <div className="mb-4 flex items-center gap-2">
            <Badge
              variant={isConnected ? 'default' : 'secondary'}
              className="gap-1.5 text-xs font-normal"
            >
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  <span>Real-time updates active</span>
                </>
              ) : connectionStatus === 'connecting' ? (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>Offline mode</span>
                </>
              )}
            </Badge>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </Alert>
        )}

        {/* Add Item Form */}
        {shoppingList && (
          <div className="mb-6">
            <AddItemForm listId={shoppingList.id} onItemsAdded={refetch} />
          </div>
        )}

        {/* Filter Bar */}
        {shoppingList && !isLoading && (
          <div className="mb-6">
            <ItemsFilterBar
              filterStatus={filterStatus}
              sortBy={sortBy}
              onFilterChange={setFilterStatus}
              onSortChange={setSortBy}
              itemCount={filteredItems.length}
            />
          </div>
        )}

        {/* Shopping List Items */}
        <ShoppingListItems
          items={filteredItems}
          selectedItemIds={selectedItemIds}
          onToggleSelect={toggleSelectItem}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onPurchaseItem={handlePurchaseItem}
          isLoading={isLoading}
          variant="table"
        />

        {/* Edit Item Dialog */}
        <EditItemDialog
          open={editingItem !== null}
          onOpenChange={open => {
            if (!open) setEditingItem(null)
          }}
          item={editingItem}
          listId={shoppingList?.id || ''}
          onSuccess={refetch}
        />

        {/* Bulk Purchase Confirmation Dialog */}
        <BulkPurchaseConfirmDialog
          open={isBulkPurchaseDialogOpen}
          onOpenChange={setIsBulkPurchaseDialogOpen}
          selectedItems={selectedItems}
          listId={shoppingList?.id || ''}
          onSuccess={handleBulkPurchaseSuccess}
        />

        {/* Bulk Delete Confirmation Dialog */}
        <BulkDeleteConfirmDialog
          open={isBulkDeleteDialogOpen}
          onOpenChange={setIsBulkDeleteDialogOpen}
          selectedItems={selectedItems}
          listId={shoppingList?.id || ''}
          onSuccess={handleBulkDeleteSuccess}
        />
      </div>
    </div>
  )
}

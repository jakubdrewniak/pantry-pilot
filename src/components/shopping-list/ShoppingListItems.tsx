'use client'

import { ShoppingListItem } from './ShoppingListItem'
import { EmptyState } from '@/components/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import type { ShoppingListItem as ShoppingListItemType } from '@/types/types'
import { ShoppingCart } from 'lucide-react'

interface ShoppingListItemsProps {
  items: ShoppingListItemType[]
  selectedItemIds: string[]
  onToggleSelect: (itemId: string) => void
  onEditItem: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
  onPurchaseItem: (itemId: string) => void
  isLoading: boolean
  variant?: 'table' | 'card'
}

/**
 * ShoppingListItems Component
 *
 * Container for shopping list items. Renders items in table or card layout.
 *
 * Features:
 * - Table view (desktop) and card view (mobile)
 * - Loading skeleton
 * - Empty state when no items
 * - Passes events to parent
 *
 * @param items - Array of shopping list items
 * @param selectedItemIds - IDs of selected items
 * @param onToggleSelect - Callback when item checkbox is toggled
 * @param onEditItem - Callback when edit button is clicked
 * @param onDeleteItem - Callback when delete button is clicked
 * @param onPurchaseItem - Callback when purchase button is clicked
 * @param isLoading - Whether data is loading
 * @param variant - Display variant: 'table' or 'card'
 */
export function ShoppingListItems({
  items,
  selectedItemIds,
  onToggleSelect,
  onEditItem,
  onDeleteItem,
  onPurchaseItem,
  isLoading,
  variant = 'table',
}: ShoppingListItemsProps): JSX.Element {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  // Empty state
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="No items found"
        description="Add items to your shopping list or adjust your filters."
      />
    )
  }

  // Card view (mobile)
  if (variant === 'card') {
    return (
      <div className="space-y-3">
        {items.map(item => (
          <ShoppingListItem
            key={item.id}
            item={item}
            isSelected={selectedItemIds.includes(item.id)}
            onToggleSelect={onToggleSelect}
            onEdit={onEditItem}
            onDelete={onDeleteItem}
            onPurchase={onPurchaseItem}
            variant="card"
          />
        ))}
      </div>
    )
  }

  // Table view (desktop)
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full border-collapse">
        <thead className="bg-muted/50">
          <tr className="border-b">
            <th className="p-4 text-left w-12">
              <span className="sr-only">Select</span>
            </th>
            <th className="p-4 text-left font-semibold">Name</th>
            <th className="p-4 text-left font-semibold w-24">Quantity</th>
            <th className="p-4 text-left font-semibold w-24">Unit</th>
            <th className="p-4 text-left font-semibold w-40">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <ShoppingListItem
              key={item.id}
              item={item}
              isSelected={selectedItemIds.includes(item.id)}
              onToggleSelect={onToggleSelect}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              onPurchase={onPurchaseItem}
              variant="table"
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

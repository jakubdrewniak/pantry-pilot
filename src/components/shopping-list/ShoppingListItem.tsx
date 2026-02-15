'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import type { ShoppingListItem as ShoppingListItemType } from '@/types/types'
import { Pencil, Trash2, ShoppingCart, Check } from 'lucide-react'

interface ShoppingListItemProps {
  item: ShoppingListItemType
  isSelected: boolean
  onToggleSelect: (itemId: string) => void
  onEdit: (itemId: string) => void
  onDelete: (itemId: string) => void
  onPurchase: (itemId: string) => void
  variant?: 'table' | 'card'
}

/**
 * ShoppingListItem Component
 *
 * Displays a single shopping list item with checkbox, actions, and purchase status.
 * Memoized for performance (only re-renders when props change).
 *
 * Features:
 * - Checkbox for bulk selection
 * - Display: name, quantity, unit
 * - "Purchased" badge for purchased items
 * - Action buttons: Edit, Mark as purchased (if not purchased), Delete
 * - Two display variants: table row (desktop) and card (mobile)
 * - ARIA labels for accessibility
 *
 * @param item - Shopping list item to display
 * @param isSelected - Whether item is selected for bulk operations
 * @param onToggleSelect - Callback when checkbox is toggled
 * @param onEdit - Callback when edit button is clicked
 * @param onDelete - Callback when delete button is clicked
 * @param onPurchase - Callback when "mark as purchased" button is clicked
 * @param variant - Display variant: 'table' (default) or 'card'
 */
export const ShoppingListItem = memo(function ShoppingListItem({
  item,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onPurchase,
  variant = 'table',
}: ShoppingListItemProps) {
  const displayUnit = item.unit || 'pcs'

  if (variant === 'card') {
    // Mobile card layout
    return (
      <Card className={isSelected ? 'ring-2 ring-primary' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(item.id)}
              aria-label={`Select ${item.name}`}
              className="mt-1"
            />

            {/* Item info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base">{item.name}</h3>
                {item.isPurchased && (
                  <Badge variant="secondary" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Purchased
                  </Badge>
                )}
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Quantity:</span> {item.quantity}
                </div>
                <div>
                  <span className="font-medium">Unit:</span> {displayUnit}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(item.id)}
                aria-label={`Edit ${item.name}`}
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {!item.isPurchased && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onPurchase(item.id)}
                  aria-label={`Mark ${item.name} as purchased`}
                  className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-50"
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item.id)}
                aria-label={`Delete ${item.name}`}
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Desktop table row layout
  return (
    <tr
      className={`border-b transition-colors hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''}`}
    >
      {/* Checkbox */}
      <td className="p-4 align-middle">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(item.id)}
          aria-label={`Select ${item.name}`}
        />
      </td>

      {/* Item name */}
      <td className="p-4 align-middle">
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.name}</span>
          {item.isPurchased && (
            <Badge variant="secondary" className="text-xs">
              <Check className="h-3 w-3 mr-1" />
              Purchased
            </Badge>
          )}
        </div>
      </td>

      {/* Quantity */}
      <td className="p-4 align-middle">{item.quantity}</td>

      {/* Unit */}
      <td className="p-4 align-middle">{displayUnit}</td>

      {/* Actions */}
      <td className="p-4 align-middle">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(item.id)}
            aria-label={`Edit ${item.name}`}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {!item.isPurchased && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPurchase(item.id)}
              aria-label={`Mark ${item.name} as purchased`}
              className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-50"
              title="Mark as purchased"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(item.id)}
            aria-label={`Delete ${item.name}`}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
})

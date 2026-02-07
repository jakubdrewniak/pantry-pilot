'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { PantryItem } from '@/types/types'
import { Pencil, Trash2 } from 'lucide-react'

interface PantryItemRowProps {
  item: PantryItem
  onEdit: (item: PantryItem) => void
  onDelete: (item: PantryItem) => void
  variant?: 'table' | 'card'
}

/**
 * PantryItemRow Component
 *
 * Displays a single pantry item in either table row (desktop) or card (mobile) format.
 *
 * Features:
 * - Two display variants: table row and card
 * - Edit and delete action buttons with icons
 * - ARIA labels for accessibility
 * - Responsive design (conditionally rendered based on variant)
 *
 * @param item - Pantry item to display
 * @param onEdit - Callback when edit button is clicked
 * @param onDelete - Callback when delete button is clicked
 * @param variant - Display variant: 'table' (default) or 'card'
 */
export function PantryItemRow({ item, onEdit, onDelete, variant = 'table' }: PantryItemRowProps) {
  // Display unit or dash if null
  const displayUnit = item.unit || '-'

  if (variant === 'card') {
    // Mobile card layout
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-base">{item.name}</h3>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Quantity:</span> {item.quantity}
                </div>
                <div>
                  <span className="font-medium">Unit:</span> {displayUnit}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(item)}
                aria-label={`Edit ${item.name}`}
                className="h-9 w-9"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item)}
                aria-label={`Delete ${item.name}`}
                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
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
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="p-4 align-middle font-medium">{item.name}</td>
      <td className="p-4 align-middle">{item.quantity}</td>
      <td className="p-4 align-middle">{displayUnit}</td>
      <td className="p-4 align-middle">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(item)}
            aria-label={`Edit ${item.name}`}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(item)}
            aria-label={`Delete ${item.name}`}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

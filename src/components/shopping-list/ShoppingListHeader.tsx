'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, MoreVertical, CheckCheck, Trash2, Sparkles } from 'lucide-react'

interface ShoppingListHeaderProps {
  selectedItemsCount: number
  onGenerateFromRecipes: () => void
  onBulkPurchase: () => void
  onBulkDelete: () => void
  isLoading: boolean
}

/**
 * ShoppingListHeader Component
 *
 * Header for shopping list page with title and bulk action controls.
 *
 * Features:
 * - Page title with icon
 * - "Generate from Recipes" button
 * - Bulk actions dropdown menu (Mark as purchased, Delete selected)
 * - Badge showing count of selected items
 * - Disabled states when no items selected or loading
 *
 * @param selectedItemsCount - Number of selected items
 * @param onGenerateFromRecipes - Callback to open generate from recipes dialog
 * @param onBulkPurchase - Callback to open bulk purchase dialog
 * @param onBulkDelete - Callback to open bulk delete dialog
 * @param isLoading - Whether operations are in progress
 */
export function ShoppingListHeader({
  selectedItemsCount,
  onGenerateFromRecipes,
  onBulkPurchase,
  onBulkDelete,
  isLoading,
}: ShoppingListHeaderProps): JSX.Element {
  const hasSelection = selectedItemsCount > 0

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
          <ShoppingCart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shopping List</h1>
          <p className="text-sm text-muted-foreground">Manage your shopping items</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Generate from Recipes button */}
        <Button
          onClick={onGenerateFromRecipes}
          disabled={isLoading}
          variant="outline"
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Generate from Recipes</span>
          <span className="sm:hidden">Generate</span>
        </Button>

        {/* Bulk actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={!hasSelection || isLoading} className="gap-2">
              <MoreVertical className="h-4 w-4" />
              <span className="hidden sm:inline">Bulk Actions</span>
              {hasSelection && (
                <Badge variant="secondary" className="ml-1">
                  {selectedItemsCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onBulkPurchase} disabled={!hasSelection || isLoading}>
              <CheckCheck className="mr-2 h-4 w-4 text-green-600" />
              <span>Mark as purchased</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onBulkDelete}
              disabled={!hasSelection || isLoading}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete selected</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

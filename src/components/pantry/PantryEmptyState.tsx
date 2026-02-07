'use client'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import { ShoppingBasket } from 'lucide-react'

interface PantryEmptyStateProps {
  onAddClick: () => void
}

/**
 * PantryEmptyState Component
 *
 * Displays an empty state when the pantry has no items.
 *
 * Features:
 * - Shopping basket icon
 * - Encouraging message
 * - Call-to-action button to add first item
 *
 * @param onAddClick - Callback when "Add Item" button is clicked
 */
export function PantryEmptyState({ onAddClick }: PantryEmptyStateProps) {
  return (
    <EmptyState
      icon={ShoppingBasket}
      title="Your pantry is empty"
      description="Start adding items to keep track of what you have in your pantry"
      action={<Button onClick={onAddClick}>Add Item</Button>}
    />
  )
}

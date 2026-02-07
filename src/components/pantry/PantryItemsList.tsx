'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PantryItemRow } from './PantryItemRow'
import { PantrySkeletonLoader } from './PantrySkeletonLoader'
import { PantryEmptyState } from './PantryEmptyState'
import type { PantryItem } from '@/types/types'
import { AlertCircle } from 'lucide-react'

interface PantryItemsListProps {
  items: PantryItem[]
  isLoading: boolean
  error: string | null
  onEdit: (item: PantryItem) => void
  onDelete: (item: PantryItem) => void
  onRetry?: () => void
  onAddClick: () => void
}

/**
 * PantryItemsList Component
 *
 * Displays the list of pantry items with different states:
 * - Loading: Shows skeleton loaders
 * - Empty: Shows empty state with CTA
 * - Error: Shows error message with retry button
 * - Data: Shows list of items (table on desktop, cards on mobile)
 *
 * Features:
 * - Responsive design (table → cards on mobile)
 * - Loading skeletons
 * - Empty state with action
 * - Error handling with retry
 * - Accessible table markup
 *
 * @param items - Array of pantry items
 * @param isLoading - Whether data is loading
 * @param error - Error message (if any)
 * @param onEdit - Callback when edit button is clicked
 * @param onDelete - Callback when delete button is clicked
 * @param onRetry - Callback when retry button is clicked (optional)
 * @param onAddClick - Callback when add button is clicked in empty state
 */
export function PantryItemsList({
  items,
  isLoading,
  error,
  onEdit,
  onDelete,
  onRetry,
  onAddClick,
}: PantryItemsListProps) {
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Loading state
  if (isLoading) {
    return <PantrySkeletonLoader variant={isMobile ? 'card' : 'table'} count={5} />
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{error}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="w-fit">
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // Empty state
  if (items.length === 0) {
    return <PantryEmptyState onAddClick={onAddClick} />
  }

  // Mobile: Card layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        {items.map(item => (
          <PantryItemRow
            key={item.id}
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
            variant="card"
          />
        ))}
      </div>
    )
  }

  // Desktop: Table layout
  return (
    <div className="rounded-md border">
      <table className="w-full" role="table">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-4 text-left font-medium" scope="col">
              Name
            </th>
            <th className="p-4 text-left font-medium" scope="col">
              Quantity
            </th>
            <th className="p-4 text-left font-medium" scope="col">
              Unit
            </th>
            <th className="p-4 text-left font-medium" scope="col">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <PantryItemRow
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              variant="table"
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

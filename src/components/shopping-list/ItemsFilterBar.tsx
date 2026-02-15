'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FilterStatus, SortBy } from '@/types/types'
import { Filter, ArrowUpDown } from 'lucide-react'

/** Map of FilterStatus → label. Adding a new FilterStatus causes a compile error until this is updated. */
const FILTER_STATUS_OPTIONS: Record<FilterStatus, { value: FilterStatus; label: string }> = {
  all: { value: 'all', label: 'All items' },
  unpurchased: { value: 'unpurchased', label: 'Not purchased' },
  purchased: { value: 'purchased', label: 'Purchased' },
}

/** Map of SortBy → label. Adding a new SortBy causes a compile error until this is updated. */
const SORT_BY_OPTIONS: Record<SortBy, { value: SortBy; label: string }> = {
  name: { value: 'name', label: 'Alphabetically' },
  isPurchased: { value: 'isPurchased', label: 'Purchase status' },
}

interface ItemsFilterBarProps {
  filterStatus: FilterStatus
  sortBy: SortBy
  onFilterChange: (filter: FilterStatus) => void
  onSortChange: (sort: SortBy) => void
  itemCount: number
}

/**
 * ItemsFilterBar Component
 *
 * Toolbar for filtering and sorting shopping list items.
 *
 * Features:
 * - Filter by purchase status (all / purchased / unpurchased)
 * - Sort by name or purchase status
 * - Displays current item count
 * - Accessible labels and controls
 *
 * @param filterStatus - Current filter status
 * @param sortBy - Current sort option
 * @param onFilterChange - Callback when filter changes
 * @param onSortChange - Callback when sort changes
 * @param itemCount - Number of items currently displayed
 */
export function ItemsFilterBar({
  filterStatus,
  sortBy,
  onFilterChange,
  onSortChange,
  itemCount,
}: ItemsFilterBarProps): JSX.Element {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg border">
      {/* Item count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium">{itemCount}</span>
        <span>{itemCount === 1 ? 'item' : 'items'}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Filter by status */}
      <div className="flex items-center gap-2">
        <Label htmlFor="filter-status" className="flex items-center gap-1.5 text-sm font-medium">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filter:</span>
        </Label>
        <Select value={filterStatus} onValueChange={value => onFilterChange(value as FilterStatus)}>
          <SelectTrigger id="filter-status" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(FILTER_STATUS_OPTIONS).map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort by */}
      <div className="flex items-center gap-2">
        <Label htmlFor="sort-by" className="flex items-center gap-1.5 text-sm font-medium">
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden sm:inline">Sort:</span>
        </Label>
        <Select value={sortBy} onValueChange={value => onSortChange(value as SortBy)}>
          <SelectTrigger id="sort-by" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(SORT_BY_OPTIONS).map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

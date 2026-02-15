import { useState, useCallback, useEffect, useMemo } from 'react'
import type { ShoppingListWithItems, ShoppingListItem } from '@/types/types'

/**
 * Filter options for shopping list items
 */
export type FilterStatus = 'all' | 'purchased' | 'unpurchased'

/**
 * Sort options for shopping list items
 */
export type SortBy = 'name' | 'isPurchased'

/**
 * Return type for useShoppingList hook
 */
export interface UseShoppingListReturn {
  shoppingList: ShoppingListWithItems | null
  filteredItems: ShoppingListItem[]
  selectedItemIds: string[]
  filterStatus: FilterStatus
  sortBy: SortBy
  isLoading: boolean
  error: Error | null
  setFilterStatus: (status: FilterStatus) => void
  setSortBy: (sort: SortBy) => void
  toggleSelectItem: (itemId: string) => void
  clearSelection: () => void
  refetch: () => Promise<void>
  setShoppingList: (list: ShoppingListWithItems | null) => void
}

/**
 * useShoppingList Hook
 *
 * Main hook for managing shopping list state, filtering, sorting, and selection.
 *
 * Features:
 * - Automatic data fetching on mount and when householdId changes
 * - Real-time filtering and sorting (computed values)
 * - Item selection management for bulk operations
 * - Manual refetch capability
 * - Error handling with user-friendly messages
 * - Loading states
 *
 * @param householdId - UUID of the household
 * @returns UseShoppingListReturn - shopping list data, filtered items, selection state, and control functions
 */
export function useShoppingList(householdId: string | null | undefined): UseShoppingListReturn {
  const [shoppingList, setShoppingList] = useState<ShoppingListWithItems | null>(null)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('unpurchased')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Filtered and sorted items (computed value)
   */
  const filteredItems = useMemo(() => {
    if (!shoppingList?.items) return []

    let items = [...shoppingList.items]

    // Filter by purchase status
    if (filterStatus === 'purchased') {
      items = items.filter(item => item.isPurchased)
    } else if (filterStatus === 'unpurchased') {
      items = items.filter(item => !item.isPurchased)
    }

    // Sort items
    if (sortBy === 'name') {
      items.sort((a, b) => a.name.localeCompare(b.name, 'pl'))
    } else if (sortBy === 'isPurchased') {
      items.sort((a, b) => Number(a.isPurchased) - Number(b.isPurchased))
    }

    return items
  }, [shoppingList?.items, filterStatus, sortBy])

  /**
   * Fetches shopping list data from API
   */
  const fetchShoppingList = useCallback(async () => {
    // Don't fetch if no householdId
    if (!householdId) {
      setShoppingList(null)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/households/${householdId}/shopping-list`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.')
        }
        if (response.status === 403) {
          throw new Error('You do not have access to this shopping list.')
        }
        if (response.status === 400) {
          throw new Error('Invalid household ID.')
        }
        throw new Error(`Failed to fetch shopping list (${response.status})`)
      }

      const data: ShoppingListWithItems = await response.json()
      setShoppingList(data)
      setError(null)
    } catch (err) {
      console.error('[useShoppingList] Failed to fetch shopping list:', {
        householdId,
        error: err,
      })

      if (err instanceof Error) {
        setError(err)
      } else {
        setError(new Error('Network error. Please check your connection.'))
      }
      setShoppingList(null)
    } finally {
      setIsLoading(false)
    }
  }, [householdId])

  /**
   * Manual refetch function
   */
  const refetch = useCallback(async () => {
    await fetchShoppingList()
  }, [fetchShoppingList])

  /**
   * Toggle item selection for bulk operations
   */
  const toggleSelectItem = useCallback((itemId: string) => {
    setSelectedItemIds(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId)
      }
      return [...prev, itemId]
    })
  }, [])

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedItemIds([])
  }, [])

  // Auto-fetch on mount and when householdId changes
  useEffect(() => {
    fetchShoppingList()
  }, [fetchShoppingList])

  return {
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
  }
}

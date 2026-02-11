# Shopping Lists API - Front-end Integration Guide

Quick reference for integrating Shopping Lists API endpoints in React/Next.js front-end.

---

## 📡 API Endpoints Overview

| Method | Endpoint                                           | Purpose                     |
| ------ | -------------------------------------------------- | --------------------------- |
| GET    | `/api/households/{householdId}/shopping-list`      | Get or create shopping list |
| GET    | `/api/shopping-lists/{listId}/items`               | List items (with filters)   |
| POST   | `/api/shopping-lists/{listId}/items`               | Add multiple items          |
| PATCH  | `/api/shopping-lists/{listId}/items/{itemId}`      | Update item                 |
| DELETE | `/api/shopping-lists/{listId}/items/{itemId}`      | Delete item                 |
| POST   | `/api/shopping-lists/{listId}/items/bulk-purchase` | Purchase multiple items     |
| DELETE | `/api/shopping-lists/{listId}/items/bulk-delete`   | Delete multiple items       |

---

## 🔧 Example: Custom Hook for Shopping List

```typescript
// src/lib/hooks/useShoppingList.ts
import { useState, useEffect } from 'react'
import type { ShoppingListWithItems } from '@/types/types'

export function useShoppingList(householdId: string) {
  const [list, setList] = useState<ShoppingListWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchList() {
      try {
        const response = await fetch(`/api/households/${householdId}/shopping-list`)
        if (!response.ok) throw new Error('Failed to fetch shopping list')
        const data = await response.json()
        setList(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchList()
  }, [householdId])

  return { list, isLoading, error, refetch: () => fetchList() }
}
```

---

## 📝 Example: Add Items

```typescript
// src/lib/hooks/useAddShoppingListItems.ts
import { useState } from 'react'
import type { AddShoppingListItemsRequest, ShoppingListItem } from '@/types/types'

export function useAddShoppingListItems(listId: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const addItems = async (items: AddShoppingListItemsRequest['items']) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add items')
      }

      const data = await response.json()
      return data.items as ShoppingListItem[]
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { addItems, isLoading, error }
}
```

---

## ✏️ Example: Update Item (Purchase)

```typescript
// src/lib/hooks/useUpdateShoppingListItem.ts
import { useState } from 'react'
import type { UpdateShoppingListItemRequest, UpdateShoppingListItemResponse } from '@/types/types'

export function useUpdateShoppingListItem(listId: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateItem = async (
    itemId: string,
    updates: UpdateShoppingListItemRequest
  ): Promise<UpdateShoppingListItemResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update item')
      }

      return await response.json()
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { updateItem, isLoading, error }
}
```

---

## 🛒 Example: Bulk Purchase

```typescript
// src/lib/hooks/useBulkPurchase.ts
import { useState } from 'react'
import type { BulkPurchaseItemsResponse } from '@/types/types'

export function useBulkPurchase(listId: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const bulkPurchase = async (itemIds: string[]): Promise<BulkPurchaseItemsResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items/bulk-purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to purchase items')
      }

      const result = await response.json()

      // Show warnings if some items failed
      if (result.failed.length > 0) {
        console.warn('Some items failed to purchase:', result.failed)
      }

      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { bulkPurchase, isLoading, error }
}
```

---

## 🔄 Real-time Subscription

```typescript
// src/lib/hooks/useShoppingListRealtime.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/db/supabase.client'
import type { ShoppingListItem, RealtimePayload } from '@/types/types'

export function useShoppingListRealtime(
  listId: string,
  onInsert?: (item: ShoppingListItem) => void,
  onUpdate?: (item: ShoppingListItem) => void,
  onDelete?: (item: ShoppingListItem) => void
) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`shopping-list-${listId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shopping_list_items',
          filter: `shopping_list_id=eq.${listId}`,
        },
        (payload: RealtimePayload<ShoppingListItem>) => {
          console.log('Item inserted:', payload.new)
          onInsert?.(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shopping_list_items',
          filter: `shopping_list_id=eq.${listId}`,
        },
        (payload: RealtimePayload<ShoppingListItem>) => {
          console.log('Item updated:', payload.new)
          onUpdate?.(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'shopping_list_items',
          filter: `shopping_list_id=eq.${listId}`,
        },
        (payload: RealtimePayload<ShoppingListItem>) => {
          console.log('Item deleted:', payload.old)
          onDelete?.(payload.old)
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CHANNEL_ERROR') {
          setError(new Error('Failed to subscribe to real-time updates'))
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [listId, onInsert, onUpdate, onDelete])

  return { isConnected, error }
}
```

---

## 🎨 Example: Shopping List Component

```typescript
// src/app/shopping-list/page.tsx
'use client'

import { useState } from 'react'
import { useShoppingList } from '@/lib/hooks/useShoppingList'
import { useShoppingListRealtime } from '@/lib/hooks/useShoppingListRealtime'
import { useUpdateShoppingListItem } from '@/lib/hooks/useUpdateShoppingListItem'
import type { ShoppingListItem } from '@/types/types'

export default function ShoppingListPage({ householdId }: { householdId: string }) {
  const { list, isLoading, error, refetch } = useShoppingList(householdId)
  const { updateItem } = useUpdateShoppingListItem(list?.id || '')
  const [localItems, setLocalItems] = useState<ShoppingListItem[]>([])

  // Update local state when list loads
  useEffect(() => {
    if (list?.items) {
      setLocalItems(list.items)
    }
  }, [list])

  // Real-time subscription
  useShoppingListRealtime(
    list?.id || '',
    // onInsert
    (item) => {
      setLocalItems((prev) => [...prev, item])
    },
    // onUpdate
    (item) => {
      setLocalItems((prev) => prev.map((i) => (i.id === item.id ? item : i)))
    },
    // onDelete
    (item) => {
      setLocalItems((prev) => prev.filter((i) => i.id !== item.id))
    }
  )

  const handlePurchase = async (itemId: string) => {
    try {
      // Optimistic update
      setLocalItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, isPurchased: true } : item))
      )

      // API call
      await updateItem(itemId, { isPurchased: true })

      // Item will be removed via real-time DELETE event
    } catch (err) {
      console.error('Failed to purchase item:', err)
      // Revert optimistic update
      refetch()
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!list) return <div>No shopping list found</div>

  return (
    <div>
      <h1>Shopping List</h1>
      <ul>
        {localItems
          .filter((item) => !item.isPurchased)
          .map((item) => (
            <li key={item.id}>
              <span>{item.name}</span>
              <span>
                {item.quantity} {item.unit}
              </span>
              <button onClick={() => handlePurchase(item.id)}>Purchase</button>
            </li>
          ))}
      </ul>
    </div>
  )
}
```

---

## 🎯 Best Practices

### 1. Optimistic Updates

```typescript
// Update UI immediately, then sync with server
const handleUpdate = async (itemId: string, updates: UpdateShoppingListItemRequest) => {
  // 1. Optimistic update
  setItems(prev => prev.map(item => (item.id === itemId ? { ...item, ...updates } : item)))

  try {
    // 2. API call
    await updateItem(itemId, updates)
    // 3. Real-time event will confirm the change
  } catch (err) {
    // 4. Revert on error
    refetch()
  }
}
```

### 2. Debounce Real-time Updates

```typescript
import { debounce } from 'lodash'

const debouncedUpdate = debounce((item: ShoppingListItem) => {
  setItems(prev => prev.map(i => (i.id === item.id ? item : i)))
}, 100)

useShoppingListRealtime(listId, undefined, debouncedUpdate, undefined)
```

### 3. Handle Partial Success

```typescript
const handleBulkPurchase = async (itemIds: string[]) => {
  const result = await bulkPurchase(itemIds)

  if (result.failed.length > 0) {
    // Show toast notification
    toast.error(`${result.failed.length} items failed to purchase`)

    // Log details
    console.error('Failed items:', result.failed)
  }

  if (result.successful > 0) {
    toast.success(`${result.successful} items purchased`)
  }
}
```

### 4. Error Handling

```typescript
try {
  await addItems([{ name: 'Milk', quantity: 2 }])
} catch (err) {
  if (err.message.includes('Duplicate')) {
    toast.error('Item already exists in shopping list')
  } else if (err.message.includes('Unauthorized')) {
    router.push('/login')
  } else {
    toast.error('Failed to add item. Please try again.')
  }
}
```

---

## 📚 Type Definitions

All types are available in `src/types/types.ts`:

```typescript
import type {
  ShoppingList,
  ShoppingListWithItems,
  ShoppingListItem,
  AddShoppingListItemsRequest,
  UpdateShoppingListItemRequest,
  BulkPurchaseItemsRequest,
  BulkDeleteItemsRequest,
  GetShoppingListResponse,
  ListShoppingListItemsResponse,
  AddShoppingListItemsResponse,
  UpdateShoppingListItemResponse,
  BulkPurchaseItemsResponse,
  BulkDeleteItemsResponse,
} from '@/types/types'
```

---

## 🔐 Authentication

All endpoints use cookie-based authentication. No need to send Authorization headers - cookies are sent automatically.

If user is not authenticated, endpoints return 401 Unauthorized. Redirect to login page:

```typescript
if (response.status === 401) {
  router.push('/login')
}
```

---

## ✅ Checklist for Front-end Implementation

- [ ] Create custom hooks for all endpoints
- [ ] Implement real-time subscription
- [ ] Add optimistic updates for better UX
- [ ] Handle partial success in bulk operations
- [ ] Show loading states
- [ ] Display error messages
- [ ] Add toast notifications
- [ ] Implement debouncing for real-time updates
- [ ] Handle authentication errors (redirect to login)
- [ ] Test with multiple users (real-time collaboration)

---

**Happy coding! 🚀**

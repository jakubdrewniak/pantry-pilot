import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/db/supabase.client'
import type { ShoppingListItem, UseShoppingListRealtimeReturn } from '@/types/types'

/**
 * useShoppingListRealtime Hook
 *
 * Hook for subscribing to real-time updates on shopping list items.
 *
 * Features:
 * - Subscribes to INSERT, UPDATE, DELETE events on shopping_list_items table
 * - Filters events by shopping list ID
 * - Connection status tracking
 * - Error handling
 * - Automatic cleanup on unmount
 *
 * How it works:
 * - Supabase uses CDC (Change Data Capture) to emit events when database rows change
 * - This hook subscribes to these events and calls the provided callbacks
 * - The parent component should update local state based on these events
 *
 * Real-time collaboration:
 * - When user A adds an item, user B receives an INSERT event
 * - When user A updates an item, user B receives an UPDATE event
 * - When user A deletes an item (or purchases it), user B receives a DELETE event
 *
 * @param listId - UUID of the shopping list to subscribe to
 * @param onInsert - Callback when item is inserted
 * @param onUpdate - Callback when item is updated
 * @param onDelete - Callback when item is deleted
 * @returns UseShoppingListRealtimeReturn - connection status and error
 */
export function useShoppingListRealtime(
  listId: string | null | undefined,
  onInsert?: (item: ShoppingListItem) => void,
  onUpdate?: (item: ShoppingListItem, oldItem?: ShoppingListItem) => void,
  onDelete?: (item: ShoppingListItem) => void
): UseShoppingListRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting')
  const [error, setError] = useState<Error | null>(null)

  // Use refs to store latest callbacks to avoid subscription re-creation
  const onInsertRef = useRef(onInsert)
  const onUpdateRef = useRef(onUpdate)
  const onDeleteRef = useRef(onDelete)

  useEffect(() => {
    onInsertRef.current = onInsert
    onUpdateRef.current = onUpdate
    onDeleteRef.current = onDelete
  }, [onInsert, onUpdate, onDelete])

  useEffect(() => {
    // Don't subscribe if no list ID
    if (!listId) {
      setIsConnected(false)
      setConnectionStatus('disconnected')
      return
    }

    const supabase = createClient()

    setConnectionStatus('connecting')

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
        payload => {
          console.log('[useShoppingListRealtime] Item inserted:', payload.new)
          onInsertRef.current?.(payload.new as ShoppingListItem)
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
        payload => {
          console.log('[useShoppingListRealtime] Item updated:', payload.new)
          onUpdateRef.current?.(payload.new as ShoppingListItem, payload.old as ShoppingListItem)
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
        payload => {
          console.log('[useShoppingListRealtime] Item deleted:', payload.old)
          onDeleteRef.current?.(payload.old as ShoppingListItem)
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setConnectionStatus('connected')
          setError(null)
          console.log('[useShoppingListRealtime] Connected to real-time updates')
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setConnectionStatus('error')
          const err = new Error('Failed to connect to real-time updates')
          setError(err)
          console.error('[useShoppingListRealtime] Channel error:', err)
        } else if (status === 'CLOSED') {
          setIsConnected(false)
          setConnectionStatus('disconnected')
          console.log('[useShoppingListRealtime] Disconnected from real-time updates')
        }
      })

    // Cleanup on unmount
    return () => {
      console.log('[useShoppingListRealtime] Unsubscribing from channel')
      channel.unsubscribe()
    }
  }, [listId])

  return {
    isConnected,
    connectionStatus,
    error,
  }
}

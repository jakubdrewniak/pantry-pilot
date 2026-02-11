import type { Database } from '@/db/database.types'
import type {
  ShoppingList,
  ShoppingListWithItems,
  ShoppingListItem,
  PantryItem,
} from '@/types/types'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Type alias for Supabase client with database types
 * Used for dependency injection in service layer
 *
 * Note: This type is compatible with both:
 * - SupabaseClient from @supabase/supabase-js
 * - ReturnType of createServerClient from @supabase/ssr (used in API routes)
 */
type TypedSupabaseClient = SupabaseClient<Database>

/**
 * Custom error classes for shopping list operations
 * These errors are thrown by the service layer and mapped to HTTP status codes
 * by the route handlers.
 */

export class ShoppingListNotFoundError extends Error {
  constructor(message = 'Shopping list not found or access denied') {
    super(message)
    this.name = 'ShoppingListNotFoundError'
  }
}

export class ShoppingListItemNotFoundError extends Error {
  constructor(message = 'Shopping list item not found or access denied') {
    super(message)
    this.name = 'ShoppingListItemNotFoundError'
  }
}

export class DuplicateItemError extends Error {
  constructor(
    public duplicateNames: string[],
    message = 'Duplicate item names found'
  ) {
    super(message)
    this.name = 'DuplicateItemError'
  }
}

export class PantryNotFoundError extends Error {
  constructor(message = 'Pantry not found for household') {
    super(message)
    this.name = 'PantryNotFoundError'
  }
}

export class EmptyUpdateError extends Error {
  constructor(message = 'At least one field must be provided for update') {
    super(message)
    this.name = 'EmptyUpdateError'
  }
}

export class TransferToPantryError extends Error {
  constructor(message = 'Failed to transfer item to pantry') {
    super(message)
    this.name = 'TransferToPantryError'
  }
}

/**
 * ShoppingListService
 *
 * Business logic layer for shopping list and shopping list item operations.
 * Handles data transformation between API DTOs and database models.
 *
 * Key responsibilities:
 * - Manage shopping list CRUD operations (get or create)
 * - Handle shopping list item CRUD operations
 * - Transfer purchased items to pantry
 * - Enforce business rules (duplicate prevention, authorization)
 * - Support bulk operations (purchase, delete)
 * - Transform database records to API DTOs
 *
 * Architecture:
 * - Similar to Angular services - encapsulates business logic and data access
 * - Throws custom errors that route handlers map to HTTP status codes
 * - Uses Supabase client for database operations with RLS policies
 * - Supports real-time collaboration through CDC events (emitted automatically by Supabase)
 */
export class ShoppingListService {
  constructor(private supabase: TypedSupabaseClient) {}

  /**
   * Helper: Check if user has access to a shopping list (via household membership)
   *
   * @param listId - The shopping list UUID
   * @param userId - The user UUID
   * @returns true if user has access to shopping list, false otherwise
   *
   * Access is determined by household membership:
   * - User must be a member of the household that owns the shopping list
   */
  private async hasAccess(listId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('shopping_lists')
      .select(
        `
        id,
        households!inner (
          id,
          user_households!inner (
            user_id
          )
        )
      `
      )
      .eq('id', listId)
      .eq('households.user_households.user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[ShoppingListService] Error checking shopping list access:', error)
      return false
    }

    return data !== null
  }

  /**
   * Helper: Check for duplicate item names in shopping list (case-insensitive)
   *
   * @param listId - The shopping list UUID
   * @param names - Array of item names to check
   * @returns Array of duplicate names found in shopping list (empty if no duplicates)
   *
   * Uses lowercase comparison in application code to prevent items like
   * "Milk" and "milk" from being added as separate items.
   */
  private async checkDuplicates(listId: string, names: string[]): Promise<string[]> {
    if (names.length === 0) {
      return []
    }

    // Fetch all existing items in the shopping list
    const { data: existingItems, error } = await this.supabase
      .from('shopping_list_items')
      .select('name')
      .eq('shopping_list_id', listId)

    if (error) {
      console.error('[ShoppingListService] Error checking duplicates:', error)
      return []
    }

    if (!existingItems || existingItems.length === 0) {
      return []
    }

    // Build set of existing names (lowercase) for O(1) lookup
    const existingNamesSet = new Set(existingItems.map(item => item.name.toLowerCase()))

    // Return original names (preserving case) that have duplicates
    return names.filter(name => existingNamesSet.has(name.toLowerCase()))
  }

  /**
   * Helper: Transfer a shopping list item to pantry
   *
   * This function handles the logic of moving a purchased item to the pantry:
   * - If item already exists in pantry (case-insensitive), merge quantities
   * - If item doesn't exist, create new pantry item
   * - Delete item from shopping list
   *
   * @param item - The shopping list item to transfer
   * @param pantryId - The pantry UUID
   * @returns Created or updated PantryItem DTO
   * @throws TransferToPantryError if transfer fails
   *
   * Used by: updateItem() and bulkPurchase()
   *
   * Note: This operation should be called within a transaction context
   * to ensure atomicity (item deleted from shopping list only if pantry update succeeds).
   */
  private async transferToPantry(item: ShoppingListItem, pantryId: string): Promise<PantryItem> {
    // Check if item already exists in pantry (case-insensitive)
    const { data: existingPantryItems, error: searchError } = await this.supabase
      .from('pantry_items')
      .select('id, name, quantity, unit')
      .eq('pantry_id', pantryId)

    if (searchError) {
      console.error('[ShoppingListService] Error searching pantry items:', searchError)
      throw new TransferToPantryError('Failed to search pantry items')
    }

    // Find matching item (case-insensitive)
    const existingItem = existingPantryItems?.find(
      pantryItem => pantryItem.name.toLowerCase() === item.name.toLowerCase()
    )

    if (existingItem) {
      // Item exists - merge quantities
      const newQuantity = Number(existingItem.quantity) + item.quantity

      const { data: updatedItem, error: updateError } = await this.supabase
        .from('pantry_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select('id, name, pantry_id, quantity, unit')
        .single()

      if (updateError || !updatedItem) {
        console.error('[ShoppingListService] Error updating pantry item:', updateError)
        throw new TransferToPantryError('Failed to update pantry item')
      }

      return {
        id: updatedItem.id,
        name: updatedItem.name,
        pantryId: updatedItem.pantry_id,
        quantity: Number(updatedItem.quantity),
        unit: updatedItem.unit,
      }
    } else {
      // Item doesn't exist - create new
      const { data: newItem, error: insertError } = await this.supabase
        .from('pantry_items')
        .insert({
          pantry_id: pantryId,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
        })
        .select('id, name, pantry_id, quantity, unit')
        .single()

      if (insertError || !newItem) {
        console.error('[ShoppingListService] Error creating pantry item:', insertError)
        throw new TransferToPantryError('Failed to create pantry item')
      }

      return {
        id: newItem.id,
        name: newItem.name,
        pantryId: newItem.pantry_id,
        quantity: Number(newItem.quantity),
        unit: newItem.unit,
      }
    }
  }

  /**
   * Get or create active shopping list for a household
   *
   * @param householdId - The household UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @returns ShoppingListWithItems DTO
   * @throws ShoppingListNotFoundError if user not authorized to access household
   *
   * Used by: GET /api/households/{householdId}/shopping-list
   *
   * Business logic:
   * - Each household has one active shopping list
   * - If list doesn't exist, create it automatically
   * - Return list with all items (sorted by creation date)
   *
   * Security: User must be a member of the household to access shopping list.
   */
  async getOrCreateShoppingList(
    householdId: string,
    userId: string
  ): Promise<ShoppingListWithItems> {
    // Check if user is a member of the household
    const { data: membership, error: membershipError } = await this.supabase
      .from('user_households')
      .select('user_id')
      .eq('household_id', householdId)
      .eq('user_id', userId)
      .maybeSingle()

    if (membershipError || !membership) {
      throw new ShoppingListNotFoundError('Access denied to household')
    }

    // Try to get existing shopping list
    const { data: existingList, error: listError } = await this.supabase
      .from('shopping_lists')
      .select('id, household_id, created_at, updated_at')
      .eq('household_id', householdId)
      .maybeSingle()

    if (listError) {
      console.error('[ShoppingListService] Error fetching shopping list:', listError)
      throw new Error('Failed to fetch shopping list')
    }

    let shoppingList: ShoppingList

    if (existingList) {
      // List exists
      shoppingList = {
        id: existingList.id,
        householdId: existingList.household_id,
        createdAt: existingList.created_at,
        updatedAt: existingList.updated_at,
      }
    } else {
      // List doesn't exist - create it
      const { data: newList, error: createError } = await this.supabase
        .from('shopping_lists')
        .insert({ household_id: householdId })
        .select('id, household_id, created_at, updated_at')
        .single()

      if (createError || !newList) {
        console.error('[ShoppingListService] Error creating shopping list:', createError)
        throw new Error('Failed to create shopping list')
      }

      shoppingList = {
        id: newList.id,
        householdId: newList.household_id,
        createdAt: newList.created_at,
        updatedAt: newList.updated_at,
      }
    }

    // Get all items for the shopping list
    const { data: items, error: itemsError } = await this.supabase
      .from('shopping_list_items')
      .select('id, name, quantity, shopping_list_id, unit, is_purchased')
      .eq('shopping_list_id', shoppingList.id)
      .order('name', { ascending: true })

    if (itemsError) {
      console.error('[ShoppingListService] Error fetching shopping list items:', itemsError)
      throw new Error('Failed to fetch shopping list items')
    }

    return {
      ...shoppingList,
      items: (items || []).map(item => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity),
        shoppingListId: item.shopping_list_id,
        unit: item.unit,
        isPurchased: item.is_purchased,
      })),
    }
  }

  /**
   * List items in a shopping list with optional filtering and sorting
   *
   * @param listId - The shopping list UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @param filters - Optional filters (isPurchased)
   * @param sort - Sort field (default: 'name')
   * @returns Array of ShoppingListItem DTOs
   * @throws ShoppingListNotFoundError if list doesn't exist or user not authorized
   *
   * Used by: GET /api/shopping-lists/{listId}/items
   *
   * Security: User must have access to shopping list (via household membership).
   */
  async listItems(
    listId: string,
    userId: string,
    filters?: { isPurchased?: boolean },
    sort: 'name' | 'isPurchased' = 'name'
  ): Promise<ShoppingListItem[]> {
    // Check authorization
    if (!(await this.hasAccess(listId, userId))) {
      throw new ShoppingListNotFoundError()
    }

    // Build query
    let query = this.supabase
      .from('shopping_list_items')
      .select('id, name, quantity, shopping_list_id, unit, is_purchased')
      .eq('shopping_list_id', listId)

    // Apply filters
    if (filters?.isPurchased !== undefined) {
      query = query.eq('is_purchased', filters.isPurchased)
    }

    // Apply sorting
    const sortColumn = sort === 'isPurchased' ? 'is_purchased' : 'name'
    query = query.order(sortColumn, { ascending: true })

    const { data: items, error } = await query

    if (error) {
      console.error('[ShoppingListService] Error fetching items:', error)
      throw new Error('Failed to fetch shopping list items')
    }

    return (items || []).map(item => ({
      id: item.id,
      name: item.name,
      quantity: Number(item.quantity),
      shoppingListId: item.shopping_list_id,
      unit: item.unit,
      isPurchased: item.is_purchased,
    }))
  }

  /**
   * Add multiple items to a shopping list (batch operation)
   *
   * @param listId - The shopping list UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @param items - Array of items to add
   * @returns Array of created ShoppingListItem DTOs
   * @throws ShoppingListNotFoundError if list doesn't exist or user not authorized
   * @throws DuplicateItemError if any item name already exists (case-insensitive)
   *
   * Used by: POST /api/shopping-lists/{listId}/items
   *
   * Business rules:
   * - All items added in single transaction (atomic operation)
   * - If any duplicate found, entire batch is rejected
   * - Item names are compared case-insensitively
   * - Quantity defaults to 1 if not provided
   * - isPurchased defaults to false
   */
  async addItems(
    listId: string,
    userId: string,
    items: Array<{
      name: string
      quantity?: number
      unit?: string | null
      isPurchased?: boolean
    }>
  ): Promise<ShoppingListItem[]> {
    // Check authorization
    if (!(await this.hasAccess(listId, userId))) {
      throw new ShoppingListNotFoundError()
    }

    // Check for duplicates (case-insensitive)
    const itemNames = items.map(item => item.name)
    const duplicates = await this.checkDuplicates(listId, itemNames)

    if (duplicates.length > 0) {
      throw new DuplicateItemError(
        duplicates,
        `Items already exist in shopping list: ${duplicates.join(', ')}`
      )
    }

    // Prepare items for insertion
    const itemsToInsert = items.map(item => ({
      shopping_list_id: listId,
      name: item.name,
      quantity: item.quantity ?? 1,
      unit: item.unit ?? null,
      is_purchased: item.isPurchased ?? false,
    }))

    // Insert all items in single operation
    const { data: insertedItems, error: insertError } = await this.supabase
      .from('shopping_list_items')
      .insert(itemsToInsert)
      .select('id, name, quantity, shopping_list_id, unit, is_purchased')

    if (insertError || !insertedItems) {
      console.error('[ShoppingListService] Error inserting items:', insertError)
      throw new Error('Failed to add items to shopping list')
    }

    return insertedItems.map(item => ({
      id: item.id,
      name: item.name,
      quantity: Number(item.quantity),
      shoppingListId: item.shopping_list_id,
      unit: item.unit,
      isPurchased: item.is_purchased,
    }))
  }

  /**
   * Update a shopping list item (quantity, unit, or purchase status)
   *
   * @param listId - The shopping list UUID
   * @param itemId - The item UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @param updates - Object with fields to update
   * @returns Object with updated item and optional pantryItem (if purchased)
   * @throws ShoppingListNotFoundError if list doesn't exist or user not authorized
   * @throws ShoppingListItemNotFoundError if item doesn't exist
   * @throws EmptyUpdateError if no fields provided for update
   *
   * Used by: PATCH /api/shopping-lists/{listId}/items/{itemId}
   *
   * Business logic:
   * - If isPurchased is set to true, item is transferred to pantry and deleted from shopping list
   * - If only quantity/unit updated, item remains in shopping list
   * - At least one field must be provided
   *
   * Security: User must have access to shopping list (via household membership).
   */
  async updateItem(
    listId: string,
    itemId: string,
    userId: string,
    updates: { quantity?: number; unit?: string | null; isPurchased?: boolean }
  ): Promise<{ item: ShoppingListItem; pantryItem?: PantryItem }> {
    // Check authorization
    if (!(await this.hasAccess(listId, userId))) {
      throw new ShoppingListNotFoundError()
    }

    // Validate at least one field is being updated
    if (
      updates.quantity === undefined &&
      updates.unit === undefined &&
      updates.isPurchased === undefined
    ) {
      throw new EmptyUpdateError()
    }

    // Get existing item
    const { data: existingItem, error: fetchError } = await this.supabase
      .from('shopping_list_items')
      .select('id, name, quantity, shopping_list_id, unit, is_purchased')
      .eq('id', itemId)
      .eq('shopping_list_id', listId)
      .maybeSingle()

    if (fetchError || !existingItem) {
      throw new ShoppingListItemNotFoundError()
    }

    // If isPurchased is true, transfer to pantry and delete from shopping list
    if (updates.isPurchased === true) {
      // Get pantry for household
      const { data: shoppingList, error: listError } = await this.supabase
        .from('shopping_lists')
        .select('household_id')
        .eq('id', listId)
        .single()

      if (listError || !shoppingList) {
        throw new ShoppingListNotFoundError()
      }

      const { data: pantry, error: pantryError } = await this.supabase
        .from('pantries')
        .select('id')
        .eq('household_id', shoppingList.household_id)
        .single()

      if (pantryError || !pantry) {
        throw new PantryNotFoundError()
      }

      // Create item DTO for transfer
      const itemToTransfer: ShoppingListItem = {
        id: existingItem.id,
        name: existingItem.name,
        quantity: updates.quantity ?? Number(existingItem.quantity),
        shoppingListId: existingItem.shopping_list_id,
        unit: updates.unit !== undefined ? updates.unit : existingItem.unit,
        isPurchased: true,
      }

      // Transfer to pantry
      const pantryItem = await this.transferToPantry(itemToTransfer, pantry.id)

      // Delete from shopping list
      const { error: deleteError } = await this.supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId)
        .eq('shopping_list_id', listId)

      if (deleteError) {
        console.error('[ShoppingListService] Error deleting item after transfer:', deleteError)
        throw new Error('Failed to delete item from shopping list')
      }

      // Return the item as it was before deletion (with updated values) and pantryItem
      return {
        item: itemToTransfer,
        pantryItem,
      }
    } else {
      // Regular update (quantity, unit)
      const updateData: {
        quantity?: number
        unit?: string | null
      } = {}

      if (updates.quantity !== undefined) {
        updateData.quantity = updates.quantity
      }
      if (updates.unit !== undefined) {
        updateData.unit = updates.unit
      }

      const { data: updatedItem, error: updateError } = await this.supabase
        .from('shopping_list_items')
        .update(updateData)
        .eq('id', itemId)
        .eq('shopping_list_id', listId)
        .select('id, name, quantity, shopping_list_id, unit, is_purchased')
        .maybeSingle()

      if (updateError || !updatedItem) {
        console.error('[ShoppingListService] Error updating item:', updateError)
        throw new Error('Failed to update item')
      }

      return {
        item: {
          id: updatedItem.id,
          name: updatedItem.name,
          quantity: Number(updatedItem.quantity),
          shoppingListId: updatedItem.shopping_list_id,
          unit: updatedItem.unit,
          isPurchased: updatedItem.is_purchased,
        },
      }
    }
  }

  /**
   * Delete a shopping list item
   *
   * @param listId - The shopping list UUID
   * @param itemId - The item UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @throws ShoppingListNotFoundError if list doesn't exist or user not authorized
   * @throws ShoppingListItemNotFoundError if item doesn't exist
   *
   * Used by: DELETE /api/shopping-lists/{listId}/items/{itemId}
   *
   * Security: User must have access to shopping list (via household membership).
   */
  async deleteItem(listId: string, itemId: string, userId: string): Promise<void> {
    // Check authorization
    if (!(await this.hasAccess(listId, userId))) {
      throw new ShoppingListNotFoundError()
    }

    // Delete item
    const { error, count } = await this.supabase
      .from('shopping_list_items')
      .delete({ count: 'exact' })
      .eq('id', itemId)
      .eq('shopping_list_id', listId)

    if (error) {
      console.error('[ShoppingListService] Error deleting item:', error)
      throw new Error('Failed to delete item')
    }

    // Check if item was actually deleted
    if (count === 0) {
      throw new ShoppingListItemNotFoundError()
    }
  }

  /**
   * Bulk purchase items (mark as purchased and transfer to pantry)
   *
   * @param listId - The shopping list UUID
   * @param itemIds - Array of item UUIDs to purchase
   * @param userId - The authenticated user's UUID (for authorization)
   * @returns Object with purchased, transferred, failed arrays and summary
   * @throws ShoppingListNotFoundError if list doesn't exist or user not authorized
   *
   * Used by: POST /api/shopping-lists/{listId}/items/bulk-purchase
   *
   * Business logic:
   * - Each item processed independently (partial success pattern)
   * - Items transferred to pantry and deleted from shopping list
   * - If item already purchased or doesn't exist, added to failed array
   * - Returns detailed results for each item
   *
   * Security: User must have access to shopping list (via household membership).
   */
  async bulkPurchase(
    listId: string,
    itemIds: string[],
    userId: string
  ): Promise<{
    purchased: string[]
    transferred: Array<{ itemId: string; pantryItemId: string }>
    failed: Array<{ itemId: string; reason: string }>
    summary: { total: number; successful: number; failed: number }
  }> {
    // Check authorization
    if (!(await this.hasAccess(listId, userId))) {
      throw new ShoppingListNotFoundError()
    }

    // Get pantry for household
    const { data: shoppingList, error: listError } = await this.supabase
      .from('shopping_lists')
      .select('household_id')
      .eq('id', listId)
      .single()

    if (listError || !shoppingList) {
      throw new ShoppingListNotFoundError()
    }

    const { data: pantry, error: pantryError } = await this.supabase
      .from('pantries')
      .select('id')
      .eq('household_id', shoppingList.household_id)
      .single()

    if (pantryError || !pantry) {
      throw new PantryNotFoundError()
    }

    const purchased: string[] = []
    const transferred: Array<{ itemId: string; pantryItemId: string }> = []
    const failed: Array<{ itemId: string; reason: string }> = []

    // Process each item independently
    for (const itemId of itemIds) {
      try {
        // Get item
        const { data: item, error: fetchError } = await this.supabase
          .from('shopping_list_items')
          .select('id, name, quantity, shopping_list_id, unit, is_purchased')
          .eq('id', itemId)
          .eq('shopping_list_id', listId)
          .maybeSingle()

        if (fetchError || !item) {
          failed.push({ itemId, reason: 'Item not found' })
          continue
        }

        if (item.is_purchased) {
          failed.push({ itemId, reason: 'Item already purchased' })
          continue
        }

        // Transfer to pantry
        const itemDTO: ShoppingListItem = {
          id: item.id,
          name: item.name,
          quantity: Number(item.quantity),
          shoppingListId: item.shopping_list_id,
          unit: item.unit,
          isPurchased: item.is_purchased,
        }

        const pantryItem = await this.transferToPantry(itemDTO, pantry.id)

        // Delete from shopping list
        const { error: deleteError } = await this.supabase
          .from('shopping_list_items')
          .delete()
          .eq('id', itemId)
          .eq('shopping_list_id', listId)

        if (deleteError) {
          failed.push({ itemId, reason: 'Failed to delete from shopping list' })
          continue
        }

        purchased.push(itemId)
        transferred.push({ itemId, pantryItemId: pantryItem.id })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        failed.push({ itemId, reason: errorMessage })
      }
    }

    return {
      purchased,
      transferred,
      failed,
      summary: {
        total: itemIds.length,
        successful: purchased.length,
        failed: failed.length,
      },
    }
  }

  /**
   * Bulk delete items from shopping list
   *
   * @param listId - The shopping list UUID
   * @param itemIds - Array of item UUIDs to delete
   * @param userId - The authenticated user's UUID (for authorization)
   * @returns Object with deleted, failed arrays and summary
   * @throws ShoppingListNotFoundError if list doesn't exist or user not authorized
   *
   * Used by: DELETE /api/shopping-lists/{listId}/items/bulk-delete
   *
   * Business logic:
   * - Each item processed independently (partial success pattern)
   * - If item doesn't exist, added to failed array
   * - Returns detailed results for each item
   *
   * Security: User must have access to shopping list (via household membership).
   */
  async bulkDelete(
    listId: string,
    itemIds: string[],
    userId: string
  ): Promise<{
    deleted: string[]
    failed: Array<{ itemId: string; reason: string }>
    summary: { total: number; successful: number; failed: number }
  }> {
    // Check authorization
    if (!(await this.hasAccess(listId, userId))) {
      throw new ShoppingListNotFoundError()
    }

    const deleted: string[] = []
    const failed: Array<{ itemId: string; reason: string }> = []

    // Process each item independently
    for (const itemId of itemIds) {
      try {
        const { error, count } = await this.supabase
          .from('shopping_list_items')
          .delete({ count: 'exact' })
          .eq('id', itemId)
          .eq('shopping_list_id', listId)

        if (error) {
          failed.push({ itemId, reason: 'Database error' })
          continue
        }

        if (count === 0) {
          failed.push({ itemId, reason: 'Item not found' })
          continue
        }

        deleted.push(itemId)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        failed.push({ itemId, reason: errorMessage })
      }
    }

    return {
      deleted,
      failed,
      summary: {
        total: itemIds.length,
        successful: deleted.length,
        failed: failed.length,
      },
    }
  }
}

import type { Database } from '@/db/database.types'
import type { Pantry, PantryWithItems, PantryItem } from '@/types/types'
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
 * Custom error classes for pantry operations
 * These errors are thrown by the service layer and mapped to HTTP status codes
 * by the route handlers.
 */

export class PantryNotFoundError extends Error {
  constructor(message = 'Pantry not found or access denied') {
    super(message)
    this.name = 'PantryNotFoundError'
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

export class ItemNotFoundError extends Error {
  constructor(message = 'Item not found or access denied') {
    super(message)
    this.name = 'ItemNotFoundError'
  }
}

export class EmptyUpdateError extends Error {
  constructor(message = 'At least one field must be provided for update') {
    super(message)
    this.name = 'EmptyUpdateError'
  }
}

/**
 * PantryService
 *
 * Business logic layer for pantry and pantry item operations.
 * Handles data transformation between API DTOs and database models.
 *
 * Key responsibilities:
 * - Manage pantry CRUD operations
 * - Handle pantry item CRUD operations
 * - Enforce business rules (duplicate prevention, authorization)
 * - Transform database records to API DTOs
 *
 * Architecture:
 * - Similar to Angular services - encapsulates business logic and data access
 * - Throws custom errors that route handlers map to HTTP status codes
 * - Uses Supabase client for database operations with RLS policies
 */
export class PantryService {
  constructor(private supabase: TypedSupabaseClient) {}

  /**
   * Helper: Check if user has access to a pantry (via household membership)
   *
   * @param pantryId - The pantry UUID
   * @param userId - The user UUID
   * @returns true if user has access to pantry, false otherwise
   *
   * Access is determined by household membership:
   * - User must be a member of the household that owns the pantry
   */
  private async hasAccess(pantryId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('pantries')
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
      .eq('id', pantryId)
      .eq('households.user_households.user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[PantryService] Error checking pantry access:', error)
      return false
    }

    return data !== null
  }

  /**
   * Helper: Get pantry for a household with authorization check
   *
   * @param householdId - The household UUID
   * @param userId - The user UUID
   * @returns Pantry record
   * @throws PantryNotFoundError if pantry doesn't exist or user not authorized
   *
   * Security: Returns same error for both "not found" and "unauthorized"
   * to prevent information leakage.
   */
  private async getPantryByHouseholdId(householdId: string, userId: string): Promise<Pantry> {
    // First check if user is a member of the household
    const { data: membership, error: membershipError } = await this.supabase
      .from('user_households')
      .select('user_id')
      .eq('household_id', householdId)
      .eq('user_id', userId)
      .maybeSingle()

    if (membershipError || !membership) {
      throw new PantryNotFoundError()
    }

    // Get pantry for household
    const { data: pantry, error: pantryError } = await this.supabase
      .from('pantries')
      .select('id, household_id, created_at')
      .eq('household_id', householdId)
      .maybeSingle()

    if (pantryError || !pantry) {
      throw new PantryNotFoundError()
    }

    return {
      id: pantry.id,
      householdId: pantry.household_id,
      createdAt: pantry.created_at,
    }
  }

  /**
   * Helper: Check for duplicate item names (case-insensitive)
   *
   * @param pantryId - The pantry UUID
   * @param names - Array of item names to check
   * @returns Array of duplicate names found in pantry (empty if no duplicates)
   *
   * Uses lowercase comparison in application code to prevent items like
   * "Rice" and "rice" from being added as separate items.
   *
   * Note: We fetch all items from pantry and compare in code rather than
   * using database functions because Supabase JS client doesn't support
   * LOWER() in WHERE clauses directly. This is acceptable for pantries
   * with reasonable item counts (typically < 1000 items).
   */
  private async checkDuplicates(pantryId: string, names: string[]): Promise<string[]> {
    if (names.length === 0) {
      return []
    }

    // Fetch all existing items in the pantry
    // Note: We select only 'name' to minimize data transfer
    const { data: existingItems, error } = await this.supabase
      .from('pantry_items')
      .select('name')
      .eq('pantry_id', pantryId)

    if (error) {
      console.error('[PantryService] Error checking duplicates:', error)
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
   * Get pantry with all items for a household
   *
   * @param householdId - The household UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @returns Pantry DTO with items array
   * @throws PantryNotFoundError if pantry doesn't exist or user not authorized
   *
   * Used by: GET /api/households/{householdId}/pantry
   *
   * Security: User must be a member of the household to access pantry.
   */
  async getPantryByHousehold(householdId: string, userId: string): Promise<PantryWithItems> {
    // Get pantry with authorization check
    const pantry = await this.getPantryByHouseholdId(householdId, userId)

    // Get all items for the pantry
    const { data: items, error: itemsError } = await this.supabase
      .from('pantry_items')
      .select('id, name, pantry_id, quantity, unit')
      .eq('pantry_id', pantry.id)
      .order('name', { ascending: true })

    if (itemsError) {
      console.error('[PantryService] Error fetching pantry items:', itemsError)
      throw new Error('Failed to fetch pantry items')
    }

    return {
      ...pantry,
      items: (items || []).map(item => ({
        id: item.id,
        name: item.name,
        pantryId: item.pantry_id,
        quantity: Number(item.quantity),
        unit: item.unit,
      })),
    }
  }

  /**
   * Add multiple items to a pantry (batch operation)
   *
   * @param householdId - The household UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @param items - Array of items to add
   * @returns Array of created PantryItem DTOs
   * @throws PantryNotFoundError if pantry doesn't exist or user not authorized
   * @throws DuplicateItemError if any item name already exists (case-insensitive)
   *
   * Used by: POST /api/households/{householdId}/pantry/items
   *
   * Business rules:
   * - All items added in single transaction (atomic operation)
   * - If any duplicate found, entire batch is rejected
   * - Item names are compared case-insensitively
   * - Quantity defaults to 1 if not provided
   * - Unit can be null
   */
  async addItems(
    householdId: string,
    userId: string,
    items: Array<{ name: string; quantity?: number; unit?: string | null }>
  ): Promise<PantryItem[]> {
    // Get pantry with authorization check
    const pantry = await this.getPantryByHouseholdId(householdId, userId)

    // Check for duplicates (case-insensitive)
    const itemNames = items.map(item => item.name)
    const duplicates = await this.checkDuplicates(pantry.id, itemNames)

    if (duplicates.length > 0) {
      throw new DuplicateItemError(
        duplicates,
        `Items already exist in pantry: ${duplicates.join(', ')}`
      )
    }

    // Prepare items for insertion
    const itemsToInsert = items.map(item => ({
      pantry_id: pantry.id,
      name: item.name,
      quantity: item.quantity ?? 1,
      unit: item.unit ?? null,
    }))

    // Insert all items in single operation
    const { data: insertedItems, error: insertError } = await this.supabase
      .from('pantry_items')
      .insert(itemsToInsert)
      .select('id, name, pantry_id, quantity, unit')

    if (insertError || !insertedItems) {
      console.error('[PantryService] Error inserting items:', insertError)
      throw new Error('Failed to add items to pantry')
    }

    return insertedItems.map(item => ({
      id: item.id,
      name: item.name,
      pantryId: item.pantry_id,
      quantity: Number(item.quantity),
      unit: item.unit,
    }))
  }

  /**
   * List all items in a specific pantry
   *
   * @param pantryId - The pantry UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @returns Array of PantryItem DTOs
   * @throws PantryNotFoundError if pantry doesn't exist or user not authorized
   *
   * Used by: GET /api/pantries/{pantryId}/items
   *
   * Security: User must have access to pantry (via household membership).
   */
  async listItems(pantryId: string, userId: string): Promise<PantryItem[]> {
    // Check authorization
    if (!(await this.hasAccess(pantryId, userId))) {
      throw new PantryNotFoundError()
    }

    // Get all items for the pantry
    const { data: items, error } = await this.supabase
      .from('pantry_items')
      .select('id, name, pantry_id, quantity, unit')
      .eq('pantry_id', pantryId)
      .order('name', { ascending: true })

    if (error) {
      console.error('[PantryService] Error fetching items:', error)
      throw new Error('Failed to fetch pantry items')
    }

    return (items || []).map(item => ({
      id: item.id,
      name: item.name,
      pantryId: item.pantry_id,
      quantity: Number(item.quantity),
      unit: item.unit,
    }))
  }

  /**
   * Update quantity or unit for a specific item
   *
   * @param pantryId - The pantry UUID
   * @param itemId - The item UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @param updates - Object with quantity and/or unit to update
   * @returns Updated PantryItem DTO
   * @throws PantryNotFoundError if pantry doesn't exist or user not authorized
   * @throws ItemNotFoundError if item doesn't exist
   * @throws EmptyUpdateError if no fields provided for update
   *
   * Used by: PATCH /api/pantries/{pantryId}/items/{itemId}
   *
   * Security: User must have access to pantry (via household membership).
   * At least one field (quantity or unit) must be provided.
   */
  async updateItem(
    pantryId: string,
    itemId: string,
    userId: string,
    updates: { quantity?: number; unit?: string | null }
  ): Promise<PantryItem> {
    // Check authorization
    if (!(await this.hasAccess(pantryId, userId))) {
      throw new PantryNotFoundError()
    }

    // Validate at least one field is being updated
    if (updates.quantity === undefined && updates.unit === undefined) {
      throw new EmptyUpdateError()
    }

    // Build update object with only provided fields
    const updateData: { quantity?: number; unit?: string | null } = {}
    if (updates.quantity !== undefined) {
      updateData.quantity = updates.quantity
    }
    if (updates.unit !== undefined) {
      updateData.unit = updates.unit
    }

    // Update item
    const { data: updatedItem, error } = await this.supabase
      .from('pantry_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('pantry_id', pantryId)
      .select('id, name, pantry_id, quantity, unit')
      .maybeSingle()

    if (error) {
      console.error('[PantryService] Error updating item:', error)
      throw new Error('Failed to update item')
    }

    if (!updatedItem) {
      throw new ItemNotFoundError()
    }

    return {
      id: updatedItem.id,
      name: updatedItem.name,
      pantryId: updatedItem.pantry_id,
      quantity: Number(updatedItem.quantity),
      unit: updatedItem.unit,
    }
  }

  /**
   * Delete a specific item from the pantry
   *
   * @param pantryId - The pantry UUID
   * @param itemId - The item UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @throws PantryNotFoundError if pantry doesn't exist or user not authorized
   * @throws ItemNotFoundError if item doesn't exist
   *
   * Used by: DELETE /api/pantries/{pantryId}/items/{itemId}
   *
   * Security: User must have access to pantry (via household membership).
   */
  async deleteItem(pantryId: string, itemId: string, userId: string): Promise<void> {
    // Check authorization
    if (!(await this.hasAccess(pantryId, userId))) {
      throw new PantryNotFoundError()
    }

    // Delete item
    const { error, count } = await this.supabase
      .from('pantry_items')
      .delete({ count: 'exact' })
      .eq('id', itemId)
      .eq('pantry_id', pantryId)

    if (error) {
      console.error('[PantryService] Error deleting item:', error)
      throw new Error('Failed to delete item')
    }

    // Check if item was actually deleted
    if (count === 0) {
      throw new ItemNotFoundError()
    }
  }
}

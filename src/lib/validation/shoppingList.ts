import { z } from 'zod'

/**
 * Validation schemas for shopping list management.
 *
 * These schemas validate:
 * - Shopping list item creation and updates
 * - Bulk operations (purchase, delete)
 * - UUID validation for list and item IDs
 * - Query parameters for filtering and sorting
 *
 * Used by both API routes and service layer for consistent validation.
 */

/**
 * UUID v4 validation schema
 *
 * Validates that a string is a valid UUID v4 format.
 * Used for validating household, list, and item IDs in route parameters.
 */
export const UUIDSchema = z.string().uuid('Invalid UUID format')

/**
 * Path parameter validation schemas
 */
export const householdIdParamSchema = z.object({
  householdId: z.string().uuid('Invalid household ID format'),
})

export const listIdParamSchema = z.object({
  listId: z.string().uuid('Invalid list ID format'),
})

export const itemIdParamSchema = z.object({
  itemId: z.string().uuid('Invalid item ID format'),
})

/**
 * Query parameters for listing shopping list items
 *
 * Rules:
 * - isPurchased: optional boolean filter (string 'true'/'false' converted to boolean)
 * - sort: optional sort field, defaults to 'name'
 *   Allowed values: 'name', 'isPurchased'
 *
 * Used for: GET /api/shopping-lists/{listId}/items
 *
 * Note: 'createdAt' is not available because shopping_list_items table doesn't have timestamp columns
 */
export const listItemsQuerySchema = z.object({
  isPurchased: z
    .enum(['true', 'false'])
    .optional()
    .transform(val => val === 'true'),
  sort: z.enum(['name', 'isPurchased']).optional().default('name'),
})

/**
 * Single shopping list item input validation schema
 *
 * Rules:
 * - name: string, trimmed, min 1 character (required)
 * - quantity: number >= 0, defaults to 1 (optional)
 * - unit: string, trimmed, nullable (optional)
 * - isPurchased: boolean, defaults to false (optional)
 *
 * Used internally by addItemsSchema for batch validation.
 */
const ShoppingListItemInputSchema = z.object({
  name: z.string().trim().min(1, 'Item name cannot be empty'),
  quantity: z.number().min(0, 'Quantity must be non-negative').optional().default(1),
  unit: z.string().trim().optional().nullable(),
  isPurchased: z.boolean().optional().default(false),
})

/**
 * Add shopping list items batch validation schema
 *
 * Rules:
 * - items: array of ShoppingListItemInputSchema, min 1, max 50 items
 *
 * Used for: POST /api/shopping-lists/{listId}/items
 *
 * Batch limit prevents performance issues and ensures reasonable request sizes.
 */
export const addItemsSchema = z.object({
  items: z
    .array(ShoppingListItemInputSchema)
    .min(1, 'At least one item required')
    .max(50, 'Maximum 50 items allowed'),
})

/**
 * Update shopping list item validation schema
 *
 * Rules:
 * - quantity: number >= 0 (optional)
 * - unit: string, nullable (optional)
 * - isPurchased: boolean (optional)
 * - At least one field must be provided (refined validation)
 *
 * Used for: PATCH /api/shopping-lists/{listId}/items/{itemId}
 *
 * The refine ensures that at least one field is being updated.
 * When isPurchased is set to true, the item is automatically transferred to pantry.
 */
export const updateItemSchema = z
  .object({
    quantity: z.number().min(0, 'Quantity must be non-negative').optional(),
    unit: z.string().trim().optional().nullable(),
    isPurchased: z.boolean().optional(),
  })
  .refine(
    data =>
      data.quantity !== undefined || data.unit !== undefined || data.isPurchased !== undefined,
    'At least one field must be provided'
  )

/**
 * Bulk purchase items validation schema
 *
 * Rules:
 * - itemIds: array of UUID strings, min 1, max 50 items
 *
 * Used for: POST /api/shopping-lists/{listId}/items/bulk-purchase
 *
 * Marks multiple items as purchased and transfers them to pantry.
 */
export const bulkPurchaseSchema = z.object({
  itemIds: z
    .array(z.string().uuid('Invalid item ID format'))
    .min(1, 'At least one item required')
    .max(50, 'Maximum 50 items allowed'),
})

/**
 * Bulk delete items validation schema
 *
 * Rules:
 * - itemIds: array of UUID strings, min 1, max 100 items
 *
 * Used for: DELETE /api/shopping-lists/{listId}/items/bulk-delete
 *
 * Higher limit than bulk purchase as deletion is simpler operation.
 */
export const bulkDeleteSchema = z.object({
  itemIds: z
    .array(z.string().uuid('Invalid item ID format'))
    .min(1, 'At least one item required')
    .max(100, 'Maximum 100 items allowed'),
})

// TypeScript types inferred from schemas
export type HouseholdIdParam = z.infer<typeof householdIdParamSchema>
export type ListIdParam = z.infer<typeof listIdParamSchema>
export type ItemIdParam = z.infer<typeof itemIdParamSchema>
export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>
export type AddItemsInput = z.infer<typeof addItemsSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>
export type BulkPurchaseInput = z.infer<typeof bulkPurchaseSchema>
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>
export type ShoppingListItemInput = z.infer<typeof ShoppingListItemInputSchema>

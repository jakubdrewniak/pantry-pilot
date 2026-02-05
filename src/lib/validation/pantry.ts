import { z } from 'zod'

/**
 * Validation schemas for pantry management.
 *
 * These schemas validate:
 * - Pantry item creation and updates
 * - Batch item operations
 * - UUID validation for pantry and item IDs
 *
 * Used by both API routes and service layer for consistent validation.
 */

/**
 * UUID v4 validation schema
 *
 * Validates that a string is a valid UUID v4 format.
 * Used for validating pantry IDs and item IDs in route parameters.
 */
export const UUIDSchema = z.string().uuid('Invalid UUID format')

/**
 * Single pantry item input validation schema
 *
 * Rules:
 * - name: string, trimmed, 1-100 characters (required)
 * - quantity: positive number, defaults to 1 (optional)
 * - unit: string, trimmed, max 20 characters, nullable (optional)
 *
 * Used internally by AddPantryItemsSchema for batch validation.
 */
const PantryItemInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Item name is required')
    .max(100, 'Item name must be at most 100 characters'),
  quantity: z.number().positive('Quantity must be positive').default(1),
  unit: z.string().trim().max(20, 'Unit must be at most 20 characters').nullable().optional(),
})

/**
 * Add pantry items batch validation schema
 *
 * Rules:
 * - items: array of PantryItemInputSchema, min 1, max 50 items
 *
 * Used for:
 * - POST /api/households/{householdId}/pantry/items (batch add items)
 *
 * Batch limit prevents performance issues and ensures reasonable request sizes.
 */
export const AddPantryItemsSchema = z.object({
  items: z
    .array(PantryItemInputSchema)
    .min(1, 'At least one item is required')
    .max(50, 'Cannot add more than 50 items at once'),
})

/**
 * Update pantry item validation schema
 *
 * Rules:
 * - quantity: positive number (optional)
 * - unit: string, max 20 chars, nullable (optional)
 * - At least one field must be provided (refined validation)
 *
 * Used for:
 * - PATCH /api/pantries/{pantryId}/items/{itemId} (update item)
 *
 * The refine ensures that at least one field is being updated.
 */
export const UpdatePantryItemSchema = z
  .object({
    quantity: z.number().positive('Quantity must be positive').optional(),
    unit: z.string().trim().max(20, 'Unit must be at most 20 characters').nullable().optional(),
  })
  .refine(data => data.quantity !== undefined || data.unit !== undefined, {
    message: 'At least one field (quantity or unit) must be provided',
  })

// TypeScript types inferred from schemas
export type AddPantryItemsInput = z.infer<typeof AddPantryItemsSchema>
export type UpdatePantryItemInput = z.infer<typeof UpdatePantryItemSchema>
export type PantryItemInput = z.infer<typeof PantryItemInputSchema>
export type UUIDInput = z.infer<typeof UUIDSchema>

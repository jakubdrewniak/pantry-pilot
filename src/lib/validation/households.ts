import { z } from 'zod'

/**
 * Validation schemas for household management.
 *
 * These schemas validate:
 * - Household creation and updates (name validation)
 * - Member invitations (email validation)
 * - UUID validation for household IDs
 *
 * Used by both API routes and service layer for consistent validation.
 */

/**
 * UUID v4 validation schema
 *
 * Validates that a string is a valid UUID v4 format.
 * Used for validating household IDs in route parameters.
 */
export const UUIDSchema = z.string().uuid('Invalid UUID format')

/**
 * Household name validation schema
 *
 * Rules:
 * - Minimum 3 characters
 * - Maximum 50 characters
 * - Automatically trims whitespace
 *
 * Used for:
 * - POST /api/households (create household)
 * - PATCH /api/households/{id} (rename household)
 */
export const HouseholdNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be at most 50 characters'),
})

/**
 * Invite member validation schema
 *
 * Rules:
 * - Valid email format
 * - Maximum 255 characters
 * - Automatically converts to lowercase
 * - Automatically trims whitespace
 *
 * Used for:
 * - POST /api/households/{id}/members (invite member)
 */
export const InviteMemberSchema = z.object({
  invitedEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email format')
    .max(255, 'Email must be at most 255 characters'),
})

// TypeScript types inferred from schemas
export type HouseholdNameInput = z.infer<typeof HouseholdNameSchema>
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>
export type UUIDInput = z.infer<typeof UUIDSchema>

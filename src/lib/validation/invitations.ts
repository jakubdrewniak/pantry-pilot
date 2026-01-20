import { z } from 'zod'

/**
 * Validation schemas for household invitation management.
 *
 * These schemas validate:
 * - Creating invitations (email validation)
 * - Accepting invitations (token validation)
 * - UUID validation for invitation and household IDs
 *
 * Used by both API routes and service layer for consistent validation.
 */

/**
 * UUID v4 validation schema
 *
 * Validates that a string is a valid UUID v4 format.
 * Used for validating household IDs and invitation IDs in route parameters.
 */
export const UUIDSchema = z.string().uuid('Invalid UUID format')

/**
 * Create invitation validation schema
 *
 * Rules:
 * - Valid email format
 * - Maximum 255 characters
 * - Automatically converts to lowercase
 * - Automatically trims whitespace
 *
 * Used for:
 * - POST /api/households/{householdId}/invitations
 */
export const CreateInvitationSchema = z.object({
  invitedEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email format')
    .max(255, 'Email must be at most 255 characters'),
})

/**
 * Accept invitation validation schema
 *
 * Rules:
 * - Token must be a non-empty string
 * - Minimum 1 character
 * - Maximum 255 characters
 * - Automatically trims whitespace
 *
 * Used for:
 * - PATCH /api/invitations/{token}/accept
 */
export const AcceptInvitationSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, 'Token is required')
    .max(255, 'Token must be at most 255 characters'),
})

/**
 * Token parameter validation schema
 *
 * Validates token format in URL parameters.
 * More lenient than AcceptInvitationSchema to allow various token formats.
 */
export const TokenParamSchema = z
  .string()
  .trim()
  .min(1, 'Token is required')
  .max(255, 'Token must be at most 255 characters')

/**
 * Household ID parameter validation schema
 *
 * Validates household ID in URL parameters.
 */
export const HouseholdIdParamSchema = UUIDSchema

/**
 * Invitation ID parameter validation schema
 *
 * Validates invitation ID in URL parameters.
 */
export const InvitationIdParamSchema = UUIDSchema

// TypeScript types inferred from schemas
export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>
export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>
export type TokenParamInput = z.infer<typeof TokenParamSchema>
export type HouseholdIdParamInput = z.infer<typeof HouseholdIdParamSchema>
export type InvitationIdParamInput = z.infer<typeof InvitationIdParamSchema>

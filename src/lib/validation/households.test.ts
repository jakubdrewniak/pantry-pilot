import { describe, it, expect } from 'vitest'
import {
  UUIDSchema,
  HouseholdNameSchema,
  InviteMemberSchema,
  type HouseholdNameInput,
  type InviteMemberInput,
} from './households'

/**
 * Household Validation Test Suite
 *
 * Tests Zod validation schemas for household operations.
 * These schemas ensure data integrity before hitting the API.
 *
 * Test Structure:
 * - Arrange: Set up test data
 * - Act: Parse data with schema
 * - Assert: Verify success or failure with correct error messages
 */

describe('Household Validation Schemas', () => {
  describe('UUIDSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid UUID v4', () => {
        // Arrange
        const validUUID = '550e8400-e29b-41d4-a716-446655440000'

        // Act
        const result = UUIDSchema.safeParse(validUUID)

        // Assert
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(validUUID)
        }
      })

      it('should accept uppercase UUID', () => {
        // Arrange
        const uppercaseUUID = '550E8400-E29B-41D4-A716-446655440000'

        // Act
        const result = UUIDSchema.safeParse(uppercaseUUID)

        // Assert
        expect(result.success).toBe(true)
      })
    })

    describe('invalid inputs', () => {
      it('should reject invalid UUID format', () => {
        // Arrange
        const invalidUUID = 'not-a-uuid'

        // Act
        const result = UUIDSchema.safeParse(invalidUUID)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Invalid UUID format')
        }
      })

      it('should accept UUID v1 (Zod uuid() accepts all versions)', () => {
        // Arrange - UUID v1 (Zod's uuid() validator accepts all UUID versions)
        const uuidV1 = '550e8400-e29b-11d4-a716-446655440000'

        // Act
        const result = UUIDSchema.safeParse(uuidV1)

        // Assert
        // Note: z.string().uuid() accepts all UUID versions (v1, v3, v4, v5)
        // not just v4. For strict v4 validation, use a custom regex.
        expect(result.success).toBe(true)
      })

      it('should reject empty string', () => {
        // Arrange
        const emptyString = ''

        // Act
        const result = UUIDSchema.safeParse(emptyString)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject null', () => {
        // Arrange
        const nullValue = null

        // Act
        const result = UUIDSchema.safeParse(nullValue)

        // Assert
        expect(result.success).toBe(false)
      })
    })
  })

  describe('HouseholdNameSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid household name', () => {
        // Arrange
        const validInput: HouseholdNameInput = {
          name: 'My Household',
        }

        // Act
        const result = HouseholdNameSchema.safeParse(validInput)

        // Assert
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.name).toBe('My Household')
        }
      })

      it('should accept name with exactly 3 characters', () => {
        // Arrange
        const input = {
          name: 'Abc',
        }

        // Act
        const result = HouseholdNameSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept name with exactly 50 characters', () => {
        // Arrange
        const input = {
          name: 'a'.repeat(50),
        }

        // Act
        const result = HouseholdNameSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should trim whitespace from name', () => {
        // Arrange
        const input = {
          name: '  My Household  ',
        }

        // Act
        const result = HouseholdNameSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.name).toBe('My Household')
        }
      })

      it('should accept name with special characters', () => {
        // Arrange
        const input = {
          name: "Smith's Family & Friends",
        }

        // Act
        const result = HouseholdNameSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(true)
      })
    })

    describe('invalid inputs', () => {
      it('should reject name shorter than 3 characters', () => {
        // Arrange
        const input = {
          name: 'Ab',
        }

        // Act
        const result = HouseholdNameSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Name must be at least 3 characters')
        }
      })

      it('should reject name longer than 50 characters', () => {
        // Arrange
        const input = {
          name: 'a'.repeat(51),
        }

        // Act
        const result = HouseholdNameSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Name must be at most 50 characters')
        }
      })

      it('should reject empty name', () => {
        // Arrange
        const input = {
          name: '',
        }

        // Act
        const result = HouseholdNameSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject name with only whitespace (after trim)', () => {
        // Arrange
        const input = {
          name: '   ',
        }

        // Act
        const result = HouseholdNameSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Name must be at least 3 characters')
        }
      })

      it('should reject missing name field', () => {
        // Arrange
        const input = {}

        // Act
        const result = HouseholdNameSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject non-string name', () => {
        // Arrange
        const input = {
          name: 123,
        }

        // Act
        const result = HouseholdNameSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
      })
    })
  })

  describe('InviteMemberSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid email', () => {
        // Arrange
        const validInput: InviteMemberInput = {
          invitedEmail: 'user@example.com',
        }

        // Act
        const result = InviteMemberSchema.safeParse(validInput)

        // Assert
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.invitedEmail).toBe('user@example.com')
        }
      })

      it('should convert email to lowercase', () => {
        // Arrange
        const input = {
          invitedEmail: 'User@EXAMPLE.COM',
        }

        // Act
        const result = InviteMemberSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.invitedEmail).toBe('user@example.com')
        }
      })

      it('should trim whitespace from email', () => {
        // Arrange
        const input = {
          invitedEmail: '  user@example.com  ',
        }

        // Act
        const result = InviteMemberSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.invitedEmail).toBe('user@example.com')
        }
      })

      it('should accept email with plus addressing', () => {
        // Arrange
        const input = {
          invitedEmail: 'user+tag@example.com',
        }

        // Act
        const result = InviteMemberSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept email with subdomain', () => {
        // Arrange
        const input = {
          invitedEmail: 'user@mail.example.com',
        }

        // Act
        const result = InviteMemberSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept email up to 255 characters', () => {
        // Arrange - 255 chars total: 'a'.repeat(243) + '@example.com' = 255
        // Note: '@example.com' = 12 characters, so 243 + 12 = 255
        const localPart = 'a'.repeat(243)
        const input = {
          invitedEmail: `${localPart}@example.com`,
        }

        // Act
        const result = InviteMemberSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(true)
      })
    })

    describe('invalid inputs', () => {
      it('should reject invalid email format', () => {
        // Arrange
        const input = {
          invitedEmail: 'not-an-email',
        }

        // Act
        const result = InviteMemberSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Invalid email format')
        }
      })

      it('should reject email without domain', () => {
        // Arrange
        const input = {
          invitedEmail: 'user@',
        }

        // Act
        const result = InviteMemberSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject email without local part', () => {
        // Arrange
        const input = {
          invitedEmail: '@example.com',
        }

        // Act
        const result = InviteMemberSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject email without @ symbol', () => {
        // Arrange
        const input = {
          invitedEmail: 'userexample.com',
        }

        // Act
        const result = InviteMemberSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject email longer than 255 characters', () => {
        // Arrange - 256 chars total: 'a'.repeat(244) + '@example.com' = 256
        // Note: '@example.com' = 12 characters, so 244 + 12 = 256
        const localPart = 'a'.repeat(244)
        const input = {
          invitedEmail: `${localPart}@example.com`,
        }

        // Act
        const result = InviteMemberSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Email must be at most 255 characters')
        }
      })

      it('should reject empty email', () => {
        // Arrange
        const input = {
          invitedEmail: '',
        }

        // Act
        const result = InviteMemberSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject missing invitedEmail field', () => {
        // Arrange
        const input = {}

        // Act
        const result = InviteMemberSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject non-string email', () => {
        // Arrange
        const input = {
          invitedEmail: 123,
        }

        // Act
        const result = InviteMemberSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
      })
    })
  })
})

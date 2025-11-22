import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from './auth'

/**
 * Auth Validation Test Suite
 *
 * Tests Zod validation schemas for authentication forms.
 * These schemas ensure data integrity before hitting the API.
 *
 * Test Structure:
 * - Arrange: Set up test data
 * - Act: Parse data with schema
 * - Assert: Verify success or failure with correct error messages
 */

describe('Auth Validation Schemas', () => {
  describe('loginSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid email and password', () => {
        // Arrange
        const validInput = {
          email: 'user@example.com',
          password: 'any-password',
        }

        // Act
        const result = loginSchema.safeParse(validInput)

        // Assert
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })

      it('should accept password with any format on login', () => {
        // Arrange - Login doesn't enforce password complexity
        const input = {
          email: 'user@example.com',
          password: 'weak',
        }

        // Act
        const result = loginSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(true)
      })
    })

    describe('invalid inputs', () => {
      it('should reject empty email', () => {
        // Arrange
        const input = {
          email: '',
          password: 'password123',
        }

        // Act
        const result = loginSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Please provide an email address.')
        }
      })

      it('should reject invalid email format', () => {
        // Arrange
        const input = {
          email: 'not-an-email',
          password: 'password123',
        }

        // Act
        const result = loginSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Please provide a valid email address.')
        }
      })

      it('should reject missing email field', () => {
        // Arrange
        const input = {
          password: 'password123',
        }

        // Act
        const result = loginSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject empty password', () => {
        // Arrange
        const input = {
          email: 'user@example.com',
          password: '',
        }

        // Act
        const result = loginSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Please provide a password.')
        }
      })

      it('should reject missing password field', () => {
        // Arrange
        const input = {
          email: 'user@example.com',
        }

        // Act
        const result = loginSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
      })
    })
  })

  describe('registerSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid registration with strong password', () => {
        // Arrange
        const validInput = {
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        }

        // Act
        const result = registerSchema.safeParse(validInput)

        // Assert
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })

      it('should accept password with various special characters', () => {
        // Arrange
        const testCases = [
          'Password1!',
          'Password1@',
          'Password1#',
          'Password1$',
          'Password1%',
          'Password1^',
          'Password1&',
          'Password1*',
          'Password1(',
          'Password1)',
        ]

        // Act & Assert
        testCases.forEach(password => {
          const input = {
            email: 'user@example.com',
            password,
            confirmPassword: password,
          }
          const result = registerSchema.safeParse(input)
          expect(result.success).toBe(true)
        })
      })
    })

    describe('invalid inputs', () => {
      it('should reject password shorter than 8 characters', () => {
        // Arrange
        const input = {
          email: 'user@example.com',
          password: 'Short1!',
          confirmPassword: 'Short1!',
        }

        // Act
        const result = registerSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Password must be at least 8 characters.')
        }
      })

      it('should reject password without digit', () => {
        // Arrange
        const input = {
          email: 'user@example.com',
          password: 'NoDigitPass!',
          confirmPassword: 'NoDigitPass!',
        }

        // Act
        const result = registerSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Password must contain at least one digit.')
        }
      })

      it('should reject password without special character', () => {
        // Arrange
        const input = {
          email: 'user@example.com',
          password: 'NoSpecial123',
          confirmPassword: 'NoSpecial123',
        }

        // Act
        const result = registerSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe(
            'Password must contain at least one special character.'
          )
        }
      })

      it('should reject mismatched passwords', () => {
        // Arrange
        const input = {
          email: 'user@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'DifferentPass123!',
        }

        // Act
        const result = registerSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          // Find the specific error for confirmPassword field
          const confirmError = result.error.errors.find(err => err.path.includes('confirmPassword'))
          expect(confirmError?.message).toBe('Passwords do not match.')
        }
      })

      it('should reject empty confirmPassword', () => {
        // Arrange
        const input = {
          email: 'user@example.com',
          password: 'SecurePass123!',
          confirmPassword: '',
        }

        // Act
        const result = registerSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Please confirm your password.')
        }
      })

      it('should reject invalid email in registration', () => {
        // Arrange
        const input = {
          email: 'invalid-email',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        }

        // Act
        const result = registerSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Please provide a valid email address.')
        }
      })

      it('should collect multiple validation errors', () => {
        // Arrange
        const input = {
          email: 'invalid',
          password: 'weak',
          confirmPassword: 'different',
        }

        // Act
        const result = registerSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          // Should have multiple errors: email, password length, digit, special char, mismatch
          expect(result.error.errors.length).toBeGreaterThan(1)
        }
      })
    })
  })

  describe('forgotPasswordSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid email', () => {
        // Arrange
        const validInput = {
          email: 'user@example.com',
        }

        // Act
        const result = forgotPasswordSchema.safeParse(validInput)

        // Assert
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })

    describe('invalid inputs', () => {
      it('should reject empty email', () => {
        // Arrange
        const input = {
          email: '',
        }

        // Act
        const result = forgotPasswordSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Please provide an email address.')
        }
      })

      it('should reject invalid email format', () => {
        // Arrange
        const input = {
          email: 'not-valid',
        }

        // Act
        const result = forgotPasswordSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Please provide a valid email address.')
        }
      })

      it('should reject missing email field', () => {
        // Arrange
        const input = {}

        // Act
        const result = forgotPasswordSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
      })
    })
  })

  describe('resetPasswordSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid password reset with token', () => {
        // Arrange
        const validInput = {
          password: 'NewSecure123!',
          confirmPassword: 'NewSecure123!',
          token: 'valid-reset-token-abc123',
        }

        // Act
        const result = resetPasswordSchema.safeParse(validInput)

        // Assert
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validInput)
        }
      })
    })

    describe('invalid inputs', () => {
      it('should reject weak password', () => {
        // Arrange
        const input = {
          password: 'weak',
          confirmPassword: 'weak',
          token: 'valid-token',
        }

        // Act
        const result = resetPasswordSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          // Should fail on multiple password requirements
          expect(result.error.errors.length).toBeGreaterThan(0)
        }
      })

      it('should reject mismatched passwords', () => {
        // Arrange
        const input = {
          password: 'SecurePass123!',
          confirmPassword: 'DifferentPass123!',
          token: 'valid-token',
        }

        // Act
        const result = resetPasswordSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          const confirmError = result.error.errors.find(err => err.path.includes('confirmPassword'))
          expect(confirmError?.message).toBe('Passwords do not match.')
        }
      })

      it('should reject empty token', () => {
        // Arrange
        const input = {
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          token: '',
        }

        // Act
        const result = resetPasswordSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          const tokenError = result.error.errors.find(err => err.path.includes('token'))
          expect(tokenError?.message).toBe('Invalid reset token.')
        }
      })

      it('should reject missing token field', () => {
        // Arrange
        const input = {
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        }

        // Act
        const result = resetPasswordSchema.safeParse(input)

        // Assert
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Type Inference', () => {
    it('should correctly infer LoginInput type', () => {
      // Arrange & Act
      const data: LoginInput = {
        email: 'user@example.com',
        password: 'any-password',
      }

      // Assert - TypeScript compilation ensures type correctness
      expect(data.email).toBeDefined()
      expect(data.password).toBeDefined()
    })

    it('should correctly infer RegisterInput type', () => {
      // Arrange & Act
      const data: RegisterInput = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      }

      // Assert - TypeScript compilation ensures type correctness
      expect(data.email).toBeDefined()
      expect(data.password).toBeDefined()
      expect(data.confirmPassword).toBeDefined()
    })

    it('should correctly infer ForgotPasswordInput type', () => {
      // Arrange & Act
      const data: ForgotPasswordInput = {
        email: 'user@example.com',
      }

      // Assert - TypeScript compilation ensures type correctness
      expect(data.email).toBeDefined()
    })

    it('should correctly infer ResetPasswordInput type', () => {
      // Arrange & Act
      const data: ResetPasswordInput = {
        password: 'NewSecure123!',
        confirmPassword: 'NewSecure123!',
        token: 'reset-token',
      }

      // Assert - TypeScript compilation ensures type correctness
      expect(data.password).toBeDefined()
      expect(data.confirmPassword).toBeDefined()
      expect(data.token).toBeDefined()
    })
  })
})

import { z } from 'zod'

/**
 * Validation schemas for authentication forms.
 *
 * These schemas are used for client-side validation and match
 * the server-side validation requirements in API routes.
 *
 * Password requirements:
 * - Minimum 8 characters
 * - At least one digit
 * - At least one special character
 */

// Email validation
const emailSchema = z
  .string()
  .min(1, 'Please provide an email address.')
  .email('Please provide a valid email address.')

// Password validation - basic (min 8 chars, digit, special char)
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .regex(/\d/, 'Password must contain at least one digit.')
  .regex(/[!@#$%^&*(),.?":{}|<>_]/, 'Password must contain at least one special character.')

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Please provide a password.'),
  // Note: We don't validate password complexity on login,
  // only that it's not empty
})

/**
 * Registration form validation schema
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

/**
 * Forgot password form validation schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

/**
 * Reset password form validation schema
 */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
    token: z.string().min(1, 'Invalid reset token.'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

// Type exports for TypeScript
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

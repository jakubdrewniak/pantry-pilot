'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormError } from './FormError'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface ForgotPasswordFormProps {
  onSuccess?: () => void
}

/**
 * ForgotPasswordForm Component
 *
 * Form for requesting a password reset link.
 *
 * Features:
 * - Email input only
 * - Client-side validation with Zod
 * - Accessible form with proper labels and ARIA attributes
 * - Loading state during submission
 * - Success message with instructions
 * - Link back to login
 *
 * Validation:
 * - Email: Must be valid email format
 *
 * Props:
 * - onSuccess: Optional callback when request succeeds
 *
 * TODO: Connect to API endpoint /api/auth/forgot-password when backend is ready
 */
export const ForgotPasswordForm = ({ onSuccess }: ForgotPasswordFormProps): JSX.Element => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState(false)

  /**
   * Client-side validation using Zod schema
   */
  const validateForm = (): ForgotPasswordInput | null => {
    setError(undefined)

    const result = forgotPasswordSchema.safeParse({ email })

    if (!result.success) {
      // Get first validation error
      const firstError = result.error.errors[0]
      setError(firstError.message)
      return null
    }

    return result.data
  }

  /**
   * Handle form submission
   * TODO: Connect to actual API when backend is implemented
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validatedData = validateForm()
    if (!validatedData) {
      return
    }

    setIsLoading(true)

    try {
      // TODO: Replace with actual API call to /api/auth/forgot-password
      // const response = await fetch('/api/auth/forgot-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(validatedData),
      // })
      //
      // if (!response.ok) {
      //   const error = await response.json()
      //   setError(error.message || 'Failed to send reset link.')
      //   return
      // }

      // Placeholder: simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // For now, just show success message
      console.log('Password reset request for:', { email: validatedData.email })
      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Forgot password error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Show success state
  if (success) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Check your email!</strong>
            <br />
            If an account exists for <strong>{email}</strong>, you will receive a password reset
            link shortly.
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={isLoading}
          aria-invalid={!!error}
          aria-describedby="email-description"
        />
        <p id="email-description" className="text-xs text-muted-foreground">
          We&apos;ll send a password reset link to this email address.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div id="form-error">
          <FormError message={error} />
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Sending Link...' : 'Send Reset Link'}
      </Button>

      {/* Back to Login Link */}
      <div className="text-center">
        <Link
          href="/auth/login"
          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Back to Sign In
        </Link>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormError } from './FormError'
import { resetPasswordSchema } from '@/lib/validation/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface ResetPasswordFormProps {
  token: string
  onSuccess?: () => void
}

/**
 * ResetPasswordForm Component
 *
 * Form for setting a new password from a reset token.
 *
 * Features:
 * - Password and confirm password inputs
 * - Token from URL (hidden from user)
 * - Client-side validation with Zod
 * - Password strength requirements displayed
 * - Accessible form with proper labels and ARIA attributes
 * - Loading state during submission
 * - Success message with redirect to login
 *
 * Validation:
 * - Password: Min 8 chars, digit, special character
 * - Confirm Password: Must match password
 * - Token: Must be valid (checked on server)
 *
 * Props:
 * - token: Reset token from URL
 * - onSuccess: Optional callback when reset succeeds
 *
 * TODO: Connect to API endpoint /api/auth/reset-password when backend is ready
 */
export const ResetPasswordForm = ({ token, onSuccess }: ResetPasswordFormProps): JSX.Element => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState(false)

  /**
   * Client-side validation using Zod schema
   */
  const validateForm = (): boolean => {
    setError(undefined)

    const result = resetPasswordSchema.safeParse({ password, confirmPassword, token })

    if (!result.success) {
      // Get first validation error
      const firstError = result.error.errors[0]
      setError(firstError.message)
      return false
    }

    return true
  }

  /**
   * Handle form submission
   * TODO: Connect to actual API when backend is implemented
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // TODO: Replace with actual API call to /api/auth/reset-password
      // const response = await fetch('/api/auth/reset-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ password, token }),
      // })
      //
      // if (!response.ok) {
      //   const error = await response.json()
      //   setError(error.message || 'Invalid or expired reset token.')
      //   return
      // }

      // Placeholder: simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // For now, just show success message
      console.log('Password reset successful with token:', token)
      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      setError('An error occurred while resetting your password. Please try again.')
      console.error('Reset password error:', err)
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
            <strong>Password reset successful!</strong>
            <br />
            You can now sign in with your new password.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full">
          <Link href="/auth/login">Go to Sign In</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">
          New Password <span className="text-destructive">*</span>
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={isLoading}
          aria-invalid={!!error}
          aria-describedby="password-requirements"
        />
        <p id="password-requirements" className="text-xs text-muted-foreground">
          Must be at least 8 characters with a digit and special character.
        </p>
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          Confirm New Password <span className="text-destructive">*</span>
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          aria-invalid={!!error}
          aria-describedby={error ? 'form-error' : undefined}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div id="form-error">
          <FormError message={error} />
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Resetting Password...' : 'Reset Password'}
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

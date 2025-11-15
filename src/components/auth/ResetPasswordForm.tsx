'use client'

import { useActionState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormError } from './FormError'
import { resetPassword } from '@/app/actions/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

/**
 * ResetPasswordForm Component
 *
 * Form for setting a new password after clicking reset link from email.
 * Integrated with Server Actions and Supabase Auth.
 *
 * Features:
 * - Password and confirm password inputs
 * - Server-side validation and password update
 * - Password strength requirements displayed
 * - Accessible form with proper labels and ARIA attributes
 * - Loading state during submission
 * - Success message with redirect to login
 *
 * Validation:
 * - Server Action validates password strength and match
 * - Supabase verifies session token automatically
 *
 * Note: This component expects the user to have a valid session from the
 * reset link (Supabase sets session from hash fragments)
 *
 * @returns Reset password form component
 */
export const ResetPasswordForm = (): JSX.Element => {
  const [state, formAction, isPending] = useActionState(resetPassword, undefined)

  // Show success state
  if (state?.success) {
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
    <form action={formAction} className="space-y-4">
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
          required
          disabled={isPending}
          aria-invalid={!!state?.error}
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
          required
          disabled={isPending}
          aria-invalid={!!state?.error}
          aria-describedby={state?.error ? 'form-error' : undefined}
        />
      </div>

      {/* Error Display */}
      {state?.error && (
        <div id="form-error">
          <FormError message={state.error} />
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Resetting Password...' : 'Reset Password'}
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

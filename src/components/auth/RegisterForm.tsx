'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button, buttonVariants } from '@/components/ui/button'
import { FormError } from './FormError'
import { signup } from '@/app/actions/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle } from 'lucide-react'

/**
 * RegisterForm Component
 *
 * Form for new user registration with email and password.
 * Integrated with Server Actions for user registration.
 *
 * Features:
 * - Email, password, and confirm password inputs
 * - Server-side validation and registration
 * - Password strength requirements displayed
 * - Accessible form with proper labels and ARIA attributes
 * - Loading state during submission
 * - Success message after registration
 *
 * Validation:
 * - Server Action validates email format, password strength, and match
 * - Returns user-friendly error messages
 *
 * Note: Email verification is disabled for MVP. User can login immediately.
 * TODO: Enable email verification for production
 *
 * @returns Registration form component
 */
export const RegisterForm = (): JSX.Element => {
  const [state, formAction, isPending] = useActionState(signup, undefined)

  // Show success state
  if (state?.success) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Account created successfully!</strong>
            <br />
            You can now sign in with your email and password.
          </AlertDescription>
        </Alert>

        {/* Sign In Link */}
        <Link href="/auth/login" className={buttonVariants({ className: 'w-full' })}>
          Go to Sign In
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
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
          required
          disabled={isPending}
          aria-invalid={!!state?.error}
          aria-describedby={state?.error ? 'form-error' : undefined}
        />
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">
          Password <span className="text-destructive">*</span>
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
          Confirm Password <span className="text-destructive">*</span>
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
        {isPending ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  )
}

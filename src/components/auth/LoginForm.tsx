'use client'

import { useActionState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormError } from './FormError'
import { login } from '@/app/actions/auth'
import Link from 'next/link'

/**
 * LoginForm Component
 *
 * Form for user authentication with email and password.
 * Integrated with Server Actions for authentication.
 *
 * Features:
 * - Email and password inputs
 * - Server-side validation and authentication
 * - Accessible form with proper labels and ARIA attributes
 * - Loading state during submission
 * - Password recovery link
 * - Automatic redirect after successful login
 *
 * Validation:
 * - Server Action validates email format and password
 * - Returns user-friendly error messages
 *
 * @returns Login form component
 */
export const LoginForm = (): JSX.Element => {
  const [state, formAction, isPending] = useActionState(login, undefined)

  return (
    <form action={formAction} className="space-y-6">
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">
            Password <span className="text-destructive">*</span>
          </Label>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            tabIndex={isPending ? -1 : 0}
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
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
        {isPending ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}

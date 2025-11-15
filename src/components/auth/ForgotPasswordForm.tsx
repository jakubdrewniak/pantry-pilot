'use client'

import { useState, useActionState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormError } from './FormError'
import { forgotPassword } from '@/app/actions/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

/**
 * ForgotPasswordForm Component
 *
 * Form for requesting a password reset link via email.
 * Integrated with Server Actions for password reset requests.
 *
 * Features:
 * - Email input only
 * - Server-side validation and email sending
 * - Accessible form with proper labels and ARIA attributes
 * - Loading state during submission
 * - Success message with instructions
 * - Link back to login
 * - User enumeration protection (always shows success)
 *
 * Validation:
 * - Server Action validates email format
 * - Always returns success (security best practice)
 *
 * @returns Forgot password form component
 */
export const ForgotPasswordForm = (): JSX.Element => {
  const [state, formAction, isPending] = useActionState(forgotPassword, undefined)
  const [submittedEmail, setSubmittedEmail] = useState('')

  // Show success state
  if (state?.success) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Check your email!</strong>
            <br />
            If an account exists for <strong>{submittedEmail}</strong>, you will receive a password
            reset link shortly.
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
    <form
      action={data => {
        // Capture email before submitting (for success message)
        const email = data.get('email')
        if (email) setSubmittedEmail(email.toString())
        formAction(data)
      }}
      className="space-y-6"
    >
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
          aria-describedby="email-description"
        />
        <p id="email-description" className="text-xs text-muted-foreground">
          We&apos;ll send a password reset link to this email address.
        </p>
      </div>

      {/* Error Display */}
      {state?.error && (
        <div id="form-error">
          <FormError message={state.error} />
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Sending Link...' : 'Send Reset Link'}
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

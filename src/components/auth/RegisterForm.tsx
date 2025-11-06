'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormError } from './FormError'
import { registerSchema, type RegisterInput } from '@/lib/validation/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle } from 'lucide-react'

interface RegisterFormProps {
  onSuccess?: () => void
}

/**
 * RegisterForm Component
 *
 * Form for new user registration with email and password.
 *
 * Features:
 * - Email, password, and confirm password inputs
 * - Client-side validation with Zod
 * - Password strength requirements displayed
 * - Accessible form with proper labels and ARIA attributes
 * - Loading state during submission
 * - Success message after registration
 *
 * Validation:
 * - Email: Must be valid email format
 * - Password: Min 8 chars, digit, special character
 * - Confirm Password: Must match password
 *
 * Props:
 * - onSuccess: Optional callback when registration succeeds
 *
 * TODO: Connect to API endpoint /api/auth/register when backend is ready
 */
export const RegisterForm = ({ onSuccess }: RegisterFormProps): JSX.Element => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState(false)

  /**
   * Client-side validation using Zod schema
   */
  const validateForm = (): RegisterInput | null => {
    setError(undefined)

    const result = registerSchema.safeParse({ email, password, confirmPassword })

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
      // TODO: Replace with actual API call to /api/auth/register
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(validatedData),
      // })
      //
      // if (!response.ok) {
      //   const error = await response.json()
      //   setError(error.message || 'An account with this email already exists.')
      //   return
      // }

      // Placeholder: simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // For now, just show success message
      console.log('Registration attempt with:', { email: validatedData.email })
      setSuccess(true)

      // Call success callback after a brief delay
      setTimeout(() => {
        onSuccess?.()
      }, 2000)
    } catch (err) {
      setError('An error occurred during registration. Please try again.')
      console.error('Registration error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Show success state
  if (success) {
    return (
      <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <strong>Account created successfully!</strong>
          <br />
          Please check your email to verify your account before signing in.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          aria-describedby={error ? 'form-error' : undefined}
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
          Confirm Password <span className="text-destructive">*</span>
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
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  )
}

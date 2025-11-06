'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormError } from './FormError'
import { loginSchema, type LoginInput } from '@/lib/validation/auth'
import Link from 'next/link'

interface LoginFormProps {
  onSuccess?: () => void
}

/**
 * LoginForm Component
 *
 * Form for user authentication with email and password.
 *
 * Features:
 * - Email and password inputs
 * - Client-side validation with Zod
 * - Accessible form with proper labels and ARIA attributes
 * - Loading state during submission
 * - Link to password recovery (future implementation)
 *
 * Validation:
 * - Email: Must be valid email format
 * - Password: Required (complexity checked server-side)
 *
 * Props:
 * - onSuccess: Optional callback when login succeeds (for now, just a placeholder)
 *
 * TODO: Connect to API endpoint /api/auth/login when backend is ready
 */
export const LoginForm = ({ onSuccess }: LoginFormProps): JSX.Element => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  /**
   * Client-side validation using Zod schema
   */
  const validateForm = (): LoginInput | null => {
    setError(undefined)

    const result = loginSchema.safeParse({ email, password })

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
      // TODO: Replace with actual API call to /api/auth/login
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(validatedData),
      // })
      //
      // if (!response.ok) {
      //   const error = await response.json()
      //   setError(error.message || 'Invalid email or password.')
      //   return
      // }

      // Placeholder: simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // For now, just log and call success callback
      console.log('Login attempt with:', { email: validatedData.email })
      onSuccess?.()
    } catch (err) {
      setError('An error occurred during login. Please try again.')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
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
          aria-describedby={error ? 'form-error' : undefined}
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
            tabIndex={isLoading ? -1 : 0}
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
          value={password}
          onChange={e => setPassword(e.target.value)}
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
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}

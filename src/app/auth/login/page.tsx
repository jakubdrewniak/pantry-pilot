import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - Pantry Pilot',
  description: 'Login to your Pantry Pilot account',
}

/**
 * LoginPage
 *
 * Public authentication page for user login.
 *
 * Features:
 * - Wrapped in AuthLayout (via layout.tsx)
 * - Card-based design consistent with app styling
 * - Link to registration page for new users
 * - Responsive design
 *
 * Route: /auth/login
 *
 * TODO: Add redirect after successful login (to /dashboard or /recipes)
 * TODO: Add "Remember me" option if needed
 */
export default function LoginPage(): JSX.Element {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>Enter your email and password to access your account.</CardDescription>
      </CardHeader>

      <CardContent>
        <LoginForm />

        {/* Registration Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/register"
              className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

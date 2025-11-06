import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RegisterForm } from '@/components/auth/RegisterForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Register - Pantry Pilot',
  description: 'Create your Pantry Pilot account',
}

/**
 * RegisterPage
 *
 * Public authentication page for new user registration.
 *
 * Features:
 * - Wrapped in AuthLayout (via layout.tsx)
 * - Card-based design consistent with app styling
 * - Link to login page for existing users
 * - Password requirements displayed
 * - Responsive design
 *
 * Route: /auth/register
 *
 * TODO: Add redirect after successful registration (to /auth/login with success message)
 * TODO: Add social registration options if needed
 */
export default function RegisterPage(): JSX.Element {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <CardDescription>Enter your details to create a new Pantry Pilot account.</CardDescription>
      </CardHeader>

      <CardContent>
        <RegisterForm />

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign In
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

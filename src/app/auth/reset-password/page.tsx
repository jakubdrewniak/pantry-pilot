import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset Password - Pantry Pilot',
  description: 'Set a new password for your Pantry Pilot account',
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>
}

/**
 * ResetPasswordPage
 *
 * Public authentication page for setting a new password from a reset token.
 *
 * Features:
 * - Wrapped in AuthLayout (via layout.tsx)
 * - Card-based design consistent with app styling
 * - Token validation from URL query parameter
 * - Error state if token is missing
 * - Password strength requirements
 * - Success message with redirect to login
 * - Responsive design
 *
 * Route: /auth/reset-password?token=xxx
 *
 * Security Note:
 * - Token must be present in URL (from email link)
 * - Token validated on backend for expiration and authenticity
 * - Token is single-use (invalidated after successful reset)
 */
export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps): Promise<JSX.Element> {
  const params = await searchParams
  const token = params.token

  // Show error if no token present
  if (!token) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>Set a new password for your account.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Invalid reset link</strong>
              <br />
              This password reset link is invalid or has expired. Please request a new one.
            </AlertDescription>
          </Alert>

          <Link
            href="/auth/forgot-password"
            className="inline-block text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Request new reset link
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>

      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  )
}

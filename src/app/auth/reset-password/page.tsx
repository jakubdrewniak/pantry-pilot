import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset Password - Pantry Pilot',
  description: 'Set a new password for your Pantry Pilot account',
}

/**
 * ResetPasswordPage
 *
 * Public authentication page for setting a new password from a reset token.
 * Handles Supabase Auth password reset flow with hash fragments.
 *
 * Features:
 * - Wrapped in AuthLayout (via layout.tsx)
 * - Card-based design consistent with app styling
 * - Supabase session extraction from URL hash fragments
 * - Password strength requirements
 * - Success message with redirect to login
 * - Responsive design
 *
 * Route: /auth/reset-password#access_token=xxx&type=recovery
 *
 * Note: Supabase sends reset links with hash fragments, not query params.
 * The ResetPasswordForm component handles session validation.
 *
 * Security Note:
 * - Token is verified via Supabase session (set from hash fragments)
 * - Token validated on backend for expiration and authenticity
 * - Token is single-use (invalidated after successful reset)
 */
export default function ResetPasswordPage(): JSX.Element {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>

      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forgot Password - Pantry Pilot',
  description: 'Reset your Pantry Pilot account password',
}

/**
 * ForgotPasswordPage
 *
 * Public authentication page for password reset request.
 *
 * Features:
 * - Wrapped in AuthLayout (via layout.tsx)
 * - Card-based design consistent with app styling
 * - Simple email input form
 * - Success message with instructions
 * - Link back to login
 * - Responsive design
 *
 * Route: /auth/forgot-password
 *
 * Security Note:
 * - Always shows success message even if email doesn't exist (prevents user enumeration)
 * - Rate limited on backend to prevent abuse
 */
export default function ForgotPasswordPage(): JSX.Element {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  )
}

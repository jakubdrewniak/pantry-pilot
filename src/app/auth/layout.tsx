import { ChefHat } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - Pantry Pilot',
  description: 'Login or register to start managing your pantry',
}

/**
 * AuthLayout
 *
 * Minimal layout for public authentication pages (/auth/*).
 *
 * Features:
 * - Clean, centered design with logo
 * - No application navigation (users are not authenticated)
 * - Responsive: full-screen on mobile, centered card on desktop
 * - Theme support (inherits from root ThemeProvider)
 *
 * Differences from AppLayout:
 * - No Navigation component
 * - No sidebar
 * - No session protection (handled by middleware)
 */
export default function AuthLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
        {/* Logo Header */}
        <div className="flex items-center gap-3 mb-8">
          <ChefHat className="h-10 w-10 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span className="text-2xl font-bold text-gray-900 dark:text-white">Pantry Pilot</span>
        </div>

        {/* Form Slot */}
        <div className="w-full max-w-md">{children}</div>

        {/* Footer */}
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Pantry Pilot. All rights reserved.
        </p>
      </div>
    </div>
  )
}

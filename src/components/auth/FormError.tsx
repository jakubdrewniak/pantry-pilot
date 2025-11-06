import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface FormErrorProps {
  message: string | undefined
}

/**
 * FormError Component
 *
 * Displays validation or API errors in authentication forms.
 * Uses shadcn/ui Alert with destructive variant.
 *
 * Features:
 * - Only renders when message is provided
 * - ARIA live region for screen readers
 * - Consistent styling across all auth forms
 *
 * Props:
 * - message: Error message to display (undefined = no render)
 */
export const FormError = ({ message }: FormErrorProps): JSX.Element | null => {
  if (!message) {
    return null
  }

  return (
    <Alert variant="destructive" role="alert" aria-live="assertive">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface WarningsPanelProps {
  warnings?: string[]
  pantryEmpty?: boolean
}

/**
 * WarningsPanel displays warnings from the API response and info about empty pantry.
 * Shows when there are warnings from the server or when pantryEmpty header is present.
 *
 * Accessibility:
 * - role="alert" for immediate announcement to screen readers
 * - aria-live="polite" for non-critical warnings
 * - aria-atomic for complete message reading
 * - Decorative icon is aria-hidden
 */
export const WarningsPanel = ({
  warnings = [],
  pantryEmpty,
}: WarningsPanelProps): JSX.Element | null => {
  // Combine both warning sources
  const allWarnings = [...warnings]
  if (pantryEmpty) {
    allWarnings.push('Your pantry is empty. The recipe will be generated without pantry items.')
  }

  // Don't render if no warnings
  if (allWarnings.length === 0) return null

  return (
    <Alert variant="warning" className="mb-4" role="alert" aria-live="polite" aria-atomic="true">
      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>Notice</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 mt-2" role="list">
          {allWarnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

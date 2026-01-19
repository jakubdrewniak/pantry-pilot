import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorAlertProps {
  error: string | null
  onRetry?: () => void
  onDismiss?: () => void
}

/**
 * Component displaying error alert
 * Used in modals and forms to display error messages
 */
export function ErrorAlert({ error, onRetry, onDismiss }: ErrorAlertProps) {
  if (!error) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm">{error}</p>
        </div>
        <div className="flex gap-2">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Close
            </Button>
          )}
        </div>
      </div>
    </Alert>
  )
}

import { Spinner } from '@/components/ui/spinner'

interface LoadingStateProps {
  loading: boolean
}

/**
 * LoadingState displays a spinner and "Generating..." message during AI recipe generation.
 * Only renders when loading is true.
 *
 * Accessibility:
 * - aria-live="polite" announces status changes to screen readers
 * - aria-busy indicates loading state
 * - Semantic status role for assistive technologies
 */
export const LoadingState = ({ loading }: LoadingStateProps): JSX.Element | null => {
  if (!loading) return null

  return (
    <div
      className="flex flex-col items-center justify-center py-8 space-y-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="ai-recipe-loading-state"
    >
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">Generating your recipe...</p>
    </div>
  )
}

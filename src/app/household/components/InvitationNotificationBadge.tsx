'use client'

import { useInvitationNotifications } from '@/lib/hooks/useInvitationNotifications'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface InvitationNotificationBadgeProps {
  className?: string
}

/**
 * Badge displaying the number of pending invitations for the logged-in user
 * Visible only when there are pending invitations (count > 0)
 * Automatically refreshes every 30 seconds via the hook
 * Used in: Navigation component
 */
export function InvitationNotificationBadge({
  className,
}: InvitationNotificationBadgeProps): JSX.Element | null {
  const { count, isLoading } = useInvitationNotifications()

  // Don't render if loading or no invitations
  if (isLoading || count === 0) {
    return null
  }

  // Display "9+" for counts greater than 9
  const displayCount = count > 9 ? '9+' : count.toString()

  return (
    <Badge
      variant="destructive"
      className={cn(
        'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
        className
      )}
      aria-label={`${count} pending invitation${count === 1 ? '' : 's'}`}
    >
      {displayCount}
    </Badge>
  )
}

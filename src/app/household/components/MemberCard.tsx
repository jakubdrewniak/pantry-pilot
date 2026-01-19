import { Badge } from '@/components/ui/badge'
import type { MemberWithRole } from '@/types/types'

interface MemberCardProps {
  member: MemberWithRole
  isCurrentUser: boolean
}

/**
 * Card displaying individual member information
 * Shows email, role badge, and join date
 * Read-only in current version (no remove functionality)
 */
export function MemberCard({ member, isCurrentUser }: MemberCardProps) {
  const formattedDate = new Date(member.joinedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{member.email}</p>
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs">
              You
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Joined {formattedDate}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
          {member.role === 'owner' ? 'Owner' : 'Member'}
        </Badge>
      </div>
    </div>
  )
}

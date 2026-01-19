import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MemberCard } from './MemberCard'
import type { MemberWithRole, HouseholdRole } from '@/types/types'

interface MembersListProps {
  members: MemberWithRole[]
  currentUserId: string
  userRole: HouseholdRole
}

/**
 * Members list section with header
 * Displays all household members in read-only mode
 * Note: No invite or remove functionality in current version
 */
export function MembersList({ members, currentUserId }: MembersListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Members</span>
          <span className="text-sm font-normal text-muted-foreground">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {members.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              isCurrentUser={member.id === currentUserId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

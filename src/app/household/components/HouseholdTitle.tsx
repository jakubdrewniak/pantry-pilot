import { Badge } from '@/components/ui/badge'

interface HouseholdTitleProps {
  name: string
  memberCount: number
}

/**
 * Displays household name as H1 heading with member count badge
 * Used in the household header section
 */
export function HouseholdTitle({ name, memberCount }: HouseholdTitleProps) {
  return (
    <div className="flex items-center gap-3">
      <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
      <Badge variant="secondary" className="text-sm">
        {memberCount} {memberCount === 1 ? 'member' : 'members'}
      </Badge>
    </div>
  )
}

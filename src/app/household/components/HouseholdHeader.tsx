import { HouseholdTitle } from './HouseholdTitle'
import { HouseholdActions } from './HouseholdActions'
import type { Household, HouseholdRole } from '@/types/types'

interface HouseholdHeaderProps {
  household: Household
  userRole: HouseholdRole
  onEditName: () => void
  onCreateOwn: () => void
}

/**
 * Header section of household dashboard
 * Combines household title with action buttons
 * Responsive: stacks on mobile, side-by-side on desktop
 */
export function HouseholdHeader({
  household,
  userRole,
  onEditName,
  onCreateOwn,
}: HouseholdHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <HouseholdTitle name={household.name} memberCount={household.memberCount ?? 0} />
      <HouseholdActions userRole={userRole} onEditName={onEditName} onCreateOwn={onCreateOwn} />
    </div>
  )
}

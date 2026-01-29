import { HouseholdTitle } from './HouseholdTitle'
import { HouseholdActions } from './HouseholdActions'
import type { Household, HouseholdRole } from '@/types/types'

interface HouseholdHeaderProps {
  household: Household
  userRole: HouseholdRole
  hasOwnHousehold: boolean
  ownHouseholdName?: string
  onEditName: () => void
  onReturnOrCreate: () => void
  onDelete: () => void
}

/**
 * Header section of household dashboard
 * Combines household title with action buttons
 * Responsive: stacks on mobile, side-by-side on desktop
 */
export function HouseholdHeader({
  household,
  userRole,
  hasOwnHousehold,
  ownHouseholdName,
  onEditName,
  onReturnOrCreate,
  onDelete,
}: HouseholdHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <HouseholdTitle name={household.name} memberCount={household.memberCount ?? 0} />
      <HouseholdActions
        userRole={userRole}
        hasOwnHousehold={hasOwnHousehold}
        ownHouseholdName={ownHouseholdName}
        onEditName={onEditName}
        onReturnOrCreate={onReturnOrCreate}
        onDelete={onDelete}
      />
    </div>
  )
}

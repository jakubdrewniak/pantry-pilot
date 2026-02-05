import { Button } from '@/components/ui/button'
import type { HouseholdRole } from '@/types/types'

interface HouseholdActionsProps {
  userRole: HouseholdRole
  hasOwnHousehold: boolean
  ownHouseholdName?: string
  onEditName: () => void
  onReturnOrCreate: () => void
}

/**
 * Action buttons group with role-based visibility
 * - Owner: Edit name
 * - Member: Return to own household OR Create new household (dynamic text)
 */
export function HouseholdActions({
  userRole,
  hasOwnHousehold,
  onEditName,
  onReturnOrCreate,
}: HouseholdActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {userRole === 'owner' && (
        <Button variant="outline" onClick={onEditName}>
          Edit Name
        </Button>
      )}
      {userRole === 'member' && (
        <Button variant="default" onClick={onReturnOrCreate}>
          {hasOwnHousehold ? 'Leave household' : 'Create Own Household'}
        </Button>
      )}
    </div>
  )
}

import { Button } from '@/components/ui/button'
import type { HouseholdRole } from '@/types/types'

interface HouseholdActionsProps {
  userRole: HouseholdRole
  onEditName: () => void
  onCreateOwn: () => void
}

/**
 * Action buttons group with role-based visibility
 * - Owner: Edit name
 * - Member: Create own household
 */
export function HouseholdActions({ userRole, onEditName, onCreateOwn }: HouseholdActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {userRole === 'owner' && (
        <Button variant="outline" onClick={onEditName}>
          Edit Name
        </Button>
      )}
      {userRole === 'member' && (
        <Button variant="default" onClick={onCreateOwn}>
          Create Own Household
        </Button>
      )}
    </div>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Household, HouseholdRole } from '@/types/types'

interface HouseholdInfoCardProps {
  household: Household
  userRole: HouseholdRole
}

/**
 * Information card displaying household metadata
 * Shows creation date, ID, and owner badge if applicable
 */
export function HouseholdInfoCard({ household, userRole }: HouseholdInfoCardProps) {
  const formattedDate = new Date(household.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Household Information</span>
          {userRole === 'owner' && (
            <Badge variant="default" className="ml-2">
              Owner
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="font-medium text-muted-foreground">Created</dt>
            <dd className="text-foreground">{formattedDate}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-muted-foreground">Household ID</dt>
            <dd className="font-mono text-xs text-muted-foreground">{household.id}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

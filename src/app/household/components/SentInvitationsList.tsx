'use client'

import { useSentInvitations } from '@/lib/hooks/useSentInvitations'
import { SentInvitationItem } from './SentInvitationItem'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Mail, RefreshCw } from 'lucide-react'

interface SentInvitationsListProps {
  householdId: string
}

/**
 * Component displaying the list of sent invitations for a household
 * Owner-only functionality showing pending invitations with cancel option
 * Handles loading, error, and empty states
 * Used in: HouseholdInvitationsSection
 */
export function SentInvitationsList({ householdId }: SentInvitationsListProps): JSX.Element {
  const { invitations, isLoading, error, refresh } = useSentInvitations(householdId)

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sent Invitations</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3 rounded-lg border p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sent Invitations</h3>
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={refresh} className="ml-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Empty state
  if (invitations.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sent Invitations</h3>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Mail className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No sent invitations. Invite someone to share your household.
          </p>
        </div>
      </div>
    )
  }

  // Success state with data
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sent Invitations ({invitations.length})</h3>
        <Button variant="ghost" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {invitations.map(invitation => (
          <SentInvitationItem
            key={invitation.id}
            invitation={invitation}
            householdId={householdId}
            onDeleted={refresh}
          />
        ))}
      </div>
    </div>
  )
}

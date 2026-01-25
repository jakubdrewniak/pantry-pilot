'use client'

import type { HouseholdRole } from '@/types/types'
import { CreateInvitationForm } from './CreateInvitationForm'
import { SentInvitationsList } from './SentInvitationsList'
import { ReceivedInvitationsList } from './ReceivedInvitationsList'
import { useState } from 'react'

interface HouseholdInvitationsSectionProps {
  householdId: string
  userRole: HouseholdRole
  className?: string
}

/**
 * Main container component for household invitations functionality
 * Conditionally renders owner-only sections (create form, sent invitations)
 * and user sections (received invitations) based on user role
 * Used in: /household page
 */
export function HouseholdInvitationsSection({
  householdId,
  userRole,
  className,
}: HouseholdInvitationsSectionProps): JSX.Element {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleInvitationCreated = () => {
    // Trigger refresh of sent invitations list
    setRefreshKey(prev => prev + 1)
  }

  return (
    <section id="invitations" className={className}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invitations</h2>
          <p className="text-muted-foreground">
            Manage household invitations and collaborate with others
          </p>
        </div>

        {/* Owner-only sections */}
        {userRole === 'owner' && (
          <div className="space-y-8">
            {/* Create invitation form */}
            <div className="rounded-lg border p-6">
              <h3 className="mb-4 text-lg font-semibold">Invite New Member</h3>
              <CreateInvitationForm
                householdId={householdId}
                onInvitationCreated={handleInvitationCreated}
              />
            </div>

            {/* Sent invitations list */}
            <div key={refreshKey}>
              <SentInvitationsList householdId={householdId} />
            </div>
          </div>
        )}

        {/* Received invitations - visible to all users */}
        <div>
          <ReceivedInvitationsList />
        </div>
      </div>
    </section>
  )
}

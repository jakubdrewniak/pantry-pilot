'use client'

import { useState, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
import { useAuth } from '@/contexts/AuthContext'
import { useHouseholdDashboard } from '@/lib/hooks/useHouseholdDashboard'
import { enrichMembersWithRoles } from '@/lib/utils/household'
import {
  HouseholdHeader,
  HouseholdInfoCard,
  MembersList,
  EditHouseholdNameModal,
  ReturnOrCreateHouseholdModal,
  HouseholdInvitationsSection,
} from './components'
import type { Household, CreateHouseholdResponse } from '@/types/types'

/**
 * Household Dashboard Page
 * Main view for managing household information and members
 *
 * Features:
 * - View household details and members
 * - Edit household name (owner only)
 * - Create own household (member only)
 *
 * Note: Invitation functionality not implemented in current version
 */
export default function HouseholdPage(): JSX.Element {
  const { user } = useAuth()
  const { viewModel, refresh, updateHouseholdName } = useHouseholdDashboard()

  // Modal states
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false)
  const [isReturnOrCreateModalOpen, setIsReturnOrCreateModalOpen] = useState(false)

  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Handler: Edit name success
  const handleEditNameSuccess = useCallback(
    (updatedHousehold: Household) => {
      setIsEditNameModalOpen(false)
      setSuccessMessage('Household name updated successfully')
      // Optimistically update the name without full refresh
      updateHouseholdName(updatedHousehold.name)

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    },
    [updateHouseholdName]
  )

  // Handler: Return or create household success
  const handleReturnOrCreateSuccess = useCallback(
    (result: CreateHouseholdResponse) => {
      setIsReturnOrCreateModalOpen(false)
      const message = result.rejoined
        ? `Returned to household: ${result.name}`
        : `Created new household: ${result.name}`
      setSuccessMessage(message)
      // Full refresh needed - switching to different household
      refresh()

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    },
    [refresh]
  )

  // Loading state
  if (viewModel.isLoading) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6 py-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Error state
  if (viewModel.error) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <ErrorAlert error={viewModel.error} onRetry={refresh} />
      </div>
    )
  }

  // Empty state - no household
  if (!viewModel.household || !viewModel.userRole) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <EmptyState
          title="No Household Found"
          description="You are not a member of any household. Create your own household to get started."
          action={
            <Button onClick={() => setIsReturnOrCreateModalOpen(true)}>Create Household</Button>
          }
        />

        <ReturnOrCreateHouseholdModal
          open={isReturnOrCreateModalOpen}
          currentHouseholdName=""
          hasOwnHousehold={viewModel.hasOwnHousehold}
          ownHouseholdName={viewModel.ownedHousehold?.name}
          onOpenChange={setIsReturnOrCreateModalOpen}
          onSuccess={handleReturnOrCreateSuccess}
        />
      </div>
    )
  }

  // Get current user ID from auth context
  const currentUserId = user?.id ?? ''

  // Enrich members with role information using ownerId from API
  const enrichedMembers = enrichMembersWithRoles(
    viewModel.household.members,
    viewModel.household.ownerId,
    currentUserId
  )

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-8">
      {/* Success message */}
      {successMessage && (
        <div className="rounded-lg border border-green-500 bg-green-50 p-4 dark:bg-green-950">
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Header with title and actions */}
      <HouseholdHeader
        household={viewModel.household}
        userRole={viewModel.userRole}
        hasOwnHousehold={viewModel.hasOwnHousehold}
        ownHouseholdName={viewModel.ownedHousehold?.name}
        onEditName={() => setIsEditNameModalOpen(true)}
        onReturnOrCreate={() => setIsReturnOrCreateModalOpen(true)}
      />

      {/* Household info card */}
      <HouseholdInfoCard household={viewModel.household} userRole={viewModel.userRole} />

      {/* Members list */}
      <MembersList
        members={enrichedMembers}
        currentUserId={currentUserId}
        userRole={viewModel.userRole}
      />

      {/* Invitations section */}
      <HouseholdInvitationsSection
        householdId={viewModel.household.id}
        userRole={viewModel.userRole}
        className="mt-8"
      />

      {/* Modals */}
      <EditHouseholdNameModal
        open={isEditNameModalOpen}
        currentName={viewModel.household.name}
        householdId={viewModel.household.id}
        onOpenChange={setIsEditNameModalOpen}
        onSuccess={handleEditNameSuccess}
      />

      <ReturnOrCreateHouseholdModal
        open={isReturnOrCreateModalOpen}
        currentHouseholdName={viewModel.household.name}
        hasOwnHousehold={viewModel.hasOwnHousehold}
        ownHouseholdName={viewModel.ownedHousehold?.name}
        onOpenChange={setIsReturnOrCreateModalOpen}
        onSuccess={handleReturnOrCreateSuccess}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Mail, Calendar, X } from 'lucide-react'
import type { Invitation } from '@/types/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface SentInvitationItemProps {
  invitation: Invitation
  householdId: string
  onDeleted?: (invitationId: string) => void
}

/**
 * Component displaying a single sent invitation with details and cancel functionality
 * Shows: invited email, creation date, expiration date, and cancel button
 * Requires confirmation dialog before cancellation
 * Used in: SentInvitationsList
 */
export function SentInvitationItem({
  invitation,
  householdId,
  onDeleted,
}: SentInvitationItemProps): JSX.Element {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCancel = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/households/${householdId}/invitations/${invitation.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDeleted?.(invitation.id)
      } else {
        // Handle error - could show a toast here
        console.error('Failed to cancel invitation')
      }
    } catch (error) {
      console.error('Error canceling invitation:', error)
    } finally {
      setIsDeleting(false)
      setIsDialogOpen(false)
    }
  }

  const createdDate = new Date(invitation.createdAt)
  const expiresDate = new Date(invitation.expiresAt)

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {/* Invited Email */}
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{invitation.invitedEmail}</p>
              </div>
            </div>

            {/* Creation Date */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Sent {formatDistanceToNow(createdDate, { addSuffix: true })}</span>
            </div>

            {/* Expiration Date */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Expires {formatDistanceToNow(expiresDate, { addSuffix: true })}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            disabled={isDeleting}
            className="w-full"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel Invitation
          </Button>
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation for{' '}
              <strong>{invitation.invitedEmail}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Canceling...' : 'Yes, Cancel Invitation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

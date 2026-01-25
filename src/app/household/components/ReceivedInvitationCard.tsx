'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Mail, User, Calendar, Check } from 'lucide-react'
import type { InvitationWithHousehold } from '@/types/types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

interface ReceivedInvitationCardProps {
  invitation: InvitationWithHousehold
  onAccepted?: (householdId: string) => void
}

/**
 * Card component displaying a received invitation with household context
 * Shows: household name, owner email, invited email, expiration date, and accept button
 * Optionally shows confirmation dialog before acceptance
 * Used in: ReceivedInvitationsList
 */
export function ReceivedInvitationCard({
  invitation,
  onAccepted,
}: ReceivedInvitationCardProps): JSX.Element {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async () => {
    setIsAccepting(true)
    setError(null)

    try {
      const response = await fetch(`/api/invitations/${invitation.token}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: invitation.token }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        let errorMessage = 'Failed to accept invitation'

        switch (response.status) {
          case 400:
            errorMessage = 'This invitation has expired'
            break
          case 403:
            errorMessage = 'This invitation is not for you'
            break
          case 404:
            errorMessage = 'Invitation not found'
            break
          case 409:
            errorMessage = 'You are already a member of this household'
            break
          default:
            errorMessage = errorData.error?.message || errorMessage
        }

        setError(errorMessage)
        return
      }

      // Success - notify parent component
      onAccepted?.(invitation.householdId)
      setIsDialogOpen(false)
    } catch (err) {
      console.error('Error accepting invitation:', err)
      setError('An unexpected error occurred while accepting the invitation')
    } finally {
      setIsAccepting(false)
    }
  }

  const expiresDate = new Date(invitation.expiresAt)

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl">{invitation.householdName}</CardTitle>
          <CardDescription>You have been invited to join this household</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 space-y-3">
          {/* Owner Email */}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Owner:</span>
            <span className="font-medium">{invitation.ownerEmail}</span>
          </div>

          {/* Invited Email - for verification */}
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Invited:</span>
            <span className="font-medium">{invitation.invitedEmail}</span>
          </div>

          {/* Expiration Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Expires {formatDistanceToNow(expiresDate, { addSuffix: true })}</span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
        </CardContent>

        <CardFooter>
          <Button onClick={() => setIsDialogOpen(true)} disabled={isAccepting} className="w-full">
            <Check className="mr-2 h-4 w-4" />
            Accept Invitation
          </Button>
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Join Household?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to join the household{' '}
              <strong>{invitation.householdName}</strong>? You will be able to collaborate with
              other members on recipes and shopping lists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAccepting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAccept} disabled={isAccepting}>
              {isAccepting ? 'Joining...' : 'Yes, Join Household'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

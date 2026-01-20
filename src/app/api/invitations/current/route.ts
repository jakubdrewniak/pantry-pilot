import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'

import { authenticateRequest } from '@/lib/api-auth'
import { InvitationService } from '@/lib/services/invitation.service'
import type { CurrentUserInvitationsResponse } from '@/types/types'
import { Database } from '@/db/database.types'

/**
 * GET /api/invitations/current
 *
 * Retrieves all pending invitations for the authenticated user's email.
 * Allows users to discover invitations without needing the token upfront.
 *
 * Headers:
 * - Cookie-based authentication (automatic)
 *
 * Response:
 * - 200 OK: Returns CurrentUserInvitationsResponse with invitations
 * - 401 Unauthorized: Missing or invalid authentication
 * - 500 Internal Server Error: Unexpected server error
 *
 * Authorization: Any authenticated user (retrieves their own invitations only)
 *
 * Security:
 * - User can only see invitations sent to their email
 * - Requires authentication to prevent enumeration
 * - Returns tokens needed for acceptance
 * - Only returns non-expired pending invitations
 *
 * Response includes household context:
 * - Household name (helpful for user to identify which household)
 * - Owner email (shows who invited them)
 * - Token (enables immediate acceptance without external communication)
 * - Expiration date (shows urgency)
 *
 * Use Cases:
 * - User logs in and app automatically checks for invitations
 * - App displays notification: "You have N pending invitations"
 * - User can accept invitation with one click (token included in response)
 * - Works even if invitation email was lost or went to spam
 *
 * Benefits over token-first approach:
 * - No external token management needed
 * - Self-service discovery
 * - More secure (no token transmission via insecure channels)
 * - Better UX (notification-like experience)
 * - Enables in-app notification badges
 *
 * Example Response:
 * {
 *   "data": [
 *     {
 *       "id": "invitation-uuid",
 *       "householdId": "household-uuid",
 *       "householdName": "Alice's Kitchen",
 *       "ownerEmail": "alice@example.com",
 *       "invitedEmail": "bob@example.com",
 *       "token": "xyz-789",
 *       "expiresAt": "2026-01-27T12:00:00Z",
 *       "createdAt": "2026-01-20T12:00:00Z"
 *     }
 *   ]
 * }
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/invitation.service.ts - business logic
 */
export async function GET(
  request: NextRequest
): Promise<
  NextResponse<
    CurrentUserInvitationsResponse | { error: string; message?: string; details?: unknown }
  >
> {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>
    // After this point, user and supabase are guaranteed to be non-null

    // ========================================================================
    // 2. BUSINESS LOGIC - GET CURRENT USER'S INVITATIONS
    // ========================================================================

    const invitationService = new InvitationService(supabase as unknown as SupabaseClient<Database>)
    const invitations = await invitationService.listCurrentUserInvitations(user!.id)

    // ========================================================================
    // 3. SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(
      {
        data: invitations,
      },
      { status: 200 }
    )
  } catch (error) {
    // ========================================================================
    // 4. GLOBAL ERROR HANDLER
    // ========================================================================

    console.error('[GET /api/invitations/current] Unexpected error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

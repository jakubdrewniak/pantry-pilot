import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'

import { authenticateRequest } from '@/lib/api-auth'
import {
  InvitationService,
  HouseholdNotFoundError,
  NotOwnerError,
  InvitationNotFoundError,
} from '@/lib/services/invitation.service'
import { HouseholdIdParamSchema, InvitationIdParamSchema } from '@/lib/validation/invitations'
import { Database } from '@/db/database.types'

/**
 * DELETE /api/households/{householdId}/invitations/{id}
 *
 * Cancels a pending invitation.
 * Deletes the invitation record from the database.
 *
 * Headers:
 * - Cookie-based authentication (automatic)
 *
 * Parameters:
 * - householdId: UUID of the household (URL parameter)
 * - id: UUID of the invitation (URL parameter)
 *
 * Response:
 * - 204 No Content: Invitation cancelled successfully (empty response body)
 * - 400 Bad Request: Invalid UUID format for household or invitation ID
 * - 401 Unauthorized: Missing or invalid authentication
 * - 403 Forbidden: User is not the household owner
 * - 404 Not Found: Invitation or household not found
 * - 500 Internal Server Error: Unexpected server error
 *
 * Authorization: Only the household owner can cancel invitations.
 *
 * Security:
 * - Verifies household ownership before allowing cancellation
 * - Ensures invitation belongs to the specified household
 * - Prevents unauthorized cancellation attempts
 *
 * Business Rules:
 * - Only household owners can cancel invitations
 * - Invitation must belong to the specified household
 * - Cancellation is permanent (record deleted, not just status updated)
 *
 * Flow:
 * 1. Authenticate user
 * 2. Validate householdId and invitation id from URL params
 * 3. Cancel invitation via service layer (checks ownership and existence)
 * 4. Return 204 No Content on success
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/invitation.service.ts - business logic
 * @see src/lib/validation/invitations.ts - validation schemas
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { householdId: string; id: string } }
): Promise<NextResponse<void | { error: string; message?: string; details?: unknown }>> {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>
    // After this point, user and supabase are guaranteed to be non-null

    // ========================================================================
    // 2. VALIDATE URL PARAMETERS
    // ========================================================================

    // Validate householdId
    const householdIdValidation = HouseholdIdParamSchema.safeParse(params.householdId)

    if (!householdIdValidation.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid household ID format',
          details: householdIdValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    // Validate invitation id
    const invitationIdValidation = InvitationIdParamSchema.safeParse(params.id)

    if (!invitationIdValidation.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid invitation ID format',
          details: invitationIdValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const householdId = householdIdValidation.data
    const invitationId = invitationIdValidation.data

    // ========================================================================
    // 3. BUSINESS LOGIC - CANCEL INVITATION
    // ========================================================================

    const invitationService = new InvitationService(supabase as unknown as SupabaseClient<Database>)
    await invitationService.cancelInvitation(householdId, invitationId, user!.id)

    // ========================================================================
    // 4. SUCCESS RESPONSE - 204 NO CONTENT
    // ========================================================================

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    // ========================================================================
    // 5. ERROR HANDLING - MAP SERVICE ERRORS TO HTTP STATUS CODES
    // ========================================================================

    if (error instanceof HouseholdNotFoundError) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      )
    }

    if (error instanceof NotOwnerError) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: error.message,
        },
        { status: 403 }
      )
    }

    if (error instanceof InvitationNotFoundError) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      )
    }

    // ========================================================================
    // 6. GLOBAL ERROR HANDLER
    // ========================================================================

    console.error(
      '[DELETE /api/households/{householdId}/invitations/{id}] Unexpected error:',
      error
    )

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

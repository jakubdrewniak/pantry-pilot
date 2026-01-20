import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'

import { authenticateRequest } from '@/lib/api-auth'
import {
  InvitationService,
  InvitationNotFoundError,
  InvitationExpiredError,
  InvitationAlreadyUsedError,
  InvitationEmailMismatchError,
  AlreadyMemberError,
} from '@/lib/services/invitation.service'
import { TokenParamSchema, AcceptInvitationSchema } from '@/lib/validation/invitations'
import type { AcceptInvitationResponse } from '@/types/types'
import { Database } from '@/db/database.types'

/**
 * PATCH /api/invitations/{token}/accept
 *
 * Accepts a pending invitation and creates household membership.
 * Single-use tokens with expiration validation.
 *
 * Headers:
 * - Cookie-based authentication (automatic)
 * - Content-Type: application/json
 *
 * Parameters:
 * - token: Invitation token (URL parameter)
 *
 * Request Body:
 * - token: string (invitation token, same as URL parameter for verification)
 *
 * Response:
 * - 200 OK: Returns AcceptInvitationResponse with membership details
 * - 400 Bad Request: Invalid token format, expired token, or already used
 * - 401 Unauthorized: Missing or invalid authentication
 * - 403 Forbidden: Invitation email doesn't match authenticated user's email
 * - 404 Not Found: Token not found
 * - 409 Conflict: User is already a member of the household
 * - 500 Internal Server Error: Unexpected server error
 *
 * Authorization: Any authenticated user can accept an invitation if the email matches.
 *
 * Security:
 * - Validates token exists and is pending
 * - Checks expiration date
 * - Verifies invitation email matches authenticated user's email
 * - Prevents duplicate memberships
 * - Token is single-use (status updated to 'accepted')
 *
 * Business Rules:
 * - Token must be pending (not already accepted or cancelled)
 * - Token must not be expired
 * - Invitation email must match authenticated user's email
 * - User cannot already be a member of the household
 *
 * Flow:
 * 1. Authenticate user
 * 2. Validate token from URL params
 * 3. Validate request body (optional, contains same token)
 * 4. Accept invitation via service layer
 * 5. Return membership details
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/invitation.service.ts - business logic
 * @see src/lib/validation/invitations.ts - validation schemas
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string } }
): Promise<
  NextResponse<AcceptInvitationResponse | { error: string; message?: string; details?: unknown }>
> {
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

    const tokenValidation = TokenParamSchema.safeParse(params.token)

    if (!tokenValidation.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid token format',
          details: tokenValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const token = tokenValidation.data

    // ========================================================================
    // 3. PARSE & VALIDATE REQUEST BODY (OPTIONAL)
    // ========================================================================
    // Note: The spec includes token in both URL and body. We primarily use
    // the URL parameter, but validate the body if provided for consistency.

    let body: unknown
    try {
      body = await request.json()
    } catch {
      // Body is optional, so ignore parse errors
      body = {}
    }

    // Validate body if it contains data
    if (body && typeof body === 'object' && Object.keys(body).length > 0) {
      const bodyValidation = AcceptInvitationSchema.safeParse(body)

      if (!bodyValidation.success) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: bodyValidation.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        )
      }

      // Verify token in body matches URL parameter (if provided)
      if (bodyValidation.data.token && bodyValidation.data.token !== token) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'Token in body does not match URL parameter',
          },
          { status: 400 }
        )
      }
    }

    // ========================================================================
    // 4. BUSINESS LOGIC - ACCEPT INVITATION
    // ========================================================================

    const invitationService = new InvitationService(supabase as unknown as SupabaseClient<Database>)
    const membership = await invitationService.acceptInvitation(token, user!.id)

    // ========================================================================
    // 5. SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(
      {
        membership,
      },
      { status: 200 }
    )
  } catch (error) {
    // ========================================================================
    // 6. ERROR HANDLING - MAP SERVICE ERRORS TO HTTP STATUS CODES
    // ========================================================================

    if (error instanceof InvitationNotFoundError) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      )
    }

    if (error instanceof InvitationExpiredError) {
      return NextResponse.json(
        {
          error: 'EXPIRED_TOKEN',
          message: error.message,
        },
        { status: 400 }
      )
    }

    if (error instanceof InvitationAlreadyUsedError) {
      return NextResponse.json(
        {
          error: 'INVALID_TOKEN',
          message: error.message,
        },
        { status: 400 }
      )
    }

    if (error instanceof InvitationEmailMismatchError) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: error.message,
        },
        { status: 403 }
      )
    }

    if (error instanceof AlreadyMemberError) {
      return NextResponse.json(
        {
          error: 'CONFLICT',
          message: error.message,
        },
        { status: 409 }
      )
    }

    // ========================================================================
    // 7. GLOBAL ERROR HANDLER
    // ========================================================================

    console.error('[PATCH /api/invitations/{token}/accept] Unexpected error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

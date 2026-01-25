import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'

import { authenticateRequest } from '@/lib/api-auth'
import {
  InvitationService,
  HouseholdNotFoundError,
  NotMemberError,
  NotOwnerError,
  AlreadyMemberError,
  InvitationAlreadyExistsError,
} from '@/lib/services/invitation.service'
import { HouseholdIdParamSchema, CreateInvitationSchema } from '@/lib/validation/invitations'
import type { InvitationsListResponse, CreateInvitationResponse } from '@/types/types'
import { Database } from '@/db/database.types'

/**
 * GET /api/households/{householdId}/invitations
 *
 * Retrieves all pending invitations for a household.
 * Returns only invitations with status = 'pending'.
 *
 * Headers:
 * - Cookie-based authentication (automatic)
 *
 * Parameters:
 * - householdId: UUID of the household (URL parameter)
 *
 * Response:
 * - 200 OK: Returns InvitationsListResponse with array of invitations
 * - 401 Unauthorized: Missing or invalid authentication
 * - 403 Forbidden: User is not a member of the household
 * - 404 Not Found: Household not found
 * - 500 Internal Server Error: Unexpected server error
 *
 * Authorization: User must be a member (owner or regular member) of the household.
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/invitation.service.ts - business logic
 * @see src/lib/validation/invitations.ts - validation schemas
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ householdId: string }> }
): Promise<
  NextResponse<InvitationsListResponse | { error: string; message?: string; details?: unknown }>
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

    const { householdId: householdIdParam } = await params
    const householdIdValidation = HouseholdIdParamSchema.safeParse(householdIdParam)

    if (!householdIdValidation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Invalid household ID format',
          details: householdIdValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const householdId = householdIdValidation.data

    // ========================================================================
    // 3. BUSINESS LOGIC - LIST INVITATIONS
    // ========================================================================

    const invitationService = new InvitationService(supabase as unknown as SupabaseClient<Database>)
    const invitations = await invitationService.listInvitations(householdId, user!.id)

    // ========================================================================
    // 4. SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(
      {
        data: invitations,
      },
      { status: 200 }
    )
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

    if (error instanceof NotMemberError) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: error.message,
        },
        { status: 403 }
      )
    }

    // ========================================================================
    // 6. GLOBAL ERROR HANDLER
    // ========================================================================

    console.error('[GET /api/households/{householdId}/invitations] Unexpected error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/households/{householdId}/invitations
 *
 * Creates a new invitation for a household.
 * Generates a cryptographically secure token with 7-day expiration.
 *
 * Headers:
 * - Cookie-based authentication (automatic)
 * - Content-Type: application/json
 *
 * Parameters:
 * - householdId: UUID of the household (URL parameter)
 *
 * Request Body:
 * - invitedEmail: string (valid email, max 255 characters, converted to lowercase)
 *
 * Response:
 * - 201 Created: Returns CreateInvitationResponse with invitation details
 * - 400 Bad Request: Invalid input data
 * - 401 Unauthorized: Missing or invalid authentication
 * - 403 Forbidden: User is not the household owner
 * - 404 Not Found: Household not found
 * - 409 Conflict: User already member or invitation already exists
 * - 500 Internal Server Error: Unexpected server error
 *
 * Authorization: Only the household owner can create invitations.
 *
 * Security:
 * - Token generated using crypto.randomUUID() (cryptographically secure)
 * - Expiration set to 7 days from creation
 * - Prevents duplicate invitations and memberships
 * - Generic error messages to prevent email enumeration
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/invitation.service.ts - business logic
 * @see src/lib/validation/invitations.ts - validation schemas
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ householdId: string }> }
): Promise<
  NextResponse<CreateInvitationResponse | { error: string; message?: string; details?: unknown }>
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

    const { householdId: householdIdParam } = await params
    const householdIdValidation = HouseholdIdParamSchema.safeParse(householdIdParam)

    if (!householdIdValidation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Invalid household ID format',
          details: householdIdValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const householdId = householdIdValidation.data

    // ========================================================================
    // 3. PARSE & VALIDATE REQUEST BODY
    // ========================================================================

    // Parse JSON body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid JSON format',
        },
        { status: 400 }
      )
    }

    // Validate with Zod schema
    const validationResult = CreateInvitationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const { invitedEmail } = validationResult.data

    // ========================================================================
    // 4. BUSINESS LOGIC - CREATE INVITATION
    // ========================================================================

    const invitationService = new InvitationService(supabase as unknown as SupabaseClient<Database>)
    const invitation = await invitationService.createInvitation(householdId, invitedEmail, user!.id)

    // ========================================================================
    // 5. SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(
      {
        invitation,
      },
      { status: 201 }
    )
  } catch (error) {
    // ========================================================================
    // 6. ERROR HANDLING - MAP SERVICE ERRORS TO HTTP STATUS CODES
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

    if (error instanceof AlreadyMemberError) {
      return NextResponse.json(
        {
          error: 'CONFLICT',
          message: error.message,
        },
        { status: 409 }
      )
    }

    if (error instanceof InvitationAlreadyExistsError) {
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

    console.error('[POST /api/households/{householdId}/invitations] Unexpected error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'

import { authenticateRequest } from '@/lib/api-auth'
import {
  HouseholdService,
  HouseholdNotFoundError,
  NotOwnerError,
  AlreadyMemberError,
} from '@/lib/services/household.service'
import { InviteMemberSchema, UUIDSchema } from '@/lib/validation/households'
import type { MembersListResponse, InviteMemberResponse } from '@/types/types'
import { Database } from '@/db/database.types'
import { createAdminClient } from '@/db/supabase.server'

/**
 * Route params type
 */
interface RouteParams {
  params: Promise<{
    householdId: string
  }>
}

/**
 * GET /api/households/{householdId}/members
 *
 * Lists all members of a household.
 * User must be a member of the household to view the list.
 *
 * Path Parameters:
 * - householdId: UUID v4
 *
 * Headers:
 * - Cookie-based authentication (automatic)
 *
 * Response:
 * - 200 OK: Returns MembersListResponse with array of User objects
 * - 400 Bad Request: Invalid UUID format
 * - 401 Unauthorized: Missing or invalid authentication
 * - 404 Not Found: Household doesn't exist OR user is not a member (security)
 * - 500 Internal Server Error: Unexpected server error
 *
 * Security:
 * - Returns 404 for both "not found" and "not authorized" to prevent information leakage
 * - Only household members can view the member list
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/household.service.ts - business logic
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<
  NextResponse<MembersListResponse | { error: string; message?: string; details?: unknown }>
> {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>
    // After this point, user and supabase are guaranteed to be non-null

    // ========================================================================
    // 2. VALIDATE PATH PARAMETERS
    // ========================================================================

    const { householdId } = await params

    // Validate UUID format
    const uuidValidation = UUIDSchema.safeParse(householdId)
    if (!uuidValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid household ID format',
        },
        { status: 400 }
      )
    }

    // ========================================================================
    // 3. BUSINESS LOGIC - LIST MEMBERS
    // ========================================================================

    const adminClient = createAdminClient()
    const householdService = new HouseholdService(
      supabase as unknown as SupabaseClient<Database>,
      adminClient as unknown as SupabaseClient<Database>
    )
    const members = await householdService.listMembers(householdId, user!.id)

    // ========================================================================
    // 4. SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(
      {
        data: members,
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
          error: 'Not Found',
          message: error.message,
        },
        { status: 404 }
      )
    }

    // ========================================================================
    // 6. GLOBAL ERROR HANDLER
    // ========================================================================

    console.error('[GET /api/households/{householdId}/members] Unexpected error:', error)

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
 * POST /api/households/{householdId}/members
 *
 * Creates an invitation to join the household.
 * Only the household owner can invite new members.
 *
 * Path Parameters:
 * - householdId: UUID v4
 *
 * Headers:
 * - Cookie-based authentication (automatic)
 * - Content-Type: application/json
 *
 * Request Body:
 * - invitedEmail: string (valid email, max 255 chars, lowercase, trimmed)
 *
 * Response:
 * - 201 Created: Returns InviteMemberResponse with invitation details
 * - 400 Bad Request: Invalid UUID format or invalid email
 * - 401 Unauthorized: Missing or invalid authentication
 * - 403 Forbidden: User is not the household owner
 * - 404 Not Found: Household doesn't exist OR user is not a member (security)
 * - 409 Conflict: Invited user is already a member
 * - 500 Internal Server Error: Unexpected server error
 *
 * Authorization:
 * - Only the household owner (owner_id) can invite members
 * - Members cannot invite other members
 *
 * Business Logic:
 * - Generates a unique invitation token (UUID)
 * - Sets expiration date (7 days from creation)
 * - Stores invitation in database
 * - TODO: Sends invitation email to invitedEmail
 *
 * Invitation Acceptance:
 * - Handled by separate endpoint (to be implemented)
 * - User clicks link in email → accepts invitation → joins household
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/household.service.ts - business logic
 * @see src/lib/validation/households.ts - InviteMemberSchema
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<
  NextResponse<InviteMemberResponse | { error: string; message?: string; details?: unknown }>
> {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>
    // After this point, user and supabase are guaranteed to be non-null

    // ========================================================================
    // 2. VALIDATE PATH PARAMETERS
    // ========================================================================

    const { householdId } = await params

    // Validate UUID format
    const uuidValidation = UUIDSchema.safeParse(householdId)
    if (!uuidValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid household ID format',
        },
        { status: 400 }
      )
    }

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
    const validationResult = InviteMemberSchema.safeParse(body)

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
    // 4. BUSINESS LOGIC - INVITE MEMBER
    // ========================================================================

    const adminClient = createAdminClient()
    const householdService = new HouseholdService(
      supabase as unknown as SupabaseClient<Database>,
      adminClient as unknown as SupabaseClient<Database>
    )
    const invitation = await householdService.inviteMember(householdId, user!.id, invitedEmail)

    // ========================================================================
    // 5. SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(
      {
        invitation,
      },
      {
        status: 201,
        headers: {
          Location: `/api/households/${householdId}/invitations/${invitation.id}`,
        },
      }
    )
  } catch (error) {
    // ========================================================================
    // 6. ERROR HANDLING - MAP SERVICE ERRORS TO HTTP STATUS CODES
    // ========================================================================

    if (error instanceof HouseholdNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
        },
        { status: 404 }
      )
    }

    if (error instanceof NotOwnerError) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: error.message,
        },
        { status: 403 }
      )
    }

    if (error instanceof AlreadyMemberError) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: error.message,
        },
        { status: 409 }
      )
    }

    // ========================================================================
    // 7. GLOBAL ERROR HANDLER
    // ========================================================================

    console.error('[POST /api/households/{householdId}/members] Unexpected error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

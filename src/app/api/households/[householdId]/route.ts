import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'

import { authenticateRequest } from '@/lib/api-auth'
import {
  HouseholdService,
  HouseholdNotFoundError,
  NotOwnerError,
  HasOtherMembersError,
} from '@/lib/services/household.service'
import { HouseholdNameSchema, UUIDSchema } from '@/lib/validation/households'
import type { GetHouseholdResponse, Household } from '@/types/types'
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
 * GET /api/households/{householdId}
 *
 * Retrieves detailed information about a specific household including members.
 * User must be a member of the household to view it.
 *
 * Path Parameters:
 * - householdId: UUID v4
 *
 * Headers:
 * - Cookie-based authentication (automatic)
 *
 * Response:
 * - 200 OK: Returns HouseholdWithMembers (household details with members array)
 * - 400 Bad Request: Invalid UUID format
 * - 401 Unauthorized: Missing or invalid authentication
 * - 404 Not Found: Household doesn't exist OR user is not a member (security)
 * - 500 Internal Server Error: Unexpected server error
 *
 * Security:
 * - Returns 404 for both "not found" and "not authorized" to prevent information leakage
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/household.service.ts - business logic
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<
  NextResponse<GetHouseholdResponse | { error: string; message?: string; details?: unknown }>
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
    // 3. BUSINESS LOGIC - GET HOUSEHOLD WITH MEMBERS
    // ========================================================================

    const adminClient = createAdminClient()
    const householdService = new HouseholdService(
      supabase as unknown as SupabaseClient<Database>,
      adminClient as unknown as SupabaseClient<Database>
    )
    const household = await householdService.getHousehold(householdId, user!.id)

    // ========================================================================
    // 4. SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(household, { status: 200 })
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

    console.error('[GET /api/households/{householdId}] Unexpected error:', error)

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
 * PATCH /api/households/{householdId}
 *
 * Updates household name. Only the household owner can rename the household.
 *
 * Path Parameters:
 * - householdId: UUID v4
 *
 * Headers:
 * - Cookie-based authentication (automatic)
 * - Content-Type: application/json
 *
 * Request Body:
 * - name: string (3-50 characters, trimmed)
 *
 * Response:
 * - 200 OK: Returns updated Household
 * - 400 Bad Request: Invalid UUID format or invalid input data
 * - 401 Unauthorized: Missing or invalid authentication
 * - 403 Forbidden: User is not the household owner
 * - 404 Not Found: Household doesn't exist OR user is not a member (security)
 * - 500 Internal Server Error: Unexpected server error
 *
 * Authorization:
 * - Only the household owner (owner_id) can rename
 * - Members cannot rename the household
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/household.service.ts - business logic
 * @see src/lib/validation/households.ts - HouseholdNameSchema
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<Household | { error: string; message?: string; details?: unknown }>> {
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
    const validationResult = HouseholdNameSchema.safeParse(body)

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

    const { name } = validationResult.data

    // ========================================================================
    // 4. BUSINESS LOGIC - UPDATE HOUSEHOLD
    // ========================================================================

    const adminClient = createAdminClient()
    const householdService = new HouseholdService(
      supabase as unknown as SupabaseClient<Database>,
      adminClient as unknown as SupabaseClient<Database>
    )
    const household = await householdService.updateHousehold(householdId, user!.id, name)

    // ========================================================================
    // 5. SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(household, { status: 200 })
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

    // ========================================================================
    // 7. GLOBAL ERROR HANDLER
    // ========================================================================

    console.error('[PATCH /api/households/{householdId}] Unexpected error:', error)

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
 * DELETE /api/households/{householdId}
 *
 * Deletes a household and all associated resources (cascade).
 * Only the household owner can delete, and only if there are no other members.
 *
 * Path Parameters:
 * - householdId: UUID v4
 *
 * Headers:
 * - Cookie-based authentication (automatic)
 *
 * Response:
 * - 204 No Content: Household successfully deleted (no response body)
 * - 400 Bad Request: Invalid UUID format
 * - 401 Unauthorized: Missing or invalid authentication
 * - 403 Forbidden: User is not the household owner
 * - 404 Not Found: Household doesn't exist OR user is not a member (security)
 * - 409 Conflict: Household has other members (must leave first)
 * - 500 Internal Server Error: Unexpected server error
 *
 * Authorization:
 * - Only the household owner (owner_id) can delete
 * - Household must have no other members
 *
 * Cascade Deletion (handled by database):
 * - Pantries and pantry items
 * - Recipes
 * - Shopping lists and items
 * - Household invitations
 * - User household memberships
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/household.service.ts - business logic
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<void | { error: string; message?: string; details?: unknown }>> {
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
    // 3. BUSINESS LOGIC - DELETE HOUSEHOLD
    // ========================================================================

    const adminClient = createAdminClient()
    const householdService = new HouseholdService(
      supabase as unknown as SupabaseClient<Database>,
      adminClient as unknown as SupabaseClient<Database>
    )
    await householdService.deleteHousehold(householdId, user!.id)

    // ========================================================================
    // 4. SUCCESS RESPONSE
    // ========================================================================

    // 204 No Content - no response body
    return new NextResponse(null, { status: 204 })
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

    if (error instanceof NotOwnerError) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: error.message,
        },
        { status: 403 }
      )
    }

    if (error instanceof HasOtherMembersError) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: error.message,
        },
        { status: 409 }
      )
    }

    // ========================================================================
    // 6. GLOBAL ERROR HANDLER
    // ========================================================================

    console.error('[DELETE /api/households/{householdId}] Unexpected error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

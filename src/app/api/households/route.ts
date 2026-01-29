import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'

import { authenticateRequest } from '@/lib/api-auth'
import { HouseholdService, AlreadyActiveMemberError } from '@/lib/services/household.service'
import { HouseholdNameSchema } from '@/lib/validation/households'
import type { HouseholdsListResponse, CreateHouseholdResponse } from '@/types/types'
import { Database } from '@/db/database.types'

/**
 * GET /api/households
 *
 * Retrieves the household that the authenticated user belongs to.
 * Returns a single household or empty array (1:1 constraint - one user = one household).
 *
 * Headers:
 * - Cookie-based authentication (automatic)
 *
 * Response:
 * - 200 OK: Returns HouseholdsListResponse with 0 or 1 household
 * - 401 Unauthorized: Missing or invalid authentication
 * - 500 Internal Server Error: Unexpected server error
 *
 * Note: Array format maintained for API consistency, but will always contain 0 or 1 element.
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/household.service.ts - business logic
 */
export async function GET(
  request: NextRequest
): Promise<
  NextResponse<HouseholdsListResponse | { error: string; message?: string; details?: unknown }>
> {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>
    // After this point, user and supabase are guaranteed to be non-null

    // ========================================================================
    // 2. BUSINESS LOGIC - GET USER'S HOUSEHOLD
    // ========================================================================

    const householdService = new HouseholdService(supabase as unknown as SupabaseClient<Database>)
    const household = await householdService.getUserHousehold(user!.id)

    // Get owned household ID (may be different from current membership)
    const ownedHouseholdId = await householdService.getOwnedHouseholdId(user!.id)

    // ========================================================================
    // 3. SUCCESS RESPONSE
    // ========================================================================

    // Return array with 0 or 1 element (1:1 constraint) + owned household ID
    return NextResponse.json(
      {
        data: household ? [household] : [],
        ownedHouseholdId,
      },
      { status: 200 }
    )
  } catch (error) {
    // ========================================================================
    // 4. GLOBAL ERROR HANDLER
    // ========================================================================

    console.error('[GET /api/households] Unexpected error:', error)

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
 * POST /api/households
 *
 * Rejoins user's own household or creates a new one.
 * - If user owns a household → rejoins it (returns 200)
 * - If user doesn't own a household → creates new one (returns 201)
 * Automatically removes user from current household in both scenarios.
 *
 * Headers:
 * - Cookie-based authentication (automatic)
 * - Content-Type: application/json
 *
 * Request Body:
 * - name: string (optional - required only when creating new, 3-50 characters, trimmed)
 *
 * Response:
 * - 200 OK: Rejoined owned household
 * - 201 Created: Created new household with Location header
 * - 400 Bad Request: Invalid input data or missing name for create
 * - 401 Unauthorized: Missing or invalid authentication
 * - 409 Conflict: User is already an active member of their own household
 * - 500 Internal Server Error: Unexpected server error
 *
 * Business Rules:
 * - Cannot rejoin if user is already active member of own household (409)
 * - Rejoin scenario: name is ignored, returns owned household
 * - Create scenario: name is required, creates new household with resources
 *
 * @see src/lib/api-auth.ts - authentication helper
 * @see src/lib/services/household.service.ts - business logic
 * @see src/lib/validation/households.ts - HouseholdNameSchema
 */
export async function POST(
  request: NextRequest
): Promise<
  NextResponse<CreateHouseholdResponse | { error: string; message?: string; details?: unknown }>
> {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>
    // After this point, user and supabase are guaranteed to be non-null

    // ========================================================================
    // 2. PARSE & VALIDATE REQUEST BODY
    // ========================================================================

    // Parse JSON body (empty body is OK for rejoin scenario)
    let body: unknown = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid JSON format',
        },
        { status: 400 }
      )
    }

    // Extract name (optional)
    const name = (body as any)?.name

    // ========================================================================
    // 3. BUSINESS LOGIC - REJOIN OR CREATE HOUSEHOLD
    // ========================================================================

    const householdService = new HouseholdService(supabase as unknown as SupabaseClient<Database>)

    let result: { household: any; rejoined: boolean }
    try {
      result = await householdService.rejoinOrCreateHousehold(user!.id, name)
    } catch (error: any) {
      // If name is missing for create scenario
      if (error.message === 'Name is required when creating a new household') {
        return NextResponse.json(
          {
            error: 'Bad Request',
            message: error.message,
          },
          { status: 400 }
        )
      }
      throw error
    }

    // Validate name only if creating new (not rejoining)
    if (!result.rejoined && name) {
      const validationResult = HouseholdNameSchema.safeParse({ name })
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
    }

    // ========================================================================
    // 4. SUCCESS RESPONSE
    // ========================================================================

    const response: CreateHouseholdResponse = {
      ...result.household,
      rejoined: result.rejoined,
    }

    if (result.rejoined) {
      // Rejoined existing household - 200 OK
      return NextResponse.json(response, { status: 200 })
    } else {
      // Created new household - 201 Created with Location header
      return NextResponse.json(response, {
        status: 201,
        headers: {
          Location: `/api/households/${result.household.id}`,
        },
      })
    }
  } catch (error) {
    // ========================================================================
    // 5. ERROR HANDLING - MAP SERVICE ERRORS TO HTTP STATUS CODES
    // ========================================================================

    if (error instanceof AlreadyActiveMemberError) {
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

    console.error('[POST /api/households] Unexpected error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

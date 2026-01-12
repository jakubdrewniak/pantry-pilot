import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'

import { authenticateRequest } from '@/lib/api-auth'
import { HouseholdService, AlreadyOwnerError } from '@/lib/services/household.service'
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

    // ========================================================================
    // 3. SUCCESS RESPONSE
    // ========================================================================

    // Return array with 0 or 1 element (1:1 constraint)
    return NextResponse.json(
      {
        data: household ? [household] : [],
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
 * Creates a new household for the authenticated user.
 * Only available if user is a member of someone else's household (not the owner).
 * Automatically removes user from previous household.
 *
 * Headers:
 * - Cookie-based authentication (automatic)
 * - Content-Type: application/json
 *
 * Request Body:
 * - name: string (3-50 characters, trimmed)
 *
 * Response:
 * - 201 Created: Returns the created Household with Location header
 * - 400 Bad Request: Invalid input data
 * - 401 Unauthorized: Missing or invalid authentication
 * - 409 Conflict: User already owns a household
 * - 500 Internal Server Error: Unexpected server error
 *
 * Business Rules:
 * - Cannot create if user is already an owner (409)
 * - Can create if user is a member of another household (will be removed from previous)
 * - Automatically creates pantry and shopping_list for new household
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
    // 3. BUSINESS LOGIC - CREATE HOUSEHOLD
    // ========================================================================

    const householdService = new HouseholdService(supabase as unknown as SupabaseClient<Database>)
    const household = await householdService.createHousehold(user!.id, name)

    // ========================================================================
    // 4. SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(household, {
      status: 201,
      headers: {
        Location: `/api/households/${household.id}`,
      },
    })
  } catch (error) {
    // ========================================================================
    // 5. ERROR HANDLING - MAP SERVICE ERRORS TO HTTP STATUS CODES
    // ========================================================================

    if (error instanceof AlreadyOwnerError) {
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

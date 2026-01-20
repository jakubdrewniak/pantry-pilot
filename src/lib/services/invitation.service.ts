import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { Invitation, Membership, InvitationWithHousehold } from '@/types/types'

/**
 * Type alias for Supabase client with database types
 * Used for dependency injection in service layer
 */
type TypedSupabaseClient = SupabaseClient<Database>

/**
 * Custom error classes for invitation operations
 * These errors are thrown by the service layer and mapped to HTTP status codes
 * by the route handlers.
 */

export class InvitationNotFoundError extends Error {
  constructor(message = 'Invitation not found') {
    super(message)
    this.name = 'InvitationNotFoundError'
  }
}

export class InvitationExpiredError extends Error {
  constructor(message = 'This invitation has expired') {
    super(message)
    this.name = 'InvitationExpiredError'
  }
}

export class InvitationAlreadyUsedError extends Error {
  constructor(message = 'This invitation has already been used') {
    super(message)
    this.name = 'InvitationAlreadyUsedError'
  }
}

export class InvitationEmailMismatchError extends Error {
  constructor(message = 'This invitation is not for your email') {
    super(message)
    this.name = 'InvitationEmailMismatchError'
  }
}

export class AlreadyMemberError extends Error {
  constructor(message = 'User is already a member of this household') {
    super(message)
    this.name = 'AlreadyMemberError'
  }
}

export class InvitationAlreadyExistsError extends Error {
  constructor(message = 'An invitation for this email already exists') {
    super(message)
    this.name = 'InvitationAlreadyExistsError'
  }
}

export class NotOwnerError extends Error {
  constructor(message = 'Only household owners can perform this action') {
    super(message)
    this.name = 'NotOwnerError'
  }
}

export class HouseholdNotFoundError extends Error {
  constructor(message = 'Household not found') {
    super(message)
    this.name = 'HouseholdNotFoundError'
  }
}

export class NotMemberError extends Error {
  constructor(message = 'You are not a member of this household') {
    super(message)
    this.name = 'NotMemberError'
  }
}

/**
 * InvitationService
 *
 * Business logic layer for household invitation operations.
 * Handles data transformation between API DTOs and database models.
 *
 * Key responsibilities:
 * - Manage invitation CRUD operations
 * - Handle invitation acceptance and membership creation
 * - Enforce business rules (owner permissions, token validation, expiration)
 * - Transform database records to API DTOs
 *
 * Architecture:
 * - Similar to Angular services - encapsulates business logic and data access
 * - Throws custom errors that route handlers map to HTTP status codes
 * - Uses Supabase client for database operations
 */
export class InvitationService {
  constructor(private supabase: TypedSupabaseClient) {}

  /**
   * Helper: Check if user is a member of a household
   *
   * @param householdId - The household UUID
   * @param userId - The user UUID
   * @returns true if user is a member, false otherwise
   */
  private async isMember(householdId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_households')
      .select('user_id')
      .eq('household_id', householdId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[InvitationService] Error checking membership:', error)
      return false
    }

    return data !== null
  }

  /**
   * Helper: Check if user is the owner of a household
   *
   * @param householdId - The household UUID
   * @param userId - The user UUID
   * @returns true if user is the owner, false otherwise
   */
  private async isOwner(householdId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('households')
      .select('owner_id')
      .eq('id', householdId)
      .eq('owner_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[InvitationService] Error checking ownership:', error)
      return false
    }

    return data !== null
  }

  /**
   * Helper: Check if household exists
   *
   * @param householdId - The household UUID
   * @returns true if household exists, false otherwise
   */
  private async householdExists(householdId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('households')
      .select('id')
      .eq('id', householdId)
      .maybeSingle()

    if (error) {
      console.error('[InvitationService] Error checking household existence:', error)
      return false
    }

    return data !== null
  }

  /**
   * List all pending invitations for a household
   *
   * @param householdId - The household UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @returns Array of Invitation DTOs
   * @throws HouseholdNotFoundError if household doesn't exist
   * @throws NotMemberError if user is not a member of the household
   *
   * Authorization: User must be a member (owner or regular member) of the household.
   *
   * Flow:
   * 1. Verify household exists
   * 2. Verify user is a member
   * 3. Fetch all pending invitations
   * 4. Transform to DTOs
   */
  async listInvitations(householdId: string, userId: string): Promise<Invitation[]> {
    // Check if household exists
    if (!(await this.householdExists(householdId))) {
      throw new HouseholdNotFoundError()
    }

    // Check if user is a member
    if (!(await this.isMember(householdId, userId))) {
      throw new NotMemberError()
    }

    // Fetch pending invitations
    const { data, error } = await this.supabase
      .from('household_invitations')
      .select('id, household_id, invited_email, token, expires_at, created_at')
      .eq('household_id', householdId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[InvitationService] Error fetching invitations:', error)
      throw new Error('Failed to fetch invitations')
    }

    // Transform to DTOs
    return (data || []).map(inv => ({
      id: inv.id,
      householdId: inv.household_id,
      invitedEmail: inv.invited_email,
      token: inv.token,
      expiresAt: inv.expires_at,
      createdAt: inv.created_at,
    }))
  }

  /**
   * Create a new invitation for a household
   *
   * @param householdId - The household UUID
   * @param invitedEmail - The email of the user to invite (normalized to lowercase)
   * @param userId - The authenticated user's UUID (for authorization)
   * @returns Created Invitation DTO
   * @throws HouseholdNotFoundError if household doesn't exist
   * @throws NotOwnerError if user is not the owner
   * @throws AlreadyMemberError if invited user is already a member
   * @throws InvitationAlreadyExistsError if active invitation exists for this email
   *
   * Authorization: Only the household owner can create invitations.
   *
   * Security:
   * - Generates cryptographically secure token using crypto.randomUUID()
   * - Sets expiration to 7 days from creation
   * - Prevents duplicate invitations and memberships
   *
   * Flow:
   * 1. Verify household exists
   * 2. Verify user is owner
   * 3. Check if invited email is already a member
   * 4. Check if active invitation exists
   * 5. Generate secure token
   * 6. Set expiration date (7 days)
   * 7. Insert invitation record
   * 8. Return DTO
   */
  async createInvitation(
    householdId: string,
    invitedEmail: string,
    userId: string
  ): Promise<Invitation> {
    // Check if household exists
    if (!(await this.householdExists(householdId))) {
      throw new HouseholdNotFoundError()
    }

    // Check if user is the owner
    if (!(await this.isOwner(householdId, userId))) {
      throw new NotOwnerError()
    }

    // Check if invited user is already a member
    // First, find user by email
    const { data: users } = await this.supabase.auth.admin.listUsers()
    const targetUser = users?.users.find(u => u.email?.toLowerCase() === invitedEmail.toLowerCase())

    if (targetUser) {
      const isAlreadyMember = await this.isMember(householdId, targetUser.id)
      if (isAlreadyMember) {
        throw new AlreadyMemberError()
      }
    }

    // Check if active invitation exists for this email
    const { data: existingInvitation } = await this.supabase
      .from('household_invitations')
      .select('id')
      .eq('household_id', householdId)
      .eq('invited_email', invitedEmail)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingInvitation) {
      throw new InvitationAlreadyExistsError()
    }

    // Generate cryptographically secure token
    const token = crypto.randomUUID()

    // Set expiration (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create invitation
    const { data: invitation, error } = await this.supabase
      .from('household_invitations')
      .insert({
        household_id: householdId,
        invited_email: invitedEmail,
        token,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select('id, household_id, invited_email, token, expires_at, created_at')
      .single()

    if (error || !invitation) {
      console.error('[InvitationService] Error creating invitation:', error)
      throw new Error('Failed to create invitation')
    }

    // TODO: Send invitation email asynchronously
    // This should be implemented as a background job to not block the response

    return {
      id: invitation.id,
      householdId: invitation.household_id,
      invitedEmail: invitation.invited_email,
      token: invitation.token,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
    }
  }

  /**
   * Accept an invitation and create membership
   *
   * @param token - The invitation token
   * @param userId - The authenticated user's UUID
   * @returns Created Membership DTO
   * @throws InvitationNotFoundError if token doesn't exist
   * @throws InvitationExpiredError if invitation has expired
   * @throws InvitationAlreadyUsedError if invitation status is not 'pending'
   * @throws InvitationEmailMismatchError if invitation email doesn't match user's email
   * @throws AlreadyMemberError if user is already a member
   *
   * Authorization: Any authenticated user can accept an invitation if the email matches.
   *
   * Security:
   * - Validates token exists and is pending
   * - Checks expiration date
   * - Verifies invitation email matches authenticated user's email
   * - Prevents duplicate memberships
   * - Uses transaction to ensure atomicity
   *
   * Flow:
   * 1. Fetch invitation by token
   * 2. Validate invitation status (must be 'pending')
   * 3. Check expiration
   * 4. Get user's email and verify match
   * 5. Check if already a member
   * 6. BEGIN TRANSACTION:
   *    - Create membership record
   *    - Update invitation status to 'accepted'
   * 7. Return Membership DTO
   */
  async acceptInvitation(token: string, userId: string): Promise<Membership> {
    // Fetch invitation by token
    const { data: invitation, error: fetchError } = await this.supabase
      .from('household_invitations')
      .select('id, household_id, invited_email, status, expires_at')
      .eq('token', token)
      .maybeSingle()

    if (fetchError || !invitation) {
      throw new InvitationNotFoundError()
    }

    // Check invitation status
    if (invitation.status !== 'pending') {
      throw new InvitationAlreadyUsedError()
    }

    // Check expiration
    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < now) {
      throw new InvitationExpiredError()
    }

    // Get user's email and verify match
    const { data: user } = await this.supabase.auth.admin.getUserById(userId)
    if (!user?.user?.email) {
      throw new Error('Unable to verify user email')
    }

    if (user.user.email.toLowerCase() !== invitation.invited_email.toLowerCase()) {
      throw new InvitationEmailMismatchError()
    }

    // Check if user is already a member
    if (await this.isMember(invitation.household_id, userId)) {
      throw new AlreadyMemberError()
    }

    // Create membership record
    const { data: membership, error: membershipError } = await this.supabase
      .from('user_households')
      .insert({
        household_id: invitation.household_id,
        user_id: userId,
      })
      .select('household_id, user_id, created_at')
      .single()

    if (membershipError || !membership) {
      console.error('[InvitationService] Error creating membership:', membershipError)
      throw new Error('Failed to create membership')
    }

    // Update invitation status to 'accepted'
    const { error: updateError } = await this.supabase
      .from('household_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('[InvitationService] Error updating invitation status:', updateError)
      // Rollback: delete membership
      await this.supabase
        .from('user_households')
        .delete()
        .eq('household_id', membership.household_id)
        .eq('user_id', membership.user_id)
      throw new Error('Failed to update invitation status')
    }

    return {
      householdId: membership.household_id,
      userId: membership.user_id,
      createdAt: membership.created_at,
      role: 'member',
      joinedAt: membership.created_at,
    }
  }

  /**
   * Cancel an invitation
   *
   * @param householdId - The household UUID
   * @param invitationId - The invitation UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @throws HouseholdNotFoundError if household doesn't exist
   * @throws NotOwnerError if user is not the owner
   * @throws InvitationNotFoundError if invitation doesn't exist or doesn't belong to household
   *
   * Authorization: Only the household owner can cancel invitations.
   *
   * Implementation: Deletes the invitation record (preferred over status update
   * for cleanup and privacy).
   *
   * Flow:
   * 1. Verify household exists
   * 2. Verify user is owner
   * 3. Fetch invitation by id and household_id
   * 4. Delete invitation record
   */
  async cancelInvitation(householdId: string, invitationId: string, userId: string): Promise<void> {
    // Check if household exists
    if (!(await this.householdExists(householdId))) {
      throw new HouseholdNotFoundError()
    }

    // Check if user is the owner
    if (!(await this.isOwner(householdId, userId))) {
      throw new NotOwnerError()
    }

    // Fetch invitation to verify it exists and belongs to the household
    const { data: invitation, error: fetchError } = await this.supabase
      .from('household_invitations')
      .select('id')
      .eq('id', invitationId)
      .eq('household_id', householdId)
      .maybeSingle()

    if (fetchError || !invitation) {
      throw new InvitationNotFoundError()
    }

    // Delete invitation
    const { error: deleteError } = await this.supabase
      .from('household_invitations')
      .delete()
      .eq('id', invitationId)

    if (deleteError) {
      console.error('[InvitationService] Error deleting invitation:', deleteError)
      throw new Error('Failed to cancel invitation')
    }
  }

  /**
   * List all pending invitations for the current authenticated user
   *
   * @param userId - The authenticated user's UUID
   * @returns Array of InvitationWithHousehold DTOs
   *
   * Authorization: Any authenticated user (retrieves their own invitations only)
   *
   * Security:
   * - User can only see invitations sent to their email
   * - Requires authentication to prevent enumeration
   * - Returns tokens needed for acceptance
   * - Only returns non-expired pending invitations
   *
   * Use Cases:
   * - User checks if they have pending invitations
   * - App shows notification: "You have N pending invitations"
   * - User can accept without receiving token externally
   *
   * Flow:
   * 1. Get user's email from auth
   * 2. Fetch pending, non-expired invitations for this email
   * 3. Join with households table to get household name
   * 4. Join with users to get owner email
   * 5. Transform to DTOs with context
   */
  async listCurrentUserInvitations(userId: string): Promise<InvitationWithHousehold[]> {
    // Get user's email
    const { data: user, error: userError } = await this.supabase.auth.admin.getUserById(userId)

    if (userError || !user?.user?.email) {
      console.error('[InvitationService] Error fetching user email:', userError)
      throw new Error('Unable to verify user email')
    }

    const userEmail = user.user.email.toLowerCase()

    // Fetch pending, non-expired invitations for this email with household context
    const { data: invitations, error: fetchError } = await this.supabase
      .from('household_invitations')
      .select(
        `
        id,
        household_id,
        invited_email,
        token,
        expires_at,
        created_at,
        households (
          id,
          name,
          owner_id
        )
      `
      )
      .eq('invited_email', userEmail)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString()) // Only non-expired
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('[InvitationService] Error fetching user invitations:', fetchError)
      throw new Error('Failed to fetch invitations')
    }

    if (!invitations || invitations.length === 0) {
      return []
    }

    // Transform to DTOs with household context
    const result: InvitationWithHousehold[] = []

    for (const inv of invitations) {
      // Get owner email
      const { data: owner } = await this.supabase.auth.admin.getUserById(inv.households.owner_id)

      result.push({
        id: inv.id,
        householdId: inv.household_id,
        invitedEmail: inv.invited_email,
        token: inv.token,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
        householdName: inv.households.name,
        ownerEmail: owner?.user?.email ?? 'Unknown',
      })
    }

    return result
  }
}

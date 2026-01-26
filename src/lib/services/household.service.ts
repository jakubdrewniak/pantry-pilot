import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { Household, HouseholdWithMembers, User, Invitation } from '@/types/types'

/**
 * Type alias for Supabase client with database types
 * Used for dependency injection in service layer
 */
type TypedSupabaseClient = SupabaseClient<Database>

/**
 * Custom error classes for household operations
 * These errors are thrown by the service layer and mapped to HTTP status codes
 * by the route handlers.
 */

export class HouseholdNotFoundError extends Error {
  constructor(message = 'Household not found') {
    super(message)
    this.name = 'HouseholdNotFoundError'
  }
}

export class NotOwnerError extends Error {
  constructor(message = 'Only the owner can perform this action') {
    super(message)
    this.name = 'NotOwnerError'
  }
}

export class AlreadyOwnerError extends Error {
  constructor(message = 'Already own a household') {
    super(message)
    this.name = 'AlreadyOwnerError'
  }
}

export class AlreadyMemberError extends Error {
  constructor(message = 'User is already a member') {
    super(message)
    this.name = 'AlreadyMemberError'
  }
}

export class HasOtherMembersError extends Error {
  constructor(message = 'Cannot delete household with other members') {
    super(message)
    this.name = 'HasOtherMembersError'
  }
}

/**
 * HouseholdService
 *
 * Business logic layer for household and membership operations.
 * Handles data transformation between API DTOs and database models.
 *
 * Key responsibilities:
 * - Manage household CRUD operations
 * - Handle membership and ownership logic
 * - Enforce business rules (one household per user, owner permissions)
 * - Transform database records to API DTOs
 *
 * Architecture:
 * - Similar to Angular services - encapsulates business logic and data access
 * - Throws custom errors that route handlers map to HTTP status codes
 * - Uses Supabase client for database operations
 */
export class HouseholdService {
  constructor(
    private supabase: TypedSupabaseClient,
    private adminClient?: TypedSupabaseClient
  ) {}

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
      console.error('[HouseholdService] Error checking membership:', error)
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
      console.error('[HouseholdService] Error checking ownership:', error)
      return false
    }

    return data !== null
  }

  /**
   * Helper: Get user's membership info
   *
   * @param userId - The user UUID
   * @returns Object with householdId and isOwner flag, or null if not a member
   */
  private async getUserMembership(
    userId: string
  ): Promise<{ householdId: string; isOwner: boolean } | null> {
    const { data, error } = await this.supabase
      .from('user_households')
      .select('household_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    const isOwner = await this.isOwner(data.household_id, userId)

    return {
      householdId: data.household_id,
      isOwner,
    }
  }

  /**
   * Get the household that the user belongs to
   *
   * @param userId - The authenticated user's UUID
   * @returns Household DTO with member count, or null if user has no household
   *
   * Note: Due to 1:1 constraint (one user = one household), this returns
   * a single household or null, but wrapped in an array for API consistency.
   */
  async getUserHousehold(userId: string): Promise<Household | null> {
    // Get household via user_households junction table
    const { data: membership, error: membershipError } = await this.supabase
      .from('user_households')
      .select('household_id')
      .eq('user_id', userId)
      .maybeSingle()

    console.log('[HouseholdService] getUserHousehold membership query:', {
      userId,
      membership,
      error: membershipError,
    })

    if (membershipError || !membership) {
      console.log('[HouseholdService] No membership found or error occurred')
      return null
    }

    // Get household details with member count
    const { data: household, error: householdError } = await this.supabase
      .from('households')
      .select(
        `
        id,
        name,
        created_at
      `
      )
      .eq('id', membership.household_id)
      .single()

    console.log('[HouseholdService] getUserHousehold households query:', {
      householdId: membership.household_id,
      household,
      error: householdError,
    })

    if (householdError || !household) {
      console.log('[HouseholdService] No household found or error occurred')
      return null
    }

    // Count members
    const { count } = await this.supabase
      .from('user_households')
      .select('*', { count: 'exact', head: true })
      .eq('household_id', household.id)

    return {
      id: household.id,
      name: household.name,
      createdAt: household.created_at,
      memberCount: count ?? 0,
    }
  }

  /**
   * Create a new household for the user
   *
   * Business rules:
   * - User cannot create a household if they already own one (409 Conflict)
   * - User can create a household if they are a member of someone else's household
   * - Creating a new household automatically removes user from previous household
   *
   * @param userId - The authenticated user's UUID
   * @param name - The household name (validated by Zod schema)
   * @returns The created Household DTO
   * @throws AlreadyOwnerError if user already owns a household
   *
   * Flow:
   * 1. Check if user is already an owner → throw error
   * 2. Check if user is a member of another household → save for cleanup
   * 3. BEGIN TRANSACTION:
   *    - Create new household with user as owner
   *    - Add user to user_households
   *    - Create pantry for household
   *    - Create shopping_list for household
   *    - Remove user from previous household (if any)
   * 4. Return created household
   */
  async createHousehold(userId: string, name: string): Promise<Household> {
    // Check current membership
    const membership = await this.getUserMembership(userId)

    if (membership?.isOwner) {
      throw new AlreadyOwnerError()
    }

    const previousHouseholdId = membership?.householdId ?? null

    // Create new household
    const { data: household, error: householdError } = await this.supabase
      .from('households')
      .insert({
        owner_id: userId,
        name,
      })
      .select('id, name, created_at')
      .single()

    if (householdError || !household) {
      console.error('[HouseholdService] Error creating household:', householdError)
      throw new Error('Failed to create household')
    }

    // Add user to household
    const { error: membershipError } = await this.supabase.from('user_households').insert({
      user_id: userId,
      household_id: household.id,
    })

    if (membershipError) {
      console.error('[HouseholdService] Error adding user to household:', membershipError)
      // Rollback: delete the household
      await this.supabase.from('households').delete().eq('id', household.id)
      throw new Error('Failed to add user to household')
    }

    // Create pantry for household
    const { error: pantryError } = await this.supabase.from('pantries').insert({
      household_id: household.id,
    })

    if (pantryError) {
      console.error('[HouseholdService] Error creating pantry:', pantryError)
      // Rollback: delete membership and household
      await this.supabase.from('user_households').delete().eq('household_id', household.id)
      await this.supabase.from('households').delete().eq('id', household.id)
      throw new Error('Failed to create pantry')
    }

    // Create shopping list for household
    const { error: shoppingListError } = await this.supabase.from('shopping_lists').insert({
      household_id: household.id,
    })

    if (shoppingListError) {
      console.error('[HouseholdService] Error creating shopping list:', shoppingListError)
      // Rollback: delete pantry, membership, and household
      await this.supabase.from('pantries').delete().eq('household_id', household.id)
      await this.supabase.from('user_households').delete().eq('household_id', household.id)
      await this.supabase.from('households').delete().eq('id', household.id)
      throw new Error('Failed to create shopping list')
    }

    // Remove user from previous household if they were a member
    if (previousHouseholdId) {
      const { error: removeError } = await this.supabase
        .from('user_households')
        .delete()
        .eq('user_id', userId)
        .eq('household_id', previousHouseholdId)

      if (removeError) {
        console.error('[HouseholdService] Error removing from previous household:', removeError)
        // Don't rollback - new household is created successfully
        // User can manually leave old household later
      }
    }

    return {
      id: household.id,
      name: household.name,
      createdAt: household.created_at,
    }
  }

  /**
   * Get household details with members
   *
   * @param householdId - The household UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @returns Household DTO with members array
   * @throws HouseholdNotFoundError if household doesn't exist or user is not a member
   *
   * Security: Returns 404 for both "not found" and "not authorized" to prevent
   * information leakage about existence of households.
   */
  async getHousehold(householdId: string, userId: string): Promise<HouseholdWithMembers> {
    // Check if user is a member
    if (!(await this.isMember(householdId, userId))) {
      throw new HouseholdNotFoundError()
    }

    // Get household details including owner_id
    const { data: household, error: householdError } = await this.supabase
      .from('households')
      .select('id, name, created_at, owner_id')
      .eq('id', householdId)
      .single()

    if (householdError || !household) {
      throw new HouseholdNotFoundError()
    }

    // Get members
    const { data: memberships, error: membersError } = await this.supabase
      .from('user_households')
      .select(
        `
        user_id,
        created_at
      `
      )
      .eq('household_id', householdId)

    if (membersError) {
      console.error('[HouseholdService] Error fetching members:', membersError)
      throw new Error('Failed to fetch household members')
    }

    // Get user details for each member
    const members: User[] = []
    if (memberships) {
      // Use admin client if available, otherwise we can't get user emails
      const client = this.adminClient || this.supabase

      for (const membership of memberships) {
        const { data: user, error: userError } = await client.auth.admin.getUserById(
          membership.user_id
        )

        if (userError) {
          console.error('[HouseholdService] Error fetching user details:', userError)
          // Skip this user if we can't fetch their details
          continue
        }

        if (user?.user) {
          members.push({
            id: user.user.id,
            email: user.user.email ?? '',
          })
        }
      }
    }

    return {
      id: household.id,
      name: household.name,
      createdAt: household.created_at,
      ownerId: household.owner_id,
      members,
    }
  }

  /**
   * Update household name
   *
   * @param householdId - The household UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @param name - The new household name (validated by Zod schema)
   * @returns Updated Household DTO
   * @throws HouseholdNotFoundError if household doesn't exist or user is not a member
   * @throws NotOwnerError if user is not the owner
   *
   * Authorization: Only the household owner can rename the household.
   */
  async updateHousehold(householdId: string, userId: string, name: string): Promise<Household> {
    // Check if user is a member
    if (!(await this.isMember(householdId, userId))) {
      throw new HouseholdNotFoundError()
    }

    // Check if user is the owner
    if (!(await this.isOwner(householdId, userId))) {
      throw new NotOwnerError()
    }

    // Update household name
    const { data: household, error } = await this.supabase
      .from('households')
      .update({ name })
      .eq('id', householdId)
      .select('id, name, created_at')
      .single()

    if (error || !household) {
      console.error('[HouseholdService] Error updating household:', error)
      throw new Error('Failed to update household')
    }

    return {
      id: household.id,
      name: household.name,
      createdAt: household.created_at,
    }
  }

  /**
   * Delete household and all associated resources
   *
   * @param householdId - The household UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @throws HouseholdNotFoundError if household doesn't exist or user is not a member
   * @throws NotOwnerError if user is not the owner
   * @throws HasOtherMembersError if household has other members
   *
   * Authorization: Only the household owner can delete the household.
   * Business rule: Household can only be deleted if there are no other members.
   *
   * Cascade deletion (handled by database FK constraints):
   * - pantries (ON DELETE CASCADE)
   * - pantry_items (through pantries)
   * - recipes (ON DELETE CASCADE)
   * - shopping_lists (ON DELETE CASCADE)
   * - shopping_list_items (through shopping_lists)
   * - household_invitations (ON DELETE CASCADE)
   * - user_households (ON DELETE CASCADE)
   */
  async deleteHousehold(householdId: string, userId: string): Promise<void> {
    // Check if user is a member
    if (!(await this.isMember(householdId, userId))) {
      throw new HouseholdNotFoundError()
    }

    // Check if user is the owner
    if (!(await this.isOwner(householdId, userId))) {
      throw new NotOwnerError()
    }

    // Check if there are other members
    const { count } = await this.supabase
      .from('user_households')
      .select('*', { count: 'exact', head: true })
      .eq('household_id', householdId)

    if (count && count > 1) {
      throw new HasOtherMembersError()
    }

    // Delete household (cascade will handle related records)
    const { error } = await this.supabase.from('households').delete().eq('id', householdId)

    if (error) {
      console.error('[HouseholdService] Error deleting household:', error)
      throw new Error('Failed to delete household')
    }
  }

  /**
   * List all members of a household
   *
   * @param householdId - The household UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @returns Array of User DTOs
   * @throws HouseholdNotFoundError if household doesn't exist or user is not a member
   */
  async listMembers(householdId: string, userId: string): Promise<User[]> {
    // Check if user is a member
    if (!(await this.isMember(householdId, userId))) {
      throw new HouseholdNotFoundError()
    }

    // Get members
    const { data: memberships, error } = await this.supabase
      .from('user_households')
      .select('user_id')
      .eq('household_id', householdId)

    if (error) {
      console.error('[HouseholdService] Error fetching members:', error)
      throw new Error('Failed to fetch members')
    }

    // Get user details for each member
    const members: User[] = []
    if (memberships) {
      // Use admin client if available, otherwise we can't get user emails
      const client = this.adminClient || this.supabase

      for (const membership of memberships) {
        const { data: user, error: userError } = await client.auth.admin.getUserById(
          membership.user_id
        )

        if (userError) {
          console.error('[HouseholdService] Error fetching user details:', userError)
          // Skip this user if we can't fetch their details
          continue
        }

        if (user?.user) {
          members.push({
            id: user.user.id,
            email: user.user.email ?? '',
          })
        }
      }
    }

    return members
  }

  /**
   * Invite a member to the household
   *
   * @param householdId - The household UUID
   * @param userId - The authenticated user's UUID (for authorization)
   * @param invitedEmail - The email of the user to invite (validated by Zod schema)
   * @returns Invitation DTO
   * @throws HouseholdNotFoundError if household doesn't exist or user is not a member
   * @throws NotOwnerError if user is not the owner
   * @throws AlreadyMemberError if invited user is already a member
   *
   * Authorization: Only the household owner can invite members.
   *
   * TODO: This is a placeholder implementation. Full invitation workflow includes:
   * - Generating unique invitation token
   * - Setting expiration date (e.g., 7 days)
   * - Sending invitation email
   * - Accepting invitation endpoint
   * - Handling invitation acceptance (user migration)
   */
  async inviteMember(
    householdId: string,
    userId: string,
    invitedEmail: string
  ): Promise<Invitation> {
    // Check if user is a member
    if (!(await this.isMember(householdId, userId))) {
      throw new HouseholdNotFoundError()
    }

    // Check if user is the owner
    if (!(await this.isOwner(householdId, userId))) {
      throw new NotOwnerError()
    }

    // Check if invited user is already a member
    // First, find user by email
    // Use admin client if available, otherwise we can't list users
    const client = this.adminClient || this.supabase
    const { data: invitedUser } = await client.auth.admin.listUsers()
    const targetUser = invitedUser?.users.find(u => u.email === invitedEmail)

    if (targetUser) {
      const isAlreadyMember = await this.isMember(householdId, targetUser.id)
      if (isAlreadyMember) {
        throw new AlreadyMemberError()
      }
    }

    // Generate invitation token (crypto-random)
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
      })
      .select('id, household_id, invited_email, token, expires_at, created_at')
      .single()

    if (error || !invitation) {
      console.error('[HouseholdService] Error creating invitation:', error)
      throw new Error('Failed to create invitation')
    }

    // TODO: Send invitation email

    return {
      id: invitation.id,
      householdId: invitation.household_id,
      invitedEmail: invitation.invited_email,
      token: invitation.token,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
    }
  }
}

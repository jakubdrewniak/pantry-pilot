import type {
  HouseholdWithMembers,
  HouseholdRole,
  User,
  MemberWithRole,
  Membership,
} from '@/types/types'

/**
 * Determines user's role in the household based on ownership
 *
 * @param household - Household with owner ID
 * @param userId - Current user's ID
 * @returns User's role: 'owner' or 'member'
 */
export function determineUserRole(household: HouseholdWithMembers, userId: string): HouseholdRole {
  // Check if user is the owner by comparing with ownerId
  return household.ownerId === userId ? 'owner' : 'member'
}

/**
 * Enriches member list with role information and current user status
 *
 * @param members - List of household members
 * @param ownerId - Household owner's ID
 * @param currentUserId - Current user's ID
 * @param memberships - Optional list of memberships with role and date information
 * @returns List of members with additional information
 */
export function enrichMembersWithRoles(
  members: User[],
  ownerId: string,
  currentUserId: string,
  memberships?: Membership[]
): MemberWithRole[] {
  return members.map(member => {
    const membership = memberships?.find(m => m.userId === member.id)
    const role: HouseholdRole = member.id === ownerId ? 'owner' : 'member'
    const joinedAt = membership?.joinedAt ?? member.createdAt ?? new Date().toISOString()

    return {
      ...member,
      role,
      joinedAt,
      isCurrentUser: member.id === currentUserId,
    }
  })
}

/**
 * Checks if user can edit household name
 *
 * @param userRole - User's role
 * @returns true if user can edit the name
 */
export function canEditHouseholdName(userRole: HouseholdRole): boolean {
  return userRole === 'owner'
}

/**
 * Checks if user can create their own household
 * Only members (not owners) can create their own household
 *
 * @param userRole - User's role
 * @returns true if user can create their own household
 */
export function canCreateOwnHousehold(userRole: HouseholdRole): boolean {
  return userRole === 'member'
}

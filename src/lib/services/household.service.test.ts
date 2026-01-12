/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  HouseholdService,
  HouseholdNotFoundError,
  NotOwnerError,
  AlreadyOwnerError,
  AlreadyMemberError,
  HasOtherMembersError,
} from './household.service'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

/**
 * HouseholdService Test Suite
 *
 * Tests business logic for household operations including:
 * - Retrieving user's household
 * - Creating new households
 * - Getting household details with members
 * - Updating household name
 * - Deleting households
 * - Listing members
 * - Inviting members
 *
 * Mock Strategy:
 * - Mock Supabase client methods
 * - Test happy path and error scenarios
 * - Verify authorization logic
 */

// Type for mocked Supabase client
type MockSupabaseClient = {
  from: any
  auth: {
    admin: {
      getUserById: any
      listUsers: any
    }
  }
}

describe('HouseholdService', () => {
  let mockSupabase: MockSupabaseClient
  let service: HouseholdService

  // Test data
  const mockUserId = '11111111-1111-1111-1111-111111111111'
  const mockHouseholdId = '22222222-2222-2222-2222-222222222222'
  const mockOtherUserId = '33333333-3333-3333-3333-333333333333'

  beforeEach(() => {
    // Create a fresh mock for each test
    mockSupabase = {
      from: vi.fn(),
      auth: {
        admin: {
          getUserById: vi.fn(),
          listUsers: vi.fn(),
        },
      },
    }

    service = new HouseholdService(mockSupabase as unknown as SupabaseClient<Database>)
  })

  describe('getUserHousehold', () => {
    it('should return household with member count when user has a household', async () => {
      // Arrange
      const mockMembership = {
        household_id: mockHouseholdId,
      }

      const mockHousehold = {
        id: mockHouseholdId,
        name: 'Test Household',
        created_at: '2025-01-01T00:00:00Z',
      }

      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++

        // First call: user_households for membership lookup
        if (callCount === 1 && table === 'user_households') {
          const mockSelect = vi.fn()
          const mockEq = vi.fn()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: mockMembership,
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq })
          mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Second call: households for household details
        if (callCount === 2 && table === 'households') {
          const mockSelect = vi.fn()
          const mockEq = vi.fn()
          const mockSingle = vi.fn().mockResolvedValue({
            data: mockHousehold,
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq })
          mockEq.mockReturnValue({ single: mockSingle })

          return { select: mockSelect }
        }

        // Third call: user_households for member count
        // Note: select('*', { count: 'exact', head: true }) returns Promise<{ count, error }>
        if (callCount === 3 && table === 'user_households') {
          const mockSelect = vi.fn()
          const mockEq = vi.fn()

          // Mock chaining: select().eq() returns Promise
          mockEq.mockResolvedValue({
            count: 3,
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq })

          return { select: mockSelect }
        }

        return {}
      })

      // Act
      const result = await service.getUserHousehold(mockUserId)

      // Assert
      expect(result).toEqual({
        id: mockHouseholdId,
        name: 'Test Household',
        createdAt: '2025-01-01T00:00:00Z',
        memberCount: 3,
      })
    })

    it('should return null when user has no household', async () => {
      // Arrange
      const mockUserHouseholdsSelect = vi.fn().mockReturnThis()
      const mockUserHouseholdsEq = vi.fn().mockReturnThis()
      const mockUserHouseholdsMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: mockUserHouseholdsSelect,
        eq: mockUserHouseholdsEq,
        maybeSingle: mockUserHouseholdsMaybeSingle,
      })

      mockUserHouseholdsSelect.mockReturnValue({
        eq: mockUserHouseholdsEq,
      })

      mockUserHouseholdsEq.mockReturnValue({
        maybeSingle: mockUserHouseholdsMaybeSingle,
      })

      // Act
      const result = await service.getUserHousehold(mockUserId)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('createHousehold', () => {
    it('should throw AlreadyOwnerError when user already owns a household', async () => {
      // Arrange - Mock user is already an owner
      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++

        // First call: getUserMembership - check user_households
        if (callCount === 1 && table === 'user_households') {
          const mockSelect = vi.fn()
          const mockEq = vi.fn()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { household_id: mockHouseholdId },
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq })
          mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Second call: isOwner - check households with TWO .eq() calls
        // Chain: select('owner_id').eq('id', householdId).eq('owner_id', userId).maybeSingle()
        if (callCount === 2 && table === 'households') {
          const mockSelect = vi.fn()
          const mockEq1 = vi.fn()
          const mockEq2 = vi.fn()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { owner_id: mockUserId }, // User IS the owner
            error: null,
          })

          // Build the chain
          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        return {}
      })

      // Act & Assert
      await expect(service.createHousehold(mockUserId, 'New Household')).rejects.toThrow(
        AlreadyOwnerError
      )
    })

    it('should create household successfully when user is not an owner', async () => {
      // Arrange
      const newHouseholdId = '44444444-4444-4444-4444-444444444444'

      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++

        // First call: getUserMembership - check user_households (user has no household)
        if (callCount === 1 && table === 'user_households') {
          const mockSelect = vi.fn()
          const mockEq = vi.fn()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: null, // No household
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq })
          mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Second call: insert household
        if (callCount === 2 && table === 'households') {
          const mockInsert = vi.fn()
          const mockSelect = vi.fn()
          const mockSingle = vi.fn().mockResolvedValue({
            data: {
              id: newHouseholdId,
              name: 'New Household',
              created_at: '2025-01-12T00:00:00Z',
            },
            error: null,
          })

          mockInsert.mockReturnValue({ select: mockSelect })
          mockSelect.mockReturnValue({ single: mockSingle })

          return { insert: mockInsert }
        }

        // Third call: insert user_households
        if (callCount === 3 && table === 'user_households') {
          const mockInsert = vi.fn().mockResolvedValue({
            error: null,
          })

          return { insert: mockInsert }
        }

        // Fourth call: insert pantry
        if (callCount === 4 && table === 'pantries') {
          const mockInsert = vi.fn().mockResolvedValue({
            error: null,
          })

          return { insert: mockInsert }
        }

        // Fifth call: insert shopping_list
        if (callCount === 5 && table === 'shopping_lists') {
          const mockInsert = vi.fn().mockResolvedValue({
            error: null,
          })

          return { insert: mockInsert }
        }

        return {}
      })

      // Act
      const result = await service.createHousehold(mockUserId, 'New Household')

      // Assert
      expect(result).toEqual({
        id: newHouseholdId,
        name: 'New Household',
        createdAt: '2025-01-12T00:00:00Z',
      })

      // Verify all operations were called
      expect(mockSupabase.from).toHaveBeenCalledWith('households')
      expect(mockSupabase.from).toHaveBeenCalledWith('user_households')
      expect(mockSupabase.from).toHaveBeenCalledWith('pantries')
      expect(mockSupabase.from).toHaveBeenCalledWith('shopping_lists')
    })
  })

  describe('getHousehold', () => {
    it('should throw HouseholdNotFoundError when user is not a member', async () => {
      // Arrange - User is not a member
      // isMember checks user_households with .select().eq().eq().maybeSingle()
      const mockSelect = vi.fn()
      const mockEq1 = vi.fn()
      const mockEq2 = vi.fn()
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null, // Not a member
        error: null,
      })

      mockSelect.mockReturnValue({ eq: mockEq1 })
      mockEq1.mockReturnValue({ eq: mockEq2 })
      mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      })

      // Act & Assert
      await expect(service.getHousehold(mockHouseholdId, mockUserId)).rejects.toThrow(
        HouseholdNotFoundError
      )
    })

    it('should return household with members when user is a member', async () => {
      // Arrange
      const mockMembership = { user_id: mockUserId }
      const mockHousehold = {
        id: mockHouseholdId,
        name: 'Test Household',
        created_at: '2025-01-01T00:00:00Z',
      }
      const mockMemberships = [
        { user_id: mockUserId, created_at: '2025-01-01T00:00:00Z' },
        { user_id: mockOtherUserId, created_at: '2025-01-02T00:00:00Z' },
      ]

      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++

        // First call: check membership
        if (callCount === 1) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: mockMembership,
            error: null,
          })

          mockSelect.mockReturnValue({
            eq: mockEq1,
          })
          mockEq1.mockReturnValue({
            eq: mockEq2,
          })
          mockEq2.mockReturnValue({
            maybeSingle: mockMaybeSingle,
          })

          return { select: mockSelect }
        }

        // Second call: get household
        if (callCount === 2) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq = vi.fn().mockReturnThis()
          const mockSingle = vi.fn().mockResolvedValue({
            data: mockHousehold,
            error: null,
          })

          mockSelect.mockReturnValue({
            eq: mockEq,
          })
          mockEq.mockReturnValue({
            single: mockSingle,
          })

          return { select: mockSelect }
        }

        // Third call: get members
        if (callCount === 3) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq = vi.fn().mockResolvedValue({
            data: mockMemberships,
            error: null,
          })

          mockSelect.mockReturnValue({
            eq: mockEq,
          })

          return { select: mockSelect }
        }

        return {}
      })

      // Mock admin.getUserById calls
      mockSupabase.auth.admin.getUserById
        .mockResolvedValueOnce({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
            },
          },
          error: null,
        } as any)
        .mockResolvedValueOnce({
          data: {
            user: {
              id: mockOtherUserId,
              email: 'other@example.com',
            },
          },
          error: null,
        } as any)

      // Act
      const result = await service.getHousehold(mockHouseholdId, mockUserId)

      // Assert
      expect(result).toEqual({
        id: mockHouseholdId,
        name: 'Test Household',
        createdAt: '2025-01-01T00:00:00Z',
        members: [
          { id: mockUserId, email: 'user@example.com' },
          { id: mockOtherUserId, email: 'other@example.com' },
        ],
      })
    })
  })

  describe('updateHousehold', () => {
    it('should throw NotOwnerError when user is not the owner', async () => {
      // Arrange - User is a member but not owner
      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++

        // First call: check membership (user IS a member)
        if (callCount === 1) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { user_id: mockUserId },
            error: null,
          })

          mockSelect.mockReturnValue({
            eq: mockEq1,
          })
          mockEq1.mockReturnValue({
            eq: mockEq2,
          })
          mockEq2.mockReturnValue({
            maybeSingle: mockMaybeSingle,
          })

          return { select: mockSelect }
        }

        // Second call: check ownership (user is NOT owner)
        if (callCount === 2) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: null, // Not the owner
            error: null,
          })

          mockSelect.mockReturnValue({
            eq: mockEq1,
          })
          mockEq1.mockReturnValue({
            eq: mockEq2,
          })
          mockEq2.mockReturnValue({
            maybeSingle: mockMaybeSingle,
          })

          return { select: mockSelect }
        }

        return {}
      })

      // Act & Assert
      await expect(
        service.updateHousehold(mockHouseholdId, mockUserId, 'New Name')
      ).rejects.toThrow(NotOwnerError)
    })

    it('should update household name when user is the owner', async () => {
      // Arrange
      const updatedHousehold = {
        id: mockHouseholdId,
        name: 'Updated Name',
        created_at: '2025-01-01T00:00:00Z',
      }

      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++

        // First call: check membership
        if (callCount === 1) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { user_id: mockUserId },
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Second call: check ownership
        if (callCount === 2) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { owner_id: mockUserId }, // User IS the owner
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Third call: update household
        if (callCount === 3) {
          const mockUpdate = vi.fn().mockReturnThis()
          const mockEq = vi.fn().mockReturnThis()
          const mockSelect = vi.fn().mockReturnThis()
          const mockSingle = vi.fn().mockResolvedValue({
            data: updatedHousehold,
            error: null,
          })

          mockUpdate.mockReturnValue({ eq: mockEq })
          mockEq.mockReturnValue({ select: mockSelect })
          mockSelect.mockReturnValue({ single: mockSingle })

          return { update: mockUpdate }
        }

        return {}
      })

      // Act
      const result = await service.updateHousehold(mockHouseholdId, mockUserId, 'Updated Name')

      // Assert
      expect(result).toEqual({
        id: mockHouseholdId,
        name: 'Updated Name',
        createdAt: '2025-01-01T00:00:00Z',
      })
    })
  })

  describe('deleteHousehold', () => {
    it('should throw HasOtherMembersError when household has multiple members', async () => {
      // Arrange
      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++

        // First call: check membership
        if (callCount === 1) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { user_id: mockUserId },
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Second call: check ownership
        if (callCount === 2) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { owner_id: mockUserId },
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Third call: count members (2 members)
        if (callCount === 3) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq = vi.fn().mockResolvedValue({
            count: 2, // Multiple members
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq })

          return { select: mockSelect }
        }

        return {}
      })

      // Act & Assert
      await expect(service.deleteHousehold(mockHouseholdId, mockUserId)).rejects.toThrow(
        HasOtherMembersError
      )
    })

    it('should delete household successfully when user is owner and no other members', async () => {
      // Arrange
      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++

        // First call: check membership
        if (callCount === 1) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { user_id: mockUserId },
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Second call: check ownership
        if (callCount === 2) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { owner_id: mockUserId },
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Third call: count members (only 1 member - the owner)
        if (callCount === 3) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq = vi.fn().mockResolvedValue({
            count: 1, // Only owner
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq })

          return { select: mockSelect }
        }

        // Fourth call: delete household
        if (callCount === 4) {
          const mockDelete = vi.fn().mockReturnThis()
          const mockEq = vi.fn().mockResolvedValue({
            error: null,
          })

          mockDelete.mockReturnValue({ eq: mockEq })

          return { delete: mockDelete }
        }

        return {}
      })

      // Act
      await service.deleteHousehold(mockHouseholdId, mockUserId)

      // Assert - no error thrown means success
      expect(mockSupabase.from).toHaveBeenCalledWith('households')
    })
  })

  describe('listMembers', () => {
    it('should throw HouseholdNotFoundError when user is not a member', async () => {
      // Arrange
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq1 = vi.fn().mockReturnThis()
      const mockEq2 = vi.fn().mockReturnThis()
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({ eq: mockEq1 })
      mockEq1.mockReturnValue({ eq: mockEq2 })
      mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

      // Act & Assert
      await expect(service.listMembers(mockHouseholdId, mockUserId)).rejects.toThrow(
        HouseholdNotFoundError
      )
    })

    it('should return list of members when user is a member', async () => {
      // Arrange
      const mockMemberships = [{ user_id: mockUserId }, { user_id: mockOtherUserId }]

      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++

        // First call: check membership
        if (callCount === 1) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { user_id: mockUserId },
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Second call: get members
        if (callCount === 2) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq = vi.fn().mockResolvedValue({
            data: mockMemberships,
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq })

          return { select: mockSelect }
        }

        return {}
      })

      // Mock admin.getUserById calls
      mockSupabase.auth.admin.getUserById
        .mockResolvedValueOnce({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
            },
          },
          error: null,
        } as any)
        .mockResolvedValueOnce({
          data: {
            user: {
              id: mockOtherUserId,
              email: 'other@example.com',
            },
          },
          error: null,
        } as any)

      // Act
      const result = await service.listMembers(mockHouseholdId, mockUserId)

      // Assert
      expect(result).toEqual([
        { id: mockUserId, email: 'user@example.com' },
        { id: mockOtherUserId, email: 'other@example.com' },
      ])
    })
  })

  describe('inviteMember', () => {
    it('should throw NotOwnerError when user is not the owner', async () => {
      // Arrange
      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++

        // First call: check membership
        if (callCount === 1) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { user_id: mockUserId },
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Second call: check ownership (not owner)
        if (callCount === 2) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: null, // Not owner
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        return {}
      })

      // Act & Assert
      await expect(
        service.inviteMember(mockHouseholdId, mockUserId, 'invited@example.com')
      ).rejects.toThrow(NotOwnerError)
    })

    it('should throw AlreadyMemberError when invited user is already a member', async () => {
      // Arrange
      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++

        // First call: check membership
        if (callCount === 1) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { user_id: mockUserId },
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Second call: check ownership (is owner)
        if (callCount === 2) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { owner_id: mockUserId },
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Third call: check if invited user is already member
        if (callCount === 3) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { user_id: mockOtherUserId }, // Already a member
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        return {}
      })

      // Mock listUsers to find invited user
      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: [
            {
              id: mockOtherUserId,
              email: 'invited@example.com',
            },
          ],
        },
        error: null,
      } as any)

      // Act & Assert
      await expect(
        service.inviteMember(mockHouseholdId, mockUserId, 'invited@example.com')
      ).rejects.toThrow(AlreadyMemberError)
    })

    it('should create invitation successfully when user is owner and invitee is not a member', async () => {
      // Arrange
      const mockInvitation = {
        id: '55555555-5555-5555-5555-555555555555',
        household_id: mockHouseholdId,
        invited_email: 'invited@example.com',
        token: '66666666-6666-6666-6666-666666666666',
        expires_at: '2025-01-19T00:00:00Z',
        created_at: '2025-01-12T00:00:00Z',
      }

      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++

        // First call: check membership
        if (callCount === 1) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { user_id: mockUserId },
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Second call: check ownership
        if (callCount === 2) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: { owner_id: mockUserId },
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Third call: check if invited user exists and is member (not a member)
        if (callCount === 3) {
          const mockSelect = vi.fn().mockReturnThis()
          const mockEq1 = vi.fn().mockReturnThis()
          const mockEq2 = vi.fn().mockReturnThis()
          const mockMaybeSingle = vi.fn().mockResolvedValue({
            data: null, // Not a member
            error: null,
          })

          mockSelect.mockReturnValue({ eq: mockEq1 })
          mockEq1.mockReturnValue({ eq: mockEq2 })
          mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle })

          return { select: mockSelect }
        }

        // Fourth call: insert invitation
        if (callCount === 4) {
          const mockInsert = vi.fn().mockReturnThis()
          const mockSelect = vi.fn().mockReturnThis()
          const mockSingle = vi.fn().mockResolvedValue({
            data: mockInvitation,
            error: null,
          })

          mockInsert.mockReturnValue({ select: mockSelect })
          mockSelect.mockReturnValue({ single: mockSingle })

          return { insert: mockInsert }
        }

        return {}
      })

      // Mock listUsers to find invited user
      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: [
            {
              id: mockOtherUserId,
              email: 'invited@example.com',
            },
          ],
        },
        error: null,
      } as any)

      // Act
      const result = await service.inviteMember(mockHouseholdId, mockUserId, 'invited@example.com')

      // Assert
      expect(result).toEqual({
        id: mockInvitation.id,
        householdId: mockInvitation.household_id,
        invitedEmail: mockInvitation.invited_email,
        token: mockInvitation.token,
        expiresAt: mockInvitation.expires_at,
        createdAt: mockInvitation.created_at,
      })
    })
  })
})

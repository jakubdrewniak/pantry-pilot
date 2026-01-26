-- migration: allow invited users to see household information
-- purpose: fix issue where users with pending invitations cannot see household details
-- affected tables: households (policies only)
-- dependencies: households, household_invitations
-- issue: users need to see household name when they have a pending invitation,
--        but existing RLS policy only allows members to see households

-- ============================================================================
-- DROP EXISTING POLICY
-- ============================================================================

-- drop the existing restrictive policy
-- we'll replace it with a more permissive one that includes invited users
drop policy if exists households_select_policy on households;

-- IMPORTANT: We need to drop and recreate rather than just modify
-- to ensure there are no conflicts with the existing policy definition

-- ============================================================================
-- CREATE NEW POLICY
-- ============================================================================

-- policy: authenticated users can select households they belong to OR have been invited to
-- grants: select
-- role: authenticated
-- logic: user must be a member (exists in user_households) OR have a valid pending invitation
-- rationale: users need to see household name when reviewing their pending invitations
--
-- NOTE: We use auth.jwt() to get the user's email from the JWT token instead of querying auth.users
--       This avoids permission denied errors when RLS policies try to access the users table
create policy households_select_policy on households
  for select
  to authenticated
  using (
    -- case 1: user is a member of the household
    exists (
      select 1 from user_households uh
      where uh.user_id = auth.uid() 
        and uh.household_id = households.id
    )
    OR
    -- case 2: user has a pending, non-expired invitation to the household
    -- Use auth.jwt() to get email from JWT token (no need to query auth.users)
    exists (
      select 1 
      from household_invitations hi
      where hi.household_id = households.id
        and lower(hi.invited_email) = lower(auth.jwt() ->> 'email')
        and hi.status = 'pending'
        and hi.expires_at > now()
    )
  );

-- ============================================================================
-- NOTES
-- ============================================================================

-- security considerations:
-- 1. users can only see households they're invited to (via their email)
-- 2. invitations must be pending and non-expired
-- 3. email comparison is case-insensitive for user convenience
-- 4. this allows the invitation list API to work correctly by joining with households table
--
-- business impact:
-- - users can now see household names in their invitation list
-- - invitation notification badge will show correct count
-- - no security degradation: users still can't see random households


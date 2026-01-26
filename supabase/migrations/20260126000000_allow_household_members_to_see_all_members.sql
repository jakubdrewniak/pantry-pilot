-- migration: allow household members to see all members of their household
-- purpose: fix issue where users can only see their own membership record
-- affected tables: user_households (policies only)
-- dependencies: user_households table
-- issue: current SELECT policy only allows users to see their own membership (user_id = auth.uid())
--        this prevents household owners and members from seeing the full member list

-- ============================================================================
-- DROP EXISTING POLICY
-- ============================================================================

-- drop the existing restrictive policy that only allows users to see themselves
drop policy if exists user_households_select_policy on user_households;

-- ============================================================================
-- CREATE HELPER FUNCTION
-- ============================================================================

-- helper function to get the user's household_id without triggering RLS recursion
-- this function uses security definer to bypass RLS when checking the user's own household
create or replace function public.get_user_household_id(p_user_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id 
  from user_households 
  where user_id = p_user_id
  limit 1;
$$;

-- ============================================================================
-- CREATE NEW POLICY
-- ============================================================================

-- policy: authenticated users can select membership records for their household
-- grants: select
-- role: authenticated
-- logic: user can see their own membership record OR all members of their household
-- rationale: household members need to see who else is in their household
--
-- how it works:
-- - user can always see their own membership record (user_id = auth.uid())
-- - user can see all members of their household (using helper function to avoid recursion)
-- - the helper function uses SECURITY DEFINER to safely query user_households
create policy user_households_select_policy on user_households
  for select
  to authenticated
  using (
    -- case 1: own membership record
    user_id = auth.uid()
    OR
    -- case 2: all members of the same household
    household_id = public.get_user_household_id(auth.uid())
  );

-- ============================================================================
-- NOTES
-- ============================================================================

-- security considerations:
-- 1. users can only see members of households they belong to
-- 2. users cannot see members of random households
-- 3. this allows proper member list functionality
--
-- business impact:
-- - household owners can now see all members
-- - member count will be accurate
-- - member lists will populate correctly
-- - no security degradation: users still can't see members of households they don't belong to


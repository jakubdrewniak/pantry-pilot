-- migration: allow owners to see their household even without membership
-- purpose: enable "return to my household" feature
-- affected tables: households
-- note: when a user accepts invitation to another household, they leave their own
--       but should still be able to see it for rejoining later

-- ============================================================================
-- ADDITIONAL HOUSEHOLDS SELECT POLICY FOR OWNERS
-- ============================================================================

-- policy: owners can always see their own household (even if not a member)
-- grants: select
-- role: authenticated
-- logic: user is the owner of the household (owner_id matches auth.uid())
-- rationale: this enables the "return to my household" feature where users
--            who left their household to join another can still see their
--            original household and rejoin it later
create policy households_select_owner_policy on households
  for select
  to authenticated
  using (owner_id = auth.uid());


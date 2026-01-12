-- migration: enable row level security for households and user_households
-- purpose: enforce security policies at database level
-- affected tables: households, user_households
-- note: this migration enables rls and creates granular policies based on user roles (owner vs member)

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

-- enable row level security on households table
-- this ensures users can only access households they belong to
alter table households enable row level security;

-- enable row level security on user_households table
-- this ensures users can only access their own membership records
alter table user_households enable row level security;

-- ============================================================================
-- HOUSEHOLDS TABLE POLICIES
-- ============================================================================

-- policy: authenticated users can select households they belong to
-- grants: select
-- role: authenticated
-- logic: user must be a member of the household (exists in user_households)
create policy households_select_policy on households
  for select
  to authenticated
  using (
    exists (
      select 1 from user_households uh
      where uh.user_id = auth.uid() and uh.household_id = households.id
    )
  );

-- policy: authenticated users can insert households
-- grants: insert
-- role: authenticated
-- logic: owner_id must match the authenticated user
-- note: this allows users to create new households for themselves
create policy households_insert_policy on households
  for insert
  to authenticated
  with check (owner_id = auth.uid());

-- policy: only household owners can update households
-- grants: update
-- role: authenticated
-- logic: only the owner (owner_id) can update the household
-- note: according to business rules, only owners can rename households
create policy households_update_policy on households
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- policy: only household owners can delete households
-- grants: delete
-- role: authenticated
-- logic: only the owner (owner_id) can delete the household
-- note: additional business logic (no other members) is enforced at application layer
create policy households_delete_policy on households
  for delete
  to authenticated
  using (owner_id = auth.uid());

-- ============================================================================
-- USER_HOUSEHOLDS TABLE POLICIES
-- ============================================================================

-- policy: authenticated users can select their own user_households record
-- grants: select
-- role: authenticated
-- logic: user can only see their own membership record
create policy user_households_select_policy on user_households
  for select
  to authenticated
  using (user_id = auth.uid());

-- policy: authenticated users can insert their own user_households record
-- grants: insert
-- role: authenticated
-- logic: user can only create membership records for themselves
-- note: this is used when creating a new household or accepting invitations
create policy user_households_insert_policy on user_households
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- policy: authenticated users can delete their own user_households record
-- grants: delete
-- role: authenticated
-- logic: user can only delete their own membership record
-- note: this is used when leaving a household
create policy user_households_delete_policy on user_households
  for delete
  to authenticated
  using (user_id = auth.uid());

-- note: no update policy for user_households
-- rationale: there are no updateable fields in this junction table
-- user_id and household_id are immutable (if you want to change household, you delete and insert)


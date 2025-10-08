-- migration: create household_invitations table
-- purpose: manage email invitations to join households
-- affected tables: household_invitations
-- dependencies: households table

-- create household_invitations table
-- this table stores invitation tokens sent to users who are invited to join a household
-- invitations have an expiration date and status tracking
create table household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  invited_email text not null,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'pending',
  
  -- ensure status is one of the allowed values
  constraint valid_status check (status in ('pending', 'accepted', 'expired', 'cancelled'))
);

-- create index on token for efficient invitation lookups
create index idx_household_invitations_token on household_invitations(token);

-- create index on household_id for efficient household-based queries
create index idx_household_invitations_household_id on household_invitations(household_id);

-- enable row level security
-- rls ensures only household members can manage invitations
-- alter table household_invitations enable row level security;

-- -- rls policy: authenticated users can select invitations for households they belong to
-- create policy household_invitations_select_policy on household_invitations
--   for select
--   to authenticated
--   using (
--     exists (
--       select 1 from user_households uh
--       where uh.user_id = auth.uid() and uh.household_id = household_invitations.household_id
--     )
--   );

-- -- rls policy: authenticated users can insert invitations for households they belong to
-- create policy household_invitations_insert_policy on household_invitations
--   for insert
--   to authenticated
--   with check (
--     exists (
--       select 1 from user_households uh
--       where uh.user_id = auth.uid() and uh.household_id = household_invitations.household_id
--     )
--   );

-- -- rls policy: authenticated users can update invitations for households they belong to
-- create policy household_invitations_update_policy on household_invitations
--   for update
--   to authenticated
--   using (
--     exists (
--       select 1 from user_households uh
--       where uh.user_id = auth.uid() and uh.household_id = household_invitations.household_id
--     )
--   )
--   with check (
--     exists (
--       select 1 from user_households uh
--       where uh.user_id = auth.uid() and uh.household_id = household_invitations.household_id
--     )
--   );

-- -- rls policy: authenticated users can delete invitations for households they belong to
-- create policy household_invitations_delete_policy on household_invitations
--   for delete
--   to authenticated
--   using (
--     exists (
--       select 1 from user_households uh
--       where uh.user_id = auth.uid() and uh.household_id = household_invitations.household_id
--     )
--   );

-- -- rls policy: anonymous users can select invitations by token (for accepting invitations)
-- create policy household_invitations_anon_select_policy on household_invitations
--   for select
--   to anon
--   using (true);


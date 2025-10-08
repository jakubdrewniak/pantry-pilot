-- migration: create households table
-- purpose: create the core household table that serves as the main organizational unit
-- affected tables: households, user_households
-- dependencies: auth.users (provided by supabase auth)

-- create households table
-- this table represents a shared household that can contain multiple users
-- each household has an owner and a name
create table households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- create user_households junction table
-- this table manages the many-to-one relationship between users and households
-- each user can belong to exactly one household (enforced by unique constraint)
create table user_households (
  user_id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- create index on household_id for efficient lookups
create index idx_user_households_household_id on user_households(household_id);

-- enable row level security
-- rls ensures users can only access households they belong to
-- alter table households enable row level security;
-- alter table user_households enable row level security;

-- -- rls policy: authenticated users can select households they belong to
-- create policy households_select_policy on households
--   for select
--   to authenticated
--   using (
--     exists (
--       select 1 from user_households uh
--       where uh.user_id = auth.uid() and uh.household_id = households.id
--     )
--   );

-- -- rls policy: authenticated users can insert households
-- -- note: the owner_id should match the authenticated user (enforced at application layer)
-- create policy households_insert_policy on households
--   for insert
--   to authenticated
--   with check (owner_id = auth.uid());

-- -- rls policy: authenticated users can update households they belong to
-- create policy households_update_policy on households
--   for update
--   to authenticated
--   using (
--     exists (
--       select 1 from user_households uh
--       where uh.user_id = auth.uid() and uh.household_id = households.id
--     )
--   )
--   with check (
--     exists (
--       select 1 from user_households uh
--       where uh.user_id = auth.uid() and uh.household_id = households.id
--     )
--   );

-- -- rls policy: only household owners can delete households
-- create policy households_delete_policy on households
--   for delete
--   to authenticated
--   using (owner_id = auth.uid());

-- -- rls policy: authenticated users can select their own user_households record
-- create policy user_households_select_policy on user_households
--   for select
--   to authenticated
--   using (user_id = auth.uid());

-- -- rls policy: authenticated users can insert their own user_households record
-- create policy user_households_insert_policy on user_households
--   for insert
--   to authenticated
--   with check (user_id = auth.uid());

-- -- rls policy: authenticated users can update their own user_households record
-- create policy user_households_update_policy on user_households
--   for update
--   to authenticated
--   using (user_id = auth.uid())
--   with check (user_id = auth.uid());

-- -- rls policy: authenticated users can delete their own user_households record
-- create policy user_households_delete_policy on user_households
--   for delete
--   to authenticated
--   using (user_id = auth.uid());


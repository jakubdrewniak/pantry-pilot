-- migration: create pantries and pantry_items tables
-- purpose: manage household pantry inventory
-- affected tables: pantries, pantry_items
-- dependencies: households table

-- create pantries table
-- each household has exactly one pantry (enforced by unique constraint on household_id)
create table pantries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null unique references households(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- create pantry_items table
-- stores individual items within a pantry
-- item names are case-insensitive unique within a pantry
create table pantry_items (
  id uuid primary key default gen_random_uuid(),
  pantry_id uuid not null references pantries(id) on delete cascade,
  name text not null,
  quantity numeric not null default 1 check (quantity >= 0),
  unit text
);

-- create index on pantry_id for efficient item lookups by pantry
create index idx_pantry_items_pantry_id on pantry_items(pantry_id);

-- create unique index to ensure case-insensitive unique item names within a pantry
-- note: unique constraints on expressions must be implemented as unique indexes
create unique index idx_pantry_items_unique_name on pantry_items(pantry_id, lower(name));

-- enable row level security
-- rls ensures only household members can access their pantry
alter table pantries enable row level security;
alter table pantry_items enable row level security;

-- rls policy: authenticated users can select pantries for households they belong to
create policy pantries_select_policy on pantries
  for select
  to authenticated
  using (
    exists (
      select 1 from user_households uh
      where uh.user_id = auth.uid() and uh.household_id = pantries.household_id
    )
  );

-- rls policy: authenticated users can insert pantries for households they belong to
create policy pantries_insert_policy on pantries
  for insert
  to authenticated
  with check (
    exists (
      select 1 from user_households uh
      where uh.user_id = auth.uid() and uh.household_id = pantries.household_id
    )
  );

-- rls policy: authenticated users can update pantries for households they belong to
create policy pantries_update_policy on pantries
  for update
  to authenticated
  using (
    exists (
      select 1 from user_households uh
      where uh.user_id = auth.uid() and uh.household_id = pantries.household_id
    )
  )
  with check (
    exists (
      select 1 from user_households uh
      where uh.user_id = auth.uid() and uh.household_id = pantries.household_id
    )
  );

-- rls policy: authenticated users can delete pantries for households they belong to
create policy pantries_delete_policy on pantries
  for delete
  to authenticated
  using (
    exists (
      select 1 from user_households uh
      where uh.user_id = auth.uid() and uh.household_id = pantries.household_id
    )
  );

-- rls policy: authenticated users can select pantry items for their household
create policy pantry_items_select_policy on pantry_items
  for select
  to authenticated
  using (
    exists (
      select 1 from pantries p
      inner join user_households uh on uh.household_id = p.household_id
      where uh.user_id = auth.uid() and p.id = pantry_items.pantry_id
    )
  );

-- rls policy: authenticated users can insert pantry items for their household
create policy pantry_items_insert_policy on pantry_items
  for insert
  to authenticated
  with check (
    exists (
      select 1 from pantries p
      inner join user_households uh on uh.household_id = p.household_id
      where uh.user_id = auth.uid() and p.id = pantry_items.pantry_id
    )
  );

-- rls policy: authenticated users can update pantry items for their household
create policy pantry_items_update_policy on pantry_items
  for update
  to authenticated
  using (
    exists (
      select 1 from pantries p
      inner join user_households uh on uh.household_id = p.household_id
      where uh.user_id = auth.uid() and p.id = pantry_items.pantry_id
    )
  )
  with check (
    exists (
      select 1 from pantries p
      inner join user_households uh on uh.household_id = p.household_id
      where uh.user_id = auth.uid() and p.id = pantry_items.pantry_id
    )
  );

-- rls policy: authenticated users can delete pantry items for their household
create policy pantry_items_delete_policy on pantry_items
  for delete
  to authenticated
  using (
    exists (
      select 1 from pantries p
      inner join user_households uh on uh.household_id = p.household_id
      where uh.user_id = auth.uid() and p.id = pantry_items.pantry_id
    )
  );


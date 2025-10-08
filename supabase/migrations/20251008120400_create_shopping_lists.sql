-- migration: create shopping_lists and shopping_list_items tables
-- purpose: manage household shopping lists
-- affected tables: shopping_lists, shopping_list_items
-- dependencies: households table

-- create shopping_lists table
-- each household has exactly one shopping list (enforced by unique constraint on household_id)
create table shopping_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null unique references households(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- create shopping_list_items table
-- stores individual items within a shopping list
-- item names are case-insensitive unique within a shopping list
-- includes is_purchased flag to track completion status
create table shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references shopping_lists(id) on delete cascade,
  name text not null,
  quantity numeric not null default 1 check (quantity >= 0),
  unit text,
  is_purchased boolean not null default false
);

-- create index on shopping_list_id for efficient item lookups by shopping list
create index idx_shopping_list_items_shopping_list_id on shopping_list_items(shopping_list_id);

-- create unique index to ensure case-insensitive unique item names within a shopping list
-- note: unique constraints on expressions must be implemented as unique indexes
create unique index idx_shopping_list_items_unique_name on shopping_list_items(shopping_list_id, lower(name));

-- enable row level security
-- rls ensures only household members can access their shopping list
-- alter table shopping_lists enable row level security;
-- alter table shopping_list_items enable row level security;

-- -- rls policy: authenticated users can select shopping lists for households they belong to
-- create policy shopping_lists_select_policy on shopping_lists
--   for select
--   to authenticated
--   using (
--     exists (
--       select 1 from user_households uh
--       where uh.user_id = auth.uid() and uh.household_id = shopping_lists.household_id
--     )
--   );

-- -- rls policy: authenticated users can insert shopping lists for households they belong to
-- create policy shopping_lists_insert_policy on shopping_lists
--   for insert
--   to authenticated
--   with check (
--     exists (
--       select 1 from user_households uh
--       where uh.user_id = auth.uid() and uh.household_id = shopping_lists.household_id
--     )
--   );

-- -- rls policy: authenticated users can update shopping lists for households they belong to
-- create policy shopping_lists_update_policy on shopping_lists
--   for update
--   to authenticated
--   using (
--     exists (
--       select 1 from user_households uh
--       where uh.user_id = auth.uid() and uh.household_id = shopping_lists.household_id
--     )
--   )
--   with check (
--     exists (
--       select 1 from user_households uh
--       where uh.user_id = auth.uid() and uh.household_id = shopping_lists.household_id
--     )
--   );

-- -- rls policy: authenticated users can delete shopping lists for households they belong to
-- create policy shopping_lists_delete_policy on shopping_lists
--   for delete
--   to authenticated
--   using (
--     exists (
--       select 1 from user_households uh
--       where uh.user_id = auth.uid() and uh.household_id = shopping_lists.household_id
--     )
--   );

-- -- rls policy: authenticated users can select shopping list items for their household
-- create policy shopping_list_items_select_policy on shopping_list_items
--   for select
--   to authenticated
--   using (
--     exists (
--       select 1 from shopping_lists sl
--       inner join user_households uh on uh.household_id = sl.household_id
--       where uh.user_id = auth.uid() and sl.id = shopping_list_items.shopping_list_id
--     )
--   );

-- -- rls policy: authenticated users can insert shopping list items for their household
-- create policy shopping_list_items_insert_policy on shopping_list_items
--   for insert
--   to authenticated
--   with check (
--     exists (
--       select 1 from shopping_lists sl
--       inner join user_households uh on uh.household_id = sl.household_id
--       where uh.user_id = auth.uid() and sl.id = shopping_list_items.shopping_list_id
--     )
--   );

-- -- rls policy: authenticated users can update shopping list items for their household
-- create policy shopping_list_items_update_policy on shopping_list_items
--   for update
--   to authenticated
--   using (
--     exists (
--       select 1 from shopping_lists sl
--       inner join user_households uh on uh.household_id = sl.household_id
--       where uh.user_id = auth.uid() and sl.id = shopping_list_items.shopping_list_id
--     )
--   )
--   with check (
--     exists (
--       select 1 from shopping_lists sl
--       inner join user_households uh on uh.household_id = sl.household_id
--       where uh.user_id = auth.uid() and sl.id = shopping_list_items.shopping_list_id
--     )
--   );

-- -- rls policy: authenticated users can delete shopping list items for their household
-- create policy shopping_list_items_delete_policy on shopping_list_items
--   for delete
--   to authenticated
--   using (
--     exists (
--       select 1 from shopping_lists sl
--       inner join user_households uh on uh.household_id = sl.household_id
--       where uh.user_id = auth.uid() and sl.id = shopping_list_items.shopping_list_id
--     )
--   );


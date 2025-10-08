-- migration: create recipes table
-- purpose: store household recipes in jsonb format
-- affected tables: recipes
-- dependencies: households table
-- note: jsonb structure validation handled at application layer

-- create recipes table
-- recipes are stored as jsonb to allow flexible markdown-based recipe format
-- includes constraints on cook_time and prep_time to ensure non-negative values
create table recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- ensure cook_time is non-negative if present
  constraint valid_cook_time check (
    (content->>'cook_time') is null or (content->>'cook_time')::int >= 0
  ),
  
  -- ensure prep_time is non-negative if present
  constraint valid_prep_time check (
    (content->>'prep_time') is null or (content->>'prep_time')::int >= 0
  )
);

-- create gin index on content for fast jsonb queries
-- this enables efficient ingredient searches and filtering
create index idx_recipes_content_gin on recipes using gin (content jsonb_path_ops);

-- create btree index on meal_type for efficient filtering by meal type
create index idx_recipes_meal_type on recipes ((content->>'meal_type'));

-- create index on household_id for efficient household-based queries
create index idx_recipes_household_id on recipes(household_id);

-- enable row level security
-- rls ensures only household members can access their recipes
alter table recipes enable row level security;

-- rls policy: authenticated users can select recipes for households they belong to
create policy recipes_select_policy on recipes
  for select
  to authenticated
  using (
    exists (
      select 1 from user_households uh
      where uh.user_id = auth.uid() and uh.household_id = recipes.household_id
    )
  );

-- rls policy: authenticated users can insert recipes for households they belong to
create policy recipes_insert_policy on recipes
  for insert
  to authenticated
  with check (
    exists (
      select 1 from user_households uh
      where uh.user_id = auth.uid() and uh.household_id = recipes.household_id
    )
  );

-- rls policy: authenticated users can update recipes for households they belong to
create policy recipes_update_policy on recipes
  for update
  to authenticated
  using (
    exists (
      select 1 from user_households uh
      where uh.user_id = auth.uid() and uh.household_id = recipes.household_id
    )
  )
  with check (
    exists (
      select 1 from user_households uh
      where uh.user_id = auth.uid() and uh.household_id = recipes.household_id
    )
  );

-- rls policy: authenticated users can delete recipes for households they belong to
create policy recipes_delete_policy on recipes
  for delete
  to authenticated
  using (
    exists (
      select 1 from user_households uh
      where uh.user_id = auth.uid() and uh.household_id = recipes.household_id
    )
  );


-- migration: add real-time collaboration support for shopping lists
-- purpose: enable real-time synchronization for shopping list items across household members
-- affected tables: shopping_list_items, shopping_lists
-- changes:
--   1. Add created_at and updated_at timestamps to shopping_list_items
--   2. Create trigger for automatic updated_at management on shopping_list_items
--   3. Add performance indexes for filtering and sorting
--   4. Enable RLS policies for shopping_lists and shopping_list_items
--   5. Configure Supabase Realtime (REPLICA IDENTITY FULL)

-- ============================================================================
-- 1. ADD TIMESTAMPS TO shopping_list_items
-- ============================================================================

-- add created_at column for tracking when items were added
alter table shopping_list_items 
  add column created_at timestamptz not null default now();

-- add updated_at column for conflict detection and last-modified sorting
alter table shopping_list_items 
  add column updated_at timestamptz not null default now();

-- ============================================================================
-- 2. CREATE TRIGGER FOR shopping_list_items
-- ============================================================================

-- trigger to automatically update updated_at timestamp
-- uses existing update_updated_at_column() function from 20251008120500
create trigger update_shopping_list_items_updated_at
  before update on shopping_list_items
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- 3. ADD PERFORMANCE INDEXES
-- ============================================================================

-- composite index for filtering purchased/unpurchased items
-- optimizes queries like: WHERE shopping_list_id = ? AND is_purchased = false
create index idx_shopping_list_items_list_purchased 
  on shopping_list_items(shopping_list_id, is_purchased);

-- index for sorting by last modification time
-- optimizes queries with ORDER BY updated_at
create index idx_shopping_list_items_updated_at 
  on shopping_list_items(updated_at);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- enable RLS on shopping_lists table
alter table shopping_lists enable row level security;

-- rls policy: users can select shopping lists for households they belong to
create policy shopping_lists_access on shopping_lists
  for select
  to authenticated
  using (
    exists (
      select 1 from user_households uh
      where uh.user_id = auth.uid() and uh.household_id = shopping_lists.household_id
    )
  );

-- rls policy: users can modify (insert/update/delete) shopping lists for their household
create policy shopping_lists_modify on shopping_lists
  for all
  to authenticated
  using (
    exists (
      select 1 from user_households uh
      where uh.user_id = auth.uid() and uh.household_id = shopping_lists.household_id
    )
  )
  with check (
    exists (
      select 1 from user_households uh
      where uh.user_id = auth.uid() and uh.household_id = shopping_lists.household_id
    )
  );

-- enable RLS on shopping_list_items table (critical for real-time security)
alter table shopping_list_items enable row level security;

-- rls policy: users can select shopping list items for their household
-- note: this policy is enforced on Supabase Realtime CDC events
create policy shopping_list_items_access on shopping_list_items
  for select
  to authenticated
  using (
    exists (
      select 1 from shopping_lists sl
      join user_households uh on uh.household_id = sl.household_id
      where sl.id = shopping_list_items.shopping_list_id 
        and uh.user_id = auth.uid()
    )
  );

-- rls policy: users can modify (insert/update/delete) shopping list items for their household
create policy shopping_list_items_modify on shopping_list_items
  for all
  to authenticated
  using (
    exists (
      select 1 from shopping_lists sl
      join user_households uh on uh.household_id = sl.household_id
      where sl.id = shopping_list_items.shopping_list_id 
        and uh.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from shopping_lists sl
      join user_households uh on uh.household_id = sl.household_id
      where sl.id = shopping_list_items.shopping_list_id 
        and uh.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. CONFIGURE SUPABASE REALTIME (REPLICA IDENTITY)
-- ============================================================================

-- set REPLICA IDENTITY FULL for shopping_list_items
-- this ensures UPDATE events include both old and new row data in CDC
-- required for: optimistic updates, conflict resolution, and complete change tracking
alter table shopping_list_items replica identity full;

-- optionally set REPLICA IDENTITY FULL for shopping_lists parent table
alter table shopping_lists replica identity full;

-- ============================================================================
-- NOTES FOR DEPLOYMENT
-- ============================================================================

-- after running this migration, enable Realtime in Supabase dashboard:
--   1. navigate to: Database → Replication
--   2. enable replication for: shopping_lists
--   3. enable replication for: shopping_list_items
--   4. supabase automatically respects RLS policies for real-time events
--
-- the supabase_realtime publication should include these tables:
--   alter publication supabase_realtime add table shopping_lists;
--   alter publication supabase_realtime add table shopping_list_items;
--
-- verify publication:
--   select * from pg_publication_tables where pubname = 'supabase_realtime';

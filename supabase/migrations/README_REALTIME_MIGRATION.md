# Shopping List Real-time Migration Guide

## Migration: `20260207120000_add_realtime_support_for_shopping_lists.sql`

This migration adds real-time collaboration support for shopping lists, enabling instant synchronization of shopping list changes across all household members.

## Changes Overview

### 1. Database Schema Changes

- ✅ Added `created_at` timestamp to `shopping_list_items`
- ✅ Added `updated_at` timestamp to `shopping_list_items`
- ✅ Created trigger for automatic `updated_at` management
- ✅ Added performance indexes for filtering and sorting

### 2. Security (RLS Policies)

- ✅ Enabled Row Level Security on `shopping_lists`
- ✅ Enabled Row Level Security on `shopping_list_items`
- ✅ Created access policies (SELECT)
- ✅ Created modify policies (INSERT, UPDATE, DELETE)

### 3. Realtime Configuration

- ✅ Set `REPLICA IDENTITY FULL` on `shopping_list_items`
- ✅ Set `REPLICA IDENTITY FULL` on `shopping_lists`

## Deployment Steps

### Step 1: Run Migration

```bash
# Navigate to project root
cd /path/to/pantry-pilot

# Apply migration using Supabase CLI
npx supabase db push

# Or apply specific migration
npx supabase migration up
```

### Step 2: Enable Realtime in Supabase Dashboard

**Important**: After running the migration, you must enable Realtime in the Supabase dashboard.

1. Open your Supabase project dashboard
2. Navigate to: **Database → Replication**
3. Find and enable replication for:
   - ✅ `shopping_lists`
   - ✅ `shopping_list_items`

### Step 3: Verify Realtime Publication

```sql
-- Connect to your Supabase database and run:
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Expected output should include:
-- pubname             | schemaname | tablename
-- --------------------|------------|-------------------
-- supabase_realtime  | public     | shopping_lists
-- supabase_realtime  | public     | shopping_list_items
```

### Step 4: Update Database Types

After running the migration, regenerate TypeScript types:

```bash
# Generate updated types from database schema
npx supabase gen types typescript --local > src/db/database.types.ts

# Or if using remote database
npx supabase gen types typescript --linked > src/db/database.types.ts
```

### Step 5: Verify RLS Policies

Test that RLS policies are working correctly:

```sql
-- As an authenticated user, try to:
-- 1. Select shopping list items from their household (should succeed)
-- 2. Select shopping list items from another household (should return empty)

-- Test query (replace <your-user-id> and <your-household-id>):
SET request.jwt.claims.sub = '<your-user-id>';

SELECT * FROM shopping_list_items sli
JOIN shopping_lists sl ON sl.id = sli.shopping_list_id
WHERE sl.household_id = '<your-household-id>';
```

## Rollback Instructions

If you need to rollback this migration:

```sql
-- 1. Remove Realtime configuration
ALTER TABLE shopping_list_items REPLICA IDENTITY DEFAULT;
ALTER TABLE shopping_lists REPLICA IDENTITY DEFAULT;

-- 2. Drop RLS policies
DROP POLICY IF EXISTS shopping_list_items_modify ON shopping_list_items;
DROP POLICY IF EXISTS shopping_list_items_access ON shopping_list_items;
DROP POLICY IF EXISTS shopping_lists_modify ON shopping_lists;
DROP POLICY IF EXISTS shopping_lists_access ON shopping_lists;

-- 3. Disable RLS
ALTER TABLE shopping_list_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists DISABLE ROW LEVEL SECURITY;

-- 4. Drop indexes
DROP INDEX IF EXISTS idx_shopping_list_items_updated_at;
DROP INDEX IF EXISTS idx_shopping_list_items_list_purchased;

-- 5. Drop trigger
DROP TRIGGER IF EXISTS update_shopping_list_items_updated_at ON shopping_list_items;

-- 6. Remove columns
ALTER TABLE shopping_list_items DROP COLUMN IF EXISTS updated_at;
ALTER TABLE shopping_list_items DROP COLUMN IF EXISTS created_at;
```

**Note**: Rollback will lose timestamp data. Consider backing up data first.

## Testing Real-time Functionality

### Test Plan

1. **Basic Subscription Test**

   ```typescript
   // In browser console or test file
   const channel = supabase
     .channel('test-shopping-list')
     .on(
       'postgres_changes',
       {
         event: '*',
         schema: 'public',
         table: 'shopping_list_items',
         filter: 'shopping_list_id=eq.<your-list-id>',
       },
       payload => {
         console.log('Change received:', payload)
       }
     )
     .subscribe()
   ```

2. **Multi-Client Test**
   - Open app in two browser windows
   - Sign in as same household member in both
   - Add item in window 1 → verify it appears in window 2
   - Mark purchased in window 2 → verify it updates in window 1
   - Delete item in window 1 → verify it disappears in window 2

3. **Security Test**
   - Sign in as user from different household
   - Verify they DON'T receive events from other household's list

### Expected Behavior

✅ INSERT events trigger immediately when items are added  
✅ UPDATE events trigger when quantity/unit/isPurchased changes  
✅ DELETE events trigger when items are removed or purchased  
✅ Events include full row data (REPLICA IDENTITY FULL)  
✅ Only household members receive events (RLS enforced)  
✅ Connection auto-reconnects on network interruption

## Performance Considerations

- **Index Performance**: Composite index `(shopping_list_id, is_purchased)` optimizes filtering
- **Realtime Overhead**: REPLICA IDENTITY FULL adds ~10-20% storage overhead
- **Connection Limits**: Supabase free tier allows 200 concurrent connections
- **Event Rate**: No rate limiting needed for MVP (shopping list changes are infrequent)

## Troubleshooting

### Issue: Real-time events not received

**Check**:

1. Realtime enabled in dashboard? (Database → Replication)
2. Tables in `supabase_realtime` publication?
3. RLS policies allow user access?
4. WebSocket connection established? (check browser Network tab)

### Issue: Unauthorized real-time events

**Solution**: Verify RLS policies are enabled and correct:

```sql
-- Check policies
SELECT * FROM pg_policies
WHERE tablename IN ('shopping_lists', 'shopping_list_items');
```

### Issue: Old row data missing in UPDATE events

**Solution**: Verify REPLICA IDENTITY is FULL:

```sql
-- Check replica identity
SELECT relname, relreplident
FROM pg_class
WHERE relname IN ('shopping_lists', 'shopping_list_items');

-- Expected: relreplident = 'f' (FULL)
```

## Related Files

- API Plan: `.ai/api-plan.md` (Shopping Lists section)
- DB Plan: `.ai/db-plan.md` (sections 1, 3, 4, 5, 6)
- TypeScript Types: `src/types/types.ts` (Realtime types)
- Database Types: `src/db/database.types.ts` (auto-generated)

## Questions?

If you encounter issues with this migration, check:

1. Supabase CLI version: `npx supabase --version` (should be >= 1.50.0)
2. PostgreSQL version: `SELECT version();` (should be >= 13.0)
3. Supabase project plan: Realtime requires Pro plan for production

---

**Migration created**: 2026-02-07  
**Status**: Ready for deployment  
**Breaking changes**: None (additive only)

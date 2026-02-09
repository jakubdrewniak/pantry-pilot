# Database Schema Plan

## 1. Tables

### users (Supabase Auth)

- **Source**: `auth.users` table managed by Supabase Auth
- **id** UUID PRIMARY KEY
- **email** TEXT NOT NULL
- **email_confirmed_at** TIMESTAMPTZ
- **created_at** TIMESTAMPTZ
- Additional profile fields managed via Supabase Auth or user_metadata JSONB

### households

- **id** UUID PRIMARY KEY
- **owner_id** UUID NOT NULL REFERENCES auth.users(id)
- **name** TEXT NOT NULL
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT now()
- **updated_at** TIMESTAMPTZ NOT NULL DEFAULT now()

### user_households

- **user_id** UUID PRIMARY KEY REFERENCES auth.users(id)
- **household_id** UUID NOT NULL REFERENCES households(id)
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT now()
- UNIQUE (user_id)

### household_invitations

- **id** UUID PRIMARY KEY
- **household_id** UUID NOT NULL REFERENCES households(id)
- **invited_email** TEXT NOT NULL
- **token** TEXT NOT NULL UNIQUE
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT now()
- **expires_at** TIMESTAMPTZ NOT NULL
- **status** TEXT NOT NULL DEFAULT 'pending'

### pantries

- **id** UUID PRIMARY KEY
- **household_id** UUID NOT NULL UNIQUE REFERENCES households(id)
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT now()
- **updated_at** TIMESTAMPTZ NOT NULL DEFAULT now()

### pantry_items

- **id** UUID PRIMARY KEY
- **pantry_id** UUID NOT NULL REFERENCES pantries(id) ON DELETE CASCADE
- **name** TEXT NOT NULL
- **quantity** NUMERIC NOT NULL DEFAULT 1 CHECK (quantity >= 0)
- **unit** TEXT
- UNIQUE (pantry_id, LOWER(name))

### recipes

- **id** UUID PRIMARY KEY
- **household_id** UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE
- **content** JSONB NOT NULL
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT now()
- **updated_at** TIMESTAMPTZ NOT NULL DEFAULT now()
- CHECK ((content->>'cook_time')::INT >= 0)
- CHECK ((content->>'prep_time')::INT >= 0)

### shopping_lists

- **id** UUID PRIMARY KEY
- **household_id** UUID NOT NULL UNIQUE REFERENCES households(id) ON DELETE CASCADE
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT now()
- **updated_at** TIMESTAMPTZ NOT NULL DEFAULT now()

### shopping_list_items

- **id** UUID PRIMARY KEY
- **shopping_list_id** UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE
- **name** TEXT NOT NULL
- **quantity** NUMERIC NOT NULL DEFAULT 1 CHECK (quantity >= 0)
- **unit** TEXT
- **is_purchased** BOOLEAN NOT NULL DEFAULT FALSE
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT now()
- **updated_at** TIMESTAMPTZ NOT NULL DEFAULT now()
- UNIQUE (shopping_list_id, LOWER(name))

## 2. Relationships

- **households** 1→\* **user_households** (a household has many memberships)
- **users** 1→1 **user_households** (each user belongs to exactly one household)
- **households** 1→1 **pantries**
- **pantries** 1→\* **pantry_items**
- **households** 1→\* **recipes**
- **households** 1→1 **shopping_lists**
- **shopping_lists** 1→\* **shopping_list_items**
- **households** 1→\* **household_invitations**

## 3. Indexes

- GIN INDEX ON recipes(content) USING gin (content jsonb_path_ops) -- fast ingredient search
- BTREE INDEX ON ( (content->>'meal_type') ) -- filter by meal type
- INDEX ON pantry_items(pantry_id)
- INDEX ON shopping_list_items(shopping_list_id) -- primary index for real-time queries
- INDEX ON shopping_list_items(shopping_list_id, is_purchased) -- filter purchased/unpurchased items
- INDEX ON shopping_list_items(updated_at) -- sorting by last modification
- INDEX ON household_invitations(token)

## 4. PostgreSQL RLS Policies

Enable Row Level Security on all resource tables:

### Example for recipes

```sql
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY recipes_access ON recipes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_households uh
      WHERE uh.user_id = auth.uid() AND uh.household_id = recipes.household_id
    )
  );
CREATE POLICY recipes_modify ON recipes
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM user_households uh
      WHERE uh.user_id = auth.uid() AND uh.household_id = recipes.household_id
    )
  );
```

### Shopping Lists RLS Policies (Real-time Enabled)

**Important**: These policies are critical for Supabase Realtime security. Users will only receive CDC events for rows they have access to.

```sql
-- Enable RLS on shopping_lists
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY shopping_lists_access ON shopping_lists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_households uh
      WHERE uh.user_id = auth.uid() AND uh.household_id = shopping_lists.household_id
    )
  );

CREATE POLICY shopping_lists_modify ON shopping_lists
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM user_households uh
      WHERE uh.user_id = auth.uid() AND uh.household_id = shopping_lists.household_id
    )
  );

-- Enable RLS on shopping_list_items (critical for real-time collaboration)
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY shopping_list_items_access ON shopping_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      JOIN user_households uh ON uh.household_id = sl.household_id
      WHERE sl.id = shopping_list_items.shopping_list_id
        AND uh.user_id = auth.uid()
    )
  );

CREATE POLICY shopping_list_items_modify ON shopping_list_items
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      JOIN user_households uh ON uh.household_id = sl.household_id
      WHERE sl.id = shopping_list_items.shopping_list_id
        AND uh.user_id = auth.uid()
    )
  );
```

Apply analogous policies on `pantries`, `pantry_items`, `household_invitations`.

## 5. Database Triggers

### Automatic Timestamp Management

To ensure `updated_at` timestamps are automatically maintained, create a reusable trigger function:

```sql
-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to households
CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to pantries
CREATE TRIGGER update_pantries_updated_at
  BEFORE UPDATE ON pantries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to recipes
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to shopping_lists
CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to shopping_list_items (critical for real-time conflict detection)
CREATE TRIGGER update_shopping_list_items_updated_at
  BEFORE UPDATE ON shopping_list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 6. Supabase Realtime Configuration

### Enable Realtime for Shopping List Items

Shopping list items require real-time replication for collaboration features:

```sql
-- Enable replica identity for shopping_list_items
-- This ensures UPDATE events include both old and new row data
ALTER TABLE shopping_list_items REPLICA IDENTITY FULL;

-- Optionally enable for shopping_lists parent table
ALTER TABLE shopping_lists REPLICA IDENTITY FULL;
```

### Realtime Publication

Ensure the Supabase Realtime publication includes shopping list tables:

```sql
-- Verify publication (Supabase creates 'supabase_realtime' publication by default)
-- Add tables if not already included
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_lists;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list_items;
```

**Note**: In Supabase dashboard, enable Realtime for these tables:

1. Navigate to Database → Replication
2. Enable replication for `shopping_lists` and `shopping_list_items`
3. Supabase automatically respects RLS policies for real-time events

## 7. Additional Notes

- JSONB validation for recipe structure (unique ingredient names) enforced at application layer.
- Supabase Auth used for user management; `auth.users.id` serves as `users` PK.
- Timestamps use `now()` defaults and are automatically managed via triggers (see section 5).
- Check constraints ensure non-negative numeric fields.
- Invitations expire via `expires_at` and cleanup via scheduled job.
- **Real-time collaboration**: `shopping_list_items` table configured for Supabase Realtime with REPLICA IDENTITY FULL to support change data capture (CDC) for household collaboration.
- **Timestamp tracking**: `created_at` and `updated_at` on `shopping_list_items` enable sorting, filtering, and conflict detection in real-time scenarios.
- **Performance**: Composite index on `(shopping_list_id, is_purchased)` optimizes filtering purchased/unpurchased items, critical for real-time UI updates.

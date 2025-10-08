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
- INDEX ON shopping_list_items(shopping_list_id)
- INDEX ON household_invitations(token)

## 4. PostgreSQL RLS Policies

Enable Row Level Security on all resource tables:

### Example for recipes

```
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

Apply analogous policies on `pantries`, `pantry_items`, `shopping_lists`, `shopping_list_items`, `household_invitations`.

## 5. Additional Notes

- JSONB validation for recipe structure (unique ingredient names) enforced at application layer.
- Supabase Auth used for user management; `auth.users.id` serves as `users` PK.
- Timestamps use `now()` defaults and application should manage `updated_at` triggers.
- Check constraints ensure non-negative numeric fields.
- Invitations expire via `expires_at` and cleanup via scheduled job.

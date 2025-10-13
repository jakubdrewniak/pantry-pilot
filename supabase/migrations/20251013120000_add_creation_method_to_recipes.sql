-- migration: add creation_method to recipes table
-- purpose: track how recipes were created (manual, ai_generated, ai_generated_modified)
-- affected tables: recipes
-- dependencies: recipes table
-- note: adds enum type and column with default value for existing recipes

-- create enum type for recipe creation methods
create type recipe_creation_method as enum ('manual', 'ai_generated', 'ai_generated_modified');

-- add creation_method column to recipes table
-- default to 'manual' for existing recipes
alter table recipes
add column creation_method recipe_creation_method not null default 'manual';

-- create index on creation_method for efficient filtering
create index idx_recipes_creation_method on recipes(creation_method);

-- add comment to document the column
comment on column recipes.creation_method is 'How the recipe was created: manual, ai_generated, or ai_generated_modified';

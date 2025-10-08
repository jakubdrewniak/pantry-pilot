-- migration: create triggers for updated_at columns
-- purpose: automatically update updated_at timestamps when records are modified
-- affected tables: households, pantries, recipes, shopping_lists
-- note: this ensures updated_at is always current without application-level management

-- create a reusable function to update the updated_at column
-- this function will be called by triggers on multiple tables
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- create trigger for households table
-- updates updated_at whenever a household record is modified
create trigger update_households_updated_at
  before update on households
  for each row
  execute function update_updated_at_column();

-- create trigger for pantries table
-- updates updated_at whenever a pantry record is modified
create trigger update_pantries_updated_at
  before update on pantries
  for each row
  execute function update_updated_at_column();

-- create trigger for recipes table
-- updates updated_at whenever a recipe record is modified
create trigger update_recipes_updated_at
  before update on recipes
  for each row
  execute function update_updated_at_column();

-- create trigger for shopping_lists table
-- updates updated_at whenever a shopping list record is modified
create trigger update_shopping_lists_updated_at
  before update on shopping_lists
  for each row
  execute function update_updated_at_column();


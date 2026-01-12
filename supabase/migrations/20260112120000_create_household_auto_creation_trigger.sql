-- migration: create trigger for automatic household creation on user registration
-- purpose: automatically create a household with associated resources when a new user registers
-- affected tables: households, user_households, pantries, shopping_lists
-- dependencies: auth.users, households, user_households, pantries, shopping_lists
--
-- business logic:
-- 1. when a new user registers (insert into auth.users), automatically create:
--    - a household owned by the user
--    - a user_households record linking the user to the household
--    - a pantry for the household
--    - a shopping list for the household
-- 2. this ensures every user has a functional household setup immediately after registration

-- create the trigger function
-- this function is executed after a new user is inserted into auth.users
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  new_household_id uuid;
begin
  -- step 1: create a household for the new user
  -- the user becomes the owner of this household
  -- default name is 'My household'
  insert into public.households (owner_id, name)
  values (new.id, 'My household')
  returning id into new_household_id;
  
  -- step 2: add the user to the household
  -- creates the many-to-one relationship between user and household
  insert into public.user_households (user_id, household_id)
  values (new.id, new_household_id);
  
  -- step 3: create a pantry for the household
  -- every household needs a pantry to manage inventory
  insert into public.pantries (household_id)
  values (new_household_id);
  
  -- step 4: create a shopping list for the household
  -- every household needs a shopping list to track items to purchase
  insert into public.shopping_lists (household_id)
  values (new_household_id);
  
  -- return the new user record (required for after insert trigger)
  return new;
exception
  when others then
    -- log the error for debugging
    raise warning 'failed to create household for user %: %', new.id, sqlerrm;
    -- re-raise the exception to roll back the transaction
    -- this ensures user registration fails if household creation fails
    raise;
end;
$$;

-- create the trigger on auth.users table
-- fires after a new user is successfully inserted
-- calls handle_new_user() to create the household and related resources
-- note: automatically creates a household with pantry and shopping list when a new user registers
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


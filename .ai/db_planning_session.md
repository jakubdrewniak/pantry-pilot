# Database Planning Session Summary

## Decisions

1. **Household Model**: Users can belong to only one household at a time - either their own or one they've been invited to
2. **Household Ownership**: The user who creates the household becomes the owner
3. **Permissions**: All household members have equal rights (no role hierarchy)
4. **Resource Sharing**: When invited to a household, users see only shared resources (pantry, shopping lists, recipes)
5. **Data Storage**: Recipes stored as JSONB in database with structure: `{title, ingredients: [{name, quantity, unit}], instructions, cook_time, meal_type, origin_type}`
6. **Ingredient Model**: Each ingredient has name, quantity, and unit as objects in JSON array
7. **Conflict Resolution**: Last editor wins (no complex conflict resolution for MVP)
8. **User Switching**: Users can switch households by accepting new invitations (must leave current household first)
9. **Household Deletion**: When household owner is deleted, the entire household is removed
10. **Resource Persistence**: User's personal resources are preserved when leaving a household
11. **Recipe Ordering**: Recipes ordered by creation date
12. **Ingredient Uniqueness**: Ingredient names must be unique within a single recipe
13. **Validation**: JSON validation handled at application level, not database level
14. **User Departure**: Hard delete from `user_households` when user leaves household
15. **No Audit Trail**: No activity logging or audit trails for MVP

## Matched Recommendations

1. **Core Tables**: Create `households`, `user_households`, `household_invitations` tables
2. **Resource Ownership**: Modify `pantries`, `recipes`, `shopping_lists` to use `household_id` instead of `user_id`
3. **JSONB Structure**: Use JSONB for recipes with proper indexing for ingredient search
4. **Indexing Strategy**: GIN index on JSONB for ingredient search, B-tree on `meal_type` for filtering
5. **RLS Policies**: Implement row-level security based on household membership
6. **Unique Constraints**: Ensure unique ingredient names within recipes and unique user-household relationships
7. **Data Integrity**: Add CHECK constraints for positive values (cook_time >= 0)
8. **Invitation Management**: Implement token-based invitation system with automatic cleanup
9. **Cascade Deletes**: Proper foreign key relationships with appropriate cascade behaviors
10. **Household Isolation**: Users can only access resources from their current household

## Database Planning Summary

### Main Requirements

The database schema needs to support a household-based sharing model where users can either manage their own resources or collaborate within a shared household. The system prioritizes simplicity with equal permissions for all household members and straightforward resource management.

### Key Entities and Relationships

- **households**: Core entity with owner_id, name, timestamps
- **user_households**: Many-to-one relationship (user can only belong to one household)
- **household_invitations**: Token-based invitation system
- **pantries**: One per household, contains pantry_items
- **recipes**: JSONB-based with household ownership
- **shopping_lists**: One per household, contains shopping_list_items

### Security and Scalability Considerations

- Row-level security (RLS) ensures users only access their current household's resources
- JSONB indexing provides efficient search capabilities for recipe ingredients
- Simple invitation system with token-based authentication
- Hard deletes for user departures to maintain data consistency
- No complex audit trails or versioning for MVP simplicity

### Data Model Highlights

- Recipes stored as JSONB with structured ingredient objects
- Household-centric resource ownership model
- Token-based invitation system with automatic cleanup
- Unique constraints on ingredient names within recipes
- Application-level JSON validation

## Unresolved Issues

None - all major architectural decisions have been clarified and the database schema requirements are well-defined for MVP implementation.

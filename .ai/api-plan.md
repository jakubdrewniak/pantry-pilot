# REST API Plan

## 1. Resources

- **User** (auth.users via Supabase Auth)
- **Household** (`households`)
- **Membership** (`user_households`)
- **Invitation** (`household_invitations`)
- **Pantry** (`pantries`)
- **PantryItem** (`pantry_items`)
- **Recipe** (`recipes`)
- **ShoppingList** (`shopping_lists`)
- **ShoppingListItem** (`shopping_list_items`)

## 2. Endpoints

### Authentication

| Method | Path               | Description                    | Request                            | Response              |
| ------ | ------------------ | ------------------------------ | ---------------------------------- | --------------------- |
| POST   | /api/auth/register | Register a new user            | `{ email, password }`              | `201 { user, token }` |
| POST   | /api/auth/login    | Log in and receive JWT         | `{ email, password }`              | `200 { user, token }` |
| POST   | /api/auth/logout   | Invalidate the current session | (Auth header)                      | `204 No Content`      |
| PATCH  | /api/auth/password | Change password                | `{ currentPassword, newPassword }` | `200 { message }`     |

### Households & Memberships

| Method | Path                                  | Description                       | Query/Body         | Response          |
| ------ | ------------------------------------- | --------------------------------- | ------------------ | ----------------- |
| GET    | /api/households                       | List households for current user  | (Auth header)      | `200 [household]` |
| POST   | /api/households                       | Create a new household            | `{ name }`         | `201 household`   |
| GET    | /api/households/{householdId}         | Retrieve household details        | (Auth header)      | `200 household`   |
| DELETE | /api/households/{householdId}         | Delete a household (with cascade) | (Auth header)      | `204`             |
| GET    | /api/households/{householdId}/members | List members                      | (Auth header)      | `200 [user]`      |
| POST   | /api/households/{householdId}/members | Invite/join household             | `{ invitedEmail }` | `201 invitation`  |

### Invitations

| Method | Path                                           | Description       | Body               | Response           |
| ------ | ---------------------------------------------- | ----------------- | ------------------ | ------------------ |
| GET    | /api/households/{householdId}/invitations      | List invitations  | (Auth header)      | `200 [invitation]` |
| POST   | /api/households/{householdId}/invitations      | Create invitation | `{ invitedEmail }` | `201 invitation`   |
| PATCH  | /api/invitations/{token}/accept                | Accept invitation | `{ token }`        | `200 membership`   |
| DELETE | /api/households/{householdId}/invitations/{id} | Cancel invitation | (Auth header)      | `204`              |

### Pantries & Items

| Method | Path                                       | Description                    | Body/Query                  | Response     |
| ------ | ------------------------------------------ | ------------------------------ | --------------------------- | ------------ |
| GET    | /api/households/{householdId}/pantry       | Get pantry for a household     | (Auth header)               | `200 pantry` |
| POST   | /api/households/{householdId}/pantry/items | Add an item (409 if duplicate) | `{ name, quantity, unit? }` | `201 item`   |
| GET    | /api/pantries/{pantryId}/items             | List pantry items              | (Auth header)               | `200 [item]` |
| PATCH  | /api/pantries/{pantryId}/items/{itemId}    | Update quantity/unit           | `{ quantity?, unit? }`      | `200 item`   |
| DELETE | /api/pantries/{pantryId}/items/{itemId}    | Remove item                    | (Auth header)               | `204`        |

### Recipes

| Method | Path                  | Description                             | Query/Body                                                                | Response                    |
| ------ | --------------------- | --------------------------------------- | ------------------------------------------------------------------------- | --------------------------- |
| GET    | /api/recipes          | List recipes (search, filter, paginate) | `?search=&mealType=&creationMethod=&page=&pageSize=&sort=`                | `200 [recipe]`              |
| POST   | /api/recipes          | Create manual recipe                    | `{ title, ingredients[], instructions, prepTime?, cookTime?, mealType? }` | `201 recipe`                |
| GET    | /api/recipes/{id}     | Get recipe by ID                        | (Auth header)                                                             | `200 recipe`                |
| PUT    | /api/recipes/{id}     | Update recipe (manual or AI-edited)     | same as POST                                                              | `200 recipe`                |
| DELETE | /api/recipes/{id}     | Delete recipe                           | (Auth header)                                                             | `204`                       |
| POST   | /api/recipes/generate | AI-powered generation                   | `{ hint?, usePantryItems: boolean }`                                      | `202 { recipe, warnings? }` |

### Shopping Lists & Items

| Method | Path                                        | Description                         | Body/Query                  | Response           |
| ------ | ------------------------------------------- | ----------------------------------- | --------------------------- | ------------------ |
| GET    | /api/households/{householdId}/shopping-list | Get or create shopping list         | (Auth header)               | `200 shoppingList` |
| POST   | /api/shopping-lists/generate                | Generate from recipes               | `{ recipeIds[] }`           | `201 [item]`       |
| GET    | /api/shopping-lists/{listId}/items          | List items                          | (Auth header)               | `200 [item]`       |
| POST   | /api/shopping-lists/{listId}/items          | Add manual item                     | `{ name, quantity, unit? }` | `201 item`         |
| PATCH  | /api/shopping-lists/{listId}/items/{itemId} | Mark purchased & transfer to pantry | `{ isPurchased: true }`     | `200 item`         |
| DELETE | /api/shopping-lists/{listId}/items/{itemId} | Remove item                         | (Auth header)               | `204`              |

## 3. Authentication and Authorization

- **Mechanism**: Supabase Auth (JWT) via Next.js API routes.
- **Implementation**: All protected endpoints require `Authorization: Bearer <token>`.
- **RLS**: Server-side row-level security policies enforce that `auth.uid()` must match household membership for selects, inserts, updates, deletes.
- **Rate limiting**: Enforce per-IP limits (e.g. 100 req/min) via middleware.

## 4. Validation and Business Logic

### Validation Conditions

- `pantry_items.quantity >= 0`; return `400 Bad Request` if negative.
- `shopping_list_items.quantity >= 0`.
- `recipes.content.prep_time, cook_time >= 0`.
- `pantry_items` and `shopping_list_items` names unique per parent (409 Conflict on violation).
- `household_invitations.token` unique; email format via Zod.

### Business Logic

- **Duplicate pantry prevention**: `POST /pantries/{id}/items` checks existing names (case-insensitive), returns `409 Conflict` if duplicate.
- **Empty pantry warning on AI generation**: `POST /recipes/generate` inspects pantry contents; if none, includes `X-Pantry-Empty: true` header and warning in body.
- **AI error handling**: Errors from LLM return `503 Service Unavailable` with user-friendly JSON: `{ error: message }`.
- **Transfer purchased items**: `PATCH /shopping-lists/{listId}/items/{itemId}` with `isPurchased=true` moves item to pantry via transaction; returns `200` with both updated item and new pantry item.
- **Confirmation prompts**: Delete endpoints are idempotent and return `204`; front-end must prompt user before calling.
- **Recipe creation tracking**: Recipes track their creation method ('manual', 'ai_generated', 'ai_generated_modified') to distinguish between different sources.
- **Search & Filter**: `GET /recipes` uses PostgreSQL GIN index on `content` for ingredient searches, BTREE index on `content->>'meal_type'` for meal type filtering, and BTREE index on `creation_method` for creation method filtering; supports full-text search on `title` and `content.ingredients`.
- **Pagination**: `page` and `pageSize` query params default to 1 and 20; include `X-Total-Count` header on list responses.

_Assumptions:_

- Meal types limited to `['breakfast','lunch','dinner']`.
- Recipe creation methods limited to `['manual', 'ai_generated', 'ai_generated_modified']`.
- Supabase client SDK manages real-time sync channels for front-end subscriptions.
- All IDs are UUIDs and returned as strings.

_End of API Plan._

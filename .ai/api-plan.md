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

#### Detailed reference: Authentication endpoints

##### Register a new user

- **Method**: POST
- **URL**: `/api/auth/register`
- **Description**: Creates a new user account and returns a session token.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "string (min 8 characters)"
  }
  ```
- **Response Body**:
  ```json
  {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2025-10-13T12:00:00Z"
    },
    "token": "jwt-string"
  }
  ```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request (invalid email/password), 409 Conflict (email already in use)
- **Validation / Business Logic Notes**:
  - Password must meet Supabase Auth strength requirements.
  - Email is stored lowercase and must be unique.

##### Log in

- **Method**: POST
- **URL**: `/api/auth/login`
- **Description**: Authenticates user credentials and issues a JWT.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "string"
  }
  ```
- **Response Body**:
  ```json
  {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "last_sign_in_at": "2025-10-13T12:34:56Z"
    },
    "token": "jwt-string"
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request (missing fields), 401 Unauthorized (wrong credentials)
- **Validation / Business Logic Notes**:
  - On success, the `Set-Cookie` header is returned when using http-only cookies auth mode.

##### Logout

- **Method**: POST
- **URL**: `/api/auth/logout`
- **Description**: Invalidates the current session token.
- **Query Parameters**: _(none)_
- **Request Body**: _(empty – relies on `Authorization` header)_
- **Response Body**: _(empty)_
- **Success Codes**: 204 No Content
- **Error Codes**: 401 Unauthorized (missing/invalid token)
- **Validation / Business Logic Notes**:
  - Clears refresh token cookie when cookie-based auth is enabled.

##### Change password

- **Method**: PATCH
- **URL**: `/api/auth/password`
- **Description**: Updates the authenticated user’s password.
- **Request Body**:
  ```json
  {
    "currentPassword": "string",
    "newPassword": "string (min 8 characters)"
  }
  ```
- **Response Body**:
  ```json
  {
    "message": "Password updated successfully"
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request (weak new password), 401 Unauthorized (wrong current password)
- **Validation / Business Logic Notes**:
  - New password must differ from the last 5 historical passwords.
  - Forces re-authentication by rotating the JWT.

### Households & Memberships

| Method | Path                                  | Description                       | Query/Body         | Response          |
| ------ | ------------------------------------- | --------------------------------- | ------------------ | ----------------- |
| GET    | /api/households                       | List households for current user  | (Auth header)      | `200 [household]` |
| POST   | /api/households                       | Create a new household            | `{ name }`         | `201 household`   |
| GET    | /api/households/{householdId}         | Retrieve household details        | (Auth header)      | `200 household`   |
| DELETE | /api/households/{householdId}         | Delete a household (with cascade) | (Auth header)      | `204`             |
| GET    | /api/households/{householdId}/members | List members                      | (Auth header)      | `200 [user]`      |
| POST   | /api/households/{householdId}/members | Invite/join household             | `{ invitedEmail }` | `201 invitation`  |

#### Detailed reference: Households & Memberships endpoints

##### List households for current user

- **Method**: GET
- **URL**: `/api/households`
- **Description**: Retrieves all households that the authenticated user belongs to.
- **Query Parameters**: _(none)_
- **Request Body**: _(empty – relies on `Authorization` header)_
- **Response Body**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "Doe Family",
        "created_at": "2025-10-13T12:00:00Z",
        "memberCount": 3
      }
    ]
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized
- **Validation / Business Logic Notes**:
  - RLS ensures only households the user is a member of are returned.

##### Create a new household

- **Method**: POST
- **URL**: `/api/households`
- **Description**: Creates a household owned by the authenticated user.
- **Request Body**:
  ```json
  {
    "name": "Doe Family"
  }
  ```
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "name": "Doe Family",
    "created_at": "2025-10-13T12:05:00Z"
  }
  ```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request (missing name)
- **Validation / Business Logic Notes**:
  - Household name must be 3–50 characters and unique per user (case-insensitive).

##### Retrieve household details

- **Method**: GET
- **URL**: `/api/households/{householdId}`
- **Description**: Fetches metadata for a specific household.
- **Request Body**: _(empty – relies on `Authorization` header)_
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "name": "Doe Family",
    "created_at": "2025-10-13T12:05:00Z",
    "members": [{ "id": "uuid", "email": "owner@example.com" }]
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 404 Not Found (not a member), 401 Unauthorized
- **Validation / Business Logic Notes**:
  - RLS validates membership.

##### Delete household

- **Method**: DELETE
- **URL**: `/api/households/{householdId}`
- **Description**: Deletes a household and all its related data.
- **Request Body**: _(empty)_
- **Response Body**: _(empty)_
- **Success Codes**: 204 No Content
- **Error Codes**: 404 Not Found, 403 Forbidden (non-owner), 401 Unauthorized
- **Validation / Business Logic Notes**:
  - Cascade deletes pantries, recipes, shopping lists within a SQL transaction.

##### List household members

- **Method**: GET
- **URL**: `/api/households/{householdId}/members`
- **Description**: Returns users belonging to the household.
- **Response Body**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "email": "member@example.com",
        "role": "owner" | "member",
        "joined_at": "2025-10-13T12:10:00Z"
      }
    ]
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 404 Not Found, 401 Unauthorized
- **Validation / Business Logic Notes**:
  - Requires membership; non-members receive 404 to avoid leaking existence.

##### Invite or join household

- **Method**: POST
- **URL**: `/api/households/{householdId}/members`
- **Description**: Sends an invitation to another user or allows an invited user to accept.
- **Request Body**:
  ```json
  {
    "invitedEmail": "friend@example.com"
  }
  ```
- **Response Body**:
  ```json
  {
    "invitation": {
      "id": "uuid",
      "householdId": "uuid",
      "invitedEmail": "friend@example.com",
      "token": "string",
      "expiresAt": "2025-10-20T12:00:00Z"
    }
  }
  ```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request (invalid email), 409 Conflict (already member), 404 Not Found
- **Validation / Business Logic Notes**:
  - Only owners may invite; invited user receives email with token.

### Invitations

| Method | Path                                           | Description       | Body               | Response           |
| ------ | ---------------------------------------------- | ----------------- | ------------------ | ------------------ |
| GET    | /api/households/{householdId}/invitations      | List invitations  | (Auth header)      | `200 [invitation]` |
| POST   | /api/households/{householdId}/invitations      | Create invitation | `{ invitedEmail }` | `201 invitation`   |
| PATCH  | /api/invitations/{token}/accept                | Accept invitation | `{ token }`        | `200 membership`   |
| DELETE | /api/households/{householdId}/invitations/{id} | Cancel invitation | (Auth header)      | `204`              |

#### Detailed reference: Invitation endpoints

##### List invitations

- **Method**: GET
- **URL**: `/api/households/{householdId}/invitations`
- **Description**: Returns all pending invitations for a given household.
- **Request Body**: _(empty – requires `Authorization` header)_
- **Response Body**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "householdId": "uuid",
        "invitedEmail": "friend@example.com",
        "token": "string",
        "expiresAt": "2025-10-20T12:00:00Z",
        "createdAt": "2025-10-13T12:00:00Z"
      }
    ]
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found
- **Validation / Business Logic Notes**:
  - Only household members can view invitations.

##### Create invitation

- **Method**: POST
- **URL**: `/api/households/{householdId}/invitations`
- **Description**: Creates a new invitation for the given email address.
- **Request Body**:
  ```json
  {
    "invitedEmail": "friend@example.com"
  }
  ```
- **Response Body**:
  ```json
  {
    "invitation": {
      "id": "uuid",
      "householdId": "uuid",
      "invitedEmail": "friend@example.com",
      "token": "string",
      "expiresAt": "2025-10-20T12:00:00Z",
      "createdAt": "2025-10-13T12:00:00Z"
    }
  }
  ```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 409 Conflict (already invited/member)
- **Validation / Business Logic Notes**:
  - Only owners may invite.
  - Email must be valid format.

##### Accept invitation

- **Method**: PATCH
- **URL**: `/api/invitations/{token}/accept`
- **Description**: Accepts a pending invitation using the provided token.
- **Request Body**:
  ```json
  {
    "token": "string"
  }
  ```
- **Response Body**:
  ```json
  {
    "membership": {
      "householdId": "uuid",
      "userId": "uuid",
      "role": "member",
      "joinedAt": "2025-10-13T12:15:00Z"
    }
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request (expired token), 404 Not Found (token not found)
- **Validation / Business Logic Notes**:
  - Token may be used once then invalidated.

##### Cancel invitation

- **Method**: DELETE
- **URL**: `/api/households/{householdId}/invitations/{id}`
- **Description**: Invalidates an existing invitation.
- **Response Body**: _(empty)_
- **Success Codes**: 204 No Content
- **Error Codes**: 404 Not Found (invitation not found), 403 Forbidden (not owner)
- **Validation / Business Logic Notes**:
  - Only owners can cancel.

### Pantries & Items

| Method | Path                                       | Description                             | Body/Query             | Response     |
| ------ | ------------------------------------------ | --------------------------------------- | ---------------------- | ------------ |
| GET    | /api/households/{householdId}/pantry       | Get pantry for a household              | (Auth header)          | `200 pantry` |
| POST   | /api/households/{householdId}/pantry/items | Add items (array, 409 if any duplicate) | `{ items[] }`          | `201 [item]` |
| GET    | /api/pantries/{pantryId}/items             | List pantry items                       | (Auth header)          | `200 [item]` |
| PATCH  | /api/pantries/{pantryId}/items/{itemId}    | Update quantity/unit                    | `{ quantity?, unit? }` | `200 item`   |
| DELETE | /api/pantries/{pantryId}/items/{itemId}    | Remove item                             | (Auth header)          | `204`        |

#### Detailed reference: Pantry endpoints

##### Get household pantry

- **Method**: GET
- **URL**: `/api/households/{householdId}/pantry`
- **Description**: Returns pantry metadata and items for a household.
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "householdId": "uuid",
    "createdAt": "2025-10-13T12:00:00Z",
    "items": [
      {
        "id": "uuid",
        "name": "Flour",
        "quantity": 1.0,
        "unit": "kg",
        "updatedAt": "2025-10-13T12:30:00Z"
      }
    ]
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 404 Not Found, 401 Unauthorized
- **Validation / Business Logic Notes**:
  - RLS ensures membership.

##### Add pantry items

- **Method**: POST
- **URL**: `/api/households/{householdId}/pantry/items`
- **Description**: Adds one or more items to the household pantry in a single request.
- **Request Body**:
  ```json
  {
    "items": [
      { "name": "Rice", "quantity": 2, "unit": "kg" },
      { "name": "Beans", "quantity": 1, "unit": "kg" }
    ]
  }
  ```
- **Response Body**:
  ```json
  {
    "items": [
      { "id": "uuid", "name": "Rice", "quantity": 2, "unit": "kg" },
      { "id": "uuid", "name": "Beans", "quantity": 1, "unit": "kg" }
    ]
  }
  ```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 409 Conflict (any duplicate name)
- **Validation / Business Logic Notes**:
  - All item names must be unique (case-insensitive) within the pantry.
  - The entire batch is rejected on the first validation error (atomic insert).

##### List pantry items

- **Method**: GET
- **URL**: `/api/pantries/{pantryId}/items`
- **Description**: Lists items in a pantry.
- **Response Body**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "Rice",
        "quantity": 2,
        "unit": "kg"
      }
    ]
  }
  ```
- **Success Codes**: 200 OK

##### Update pantry item quantity/unit

- **Method**: PATCH
- **URL**: `/api/pantries/{pantryId}/items/{itemId}`
- **Description**: Updates quantity or unit for an existing pantry item.
- **Request Body**:
  ```json
  {
    "quantity": 3,
    "unit": "kg"
  }
  ```
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "name": "Rice",
    "quantity": 3,
    "unit": "kg"
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 404 Not Found

##### Remove pantry item

- **Method**: DELETE
- **URL**: `/api/pantries/{pantryId}/items/{itemId}`
- **Description**: Deletes the specified pantry item.
- **Success Codes**: 204 No Content

### Recipes

| Method | Path                  | Description                             | Query/Body                                                                | Response                    |
| ------ | --------------------- | --------------------------------------- | ------------------------------------------------------------------------- | --------------------------- |
| GET    | /api/recipes          | List recipes (search, filter, paginate) | `?search=&mealType=&creationMethod=&page=&pageSize=&sort=`                | `200 [recipe]`              |
| POST   | /api/recipes          | Create manual recipe                    | `{ title, ingredients[], instructions, prepTime?, cookTime?, mealType? }` | `201 recipe`                |
| DELETE | /api/recipes          | Delete multiple recipes (bulk delete)   | `{ ids: string[] }`                                                       | `200 { deleted, failed }`   |
| GET    | /api/recipes/{id}     | Get recipe by ID                        | (Auth header)                                                             | `200 recipe`                |
| PUT    | /api/recipes/{id}     | Update recipe (manual or AI-edited)     | same as POST                                                              | `200 recipe`                |
| DELETE | /api/recipes/{id}     | Delete single recipe                    | (Auth header)                                                             | `204`                       |
| POST   | /api/recipes/generate | AI-powered generation                   | `{ hint?, usePantryItems: boolean }`                                      | `202 { recipe, warnings? }` |

#### Detailed reference: Recipe endpoints

##### List recipes

- **Method**: GET
- **URL**: `/api/recipes`
- **Description**: Returns paginated recipes filtered by search and metadata.
- **Query Parameters**:
  - `search` (string, optional) – full-text search across title/ingredients
  - `mealType` (breakfast | lunch | dinner)
  - `creationMethod` (manual | ai_generated | ai_generated_modified)
  - `page` (number, default 1)
  - `pageSize` (number, default 20)
  - `sort` (string, default `-createdAt`)
- **Response Body**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "title": "Fried Rice",
        "ingredients": [{ "name": "Rice", "quantity": 2, "unit": "cup" }],
        "instructions": "Cook rice…",
        "mealType": "dinner",
        "creationMethod": "manual",
        "prepTime": 10,
        "cookTime": 20,
        "createdAt": "2025-10-13T12:00:00Z"
      }
    ],
    "pagination": { "page": 1, "pageSize": 20, "total": 40 }
  }
  ```
- **Success Codes**: 200 OK

##### Create manual recipe

- **Method**: POST
- **URL**: `/api/recipes`
- **Description**: Creates a recipe authored by a user.
- **Request Body**: same shape as response without auto fields.
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request
- **Validation / Business Logic Notes**:
  - Title 3–100 chars, at least 1 ingredient.

##### Get recipe by ID

- **Method**: GET
- **URL**: `/api/recipes/{id}`
- **Description**: Returns a recipe in full.
- **Success Codes**: 200 OK, 404 Not Found

##### Update recipe

- **Method**: PUT
- **URL**: `/api/recipes/{id}`
- **Description**: Replaces recipe content.
- **Validation**: same as create.
- **Success Codes**: 200 OK

##### Delete recipe

- **Method**: DELETE
- **URL**: `/api/recipes/{id}`
- **Description**: Removes a single recipe permanently.
- **Success Codes**: 204 No Content
- **Error Codes**: 400 Bad Request (invalid UUID), 404 Not Found, 401 Unauthorized

##### Delete multiple recipes (bulk delete)

- **Method**: DELETE
- **URL**: `/api/recipes`
- **Description**: Removes multiple recipes in a single request. Returns detailed results including successful deletions and failures.
- **Request Body**:
  ```json
  {
    "ids": ["uuid1", "uuid2", "uuid3"]
  }
  ```
- **Response Body**:
  ```json
  {
    "deleted": ["uuid1", "uuid3"],
    "failed": [
      {
        "id": "uuid2",
        "reason": "Recipe not found or no access"
      }
    ],
    "summary": {
      "total": 3,
      "successful": 2,
      "failed": 1
    }
  }
  ```
- **Success Codes**: 200 OK (partial success is still 200)
- **Error Codes**: 400 Bad Request (invalid body or UUIDs), 401 Unauthorized
- **Validation / Business Logic Notes**:
  - Accepts 1-50 recipe IDs per request (prevents abuse)
  - Each UUID is validated for format
  - Non-existent recipes or recipes from other households are reported in `failed` array
  - Operation continues even if some deletions fail (partial success)
  - All successful deletions are committed atomically per recipe
  - Returns 200 even if all deletions fail (check `failed` array)

##### Generate recipe via AI

- **Method**: POST
- **URL**: `/api/recipes/generate`
- **Description**: Generates a recipe using GPT taking current pantry into account.
- **Request Body**:
  ```json
  {
    "hint": "spicy chicken",
    "usePantryItems": true
  }
  ```
- **Response Body**:
  ```json
  {
    "recipe": {
      "id": "uuid",
      "title": "Spicy Chicken & Rice",
      "ingredients": [ ... ],
      "instructions": "..."
    },
    "warnings": ["Pantry empty, using defaults"]
  }
  ```
- **Success Codes**: 202 Accepted
- **Error Codes**: 503 Service Unavailable (LLM error)
- **Validation / Business Logic Notes**:
  - Adds header `X-Pantry-Empty: true` when pantry empty.

### Shopping Lists & Items

**Real-time Collaboration Support**: Shopping lists are designed for real-time collaboration among household members. All mutations (INSERT, UPDATE, DELETE) trigger Supabase Realtime events that clients can subscribe to via PostgreSQL Change Data Capture (CDC). Front-end applications should establish a subscription to `shopping_list_items` table filtered by `shopping_list_id` to receive instant updates without polling.

| Method | Path                                             | Description                                       | Body/Query                           | Response                                 |
| ------ | ------------------------------------------------ | ------------------------------------------------- | ------------------------------------ | ---------------------------------------- |
| GET    | /api/households/{householdId}/shopping-list      | Get or create shopping list                       | (Auth header)                        | `200 shoppingList`                       |
| POST   | /api/shopping-lists/generate                     | Generate from recipes                             | `{ recipeIds[] }`                    | `201 [item]`                             |
| GET    | /api/shopping-lists/{listId}/items               | List items                                        | (Auth header)                        | `200 [item]`                             |
| POST   | /api/shopping-lists/{listId}/items               | Add manual items (array)                          | `{ items[] }`                        | `201 [item]`                             |
| PATCH  | /api/shopping-lists/{listId}/items/{itemId}      | Update item (quantity, unit, purchase)            | `{ quantity?, unit?, isPurchased? }` | `200 item`                               |
| DELETE | /api/shopping-lists/{listId}/items/{itemId}      | Remove single item                                | (Auth header)                        | `204`                                    |
| POST   | /api/shopping-lists/{listId}/items/bulk-purchase | Bulk mark items as purchased & transfer to pantry | `{ itemIds[] }`                      | `200 { purchased, transferred, failed }` |
| DELETE | /api/shopping-lists/{listId}/items/bulk-delete   | Bulk delete items                                 | `{ itemIds[] }`                      | `200 { deleted, failed }`                |

#### Detailed reference: Shopping list endpoints

##### Get or create shopping list

- **Method**: GET
- **URL**: `/api/households/{householdId}/shopping-list`
- **Description**: Retrieves the active shopping list for a household or creates one if none exists.
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "householdId": "uuid",
    "createdAt": "2025-10-13T12:00:00Z",
    "updatedAt": "2025-10-13T12:00:00Z",
    "items": []
  }
  ```
- **Success Codes**: 200 OK
- **Real-time Notes**:
  - After retrieving the list, front-end should subscribe to Supabase Realtime channel: `shopping_list_items:shopping_list_id=eq.{listId}`
  - Subscribe to events: `INSERT`, `UPDATE`, `DELETE` on `shopping_list_items` table
  - Client receives automatic updates when any household member modifies items

##### Generate shopping list from recipes

- **Method**: POST
- **URL**: `/api/shopping-lists/generate`
- **Description**: Populates a shopping list with ingredients needed for selected recipes. Triggers real-time notifications to all connected household members.
- **Request Body**:
  ```json
  {
    "recipeIds": ["uuid", "uuid"]
  }
  ```
- **Response Body**:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "name": "Chicken",
        "quantity": 1,
        "unit": "kg",
        "isPurchased": false,
        "createdAt": "2025-10-13T12:00:00Z"
      }
    ]
  }
  ```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request (invalid recipe IDs), 404 Not Found (recipe not found)
- **Validation / Business Logic Notes**:
  - Combines duplicate ingredients; sums quantities.
  - Maximum 20 recipes per request to prevent abuse.
  - All items are inserted atomically in a transaction.
- **Real-time Notes**:
  - Each inserted item triggers an `INSERT` event on Supabase Realtime
  - Connected clients receive batch notifications for all new items

##### List shopping list items

- **Method**: GET
- **URL**: `/api/shopping-lists/{listId}/items`
- **Description**: Lists items of a shopping list with optional filtering.
- **Query Parameters**:
  - `isPurchased` (boolean, optional) – filter by purchase status
  - `sort` (string, default `createdAt`) – sort by field (createdAt, name, isPurchased)
- **Response Body**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "shoppingListId": "uuid",
        "name": "Milk",
        "quantity": 2,
        "unit": "L",
        "isPurchased": false,
        "createdAt": "2025-10-13T12:00:00Z",
        "updatedAt": "2025-10-13T12:00:00Z"
      }
    ]
  }
  ```
- **Success Codes**: 200 OK
- **Real-time Notes**:
  - This endpoint provides initial state; real-time updates come via Supabase subscription
  - Use this for initial load, then rely on CDC events for updates

##### Add manual shopping list items

- **Method**: POST
- **URL**: `/api/shopping-lists/{listId}/items`
- **Description**: Adds multiple custom items to the shopping list at once. Triggers real-time notifications.
- **Request Body**:
  ```json
  {
    "items": [
      { "name": "Milk", "quantity": 2, "unit": "L" },
      { "name": "Eggs", "quantity": 12, "unit": "pcs" }
    ]
  }
  ```
- **Response Body**:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "name": "Milk",
        "quantity": 2,
        "unit": "L",
        "isPurchased": false,
        "createdAt": "2025-10-13T12:00:00Z"
      },
      {
        "id": "uuid",
        "name": "Eggs",
        "quantity": 12,
        "unit": "pcs",
        "isPurchased": false,
        "createdAt": "2025-10-13T12:00:00Z"
      }
    ]
  }
  ```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request (invalid items), 409 Conflict (duplicate names)
- **Validation / Business Logic Notes**:
  - Maximum 50 items per request to prevent abuse.
  - Item names must be unique (case-insensitive) within the shopping list.
  - If any duplicate is detected, entire batch is rejected (atomic operation).
  - Empty item names are rejected.
- **Real-time Notes**:
  - Each inserted item triggers an `INSERT` event
  - All household members see new items appear immediately
  - Client should implement optimistic updates for better UX

##### Update shopping list item

- **Method**: PATCH
- **URL**: `/api/shopping-lists/{listId}/items/{itemId}`
- **Description**: Updates item properties (quantity, unit, purchase status). Can also transfer purchased items to pantry.
- **Request Body** (all fields optional):
  ```json
  {
    "quantity": 3,
    "unit": "L",
    "isPurchased": true
  }
  ```
- **Response Body**:
  ```json
  {
    "item": {
      "id": "uuid",
      "name": "Milk",
      "quantity": 3,
      "unit": "L",
      "isPurchased": true,
      "updatedAt": "2025-10-13T12:30:00Z"
    },
    "pantryItem": {
      "id": "uuid",
      "name": "Milk",
      "quantity": 3,
      "unit": "L"
    }
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request (invalid values), 404 Not Found, 409 Conflict (name conflict in pantry)
- **Validation / Business Logic Notes**:
  - When `isPurchased` is set to `true`, item is automatically transferred to pantry via transaction.
  - If item already exists in pantry (case-insensitive name match), quantities are merged.
  - After successful pantry transfer, item is deleted from shopping list.
  - Transaction ensures atomicity: both pantry insert and list item delete succeed or both fail.
  - `quantity` must be >= 0.
- **Real-time Notes**:
  - Triggers `UPDATE` event if only quantity/unit changed
  - Triggers `DELETE` event if item was purchased and removed from list
  - Other household members see updates immediately
  - Pantry updates are NOT real-time in MVP (optional future enhancement)

##### Remove shopping list item

- **Method**: DELETE
- **URL**: `/api/shopping-lists/{listId}/items/{itemId}`
- **Description**: Deletes an item from the shopping list. Triggers real-time notification.
- **Success Codes**: 204 No Content
- **Error Codes**: 404 Not Found, 401 Unauthorized
- **Real-time Notes**:
  - Triggers `DELETE` event on Supabase Realtime
  - All connected household members see item disappear immediately
  - Client should implement optimistic deletion for better UX

##### Bulk purchase items

- **Method**: POST
- **URL**: `/api/shopping-lists/{listId}/items/bulk-purchase`
- **Description**: Marks multiple items as purchased and transfers them to pantry in a single operation. Implements partial success pattern.
- **Request Body**:
  ```json
  {
    "itemIds": ["uuid1", "uuid2", "uuid3"]
  }
  ```
- **Response Body**:
  ```json
  {
    "purchased": ["uuid1", "uuid3"],
    "transferred": [
      { "itemId": "uuid1", "pantryItemId": "uuid-a" },
      { "itemId": "uuid3", "pantryItemId": "uuid-b" }
    ],
    "failed": [
      {
        "itemId": "uuid2",
        "reason": "Item not found or already purchased"
      }
    ],
    "summary": {
      "total": 3,
      "successful": 2,
      "failed": 1
    }
  }
  ```
- **Success Codes**: 200 OK (even with partial failures)
- **Error Codes**: 400 Bad Request (invalid item IDs or empty array), 401 Unauthorized
- **Validation / Business Logic Notes**:
  - Accepts 1-50 item IDs per request (prevents abuse).
  - Each item is processed independently; failures don't block others.
  - For each item: marks as purchased, transfers to pantry (merging if exists), then deletes from list.
  - Each item transfer is atomic (transaction per item).
  - If pantry name conflict occurs, quantities are merged.
  - Returns detailed results showing which items succeeded/failed.
- **Real-time Notes**:
  - Each successful purchase triggers a `DELETE` event for that item
  - Multiple concurrent bulk operations are safe due to row-level locking
  - All household members see items disappear as they're processed

##### Bulk delete items

- **Method**: DELETE
- **URL**: `/api/shopping-lists/{listId}/items/bulk-delete`
- **Description**: Removes multiple items from shopping list in a single request. Implements partial success pattern.
- **Request Body**:
  ```json
  {
    "itemIds": ["uuid1", "uuid2", "uuid3"]
  }
  ```
- **Response Body**:
  ```json
  {
    "deleted": ["uuid1", "uuid3"],
    "failed": [
      {
        "itemId": "uuid2",
        "reason": "Item not found"
      }
    ],
    "summary": {
      "total": 3,
      "successful": 2,
      "failed": 1
    }
  }
  ```
- **Success Codes**: 200 OK (even with partial failures)
- **Error Codes**: 400 Bad Request (invalid item IDs or empty array), 401 Unauthorized
- **Validation / Business Logic Notes**:
  - Accepts 1-100 item IDs per request (prevents abuse).
  - Non-existent items are reported in `failed` array.
  - Each deletion is independent; some can succeed while others fail.
  - Operation is idempotent: deleting already-deleted items returns success.
- **Real-time Notes**:
  - Each successful deletion triggers a `DELETE` event
  - All household members see items disappear in real-time
  - Race conditions handled by PostgreSQL row-level locking

---

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
- **Shopping list real-time sync**: All shopping list mutations (INSERT, UPDATE, DELETE on `shopping_list_items`) trigger Supabase Realtime events via PostgreSQL CDC. Front-end subscribes to channel `shopping_list_items:shopping_list_id=eq.{listId}` to receive instant updates.
- **Bulk operations partial success**: Bulk purchase and bulk delete endpoints process items independently and return detailed results with both successful and failed operations. This allows the operation to continue even if some items fail.
- **Optimistic concurrency**: While not using explicit version fields, PostgreSQL row-level locking prevents lost updates during concurrent modifications. Last write wins for quantity/unit updates.
- **Conflict resolution for pantry transfer**: When purchasing an item that already exists in pantry (case-insensitive name match), quantities are summed and the shopping list item is removed.
- **Confirmation prompts**: Delete endpoints are idempotent and return `204`; front-end must prompt user before calling.
- **Recipe creation tracking**: Recipes track their creation method ('manual', 'ai_generated', 'ai_generated_modified') to distinguish between different sources.
- **Search & Filter**: `GET /recipes` uses PostgreSQL GIN index on `content` for ingredient searches, BTREE index on `content->>'meal_type'` for meal type filtering, and BTREE index on `creation_method` for creation method filtering; supports full-text search on `title` and `content.ingredients`.
- **Pagination**: `page` and `pageSize` query params default to 1 and 20; include `X-Total-Count` header on list responses.

_Assumptions:_

- Meal types limited to `['breakfast','lunch','dinner']`.
- Recipe creation methods limited to `['manual', 'ai_generated', 'ai_generated_modified']`.
- Supabase client SDK manages real-time sync channels for front-end subscriptions.
- All IDs are UUIDs and returned as strings.

## 5. Real-time Collaboration Strategy (Shopping Lists)

### Overview

Shopping lists support real-time collaboration via Supabase Realtime, which uses PostgreSQL Change Data Capture (CDC) to broadcast database changes to connected clients. This eliminates the need for polling and ensures all household members see updates immediately.

### Implementation Pattern

#### Server-side (API Routes)

1. All shopping list mutations use standard PostgreSQL operations (INSERT, UPDATE, DELETE)
2. No additional code needed for real-time—Supabase CDC automatically captures changes
3. Ensure RLS policies allow household members to read/write their shared shopping list
4. Use transactions for multi-step operations (e.g., purchase → pantry transfer → delete)

#### Client-side (React/Next.js)

1. **Initial Load**: Call `GET /api/shopping-lists/{listId}/items` to fetch current state
2. **Subscribe**: Establish Supabase Realtime channel:
   ```typescript
   const channel = supabase
     .channel('shopping-list-changes')
     .on(
       'postgres_changes',
       {
         event: '*', // INSERT, UPDATE, DELETE
         schema: 'public',
         table: 'shopping_list_items',
         filter: `shopping_list_id=eq.${listId}`,
       },
       payload => {
         // Handle payload.eventType: INSERT, UPDATE, DELETE
         // Update local state accordingly
       }
     )
     .subscribe()
   ```
3. **Optimistic Updates**: For better UX, update local state immediately, then revert on API error
4. **Cleanup**: Unsubscribe when component unmounts or user navigates away

### Event Types and Handling

| Event Type | Trigger                                | Client Action                       |
| ---------- | -------------------------------------- | ----------------------------------- |
| `INSERT`   | New item added (manual or from recipe) | Add item to local state             |
| `UPDATE`   | Item quantity/unit/isPurchased changed | Update matching item in local state |
| `DELETE`   | Item removed or purchased              | Remove item from local state        |

### Conflict Resolution

- **Last Write Wins**: PostgreSQL row-level locking ensures atomic updates
- **Duplicate Prevention**: Unique constraint on `(shopping_list_id, LOWER(name))` prevents duplicates
- **Quantity Merging**: When purchasing item that exists in pantry, server merges quantities
- **Race Conditions**: If two users purchase the same item simultaneously, first transaction succeeds, second receives 404 (item already deleted)

### Connection Management

- **Reconnection**: Supabase client automatically reconnects on network interruption
- **Sync on Reconnect**: After reconnection, client should call `GET /api/shopping-lists/{listId}/items` to sync missed changes
- **Offline Support**: Not in MVP scope; mutations fail gracefully with error messages

### Performance Considerations

- **Channel Limit**: One channel per shopping list is sufficient for all household members
- **Event Throttling**: Not required for MVP; shopping list mutations are infrequent
- **Payload Size**: CDC events include full row data; no additional API calls needed for most updates

### Security

- **RLS Enforcement**: Row-level security policies ensure users only receive events for their household's shopping list
- **JWT Validation**: Supabase validates JWT token on subscription; expired tokens are rejected
- **Channel Authorization**: Front-end passes authenticated Supabase client; server-side RLS handles authorization

### Testing Strategy

- **Unit Tests**: Mock Supabase client and verify state updates on each event type
- **Integration Tests**: Use Supabase test environment to verify real CDC events
- **E2E Tests**: Open two browser windows, perform action in one, verify update appears in other within 1 second

_End of API Plan._

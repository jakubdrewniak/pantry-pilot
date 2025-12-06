# API Endpoint Implementation Plan: Recipes CRUD - View, Update, Delete

## 1. Endpoint Overview

This document describes the implementation of four REST API endpoints for managing culinary recipes:

- **GET /api/recipes/{id}** - Retrieves a single recipe's details
- **PUT /api/recipes/{id}** - Updates an existing recipe
- **DELETE /api/recipes/{id}** - Deletes a single recipe
- **DELETE /api/recipes** (bulk) - Deletes multiple recipes at once

All endpoints require Bearer token authentication and implement resource-level authorization - users can only operate on recipes belonging to their household.

## 2. Request Details

### 2.1. GET /api/recipes/{id}

**HTTP Method**: GET  
**URL Structure**: `/api/recipes/{id}`

**Path Parameters**:

- `id` (required) - Recipe UUID in string format

**Headers**:

- `Authorization: Bearer <token>` (required)

**Query Parameters**: none

**Request Body**: none

---

### 2.2. PUT /api/recipes/{id}

**HTTP Method**: PUT  
**URL Structure**: `/api/recipes/{id}`

**Path Parameters**:

- `id` (required) - Recipe UUID in string format

**Headers**:

- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json` (required)

**Query Parameters**: none

**Request Body** (JSON):

```json
{
  "title": "Fried Rice with Vegetables",
  "ingredients": [
    {
      "name": "Rice",
      "quantity": 2,
      "unit": "cup"
    },
    {
      "name": "Carrots",
      "quantity": 1,
      "unit": "piece"
    }
  ],
  "instructions": "1. Cook rice...\n2. Sauté vegetables...",
  "prepTime": 15,
  "cookTime": 20,
  "mealType": "dinner"
}
```

**Required Fields**:

- `title` - string (3-100 characters)
- `ingredients` - array of objects (minimum 1 element)
  - `name` - string (non-empty)
  - `quantity` - number (positive)
  - `unit` - string (optional)
- `instructions` - string (non-empty)

**Optional Fields**:

- `prepTime` - number (integer >= 0, in minutes)
- `cookTime` - number (integer >= 0, in minutes)
- `mealType` - enum ('breakfast' | 'lunch' | 'dinner')

---

### 2.3. DELETE /api/recipes/{id}

**HTTP Method**: DELETE  
**URL Structure**: `/api/recipes/{id}`

**Path Parameters**:

- `id` (required) - Recipe UUID in string format

**Headers**:

- `Authorization: Bearer <token>` (required)

**Query Parameters**: none

**Request Body**: none

---

### 2.4. DELETE /api/recipes (Bulk Delete)

**HTTP Method**: DELETE  
**URL Structure**: `/api/recipes`

**Path Parameters**: none

**Headers**:

- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json` (required)

**Query Parameters**: none

**Request Body** (JSON):

```json
{
  "ids": [
    "123e4567-e89b-12d3-a456-426614174000",
    "234e5678-e89b-12d3-a456-426614174001",
    "345e6789-e89b-12d3-a456-426614174002"
  ]
}
```

**Required Fields**:

- `ids` - array of strings (UUIDs), 1-50 elements

**Constraints**:

- Minimum 1 UUID
- Maximum 50 UUIDs (protection against abuse)
- Each UUID must be in valid format

---

## 3. Types Used

### 3.1. DTOs (Data Transfer Objects)

**Recipe** (return type):

```typescript
interface Recipe {
  id: string
  title: string
  ingredients: Ingredient[]
  instructions: string
  mealType?: string
  creationMethod: RecipeCreationMethod
  prepTime?: number
  cookTime?: number
  createdAt: string
  updatedAt?: string
  householdId: string
}
```

**Ingredient**:

```typescript
interface Ingredient {
  name: string
  quantity: number
  unit?: string
}
```

### 3.2. Command Models (Request DTOs)

**UpdateRecipeRequest** (alias for CreateRecipeRequest):

```typescript
interface UpdateRecipeRequest {
  title: string
  ingredients: Ingredient[]
  instructions: string
  prepTime?: number
  cookTime?: number
  mealType?: string
}
```

### 3.3. Response Types

**GET /api/recipes/{id}**:

```typescript
type GetRecipeResponse = Recipe
```

**PUT /api/recipes/{id}**:

```typescript
type UpdateRecipeResponse = Recipe
```

**DELETE /api/recipes/{id}**:
No body in response (204 No Content)

**DELETE /api/recipes** (bulk):

```typescript
interface BulkDeleteResponse {
  deleted: string[] // Array of successfully deleted recipe IDs
  failed: Array<{
    id: string
    reason: string
  }>
  summary: {
    total: number
    successful: number
    failed: number
  }
}
```

**Error Response** (common for all):

```typescript
interface ErrorResponse {
  error: string
  message?: string
  details?: unknown
}
```

### 3.4. Internal Types

**RecipeContent** (JSONB representation in database):

```typescript
interface RecipeContent {
  title: string
  ingredients: Array<{
    name: string
    quantity: number
    unit?: string
  }>
  instructions: string
  meal_type?: string
  prep_time?: number
  cook_time?: number
}
```

---

## 4. Response Details

### 4.1. GET /api/recipes/{id}

**Success (200 OK)**:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Fried Rice with Vegetables",
  "ingredients": [
    {
      "name": "Rice",
      "quantity": 2,
      "unit": "cup"
    }
  ],
  "instructions": "1. Cook rice...",
  "mealType": "dinner",
  "creationMethod": "manual",
  "prepTime": 15,
  "cookTime": 20,
  "createdAt": "2025-12-06T10:30:00Z",
  "updatedAt": "2025-12-06T11:00:00Z",
  "householdId": "456e7890-e89b-12d3-a456-426614174000"
}
```

**Errors**:

- **400 Bad Request** - invalid UUID format

```json
{
  "error": "Bad Request",
  "message": "Invalid recipe ID format"
}
```

- **401 Unauthorized** - missing/invalid token

```json
{
  "error": "Unauthorized",
  "message": "Authentication token is required"
}
```

- **403 Forbidden** - recipe doesn't belong to user's household

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this recipe"
}
```

- **404 Not Found** - recipe doesn't exist

```json
{
  "error": "Not Found",
  "message": "Recipe not found"
}
```

- **500 Internal Server Error** - unexpected error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

### 4.2. PUT /api/recipes/{id}

**Success (200 OK)**:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Fried Rice with Vegetables - updated",
  "ingredients": [
    {
      "name": "Basmati Rice",
      "quantity": 2.5,
      "unit": "cup"
    }
  ],
  "instructions": "1. Cook basmati rice...",
  "mealType": "lunch",
  "creationMethod": "manual",
  "prepTime": 10,
  "cookTime": 25,
  "createdAt": "2025-12-06T10:30:00Z",
  "updatedAt": "2025-12-06T12:00:00Z",
  "householdId": "456e7890-e89b-12d3-a456-426614174000"
}
```

**Errors**:

- **400 Bad Request** - invalid UUID format or invalid data

```json
{
  "error": "Bad Request",
  "message": "Invalid recipe ID format"
}
```

or

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title must be at least 3 characters"
    },
    {
      "field": "ingredients.0.quantity",
      "message": "Quantity must be positive"
    }
  ]
}
```

- **401 Unauthorized** - same as GET
- **403 Forbidden** - same as GET
- **404 Not Found** - same as GET
- **500 Internal Server Error** - same as GET

---

### 4.3. DELETE /api/recipes/{id}

**Success (204 No Content)**:
No body in response. Status code 204 indicates successful deletion.

**Errors**:

- **400 Bad Request** - invalid UUID format

```json
{
  "error": "Bad Request",
  "message": "Invalid recipe ID format"
}
```

- **401 Unauthorized** - same as GET
- **403 Forbidden** - same as GET
- **404 Not Found** - same as GET
- **500 Internal Server Error** - same as GET

---

### 4.4. DELETE /api/recipes (Bulk Delete)

**Success (200 OK)**:

```json
{
  "deleted": ["123e4567-e89b-12d3-a456-426614174000", "345e6789-e89b-12d3-a456-426614174002"],
  "failed": [
    {
      "id": "234e5678-e89b-12d3-a456-426614174001",
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

**Success with all deleted**:

```json
{
  "deleted": ["123e4567-e89b-12d3-a456-426614174000", "234e5678-e89b-12d3-a456-426614174001"],
  "failed": [],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

**Success with none deleted** (all not found):

```json
{
  "deleted": [],
  "failed": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "reason": "Recipe not found or no access"
    },
    {
      "id": "234e5678-e89b-12d3-a456-426614174001",
      "reason": "Recipe not found or no access"
    }
  ],
  "summary": {
    "total": 2,
    "successful": 0,
    "failed": 2
  }
}
```

**Errors**:

- **400 Bad Request** - invalid body format or UUID

```json
{
  "error": "Bad Request",
  "message": "Invalid JSON format"
}
```

or

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "ids",
      "message": "Must provide between 1 and 50 recipe IDs"
    }
  ]
}
```

or

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "ids.0",
      "message": "Invalid UUID format"
    }
  ]
}
```

- **401 Unauthorized** - same as GET
- **500 Internal Server Error** - same as GET

**Notes**:

- Endpoint always returns 200 OK if the request is valid, even if all deletions fail
- Success/failure details are in the response body
- Partial success is normal and expected
- Frontend should display operation summary to the user

---

## 5. Data Flow

### 5.1. GET /api/recipes/{id}

```
1. Client → API: GET /api/recipes/{id} + Authorization header
2. API: Token verification (authenticateRequest)
3. API: UUID format validation
4. API → RecipeService: getRecipeById(userId, recipeId)
5. RecipeService → Supabase: Fetch user's household_id
6. RecipeService → Supabase: Fetch recipe + verify household_id
7. RecipeService: Transform DB → DTO (mapDbRecipeToDto)
8. API → Client: 200 OK + Recipe JSON
```

**Database Interactions**:

- Query 1: SELECT household_id FROM user_households WHERE user_id = ? LIMIT 1
- Query 2: SELECT \* FROM recipes WHERE id = ? AND household_id = ? LIMIT 1

---

### 5.2. PUT /api/recipes/{id}

```
1. Client → API: PUT /api/recipes/{id} + Authorization header + JSON body
2. API: Token verification (authenticateRequest)
3. API: UUID format validation
4. API: Parse JSON body
5. API: Validate body using CreateRecipeSchema (Zod)
6. API → RecipeService: updateRecipe(userId, recipeId, validatedInput)
7. RecipeService → Supabase: Fetch user's household_id
8. RecipeService → Supabase: Verify recipe exists and belongs to household
9. RecipeService: Transform input → RecipeContent (camelCase → snake_case)
10. RecipeService → Supabase: UPDATE recipes SET content = ?, updated_at = now() WHERE id = ?
11. RecipeService: Transform DB → DTO (mapDbRecipeToDto)
12. API → Client: 200 OK + Recipe JSON
```

**Database Interactions**:

- Query 1: SELECT household_id FROM user_households WHERE user_id = ? LIMIT 1
- Query 2: SELECT \* FROM recipes WHERE id = ? AND household_id = ? LIMIT 1
- Query 3: UPDATE recipes SET content = ?, updated_at = now() WHERE id = ? RETURNING \*

**Important**:

- Field `creation_method` is NOT updated - remains unchanged
- Field `household_id` is NOT updated - remains unchanged
- We only update the `content` field (JSONB) and automatic `updated_at`

---

### 5.3. DELETE /api/recipes/{id}

```
1. Client → API: DELETE /api/recipes/{id} + Authorization header
2. API: Token verification (authenticateRequest)
3. API: UUID format validation
4. API → RecipeService: deleteRecipe(userId, recipeId)
5. RecipeService → Supabase: Fetch user's household_id
6. RecipeService → Supabase: Verify recipe exists and belongs to household
7. RecipeService → Supabase: DELETE FROM recipes WHERE id = ?
8. API → Client: 204 No Content (no body)
```

**Database Interactions**:

- Query 1: SELECT household_id FROM user_households WHERE user_id = ? LIMIT 1
- Query 2: SELECT household_id FROM recipes WHERE id = ? LIMIT 1
- Query 3: DELETE FROM recipes WHERE id = ?

**Important**:

- CASCADE delete may remove related data (if relationships exist in DB)
- No body in response - only status code 204

---

### 5.4. DELETE /api/recipes (Bulk Delete)

```
1. Client → API: DELETE /api/recipes + Authorization header + JSON body with IDs array
2. API: Token verification (authenticateRequest)
3. API: Parse JSON body
4. API: Validate body (ids array, length 1-50, UUID format for each)
5. API → RecipeService: bulkDeleteRecipes(userId, recipeIds[])
6. RecipeService → Supabase: Fetch user's household_id
7. RecipeService: Loop through each recipeId:
   7a. RecipeService → Supabase: Verify recipe exists and belongs to household
   7b. If YES → DELETE FROM recipes WHERE id = ? (add to 'deleted')
   7c. If NO → add to 'failed' with reason
8. RecipeService: Return object with deleted[], failed[], summary
9. API → Client: 200 OK + BulkDeleteResponse JSON
```

**Database Interactions**:

- Query 1: SELECT household_id FROM user_households WHERE user_id = ? LIMIT 1
- For each recipe ID (N operations):
  - Query N.1: SELECT household_id FROM recipes WHERE id = ? LIMIT 1
  - Query N.2: DELETE FROM recipes WHERE id = ? (if verification passed)

**Transaction Approach**:
We consider two approaches:

**Option A - No transaction (recommended)**:

- Each deletion is independent
- Partial success is possible and reported
- Simpler to implement
- Better for UX (user sees what succeeded)

**Option B - With transaction (all-or-nothing)**:

- All deletions in one transaction
- Either all succeed or none
- More complex
- Can be frustrating for user (one failure = zero deletions)

**Recommendation**: Option A - no transaction, with partial success reporting.

**Performance Optimization**:

```sql
-- Instead of N+2 queries, can use:
-- Query 1: Fetch household_id
-- Query 2: Fetch all recipe_ids that belong to household (1 query)
SELECT id FROM recipes
WHERE id = ANY($1::uuid[]) AND household_id = $2

-- Query 3: Delete all verified (1 query)
DELETE FROM recipes
WHERE id = ANY($1::uuid[]) AND household_id = $2
RETURNING id
```

Benefit: Reduction from N+2 queries to 3 queries (constant).

---

## 6. Security Considerations

### 6.1. Authentication

**Mechanism**: Bearer Token in Authorization header

**Implementation**:

- Use `authenticateRequest()` function from `@/lib/api-auth`
- Automatic token verification by Supabase Auth
- Return 401 Unauthorized if token is missing/invalid

**Token Type**: JWT issued by Supabase Auth

---

### 6.2. Authorization

**KEY PRINCIPLE**: User can only operate on recipes belonging to their household.

**Implementation at service level**:

```typescript
// Pseudocode for access verification
async verifyRecipeAccess(userId: string, recipeId: string): Promise<boolean> {
  // 1. Fetch user's household_id
  const userHouseholdId = await getUserHouseholdId(userId)

  // 2. Fetch recipe's household_id
  const recipe = await getRecipeFromDb(recipeId)

  // 3. Compare
  return recipe.household_id === userHouseholdId
}
```

**Error Codes**:

- 403 Forbidden - when recipe exists but belongs to another household
- 404 Not Found - when recipe doesn't exist (don't reveal existence of other users' resources)

**Pattern**: For better UX and security, we return 404 instead of 403 when recipe doesn't belong to user. This prevents information leakage about resource existence.

---

### 6.3. Input Validation

**UUID Validation**:

```typescript
// Regex for UUID v4
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}
```

**Body Validation** (PUT):

- Use Zod schema: `CreateRecipeSchema`
- Automatic validation of types, ranges, required fields
- Return detailed validation errors in format:

```json
{
  "error": "Validation failed",
  "details": [{ "field": "title", "message": "Title must be at least 3 characters" }]
}
```

**SQL Injection Prevention**:

- Supabase uses parameterized queries
- We don't construct raw SQL queries
- All data goes through Supabase query builder

**XSS Prevention**:

- Data is validated but not sanitized on backend
- HTML escaping responsibility lies with frontend
- Backend stores raw data

---

### 6.4. Rate Limiting

**Currently not implemented** - to consider in the future:

- Rate limiting per user (e.g., 100 requests/minute)
- Rate limiting per IP
- Implementation using middleware or Supabase Edge Functions

---

### 6.5. CORS

**Handling**: Managed by Next.js and Supabase

- API routes handle CORS by default
- Token-based auth eliminates need for cookies (CSRF)

---

## 7. Error Handling

### 7.1. Error Handling Hierarchy

```
Route Handler (route.ts)
├─ Global try-catch (500)
├─ UUID validation (400)
├─ JSON parsing (400 - PUT and bulk DELETE only)
├─ Zod validation (400 - PUT and bulk DELETE only)
└─ Service Layer (RecipeService)
   ├─ No household (404 or use default)
   ├─ Recipe doesn't exist (404)
   ├─ No access (404)
   └─ Database errors (throw Error → caught in route handler → 500)
```

---

### 7.2. Detailed Error Handling Per Endpoint

#### GET /api/recipes/{id}

| Scenario                            | HTTP Status | Response                                                                      |
| ----------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| No token                            | 401         | `{ error: "Unauthorized", message: "Authentication token is required" }`      |
| Invalid token                       | 401         | `{ error: "Unauthorized", message: "Invalid or expired token" }`              |
| Invalid UUID                        | 400         | `{ error: "Bad Request", message: "Invalid recipe ID format" }`               |
| Recipe doesn't exist                | 404         | `{ error: "Not Found", message: "Recipe not found" }`                         |
| Recipe belongs to another household | 404         | `{ error: "Not Found", message: "Recipe not found" }`                         |
| Database error                      | 500         | `{ error: "Internal Server Error", message: "An unexpected error occurred" }` |
| Success                             | 200         | Recipe object                                                                 |

---

#### PUT /api/recipes/{id}

| Scenario                            | HTTP Status | Response                                                   |
| ----------------------------------- | ----------- | ---------------------------------------------------------- |
| No token                            | 401         | same as GET                                                |
| Invalid token                       | 401         | same as GET                                                |
| Invalid UUID                        | 400         | same as GET                                                |
| Invalid JSON                        | 400         | `{ error: "Bad Request", message: "Invalid JSON format" }` |
| Zod validation error                | 400         | `{ error: "Validation failed", details: [...] }`           |
| Recipe doesn't exist                | 404         | same as GET                                                |
| Recipe belongs to another household | 404         | same as GET                                                |
| Database error                      | 500         | same as GET                                                |
| Success                             | 200         | Updated Recipe object                                      |

---

#### DELETE /api/recipes/{id}

| Scenario                            | HTTP Status | Response    |
| ----------------------------------- | ----------- | ----------- |
| No token                            | 401         | same as GET |
| Invalid token                       | 401         | same as GET |
| Invalid UUID                        | 400         | same as GET |
| Recipe doesn't exist                | 404         | same as GET |
| Recipe belongs to another household | 404         | same as GET |
| Database error                      | 500         | same as GET |
| Success                             | 204         | (no body)   |

---

#### DELETE /api/recipes (Bulk Delete)

| Scenario                            | HTTP Status | Response                                                   |
| ----------------------------------- | ----------- | ---------------------------------------------------------- |
| No token                            | 401         | same as GET                                                |
| Invalid token                       | 401         | same as GET                                                |
| Invalid JSON                        | 400         | `{ error: "Bad Request", message: "Invalid JSON format" }` |
| Validation error (too few/many IDs) | 400         | `{ error: "Validation failed", details: [...] }`           |
| Invalid UUID in array               | 400         | `{ error: "Validation failed", details: [...] }`           |
| Database error                      | 500         | same as GET                                                |
| Success (full or partial)           | 200         | BulkDeleteResponse object                                  |

**Note**: Bulk delete always returns 200 if the request is valid, even with partial or complete deletion failure. Details are in the response body.

---

### 7.3. Logging Strategy

**Development**:

```typescript
console.error('[GET /api/recipes/[id]] Unexpected error:', error)
console.warn('[RecipeService] User has no household, using default')
```

**Production** (future):

- Integration with Sentry / LogRocket
- Structured logging with context (userId, recipeId, operation)
- Alerts for 500 errors

---

## 8. Performance Considerations

### 8.1. Database Query Optimizations

**Current queries** (per request):

- GET: 2 queries (household + recipe)
- PUT: 3 queries (household + verify + update)
- DELETE: 3 queries (household + verify + delete)
- Bulk DELETE: N+2 queries (household + N verifications + N deletes)

**Potential optimizations**:

1. **JOIN instead of 2 queries**:

```sql
-- Instead of 2 queries:
SELECT household_id FROM user_households WHERE user_id = ?
SELECT * FROM recipes WHERE id = ? AND household_id = ?

-- Use 1 query with JOIN:
SELECT r.*
FROM recipes r
INNER JOIN user_households uh ON r.household_id = uh.household_id
WHERE r.id = ? AND uh.user_id = ?
```

Benefit: Reduction of round-trips to database from 2 to 1.

2. **Caching household_id** in JWT token claims:

```typescript
// Add household_id to token during login
// Read from token instead of DB query
const householdId = user.app_metadata?.household_id
```

Benefit: Elimination of 1 query per request.

3. **Bulk DELETE optimization**:

```sql
-- Instead of N+2 queries:
-- Query 1: Fetch household_id
-- Query 2: Verify all recipes at once
SELECT id FROM recipes
WHERE id = ANY($1::uuid[]) AND household_id = $2

-- Query 3: Delete all verified at once
DELETE FROM recipes
WHERE id = ANY($1::uuid[]) AND household_id = $2
RETURNING id
```

Benefit: Reduction from N+2 queries to 3 queries (constant).

**Recommendation**: Implement optimizations after gathering performance metrics (avoid premature optimization).

---

### 8.2. Database Indexes

**Required indexes** (to verify in migrations):

```sql
-- For user_households
CREATE INDEX idx_user_households_user_id ON user_households(user_id);

-- For recipes
CREATE INDEX idx_recipes_household_id ON recipes(household_id);
CREATE INDEX idx_recipes_id_household ON recipes(id, household_id); -- composite
```

**Justification**:

- `user_id` - frequently used in WHERE clause
- `household_id` - frequently used in JOIN and WHERE
- Composite index `(id, household_id)` - covering index for verify queries

---

### 8.3. Response Size

**Current sizes** (estimated):

- GET: ~2-5 KB (single recipe)
- PUT: ~2-5 KB (updated recipe)
- DELETE single: ~0 KB (204 No Content)
- DELETE bulk: ~0.5-2 KB (depends on number of items)

**Potential optimizations**:

- Compression (gzip/brotli) - handled automatically by Next.js
- Partial responses (field selection) - to consider in the future:
  ```
  GET /api/recipes/{id}?fields=title,ingredients
  ```

**Recommendation**: Currently not needed, sizes are small.

---

### 8.4. Caching Strategy

**Cache headers**:

```typescript
// For GET endpoint
return NextResponse.json(recipe, {
  headers: {
    'Cache-Control': 'private, max-age=60', // 1 minute cache in browser
    ETag: generateETag(recipe), // to consider
  },
})
```

**Redis cache** (future):

- Cache recipe objects per household
- Invalidate on PUT/DELETE
- TTL: 5-10 minutes

**Recommendation**: Implement caching after confirming bottlenecks.

---

### 8.5. Monitoring Metrics

**Key Performance Indicators** (to implement):

- Response time per endpoint (p50, p95, p99)
- Database query time
- Error rate (4xx vs 5xx)
- Throughput (requests per second)

**Tools** (future):

- Vercel Analytics (if deploying to Vercel)
- Supabase Dashboard (query performance)
- Custom middleware for timing logs

---

## 9. Implementation Steps

### 9.1. Preparing Service Layer (RecipeService)

**File**: `src/lib/services/recipe.service.ts`

**Tasks**:

1. **Add method `getRecipeById`**:

```typescript
async getRecipeById(userId: string, recipeId: string): Promise<Recipe>
```

- Fetches user's household_id (with fallback to DEFAULT_HOUSEHOLD_ID)
- Executes query: `SELECT * FROM recipes WHERE id = ? AND household_id = ?`
- If no result → throw Error('Recipe not found')
- Transforms result to DTO using `mapDbRecipeToDto`
- Returns Recipe object

2. **Add method `updateRecipe`**:

```typescript
async updateRecipe(userId: string, recipeId: string, input: CreateRecipeInput): Promise<Recipe>
```

- Fetches user's household_id
- Verifies existence and access (similar to `getRecipeById`)
- Transforms input → RecipeContent (camelCase → snake_case)
- Executes UPDATE query with RETURNING \*
- If no result → throw Error('Recipe not found')
- Transforms result to DTO
- Returns updated Recipe object

3. **Add method `deleteRecipe`**:

```typescript
async deleteRecipe(userId: string, recipeId: string): Promise<void>
```

- Fetches user's household_id
- Verifies existence and access (query: `SELECT household_id FROM recipes WHERE id = ?`)
- If household_id doesn't match → throw Error('Recipe not found')
- Executes DELETE query
- Returns nothing (void)

4. **Add method `bulkDeleteRecipes`**:

```typescript
async bulkDeleteRecipes(userId: string, recipeIds: string[]): Promise<BulkDeleteResult>
```

- Fetches user's household_id
- **Option A (simple)**: Loop through each ID:
  - Verifies existence and household_id
  - If OK → deletes and adds to deleted[]
  - If error → adds to failed[] with reason
- **Option B (optimized)**: Uses bulk queries:
  - Query 1: SELECT id FROM recipes WHERE id = ANY($1) AND household_id = $2
  - Query 2: DELETE FROM recipes WHERE id = ANY($1) AND household_id = $2 RETURNING id
  - Compares requested IDs with deleted IDs, difference goes to failed[]
- Returns BulkDeleteResult with deleted[], failed[], summary

**BulkDeleteResult interface**:

```typescript
interface BulkDeleteResult {
  deleted: string[]
  failed: Array<{ id: string; reason: string }>
  summary: {
    total: number
    successful: number
    failed: number
  }
}
```

**Recommendation**: Start with Option A (simpler), optimize to Option B if performance is an issue.

**Notes**:

- All methods use the same access verification pattern
- Errors are thrown as Error - caught in route handler returns 500
- "Recipe not found" can mean either recipe missing or no access (security pattern)

---

### 9.2. Create Route Handler File for [id]

**File**: `src/app/api/recipes/[id]/route.ts`

**Directory Structure**:

```
src/app/api/recipes/
├── route.ts                 (existing - POST, GET /api/recipes)
├── [id]/
│   └── route.ts            (new - GET, PUT, DELETE /api/recipes/{id})
└── generate/
    └── route.ts            (existing - POST /api/recipes/generate)
```

**Tasks**:

1. Create directory `src/app/api/recipes/[id]/`
2. Create file `src/app/api/recipes/[id]/route.ts`

---

### 9.3. Implementation of GET /api/recipes/[id]

**File**: `src/app/api/recipes/[id]/route.ts`

**Function Structure**:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<GetRecipeResponse | { error: string; message?: string }>>
```

**Step-by-step Implementation**:

1. **Section 1: AUTHENTICATION**
   - Call `authenticateRequest(request)`
   - If `errorResponse` → return errorResponse
   - After this point `user` and `supabase` are guaranteed

2. **Section 2: VALIDATE PATH PARAMETER**
   - Get `id` from `params.id`
   - Validate UUID format using regex:
     ```typescript
     const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
     if (!UUID_REGEX.test(id)) {
       return NextResponse.json(
         { error: 'Bad Request', message: 'Invalid recipe ID format' },
         { status: 400 }
       )
     }
     ```

3. **Section 3: BUSINESS LOGIC - FETCH RECIPE**
   - Create `RecipeService` instance: `new RecipeService(supabase)`
   - Call in try-catch:
     ```typescript
     try {
       const recipe = await recipeService.getRecipeById(user!.id, id)
     } catch (error) {
       // If error message contains "not found" → 404
       // Otherwise → throw further (caught by global handler → 500)
     }
     ```

4. **Section 4: SUCCESS RESPONSE**
   - Return 200 OK with recipe object:
     ```typescript
     return NextResponse.json(recipe, { status: 200 })
     ```

5. **Section 5: GLOBAL ERROR HANDLER**
   - Catch-all in outer try-catch
   - Log error: `console.error('[GET /api/recipes/[id]]', error)`
   - Return 500

**Code Comments**:

- Use section structure as in existing `route.ts`
- Add JSDoc at top of function describing endpoint
- Add comments explaining each section

---

### 9.4. Implementation of PUT /api/recipes/[id]

**File**: Same - `src/app/api/recipes/[id]/route.ts`

**Function Structure**:

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<
  NextResponse<UpdateRecipeResponse | { error: string; message?: string; details?: unknown }>
>
```

**Step-by-step Implementation**:

1. **Section 1: AUTHENTICATION**
   - Same as GET

2. **Section 2: VALIDATE PATH PARAMETER**
   - Same as GET

3. **Section 3: PARSE & VALIDATE REQUEST BODY**
   - Parse JSON (in try-catch):
     ```typescript
     let body: unknown
     try {
       body = await request.json()
     } catch {
       return NextResponse.json(
         { error: 'Bad Request', message: 'Invalid JSON format' },
         { status: 400 }
       )
     }
     ```
   - Zod validation:
     ```typescript
     const validationResult = CreateRecipeSchema.safeParse(body)
     if (!validationResult.success) {
       return NextResponse.json(
         {
           error: 'Validation failed',
           details: validationResult.error.errors.map(err => ({
             field: err.path.join('.'),
             message: err.message,
           })),
         },
         { status: 400 }
       )
     }
     const validatedInput = validationResult.data
     ```

4. **Section 4: BUSINESS LOGIC - UPDATE RECIPE**
   - Create `RecipeService` instance
   - Call in try-catch:
     ```typescript
     try {
       const recipe = await recipeService.updateRecipe(user!.id, id, validatedInput)
     } catch (error) {
       // If error message contains "not found" → 404
       // Otherwise → throw further (caught by global handler → 500)
     }
     ```

5. **Section 5: SUCCESS RESPONSE**
   - Return 200 OK with updated recipe:
     ```typescript
     return NextResponse.json(recipe, { status: 200 })
     ```

6. **Section 6: GLOBAL ERROR HANDLER**
   - Same as GET

**Notes**:

- Import `CreateRecipeSchema` from `@/lib/validation/recipes`
- Use the same section structure as GET
- Add detailed comments

---

### 9.5. Implementation of DELETE /api/recipes/[id]

**File**: Same - `src/app/api/recipes/[id]/route.ts`

**Function Structure**:

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<void | { error: string; message?: string }>>
```

**Step-by-step Implementation**:

1. **Section 1: AUTHENTICATION**
   - Same as GET

2. **Section 2: VALIDATE PATH PARAMETER**
   - Same as GET

3. **Section 3: BUSINESS LOGIC - DELETE RECIPE**
   - Create `RecipeService` instance
   - Call in try-catch:
     ```typescript
     try {
       await recipeService.deleteRecipe(user!.id, id)
     } catch (error) {
       // If error message contains "not found" → 404
       // Otherwise → throw further (caught by global handler → 500)
     }
     ```

4. **Section 4: SUCCESS RESPONSE**
   - Return 204 No Content (NO body):
     ```typescript
     return new NextResponse(null, { status: 204 })
     ```

5. **Section 5: GLOBAL ERROR HANDLER**
   - Same as GET

**Notes**:

- DELETE returns `NextResponse<void>` for success
- Don't use `NextResponse.json()` for 204 - use `new NextResponse(null, { status: 204 })`
- No body in success response

---

### 9.6. Implementation of DELETE /api/recipes (Bulk Delete)

**File**: `src/app/api/recipes/route.ts` (add to existing file)

**Function Structure**:

```typescript
export async function DELETE(
  request: NextRequest
): Promise<
  NextResponse<BulkDeleteRecipesResponse | { error: string; message?: string; details?: unknown }>
>
```

**Step-by-step Implementation**:

1. **Section 1: AUTHENTICATION**
   - Call `authenticateRequest(request)`
   - If `errorResponse` → return errorResponse

2. **Section 2: PARSE & VALIDATE REQUEST BODY**
   - Parse JSON (in try-catch):
     ```typescript
     let body: unknown
     try {
       body = await request.json()
     } catch {
       return NextResponse.json(
         { error: 'Bad Request', message: 'Invalid JSON format' },
         { status: 400 }
       )
     }
     ```
   - Zod validation (new schema `BulkDeleteRecipesSchema`):
     ```typescript
     const validationResult = BulkDeleteRecipesSchema.safeParse(body)
     if (!validationResult.success) {
       return NextResponse.json(
         {
           error: 'Validation failed',
           details: validationResult.error.errors.map(err => ({
             field: err.path.join('.'),
             message: err.message,
           })),
         },
         { status: 400 }
       )
     }
     const { ids } = validationResult.data
     ```

3. **Section 3: VALIDATE UUID FORMATS**
   - For each ID in array, check UUID format:
     ```typescript
     const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
     const invalidIds = ids.filter(id => !UUID_REGEX.test(id))
     if (invalidIds.length > 0) {
       return NextResponse.json(
         {
           error: 'Validation failed',
           details: invalidIds.map((id, idx) => ({
             field: `ids.${ids.indexOf(id)}`,
             message: 'Invalid UUID format',
           })),
         },
         { status: 400 }
       )
     }
     ```

4. **Section 4: BUSINESS LOGIC - BULK DELETE RECIPES**
   - Create `RecipeService` instance
   - Call:
     ```typescript
     const result = await recipeService.bulkDeleteRecipes(user!.id, ids)
     ```

5. **Section 5: SUCCESS RESPONSE**
   - Return 200 OK with results:
     ```typescript
     return NextResponse.json(result, { status: 200 })
     ```

6. **Section 6: GLOBAL ERROR HANDLER**
   - Catch-all in outer try-catch
   - Log error: `console.error('[DELETE /api/recipes] Bulk delete error:', error)`
   - Return 500

**New Zod Schema** (add to `src/lib/validation/recipes.ts`):

```typescript
export const BulkDeleteRecipesSchema = z.object({
  ids: z
    .array(z.string())
    .min(1, 'Must provide at least 1 recipe ID')
    .max(50, 'Cannot delete more than 50 recipes at once'),
})

export type BulkDeleteRecipesInput = z.infer<typeof BulkDeleteRecipesSchema>
```

**Notes**:

- Import new schema from `@/lib/validation/recipes`
- Use the same section structure as other endpoints
- Add detailed comments
- Bulk delete always returns 200 (not 204), because it has body with results

---

### 9.7. Add Types for Bulk Delete Response

**File**: `src/types/types.ts`

**Add**:

```typescript
// Bulk Delete Response
export interface BulkDeleteRecipesResponse {
  deleted: string[]
  failed: Array<{
    id: string
    reason: string
  }>
  summary: {
    total: number
    successful: number
    failed: number
  }
}
```

---

### 9.8. Add UUID Validation Helper Function

**Option 1**: In route handler file (at the top)

```typescript
// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}
```

**Option 2**: Create shared utility (if used in multiple places)

```typescript
// src/lib/utils/uuid.ts
export function isValidUUID(id: string): boolean {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return UUID_REGEX.test(id)
}
```

**Recommendation**: Start with Option 1 (in route handler), move to utility if reused.

---

### 9.9. Update Validation Schemas

**File**: `src/lib/validation/recipes.ts`

**Add**:

```typescript
/**
 * Zod schema for bulk deleting recipes
 * Validates the request body for the DELETE /api/recipes endpoint
 */
export const BulkDeleteRecipesSchema = z.object({
  ids: z
    .array(z.string())
    .min(1, 'Must provide at least 1 recipe ID')
    .max(50, 'Cannot delete more than 50 recipes at once'),
})

export type BulkDeleteRecipesInput = z.infer<typeof BulkDeleteRecipesSchema>
```

**Note**: UUID format validation will be in route handler, not in Zod schema (for better error messages).

---

### 9.10. Manual Testing

**Before starting tests**:

1. Ensure Supabase is running
2. Ensure user is registered and logged in
3. Obtain Bearer token from login response

**Test GET /api/recipes/{id}**:

```bash
# Success
curl -X GET http://localhost:3000/api/recipes/{VALID_ID} \
  -H "Authorization: Bearer {TOKEN}"

# Invalid UUID
curl -X GET http://localhost:3000/api/recipes/invalid-uuid \
  -H "Authorization: Bearer {TOKEN}"

# No token
curl -X GET http://localhost:3000/api/recipes/{VALID_ID}

# Non-existent recipe
curl -X GET http://localhost:3000/api/recipes/00000000-0000-0000-0000-000000000999 \
  -H "Authorization: Bearer {TOKEN}"
```

**Test PUT /api/recipes/{id}**:

```bash
# Success
curl -X PUT http://localhost:3000/api/recipes/{VALID_ID} \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Recipe",
    "ingredients": [{"name": "Test", "quantity": 1}],
    "instructions": "Updated instructions",
    "prepTime": 20,
    "cookTime": 30,
    "mealType": "lunch"
  }'

# Validation error
curl -X PUT http://localhost:3000/api/recipes/{VALID_ID} \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AB",
    "ingredients": [],
    "instructions": ""
  }'

# Invalid JSON
curl -X PUT http://localhost:3000/api/recipes/{VALID_ID} \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d 'invalid-json'
```

**Test DELETE /api/recipes/{id}**:

```bash
# Success
curl -X DELETE http://localhost:3000/api/recipes/{VALID_ID} \
  -H "Authorization: Bearer {TOKEN}"

# Verify deletion
curl -X GET http://localhost:3000/api/recipes/{VALID_ID} \
  -H "Authorization: Bearer {TOKEN}"
# Should return 404
```

**Test DELETE /api/recipes (Bulk Delete)**:

```bash
# Success - all recipes deleted
curl -X DELETE http://localhost:3000/api/recipes \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "{VALID_ID_1}",
      "{VALID_ID_2}",
      "{VALID_ID_3}"
    ]
  }'

# Partial success - some don't exist
curl -X DELETE http://localhost:3000/api/recipes \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "{VALID_ID}",
      "00000000-0000-0000-0000-000000000999",
      "{ANOTHER_VALID_ID}"
    ]
  }'

# Validation error - too many IDs (> 50)
curl -X DELETE http://localhost:3000/api/recipes \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [/* 51 UUIDs */]
  }'

# Validation error - invalid UUID
curl -X DELETE http://localhost:3000/api/recipes \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["invalid-uuid", "{VALID_ID}"]
  }'

# Validation error - empty array
curl -X DELETE http://localhost:3000/api/recipes \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": []
  }'

# Invalid JSON
curl -X DELETE http://localhost:3000/api/recipes \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d 'invalid-json'
```

**Scenarios to Test**:

- ✅ Success for each endpoint
- ✅ No token (401)
- ✅ Invalid token (401)
- ✅ Invalid UUID (400)
- ✅ Non-existent recipe (404)
- ✅ Validation errors (400) - PUT only
- ✅ Invalid JSON (400) - PUT only
- ✅ Bulk delete - all deleted (200)
- ✅ Bulk delete - partial success (200)
- ✅ Bulk delete - all failed (200, but deleted=[])
- ✅ Bulk delete - too many IDs (400)
- ✅ Bulk delete - invalid UUID (400)
- ✅ Bulk delete - empty array (400)

---

### 9.11. Update Types (if needed)

**File**: `src/types/types.ts`

**Check**:

- Does `GetRecipeResponse` = Recipe ✅ (already exists)
- Does `UpdateRecipeRequest` = CreateRecipeRequest ✅ (already exists)
- Does `UpdateRecipeResponse` = Recipe ✅ (already exists)

**Add**:

- `BulkDeleteRecipesResponse` interface (as shown in section 9.7)

---

### 9.12. Update Validation Schemas

**File**: `src/lib/validation/recipes.ts`

**Add**:

```typescript
/**
 * Zod schema for bulk deleting recipes
 * Validates the request body for the DELETE /api/recipes endpoint
 */
export const BulkDeleteRecipesSchema = z.object({
  ids: z
    .array(z.string())
    .min(1, 'Must provide at least 1 recipe ID')
    .max(50, 'Cannot delete more than 50 recipes at once'),
})

export type BulkDeleteRecipesInput = z.infer<typeof BulkDeleteRecipesSchema>
```

**Note**: UUID format validation will be in route handler, not in Zod schema (for better error messages).

---

### 9.13. API Documentation (update)

**File**: `.ai/api-plan.md`

**Task**: Expand the recipes section with detailed descriptions of GET/PUT/DELETE endpoints (single and bulk).

**Note**: This update was already completed as part of this task.

---

### 9.14. Code Review Checklist

Before completing implementation, check:

**Code**:

- [ ] All sections are properly commented
- [ ] We use consistent naming (camelCase for JS, snake_case for DB)
- [ ] Error messages are user-friendly
- [ ] Logs contain context (endpoint, operation)
- [ ] No hardcoded values (except UUID_REGEX)

**Security**:

- [ ] All endpoints require authentication
- [ ] All operations verify household_id
- [ ] UUID is validated before use in query
- [ ] Input is validated by Zod schema (PUT, bulk DELETE)
- [ ] Error messages don't reveal implementation details

**Performance**:

- [ ] Minimal number of DB queries
- [ ] No N+1 query problems
- [ ] Responses are concise (no excessive data)

**Functionality**:

- [ ] GET returns 200 + Recipe
- [ ] PUT returns 200 + Updated Recipe
- [ ] DELETE (single) returns 204 (no content)
- [ ] DELETE (bulk) returns 200 + BulkDeleteResponse
- [ ] Bulk delete handles partial success correctly
- [ ] All error codes are correct
- [ ] 404 is returned instead of 403 (security pattern)

**Testing**:

- [ ] All success scenarios tested
- [ ] All error scenarios tested
- [ ] Response bodies verified
- [ ] Status codes verified
- [ ] Bulk delete: full success tested
- [ ] Bulk delete: partial success tested
- [ ] Bulk delete: complete failure tested

---

## 10. Future Improvements

### 10.1. Functionality

1. **Soft Delete** instead of hard delete:
   - Add `deleted_at` column to recipes table
   - DELETE sets `deleted_at = now()` instead of removing record
   - Queries filter `WHERE deleted_at IS NULL`
   - Benefit: recovery capability, audit trail

2. **Partial Updates** (PATCH):
   - Add PATCH /api/recipes/{id} endpoint
   - Allows updating only selected fields
   - Use `PartialUpdateRecipeSchema` (partial Zod schema)

3. **Recipe Versioning**:
   - Change history for recipes
   - Ability to rollback to previous version

4. **Bulk Update**:
   - PUT /api/recipes with array of recipes
   - Update multiple recipes at once
   - Similar pattern to bulk delete

### 10.2. Performance

1. **Query Optimization**:
   - Implement JOIN instead of 2 queries
   - Cache household_id in JWT claims
   - Bulk SQL for bulk delete (ANY operator)

2. **Response Caching**:
   - Redis cache for frequently read recipes
   - ETag support for conditional requests

3. **Database Indexes**:
   - Verify and add missing indexes
   - Monitor slow queries

### 10.3. Monitoring & Observability

1. **Metrics Collection**:
   - Response time tracking
   - Error rate monitoring
   - Throughput metrics

2. **Distributed Tracing**:
   - OpenTelemetry implementation
   - Trace ID propagation

3. **Alerting**:
   - Alerts for high error rate
   - Alerts for slow queries

### 10.4. Developer Experience

1. **API Playground**:
   - Swagger/OpenAPI documentation
   - Interactive API testing

2. **SDK Generation**:
   - Auto-generated TypeScript client
   - Type-safe API calls from frontend

3. **Integration Tests**:
   - Automated tests for endpoints
   - CI/CD integration

---

## Summary

This implementation plan provides detailed guidelines for implementing four CRUD endpoints for recipes:

- **GET /api/recipes/{id}** - retrieving a single recipe
- **PUT /api/recipes/{id}** - updating a recipe
- **DELETE /api/recipes/{id}** - deleting a single recipe
- **DELETE /api/recipes** - deleting multiple recipes at once (bulk delete)

Key implementation aspects:

1. **Security**: Token-based auth + household-level authorization
2. **Validation**: UUID format + Zod schema (PUT, bulk DELETE)
3. **Error Handling**: Consistent error responses, 404 instead of 403
4. **Code Quality**: Clear structure, comprehensive comments
5. **Performance**: Optimized queries, minimal round-trips (especially in bulk delete)
6. **UX**: Bulk delete with partial success - better user experience

**Bulk Delete - Key Features**:

- Handles 1-50 recipes at a time
- Partial success is OK (reported in response)
- Always returns 200 OK (if request is valid)
- Detailed information about successes and failures
- Database query optimization (optional, but recommended)

Implementation should take approximately 3-5 hours for an experienced developer, including manual testing.

After implementation, it is recommended to:

- Manual test all scenarios (especially bulk delete)
- Code review with focus on security and edge cases
- API documentation (api-plan.md update - already done)
- Plan for automated tests
- Monitor bulk delete performance in production

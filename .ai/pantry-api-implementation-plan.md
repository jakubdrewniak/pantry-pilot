# Pantry API Endpoints Implementation Plan

## 1. Endpoint Overview

This plan covers the implementation of five REST API endpoints for managing household pantries and pantry items:

1. **GET /api/households/{householdId}/pantry** - Retrieve pantry with all items for a household
2. **POST /api/households/{householdId}/pantry/items** - Add multiple items to a pantry (batch operation)
3. **GET /api/pantries/{pantryId}/items** - List all items in a specific pantry
4. **PATCH /api/pantries/{pantryId}/items/{itemId}** - Update quantity or unit for a specific item
5. **DELETE /api/pantries/{pantryId}/items/{itemId}** - Remove a specific item from the pantry

**Key Features**:

- Cookie-based authentication (handled by middleware)
- Authorization through household membership (enforced by RLS and service layer)
- Batch item insertion with atomic validation
- Case-insensitive duplicate prevention
- RESTful design with proper HTTP status codes

## 2. Request Details

### GET /api/households/{householdId}/pantry

- **HTTP Method**: GET
- **URL Structure**: `/api/households/{householdId}/pantry`
- **Parameters**:
  - **Required**:
    - `householdId` (path parameter, UUID v4) - The household identifier
  - **Optional**: None
- **Headers**:
  - Cookie-based authentication (automatic, no Authorization header needed)
- **Request Body**: None

### POST /api/households/{householdId}/pantry/items

- **HTTP Method**: POST
- **URL Structure**: `/api/households/{householdId}/pantry/items`
- **Parameters**:
  - **Required**:
    - `householdId` (path parameter, UUID v4) - The household identifier
  - **Optional**: None
- **Headers**:
  - Cookie-based authentication (automatic)
  - Content-Type: application/json
- **Request Body**:
  ```json
  {
    "items": [
      {
        "name": "Rice",
        "quantity": 2, // Optional, defaults to 1
        "unit": "kg" // Optional, can be null
      },
      {
        "name": "Beans",
        "quantity": 1,
        "unit": "kg"
      }
    ]
  }
  ```

### GET /api/pantries/{pantryId}/items

- **HTTP Method**: GET
- **URL Structure**: `/api/pantries/{pantryId}/items`
- **Parameters**:
  - **Required**:
    - `pantryId` (path parameter, UUID v4) - The pantry identifier
  - **Optional**: None
- **Headers**:
  - Cookie-based authentication (automatic)
- **Request Body**: None

### PATCH /api/pantries/{pantryId}/items/{itemId}

- **HTTP Method**: PATCH
- **URL Structure**: `/api/pantries/{pantryId}/items/{itemId}`
- **Parameters**:
  - **Required**:
    - `pantryId` (path parameter, UUID v4) - The pantry identifier
    - `itemId` (path parameter, UUID v4) - The item identifier
  - **Optional**: None (but at least one of quantity or unit must be provided in body)
- **Headers**:
  - Cookie-based authentication (automatic)
  - Content-Type: application/json
- **Request Body**:
  ```json
  {
    "quantity": 3, // Optional (but at least one field required)
    "unit": "kg" // Optional (but at least one field required)
  }
  ```

### DELETE /api/pantries/{pantryId}/items/{itemId}

- **HTTP Method**: DELETE
- **URL Structure**: `/api/pantries/{pantryId}/items/{itemId}`
- **Parameters**:
  - **Required**:
    - `pantryId` (path parameter, UUID v4) - The pantry identifier
    - `itemId` (path parameter, UUID v4) - The item identifier
  - **Optional**: None
- **Headers**:
  - Cookie-based authentication (automatic)
- **Request Body**: None

## 3. Types and Schemas

### Existing DTOs (from src/types/types.ts)

**Pantry DTOs**:

```typescript
interface Pantry {
  id: string
  householdId: string
  createdAt: string
}

type PantryWithItems = Pantry & {
  items: PantryItem[]
}

interface PantryItem {
  id: string
  name: string
  pantryId: string
  quantity: number
  unit: string | null
}
```

**Command Models**:

```typescript
interface AddPantryItemsRequest {
  items: Array<{
    name: string
    quantity?: number
    unit?: string | null
  }>
}

interface UpdatePantryItemRequest {
  quantity?: number
  unit?: string | null
}
```

**Response Types**:

```typescript
type GetPantryResponse = PantryWithItems

interface AddPantryItemsResponse {
  items: PantryItem[]
}

interface ListPantryItemsResponse {
  data: PantryItem[]
}

type UpdatePantryItemResponse = PantryItem
```

### New Validation Schemas (to create in src/lib/validation/pantry.ts)

```typescript
import { z } from 'zod'

// UUID validation (can be reused from household validation or defined here)
export const UUIDSchema = z.string().uuid('Invalid UUID format')

// Single pantry item schema
const PantryItemInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Item name is required')
    .max(100, 'Item name must be at most 100 characters'),
  quantity: z.number().positive('Quantity must be positive').default(1),
  unit: z.string().trim().max(20, 'Unit must be at most 20 characters').nullable().optional(),
})

// Add items request validation
export const AddPantryItemsSchema = z.object({
  items: z
    .array(PantryItemInputSchema)
    .min(1, 'At least one item is required')
    .max(50, 'Cannot add more than 50 items at once'),
})

// Update item request validation
export const UpdatePantryItemSchema = z
  .object({
    quantity: z.number().positive('Quantity must be positive').optional(),
    unit: z.string().trim().max(20, 'Unit must be at most 20 characters').nullable().optional(),
  })
  .refine(data => data.quantity !== undefined || data.unit !== undefined, {
    message: 'At least one field (quantity or unit) must be provided',
  })

// TypeScript types inferred from schemas
export type AddPantryItemsInput = z.infer<typeof AddPantryItemsSchema>
export type UpdatePantryItemInput = z.infer<typeof UpdatePantryItemSchema>
export type PantryItemInput = z.infer<typeof PantryItemInputSchema>
export type UUIDInput = z.infer<typeof UUIDSchema>
```

## 4. Response Details

### GET /api/households/{householdId}/pantry

**Success (200 OK)**:

```json
{
  "id": "uuid",
  "householdId": "uuid",
  "createdAt": "2025-10-13T12:00:00Z",
  "items": [
    {
      "id": "uuid",
      "name": "Flour",
      "pantryId": "uuid",
      "quantity": 1.0,
      "unit": "kg"
    }
  ]
}
```

**Error Responses**:

- `400 Bad Request` - Invalid householdId UUID format
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Household/pantry not found OR user not a member
- `500 Internal Server Error` - Unexpected error

### POST /api/households/{householdId}/pantry/items

**Success (201 Created)**:

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Rice",
      "pantryId": "uuid",
      "quantity": 2,
      "unit": "kg"
    },
    {
      "id": "uuid",
      "name": "Beans",
      "pantryId": "uuid",
      "quantity": 1,
      "unit": "kg"
    }
  ]
}
```

**Error Responses**:

- `400 Bad Request` - Invalid UUID, JSON, or validation failure
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Household/pantry not found OR user not a member
- `409 Conflict` - Duplicate item name (entire batch rejected)
- `500 Internal Server Error` - Unexpected error

### GET /api/pantries/{pantryId}/items

**Success (200 OK)**:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Rice",
      "pantryId": "uuid",
      "quantity": 2,
      "unit": "kg"
    }
  ]
}
```

**Error Responses**:

- `400 Bad Request` - Invalid pantryId UUID format
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Pantry not found OR user not authorized
- `500 Internal Server Error` - Unexpected error

### PATCH /api/pantries/{pantryId}/items/{itemId}

**Success (200 OK)**:

```json
{
  "id": "uuid",
  "name": "Rice",
  "pantryId": "uuid",
  "quantity": 3,
  "unit": "kg"
}
```

**Error Responses**:

- `400 Bad Request` - Invalid UUID, JSON, validation failure, or no fields provided
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Pantry/item not found OR user not authorized
- `500 Internal Server Error` - Unexpected error

### DELETE /api/pantries/{pantryId}/items/{itemId}

**Success (204 No Content)**: No response body

**Error Responses**:

- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Pantry/item not found OR user not authorized
- `500 Internal Server Error` - Unexpected error

## 5. Data Flow

### GET /api/households/{householdId}/pantry

1. **Authentication**: Validate user session from cookies
2. **Path Validation**: Validate householdId UUID format
3. **Authorization**: Check user is household member (via service layer)
4. **Pantry Retrieval**: Query pantries table by household_id
5. **Items Retrieval**: Query pantry_items table by pantry_id
6. **Transform**: Map database records to DTO
7. **Response**: Return 200 with PantryWithItems DTO

**Database Queries**:

```sql
-- Check membership (via RLS or service layer)
SELECT * FROM user_households
WHERE user_id = $1 AND household_id = $2

-- Get pantry
SELECT id, household_id, created_at
FROM pantries
WHERE household_id = $1

-- Get items
SELECT id, name, pantry_id, quantity, unit
FROM pantry_items
WHERE pantry_id = $1
ORDER BY name ASC
```

### POST /api/households/{householdId}/pantry/items

1. **Authentication**: Validate user session
2. **Path Validation**: Validate householdId UUID
3. **Body Validation**: Parse and validate items array
4. **Authorization**: Check user is household member
5. **Pantry Lookup**: Get pantry for household
6. **Duplicate Check**: Query existing items (case-insensitive)
7. **Atomic Insert**: Insert all items in single transaction OR reject all
8. **Transform**: Map inserted records to DTO
9. **Response**: Return 201 with created items array

**Business Logic**:

- Names are compared case-insensitively (LOWER(name))
- Quantity defaults to 1 if not provided
- Unit can be null
- If ANY duplicate found, entire batch is rejected (409 Conflict)
- Operation is atomic - all succeed or all fail

**Database Queries**:

```sql
-- Check for duplicates (case-insensitive)
SELECT name FROM pantry_items
WHERE pantry_id = $1
AND LOWER(name) IN ($2, $3, ...)

-- Batch insert (if no duplicates)
INSERT INTO pantry_items (pantry_id, name, quantity, unit)
VALUES
  ($1, $2, $3, $4),
  ($1, $5, $6, $7),
  ...
RETURNING id, name, pantry_id, quantity, unit
```

### GET /api/pantries/{pantryId}/items

1. **Authentication**: Validate user session
2. **Path Validation**: Validate pantryId UUID
3. **Authorization**: Check user has access to pantry (via household membership)
4. **Items Retrieval**: Query pantry_items table
5. **Transform**: Map records to DTOs
6. **Response**: Return 200 with items array

**Database Queries**:

```sql
-- Get pantry and check membership
SELECT p.*, h.id as household_id
FROM pantries p
JOIN households h ON h.id = p.household_id
JOIN user_households uh ON uh.household_id = h.id
WHERE p.id = $1 AND uh.user_id = $2

-- Get items
SELECT id, name, pantry_id, quantity, unit
FROM pantry_items
WHERE pantry_id = $1
ORDER BY name ASC
```

### PATCH /api/pantries/{pantryId}/items/{itemId}

1. **Authentication**: Validate user session
2. **Path Validation**: Validate pantryId and itemId UUIDs
3. **Body Validation**: Parse and validate quantity/unit (at least one required)
4. **Authorization**: Check user has access to pantry
5. **Item Update**: Update quantity and/or unit
6. **Transform**: Map updated record to DTO
7. **Response**: Return 200 with updated item

**Database Queries**:

```sql
-- Check authorization and update
UPDATE pantry_items
SET
  quantity = COALESCE($3, quantity),
  unit = COALESCE($4, unit)
WHERE id = $2
  AND pantry_id = $1
  AND EXISTS (
    SELECT 1 FROM pantries p
    JOIN user_households uh ON uh.household_id = p.household_id
    WHERE p.id = $1 AND uh.user_id = $5
  )
RETURNING id, name, pantry_id, quantity, unit
```

### DELETE /api/pantries/{pantryId}/items/{itemId}

1. **Authentication**: Validate user session
2. **Path Validation**: Validate pantryId and itemId UUIDs
3. **Authorization**: Check user has access to pantry
4. **Item Deletion**: Delete item from database
5. **Response**: Return 204 No Content

**Database Queries**:

```sql
-- Check authorization and delete
DELETE FROM pantry_items
WHERE id = $2
  AND pantry_id = $1
  AND EXISTS (
    SELECT 1 FROM pantries p
    JOIN user_households uh ON uh.household_id = p.household_id
    WHERE p.id = $1 AND uh.user_id = $3
  )
```

## 6. Security Considerations

### Authentication

- **Method**: Cookie-based session authentication
- **Implementation**: Use `authenticateRequest()` helper from `src/lib/api-auth.ts`
- **Session Management**: Middleware automatically refreshes session on each request
- **No Bearer Tokens**: Clients don't need to send Authorization headers

### Authorization

**Household Membership**:

- All pantry operations require user to be a member of the household that owns the pantry
- Membership checked via `user_households` table
- Service layer validates membership before any operations

**Row-Level Security (RLS)**:

- Supabase RLS policies enforce access at database level
- Policies check user_id is in user_households for the household
- Defense in depth - both application and database layers enforce security

**Information Disclosure Prevention**:

- Return 404 (Not Found) for BOTH "doesn't exist" AND "unauthorized" scenarios
- Prevents attackers from enumerating valid household/pantry IDs
- Consistent error messages regardless of reason

### Input Validation

**UUID Validation**:

- All IDs validated against UUID v4 format before database queries
- Prevents injection attacks and invalid data

**String Sanitization**:

- All strings trimmed to remove leading/trailing whitespace
- Maximum length limits enforced (name: 100 chars, unit: 20 chars)
- Minimum length for required fields (name: 1 char)

**Numeric Validation**:

- Quantity must be positive number
- Prevents negative inventory

**Case-Insensitive Duplicates**:

- Item names compared using LOWER() function
- Prevents "Rice" and "rice" as separate items

### Database Security

**Parameterized Queries**:

- All queries use Supabase client which automatically parameterizes
- Prevents SQL injection attacks

**Transaction Handling**:

- Batch operations use database transactions
- Rollback on any error ensures data consistency

**Cascade Deletion**:

- Items automatically deleted when pantry is deleted (ON DELETE CASCADE)
- Prevents orphaned records

## 7. Error Handling

### Service Layer Custom Errors

Create custom error classes in `src/lib/services/pantry.service.ts`:

```typescript
export class PantryNotFoundError extends Error {
  constructor(message = 'Pantry not found or access denied') {
    super(message)
    this.name = 'PantryNotFoundError'
  }
}

export class DuplicateItemError extends Error {
  constructor(
    public duplicateNames: string[],
    message = 'Duplicate item names found'
  ) {
    super(message)
    this.name = 'DuplicateItemError'
  }
}

export class ItemNotFoundError extends Error {
  constructor(message = 'Item not found') {
    super(message)
    this.name = 'ItemNotFoundError'
  }
}

export class EmptyUpdateError extends Error {
  constructor(message = 'At least one field must be provided for update') {
    super(message)
    this.name = 'EmptyUpdateError'
  }
}
```

### Error Mapping (Service → HTTP Status)

| Service Error         | HTTP Status               | When                                        |
| --------------------- | ------------------------- | ------------------------------------------- |
| `PantryNotFoundError` | 404 Not Found             | Pantry doesn't exist or user unauthorized   |
| `DuplicateItemError`  | 409 Conflict              | Item name already exists (case-insensitive) |
| `ItemNotFoundError`   | 404 Not Found             | Item doesn't exist or unauthorized          |
| `EmptyUpdateError`    | 400 Bad Request           | PATCH with no fields provided               |
| Zod validation error  | 400 Bad Request           | Invalid input data                          |
| JSON parse error      | 400 Bad Request           | Malformed JSON                              |
| UUID validation error | 400 Bad Request           | Invalid UUID format                         |
| Auth error            | 401 Unauthorized          | Missing or invalid session                  |
| Other errors          | 500 Internal Server Error | Unexpected errors                           |

### Error Response Format

All errors return JSON with consistent structure:

```typescript
interface ErrorResponse {
  error: string // Error category (e.g., "Bad Request", "Not Found")
  message?: string // Human-readable error message
  details?: unknown // Validation details (for 400 errors)
}
```

**Examples**:

```json
// 400 - Validation Error
{
  "error": "Validation failed",
  "details": [
    {
      "field": "items.0.name",
      "message": "Item name is required"
    },
    {
      "field": "items.1.quantity",
      "message": "Quantity must be positive"
    }
  ]
}

// 409 - Duplicate Item
{
  "error": "Conflict",
  "message": "Item 'Rice' already exists in pantry"
}

// 404 - Not Found
{
  "error": "Not Found",
  "message": "Pantry not found or access denied"
}

// 500 - Server Error
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### Logging Strategy

**Console Logging** (for development and debugging):

- Log all unexpected errors with full context
- Include endpoint path, method, user ID, request IDs
- Log validation failures for monitoring patterns

**Example**:

```typescript
console.error('[POST /api/households/{householdId}/pantry/items] Unexpected error:', {
  userId: user.id,
  householdId,
  error: error.message,
  stack: error.stack,
})
```

**Production Considerations**:

- Integrate with error tracking service (e.g., Sentry) in future
- Log errors to centralized logging service
- Monitor error rates and patterns

## 8. Performance Considerations

### Database Optimization

**Indexes** (should exist in database):

- Primary keys on all tables (automatic)
- Foreign keys for joins:
  - `pantries.household_id` → `households.id`
  - `pantry_items.pantry_id` → `pantries.id`
- Unique constraint on `(pantry_id, LOWER(name))` for duplicate prevention
- Index on `pantry_items.pantry_id` for fast item lookups

**Query Optimization**:

- Use single query to fetch pantry with items (avoid N+1)
- Batch insert for multiple items (single database round trip)
- Use COALESCE for partial updates (avoid conditionals)
- Limit result sets (e.g., max 50 items per batch insert)

### Batch Operations

**Add Items Endpoint**:

- Maximum 50 items per request (configurable)
- Single database transaction for atomicity
- Prevents performance degradation from huge batches
- Client can paginate if needed

### Caching Opportunities

**Future Optimizations**:

- Cache pantry items in Redis for frequently accessed households
- Invalidate cache on item updates
- Use stale-while-revalidate pattern for better UX

**Current Implementation**:

- No caching (rely on database performance)
- Supabase RLS caching at database level
- Client-side caching via React Query/SWR

### Connection Pooling

- Supabase handles connection pooling automatically
- No need to manage connections in application code
- RLS policies executed at database level (minimal overhead)

## 9. Implementation Steps

### Phase 1: Foundation (Validation & Service Layer)

#### Step 1.1: Create Validation Schemas

**File**: `src/lib/validation/pantry.ts`

- [ ] Create `UUIDSchema` for UUID validation (or import from households)
- [ ] Create `PantryItemInputSchema` for single item validation
  - name: string, trim, 1-100 chars
  - quantity: number, positive, default 1
  - unit: string, trim, max 20 chars, nullable, optional
- [ ] Create `AddPantryItemsSchema` for batch add validation
  - items: array, min 1, max 50
- [ ] Create `UpdatePantryItemSchema` for update validation
  - quantity: number, positive, optional
  - unit: string, max 20 chars, nullable, optional
  - refine: at least one field required
- [ ] Export TypeScript types inferred from schemas
- [ ] Add JSDoc comments for each schema

**Dependencies**: `zod`

**Tests**: Create `pantry.test.ts` with validation tests

#### Step 1.2: Create Pantry Service

**File**: `src/lib/services/pantry.service.ts`

- [ ] Define custom error classes:
  - `PantryNotFoundError`
  - `DuplicateItemError` (with `duplicateNames` property)
  - `ItemNotFoundError`
  - `EmptyUpdateError`
- [ ] Create `PantryService` class with constructor (accepts SupabaseClient)
- [ ] Implement private helper methods:
  - `hasAccess(pantryId, userId)` - check user can access pantry
  - `getPantryByHouseholdId(householdId, userId)` - get pantry for household
  - `checkDuplicates(pantryId, names)` - case-insensitive duplicate check
- [ ] Implement public methods:
  - `getPantryByHousehold(householdId, userId)` → `PantryWithItems`
  - `addItems(householdId, userId, items)` → `PantryItem[]`
  - `listItems(pantryId, userId)` → `PantryItem[]`
  - `updateItem(pantryId, itemId, userId, updates)` → `PantryItem`
  - `deleteItem(pantryId, itemId, userId)` → `void`
- [ ] Add comprehensive JSDoc comments
- [ ] Handle database errors with try-catch
- [ ] Log errors with context

**Dependencies**: `@supabase/supabase-js`, `src/db/database.types`, `src/types/types`

**Tests**: Create `pantry.service.test.ts` with unit tests

### Phase 2: API Route - Get Pantry by Household

#### Step 2.1: Create Route Handler

**File**: `src/app/api/households/[householdId]/pantry/route.ts`

- [ ] Import dependencies (NextRequest, NextResponse, authenticateRequest, PantryService, validation)
- [ ] Define `RouteParams` interface for path params
- [ ] Implement `GET` function:
  - Section 1: Authentication (use `authenticateRequest`)
  - Section 2: Validate path parameters (householdId UUID)
  - Section 3: Business logic (call service `getPantryByHousehold`)
  - Section 4: Success response (200 OK)
  - Section 5: Error handling (map service errors to HTTP status)
  - Section 6: Global error handler (500)
- [ ] Add comprehensive JSDoc comments
- [ ] Include all response types in function signature

**Example Structure**:

```typescript
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<GetPantryResponse | { error: string; message?: string }>> {
  try {
    // 1. Authentication
    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse

    // 2. Validate path parameters
    const { householdId } = await params
    const uuidValidation = UUIDSchema.safeParse(householdId)
    if (!uuidValidation.success) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid household ID format' },
        { status: 400 }
      )
    }

    // 3. Business logic
    const pantryService = new PantryService(supabase)
    const pantry = await pantryService.getPantryByHousehold(householdId, user!.id)

    // 4. Success response
    return NextResponse.json(pantry, { status: 200 })
  } catch (error) {
    // 5. Error handling
    if (error instanceof PantryNotFoundError) {
      return NextResponse.json({ error: 'Not Found', message: error.message }, { status: 404 })
    }

    // 6. Global error handler
    console.error('[GET /api/households/{householdId}/pantry] Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
```

### Phase 3: API Route - Add Pantry Items

#### Step 3.1: Create Route Handler

**File**: `src/app/api/households/[householdId]/pantry/items/route.ts`

- [ ] Implement `POST` function following same structure:
  - Section 1: Authentication
  - Section 2: Validate path parameters (householdId UUID)
  - Section 3: Parse & validate request body (AddPantryItemsSchema)
  - Section 4: Business logic (call service `addItems`)
  - Section 5: Success response (201 Created)
  - Section 6: Error handling (map DuplicateItemError → 409, PantryNotFoundError → 404)
  - Section 7: Global error handler (500)
- [ ] Handle JSON parse errors (400)
- [ ] Handle Zod validation errors (400 with details)
- [ ] Add comprehensive JSDoc comments

### Phase 4: API Route - List Pantry Items

#### Step 4.1: Create Route Handler

**File**: `src/app/api/pantries/[pantryId]/items/route.ts`

- [ ] Implement `GET` function:
  - Section 1: Authentication
  - Section 2: Validate path parameters (pantryId UUID)
  - Section 3: Business logic (call service `listItems`)
  - Section 4: Success response (200 OK with `{ data: items }` format)
  - Section 5: Error handling (PantryNotFoundError → 404)
  - Section 6: Global error handler (500)
- [ ] Add comprehensive JSDoc comments

### Phase 5: API Route - Update & Delete Pantry Item

#### Step 5.1: Create Route Handler

**File**: `src/app/api/pantries/[pantryId]/items/[itemId]/route.ts`

- [ ] Define `RouteParams` interface (pantryId and itemId)
- [ ] Implement `PATCH` function:
  - Section 1: Authentication
  - Section 2: Validate path parameters (both UUIDs)
  - Section 3: Parse & validate request body (UpdatePantryItemSchema)
  - Section 4: Business logic (call service `updateItem`)
  - Section 5: Success response (200 OK)
  - Section 6: Error handling (ItemNotFoundError → 404, EmptyUpdateError → 400)
  - Section 7: Global error handler (500)
- [ ] Implement `DELETE` function:
  - Section 1: Authentication
  - Section 2: Validate path parameters (both UUIDs)
  - Section 3: Business logic (call service `deleteItem`)
  - Section 4: Success response (204 No Content)
  - Section 5: Error handling (ItemNotFoundError → 404)
  - Section 6: Global error handler (500)
- [ ] Add comprehensive JSDoc comments

### Phase 6: Testing

#### Step 6.1: Unit Tests

- [ ] Test validation schemas (`pantry.test.ts`)
  - Valid inputs pass
  - Invalid inputs fail with correct messages
  - Edge cases (empty strings, negative numbers, etc.)
- [ ] Test service layer (`pantry.service.test.ts`)
  - Mock Supabase client
  - Test each service method
  - Test error cases (not found, duplicates, etc.)
  - Test authorization checks

#### Step 6.2: Integration Tests

- [ ] Create test database with seed data
- [ ] Test each API endpoint:
  - Success cases (200, 201, 204)
  - Authentication failures (401)
  - Validation failures (400)
  - Authorization failures (404)
  - Conflict cases (409)
- [ ] Test batch operations (multiple items)
- [ ] Test edge cases (empty arrays, max limits, etc.)

#### Step 6.3: E2E Tests (Playwright)

- [ ] Create test scenarios:
  - User creates household
  - User adds items to pantry
  - User updates item quantity
  - User deletes item
  - User views pantry
- [ ] Test error scenarios (unauthorized access, etc.)

### Phase 7: Documentation & Cleanup

#### Step 7.1: Update API Documentation

- [ ] Add pantry endpoints to API documentation
- [ ] Include request/response examples
- [ ] Document error codes and meanings

#### Step 7.2: Code Review Checklist

- [ ] All functions have JSDoc comments
- [ ] Error handling is comprehensive
- [ ] Logging is consistent
- [ ] TypeScript types are correct
- [ ] No console.logs (only console.error for errors)
- [ ] All tests pass
- [ ] Linter passes
- [ ] No security vulnerabilities

#### Step 7.3: Performance Testing

- [ ] Test with large item lists (100+ items)
- [ ] Test concurrent requests
- [ ] Monitor database query performance
- [ ] Check for N+1 query problems

### Phase 8: Deployment

#### Step 8.1: Pre-deployment

- [ ] Run full test suite
- [ ] Check database migrations are applied
- [ ] Verify environment variables
- [ ] Review security settings

#### Step 8.2: Deployment

- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Check performance metrics

## 10. Additional Considerations

### Database Migrations

Verify the following database setup exists (should already be in place):

```sql
-- pantries table
CREATE TABLE pantries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL UNIQUE REFERENCES households(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- pantry_items table
CREATE TABLE pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pantry_id UUID NOT NULL REFERENCES pantries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit TEXT,
  UNIQUE (pantry_id, LOWER(name))  -- Case-insensitive unique constraint
);

-- Indexes for performance
CREATE INDEX idx_pantries_household_id ON pantries(household_id);
CREATE INDEX idx_pantry_items_pantry_id ON pantry_items(pantry_id);

-- RLS policies
ALTER TABLE pantries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

-- Pantries: Users can only access pantries of households they're members of
CREATE POLICY "Users can view pantries of their households"
  ON pantries FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM user_households WHERE user_id = auth.uid()
    )
  );

-- Pantry Items: Users can access items of pantries they have access to
CREATE POLICY "Users can view items of their pantries"
  ON pantry_items FOR SELECT
  USING (
    pantry_id IN (
      SELECT p.id FROM pantries p
      JOIN user_households uh ON uh.household_id = p.household_id
      WHERE uh.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items to their pantries"
  ON pantry_items FOR INSERT
  WITH CHECK (
    pantry_id IN (
      SELECT p.id FROM pantries p
      JOIN user_households uh ON uh.household_id = p.household_id
      WHERE uh.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their pantries"
  ON pantry_items FOR UPDATE
  USING (
    pantry_id IN (
      SELECT p.id FROM pantries p
      JOIN user_households uh ON uh.household_id = p.household_id
      WHERE uh.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their pantries"
  ON pantry_items FOR DELETE
  USING (
    pantry_id IN (
      SELECT p.id FROM pantries p
      JOIN user_households uh ON uh.household_id = p.household_id
      WHERE uh.user_id = auth.uid()
    )
  );
```

### Future Enhancements

**Potential improvements for future iterations**:

1. **Real-time Updates**: Use Supabase Realtime for live pantry updates when multiple users modify items
2. **Item History**: Track quantity changes over time for analytics
3. **Item Categories**: Add categories (dairy, produce, meat, etc.) for better organization
4. **Expiration Dates**: Track when items expire
5. **Barcode Scanning**: Add items by scanning product barcodes
6. **Units Standardization**: Suggest common units for specific items
7. **Shopping List Integration**: One-click move pantry items to shopping list
8. **Search & Filter**: Search items by name, filter by category
9. **Bulk Operations**: Bulk update quantities, bulk delete
10. **Import/Export**: CSV import/export for pantry items

### API Versioning

Current implementation is version 1 (implicit). Consider versioning strategy for future breaking changes:

- Option 1: URL versioning (`/api/v1/pantries/...`)
- Option 2: Header versioning (`Accept: application/vnd.pantry.v1+json`)
- Option 3: No versioning yet (current approach - breaking changes require migration)

---

**Implementation Priority**: Follow phases sequentially for a systematic rollout. Each phase builds on the previous one and includes testing to ensure quality.

**Estimated Timeline**:

- Phase 1-2: 1-2 days
- Phase 3-5: 2-3 days
- Phase 6-7: 2-3 days
- Phase 8: 1 day
- **Total**: 6-9 days (including testing and documentation)

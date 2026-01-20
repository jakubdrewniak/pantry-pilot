# API Endpoints Implementation Plan: Household Invitations

This document provides a comprehensive implementation plan for the household invitation management endpoints. These endpoints enable household owners to invite new members, track pending invitations, accept invitations, and cancel them when needed.

## Implementation Status

**✅ COMPLETED** - All 5 endpoints implemented and functional (as of 2026-01-20)

### What's Implemented:

- ✅ 4 core endpoints (list, create, accept, cancel)
- ✅ 1 enhancement endpoint (current user invitations - discovery-based flow)
- ✅ Complete validation layer with Zod schemas
- ✅ InvitationService with all business logic
- ✅ Comprehensive error handling and status codes
- ✅ Full TypeScript type safety
- ✅ Security best practices (auth, authorization, token handling)
- ✅ No linting errors

### What's Pending:

- ⏳ Unit tests for service methods
- ⏳ Integration tests for API routes
- ⏳ E2E tests for complete flows
- ⏳ Security review and penetration testing
- ⏳ Performance testing and optimization

### Files Created:

- `src/lib/validation/invitations.ts` - Zod validation schemas
- `src/lib/services/invitation.service.ts` - Business logic and data access
- `src/app/api/households/[householdId]/invitations/route.ts` - GET & POST endpoints
- `src/app/api/invitations/[token]/accept/route.ts` - PATCH endpoint
- `src/app/api/households/[householdId]/invitations/[id]/route.ts` - DELETE endpoint
- `src/app/api/invitations/current/route.ts` - GET current user endpoint (enhancement)
- `src/types/types.ts` - Added InvitationWithHousehold and response types

## 1. Endpoints Overview

The invitation system consists of **five REST API endpoints** (4 core + 1 enhancement):

### Core Endpoints:

1. **GET /api/households/{householdId}/invitations** - List all pending invitations for a household
2. **POST /api/households/{householdId}/invitations** - Create a new invitation
3. **PATCH /api/invitations/{token}/accept** - Accept a pending invitation
4. **DELETE /api/households/{householdId}/invitations/{id}** - Cancel an existing invitation

### Enhancement Endpoint:

5. **GET /api/invitations/current** - Get current user's pending invitations (discovery-based flow)

### Purpose and Functionality

These endpoints implement a secure invitation flow that allows:

- Household owners to invite users by email
- Tracking of pending invitations
- Token-based invitation acceptance (single-use tokens with expiration)
- **Self-service invitation discovery (users can find invitations without external token)**
- Invitation cancellation by owners
- Prevention of duplicate invitations and memberships

---

## 2. Request Details by Endpoint

### 2.1 List Invitations

- **HTTP Method**: GET
- **URL Structure**: `/api/households/{householdId}/invitations`
- **Parameters**:
  - **Required**:
    - `householdId` (URL parameter, UUID) - The household ID
    - `Authorization` header with Bearer token
  - **Optional**: None
- **Request Body**: None

### 2.2 Create Invitation

- **HTTP Method**: POST
- **URL Structure**: `/api/households/{householdId}/invitations`
- **Parameters**:
  - **Required**:
    - `householdId` (URL parameter, UUID) - The household ID
    - `Authorization` header with Bearer token
  - **Optional**: None
- **Request Body**:

```json
{
  "invitedEmail": "friend@example.com"
}
```

### 2.3 Accept Invitation

- **HTTP Method**: PATCH
- **URL Structure**: `/api/invitations/{token}/accept`
- **Parameters**:
  - **Required**:
    - `token` (URL parameter, string) - The invitation token
    - `Authorization` header with Bearer token
  - **Optional**: None
- **Request Body**:

```json
{
  "token": "string"
}
```

> **Note**: The token appears both in URL and body per spec. Implementation should primarily use URL parameter.

### 2.4 Cancel Invitation

- **HTTP Method**: DELETE
- **URL Structure**: `/api/households/{householdId}/invitations/{id}`
- **Parameters**:
  - **Required**:
    - `householdId` (URL parameter, UUID) - The household ID
    - `id` (URL parameter, UUID) - The invitation ID
    - `Authorization` header with Bearer token
  - **Optional**: None
- **Request Body**: None

### 2.5 Get Current User's Invitations (Enhancement)

- **HTTP Method**: GET
- **URL Structure**: `/api/invitations/current`
- **Parameters**:
  - **Required**:
    - `Authorization` header with Bearer token
  - **Optional**: None
- **Request Body**: None
- **Purpose**: Self-service invitation discovery - allows authenticated users to find invitations sent to their email without needing the token upfront

---

## 3. Types Used

### 3.1 DTOs (Data Transfer Objects)

From `src/types/types.ts`:

**Invitation** (lines 57-64):

```typescript
export interface Invitation {
  id: string
  householdId: string
  invitedEmail: string
  token: string
  expiresAt: string
  createdAt: string
}
```

**InvitationWithHousehold** (lines 67-70) - Enhancement:

```typescript
export interface InvitationWithHousehold extends Invitation {
  householdName: string
  ownerEmail: string
}
```

**Membership** (lines 48-54):

```typescript
export interface Membership {
  householdId: string
  userId: string
  createdAt: string
  role: 'owner' | 'member'
  joinedAt: string
}
```

### 3.2 Command Models (Request DTOs)

From `src/types/types.ts`:

**CreateInvitationRequest** (lines 151-153):

```typescript
export interface CreateInvitationRequest {
  invitedEmail: string
}
```

**AcceptInvitationRequest** (lines 155-157):

```typescript
export interface AcceptInvitationRequest {
  token: string
}
```

### 3.3 Response Types

From `src/types/types.ts`:

**InvitationsListResponse** (lines 245-248):

```typescript
export interface InvitationsListResponse {
  data: Invitation[]
}
```

**CreateInvitationResponse** (lines 250-252):

```typescript
export interface CreateInvitationResponse {
  invitation: Invitation
}
```

**AcceptInvitationResponse** (lines 254-256):

```typescript
export interface AcceptInvitationResponse {
  membership: Membership
}
```

**CurrentUserInvitationsResponse** (lines 264-266) - Enhancement:

```typescript
export interface CurrentUserInvitationsResponse {
  data: InvitationWithHousehold[]
}
```

### 3.4 New Types Needed

✅ **Implemented** - All types added to `src/types/types.ts`:

- `InvitationWithHousehold` - Extends Invitation with household context
- `CurrentUserInvitationsResponse` - Response type for current user endpoint

---

## 4. Response Details by Endpoint

### 4.1 List Invitations

**Success Response (200 OK)**:

```json
{
  "data": [
    {
      "id": "uuid",
      "householdId": "uuid",
      "invitedEmail": "friend@example.com",
      "token": "cryptographically-secure-token",
      "expiresAt": "2026-02-20T12:00:00Z",
      "createdAt": "2026-01-20T12:00:00Z"
    }
  ]
}
```

**Status Codes**:

- `200 OK` - Successfully retrieved invitations
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a household member
- `404 Not Found` - Household not found

### 4.2 Create Invitation

**Success Response (201 Created)**:

```json
{
  "invitation": {
    "id": "uuid",
    "householdId": "uuid",
    "invitedEmail": "friend@example.com",
    "token": "cryptographically-secure-token",
    "expiresAt": "2026-02-20T12:00:00Z",
    "createdAt": "2026-01-20T12:00:00Z"
  }
}
```

**Status Codes**:

- `201 Created` - Invitation created successfully
- `400 Bad Request` - Invalid email format or validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not household owner
- `404 Not Found` - Household not found
- `409 Conflict` - User already member or already invited

### 4.3 Accept Invitation

**Success Response (200 OK)**:

```json
{
  "membership": {
    "householdId": "uuid",
    "userId": "uuid",
    "role": "member",
    "joinedAt": "2026-01-20T12:15:00Z",
    "createdAt": "2026-01-20T12:15:00Z"
  }
}
```

**Status Codes**:

- `200 OK` - Invitation accepted successfully
- `400 Bad Request` - Invalid or expired token
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Token not found
- `409 Conflict` - User already member of household

### 4.4 Cancel Invitation

**Success Response (204 No Content)**:

- Empty response body

**Status Codes**:

- `204 No Content` - Invitation cancelled successfully
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not household owner
- `404 Not Found` - Invitation or household not found

### 4.5 Get Current User's Invitations (Enhancement)

**Success Response (200 OK)**:

```json
{
  "data": [
    {
      "id": "uuid",
      "householdId": "uuid",
      "householdName": "Alice's Kitchen",
      "ownerEmail": "alice@example.com",
      "invitedEmail": "bob@example.com",
      "token": "cryptographically-secure-token",
      "expiresAt": "2026-01-27T12:00:00Z",
      "createdAt": "2026-01-20T12:00:00Z"
    }
  ]
}
```

**Status Codes**:

- `200 OK` - Successfully retrieved user's invitations (may be empty array)
- `401 Unauthorized` - Not authenticated

**Key Features**:

- Returns only invitations sent to the authenticated user's email
- Only returns pending, non-expired invitations
- Includes household context (name, owner) for better UX
- Token included for immediate acceptance
- Enables self-service invitation discovery

---

## 5. Data Flow

### 5.1 List Invitations Flow

```
Client Request
    ↓
[1] Extract householdId from URL params
[2] Verify authentication (JWT from Authorization header)
[3] Get userId from authenticated session
    ↓
[4] Service: listInvitations(householdId, userId)
    ↓
[5] Query: Verify user is member of household
    ↓ (if not member)
    → Return 403 Forbidden
    ↓ (if member)
[6] Query: Fetch all invitations where household_id = householdId AND status = 'pending'
    ↓
[7] Transform DB records to Invitation DTOs
    ↓
[8] Return 200 OK with InvitationsListResponse
```

### 5.2 Create Invitation Flow

```
Client Request
    ↓
[1] Extract householdId from URL params
[2] Extract invitedEmail from request body
[3] Verify authentication (JWT from Authorization header)
[4] Get userId from authenticated session
    ↓
[5] Validate request body with Zod schema
    ↓ (if invalid)
    → Return 400 Bad Request
    ↓ (if valid)
[6] Service: createInvitation(householdId, invitedEmail, userId)
    ↓
[7] Query: Verify user is owner of household
    ↓ (if not owner)
    → Return 403 Forbidden
    ↓ (if owner)
[8] Query: Check if invitedEmail is already a member
    ↓ (if already member)
    → Return 409 Conflict
    ↓ (if not member)
[9] Query: Check if active invitation exists for this email
    ↓ (if invitation exists)
    → Return 409 Conflict
    ↓ (if no invitation)
[10] Generate cryptographically secure token (crypto.randomBytes)
[11] Set expiration date (e.g., 7 days from now)
[12] Insert invitation record into household_invitations table
[13] (Optional) Send invitation email with token link
    ↓
[14] Transform DB record to Invitation DTO
    ↓
[15] Return 201 Created with CreateInvitationResponse
```

### 5.3 Accept Invitation Flow

```
Client Request
    ↓
[1] Extract token from URL params
[2] Verify authentication (JWT from Authorization header)
[3] Get userId from authenticated session
    ↓
[4] Service: acceptInvitation(token, userId)
    ↓
[5] Query: Fetch invitation by token
    ↓ (if not found)
    → Return 404 Not Found
    ↓ (if found)
[6] Check invitation status (must be 'pending')
    ↓ (if not pending)
    → Return 400 Bad Request (already used/cancelled)
    ↓ (if pending)
[7] Check expiration (expiresAt > now)
    ↓ (if expired)
    → Return 400 Bad Request
    ↓ (if valid)
[8] Query: Check if user is already member of household
    ↓ (if already member)
    → Return 409 Conflict
    ↓ (if not member)
[9] Begin Transaction:
    [9a] Insert membership record (household_memberships table)
    [9b] Update invitation status to 'accepted'
    [9c] Commit transaction
    ↓ (if transaction fails)
    → Rollback, Return 500 Internal Server Error
    ↓ (if successful)
[10] Transform membership record to Membership DTO
    ↓
[11] Return 200 OK with AcceptInvitationResponse
```

### 5.4 Cancel Invitation Flow

```
Client Request
    ↓
[1] Extract householdId and invitationId from URL params
[2] Verify authentication (JWT from Authorization header)
[3] Get userId from authenticated session
    ↓
[4] Service: cancelInvitation(householdId, invitationId, userId)
    ↓
[5] Query: Verify user is owner of household
    ↓ (if not owner)
    → Return 403 Forbidden
    ↓ (if owner)
[6] Query: Fetch invitation by id and household_id
    ↓ (if not found)
    → Return 404 Not Found
    ↓ (if found)
[7] Delete invitation record OR update status to 'cancelled'
    ↓
[8] Return 204 No Content
```

### 5.5 Get Current User's Invitations Flow (Enhancement)

```
Client Request
    ↓
[1] Verify authentication (JWT from Authorization header)
[2] Get userId from authenticated session
    ↓
[3] Service: listCurrentUserInvitations(userId)
    ↓
[4] Query: Get user's email from auth.users
    ↓
[5] Query: Fetch invitations with:
    - invited_email = user's email (normalized)
    - status = 'pending'
    - expires_at > now (non-expired only)
    - JOIN with households to get household name
    ↓
[6] For each invitation:
    [6a] Fetch owner details by owner_id
    [6b] Extract owner email
    ↓
[7] Transform to InvitationWithHousehold DTOs
    ↓
[8] Return 200 OK with CurrentUserInvitationsResponse

Key Benefits:
- No token needed upfront (self-service discovery)
- Returns enriched data with household context
- Enables in-app notifications
- More secure (no external token transmission)
```

---

## 6. Security Considerations

### 6.1 Authentication

- **All endpoints require authentication** via JWT Bearer token in Authorization header
- Use Supabase Auth to verify tokens and extract user identity
- Reject requests with missing, invalid, or expired tokens with 401 Unauthorized

### 6.2 Authorization

**List Invitations**:

- User must be a member (owner or regular member) of the household
- Query `household_memberships` to verify membership before returning invitations

**Create Invitation**:

- User must be the **owner** of the household
- Query `household_memberships` to verify role = 'owner'
- Non-owners receive 403 Forbidden

**Accept Invitation**:

- Any authenticated user can accept an invitation token
- Validate that the invitation is addressed to the user's email (check `invited_email` matches authenticated user's email)
- Prevent accepting invitations for other users

**Cancel Invitation**:

- User must be the **owner** of the household
- Query `household_memberships` to verify role = 'owner'
- Non-owners receive 403 Forbidden

**Get Current User's Invitations** (Enhancement):

- Any authenticated user (retrieves their own invitations only)
- System automatically filters by authenticated user's email
- Cannot view other users' invitations
- No additional authorization checks needed beyond authentication

### 6.3 Token Security

- **Generate tokens using cryptographically secure random generator** (e.g., `crypto.randomBytes(32).toString('hex')`)
- **Tokens must be unique** - enforce via UNIQUE constraint in database
- **Tokens are single-use** - update invitation status to 'accepted' after use
- **Tokens expire** - set expiration to 7 days from creation (configurable)
- **Store tokens securely** - don't expose in logs or error messages beyond necessary

### 6.4 Input Validation

Use Zod schemas to validate all inputs:

**Email validation**:

- Must match RFC 5322 email format
- Trim whitespace
- Convert to lowercase for consistency

**Token validation**:

- Must be non-empty string
- Match expected format (alphanumeric, specific length)

**UUID validation**:

- Validate householdId and invitationId are valid UUIDs
- Use Zod's `z.string().uuid()` schema

### 6.5 Privacy and Data Exposure

- **Prevent email enumeration**: When checking if email is already a member, use generic error message "Unable to create invitation" rather than "User already member"
- **Limit invitation listing**: Only show invitations for the requesting user's household
- **Don't expose sensitive data**: Ensure error messages don't reveal internal system details

### 6.6 Rate Limiting

- Implement rate limiting on invitation creation to prevent abuse (e.g., max 10 invitations per hour per household)
- Consider rate limiting on accept endpoint to prevent token brute-forcing

### 6.7 SQL Injection Prevention

- Use Supabase parameterized queries (handled automatically by Supabase client)
- Never concatenate user input directly into SQL

---

## 7. Error Handling

### 7.1 Error Response Format

All errors should return consistent JSON structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### 7.2 Error Scenarios by Endpoint

#### List Invitations Errors

| Status | Code           | Message                                  | When                           |
| ------ | -------------- | ---------------------------------------- | ------------------------------ |
| 401    | `UNAUTHORIZED` | "Authentication required"                | No auth token or invalid token |
| 403    | `FORBIDDEN`    | "You are not a member of this household" | User not member of household   |
| 404    | `NOT_FOUND`    | "Household not found"                    | householdId doesn't exist      |

#### Create Invitation Errors

| Status | Code               | Message                                       | When                           |
| ------ | ------------------ | --------------------------------------------- | ------------------------------ |
| 400    | `VALIDATION_ERROR` | "Invalid email format"                        | Email validation fails         |
| 400    | `VALIDATION_ERROR` | "invitedEmail is required"                    | Missing invitedEmail field     |
| 401    | `UNAUTHORIZED`     | "Authentication required"                     | No auth token or invalid token |
| 403    | `FORBIDDEN`        | "Only household owners can send invitations"  | User not owner                 |
| 404    | `NOT_FOUND`        | "Household not found"                         | householdId doesn't exist      |
| 409    | `CONFLICT`         | "User is already a member of this household"  | Invited user already member    |
| 409    | `CONFLICT`         | "An invitation for this email already exists" | Active invitation exists       |

#### Accept Invitation Errors

| Status | Code               | Message                                      | When                            |
| ------ | ------------------ | -------------------------------------------- | ------------------------------- |
| 400    | `VALIDATION_ERROR` | "Invalid token"                              | Token format invalid            |
| 400    | `EXPIRED_TOKEN`    | "This invitation has expired"                | Token expired (expiresAt < now) |
| 400    | `INVALID_TOKEN`    | "This invitation has already been used"      | Invitation status not 'pending' |
| 401    | `UNAUTHORIZED`     | "Authentication required"                    | No auth token or invalid token  |
| 403    | `FORBIDDEN`        | "This invitation is not for your email"      | invited_email ≠ user's email    |
| 404    | `NOT_FOUND`        | "Invitation not found"                       | Token doesn't exist             |
| 409    | `CONFLICT`         | "You are already a member of this household" | User already member             |

#### Cancel Invitation Errors

| Status | Code           | Message                                        | When                                                    |
| ------ | -------------- | ---------------------------------------------- | ------------------------------------------------------- |
| 401    | `UNAUTHORIZED` | "Authentication required"                      | No auth token or invalid token                          |
| 403    | `FORBIDDEN`    | "Only household owners can cancel invitations" | User not owner                                          |
| 404    | `NOT_FOUND`    | "Invitation not found"                         | Invitation doesn't exist or doesn't belong to household |

### 7.3 Error Logging

- Log all errors with appropriate severity levels:
  - **INFO**: 404 errors (expected user behavior)
  - **WARN**: 400, 403, 409 errors (validation/business logic failures)
  - **ERROR**: 500 errors (unexpected system failures)
- Include request context: userId, householdId, endpoint, timestamp
- Never log sensitive data: tokens, passwords, emails in plain text
- Use structured logging (JSON format) for easier parsing

---

## 8. Performance Considerations

### 8.1 Database Queries Optimization

**Indexes**:

- Ensure index on `household_invitations(household_id)` for fast household lookup
- Ensure unique index on `household_invitations(token)` for fast token lookup
- Ensure index on `household_invitations(status, expires_at)` for cleanup queries
- Ensure index on `household_memberships(household_id, user_id)` for membership checks

**Query Optimization**:

- Use `SELECT COUNT(*)` instead of fetching all rows when checking membership
- Limit invitation listing to reasonable default (e.g., 50 invitations) with pagination if needed
- Use database transactions for accept invitation to ensure atomicity

### 8.2 Caching Strategy

- **Don't cache invitation lists** - invitations change frequently and are not frequently accessed
- **Consider caching household membership** - membership changes infrequently, cache for 5-10 minutes
- Use in-memory cache (e.g., Redis) for membership checks if performance becomes issue

### 8.3 Token Generation

- Token generation using `crypto.randomBytes` is fast but can be optimized:
  - Generate tokens asynchronously if creating multiple invitations
  - Consider pre-generating token pool during low-traffic periods (optional, likely unnecessary)

### 8.4 Email Sending

- **Send invitation emails asynchronously** - don't block API response
- Use background job queue (e.g., Supabase Edge Functions with queue)
- Handle email failures gracefully - invitation still valid even if email fails

---

## 9. Implementation Steps

### Phase 1: Setup and Validation Layer

1. **Create Zod validation schemas** (`src/lib/validation/invitation-validation.ts`):
   - `createInvitationSchema` - validates `CreateInvitationRequest`
   - `acceptInvitationSchema` - validates `AcceptInvitationRequest`
   - `householdIdParamSchema` - validates UUID parameters
   - `tokenParamSchema` - validates token format

2. **Create service layer** (`src/lib/services/invitation-service.ts`):
   - Define service class/module structure
   - Import Supabase client and types
   - Set up error handling utilities

### Phase 2: Service Implementation

3. **Implement `listInvitations` method**:
   - Accept `householdId` and `userId` parameters
   - Verify user membership in household
   - Query invitations with status = 'pending'
   - Transform DB records to DTOs
   - Return array of Invitation objects

4. **Implement `createInvitation` method**:
   - Accept `householdId`, `invitedEmail`, and `userId` parameters
   - Verify user is owner
   - Check for duplicate memberships
   - Check for existing invitations
   - Generate secure token (use `crypto.randomBytes(32).toString('hex')`)
   - Calculate expiration date (7 days from now)
   - Insert invitation record
   - Return Invitation DTO

5. **Implement `acceptInvitation` method**:
   - Accept `token` and `userId` parameters
   - Fetch invitation by token
   - Validate invitation status and expiration
   - Verify invitation email matches user email
   - Check for existing membership
   - Begin transaction:
     - Create membership record
     - Update invitation status to 'accepted'
     - Commit
   - Return Membership DTO

6. **Implement `cancelInvitation` method**:
   - Accept `householdId`, `invitationId`, and `userId` parameters
   - Verify user is owner
   - Fetch invitation by id and household_id
   - Delete invitation or update status to 'cancelled'
   - Return success

### Phase 3: API Route Handlers

7. **Create GET /api/households/[householdId]/invitations/route.ts**:
   - Extract householdId from params
   - Validate householdId with Zod
   - Get user from session (Supabase Auth)
   - Call `invitationService.listInvitations()`
   - Handle errors with appropriate status codes
   - Return `InvitationsListResponse`

8. **Create POST /api/households/[householdId]/invitations/route.ts**:
   - Extract householdId from params
   - Parse and validate request body
   - Get user from session
   - Call `invitationService.createInvitation()`
   - Handle errors with appropriate status codes
   - Return `CreateInvitationResponse` with 201 status

9. **Create PATCH /api/invitations/[token]/accept/route.ts**:
   - Extract token from params
   - Parse and validate request body
   - Get user from session
   - Call `invitationService.acceptInvitation()`
   - Handle errors with appropriate status codes
   - Return `AcceptInvitationResponse` with 200 status

10. **Create DELETE /api/households/[householdId]/invitations/[id]/route.ts**:
    - Extract householdId and id from params
    - Validate parameters with Zod
    - Get user from session
    - Call `invitationService.cancelInvitation()`
    - Handle errors with appropriate status codes
    - Return 204 No Content

### Phase 3.1: Enhancement - Current User Invitations (✅ Completed)

11. **Add InvitationWithHousehold type to types.ts**:
    - Extends Invitation with householdName and ownerEmail
    - Add CurrentUserInvitationsResponse type
    - Export types for use in service and routes

12. **Add listCurrentUserInvitations method to InvitationService**:
    - Accept userId parameter
    - Fetch user's email from authentication
    - Query invitations by invited_email (normalized)
    - Filter for status = 'pending' AND expires_at > now
    - Join with households table to get name and owner_id
    - Fetch owner email for each invitation
    - Transform to InvitationWithHousehold DTOs
    - Return enriched invitation list

13. **Create GET /api/invitations/current/route.ts**:
    - Verify authentication (cookie-based)
    - Call `invitationService.listCurrentUserInvitations()`
    - Return 200 OK with CurrentUserInvitationsResponse
    - Simple error handling (only 401 and 500)
    - No parameters needed (uses authenticated user's email)

### Phase 4: Testing

11. **Write unit tests for validation schemas**:
    - Test valid inputs pass validation
    - Test invalid inputs fail with appropriate errors
    - Test edge cases (empty strings, special characters, etc.)

12. **Write unit tests for service methods**:
    - Mock Supabase client
    - Test successful flows
    - Test error scenarios (not owner, already member, expired token, etc.)
    - Test transaction rollback on accept invitation failure

13. **Write integration tests for API routes**:
    - Test authentication failures
    - Test authorization failures
    - Test validation errors
    - Test successful requests
    - Test conflict scenarios
    - Use real Supabase instance (test environment)

14. **Write E2E tests** (optional but recommended):
    - Test complete invitation flow: create → accept
    - Test invitation cancellation
    - Test expired invitation handling
    - Use Playwright or similar

### Phase 5: Security Review

15. **Conduct security review**:
    - Verify all endpoints require authentication
    - Verify authorization checks are in place
    - Test for SQL injection vulnerabilities
    - Test token security (uniqueness, expiration)
    - Test rate limiting (if implemented)
    - Review error messages for information leakage

### Phase 6: Documentation and Deployment

16. **Update API documentation**:
    - Document all endpoints in API reference
    - Include request/response examples
    - Document error codes and messages
    - Add usage examples

17. **Deploy to staging environment**:
    - Run all tests in staging
    - Perform manual testing
    - Monitor logs for errors

18. **Deploy to production**:
    - Run smoke tests after deployment
    - Monitor metrics (latency, error rates)
    - Set up alerts for errors

---

## 10. Enhancement: Self-Service Invitation Discovery

### 10.1 Overview

The `GET /api/invitations/current` endpoint was added as an enhancement to improve the user experience and security of the invitation system. This enables a **discovery-based flow** alongside the original **token-first flow**.

### 10.2 Motivation

**Problems with Token-First Only:**

- Users must receive and manage tokens externally (email, messaging)
- Tokens can be lost or emails can go to spam
- No in-app visibility of pending invitations
- Requires secure external communication channels
- Poor UX for notification features

**Benefits of Discovery-Based Flow:**

- ✅ Self-service invitation discovery (no external token needed)
- ✅ In-app notifications and badges
- ✅ More secure (no token transmission via insecure channels)
- ✅ Works even if invitation email is lost
- ✅ Better UX (notification-like experience)
- ✅ One-click acceptance from within the app

### 10.3 Security Analysis

**Is it secure to expose invitations by email?** YES, because:

1. **Authentication required** - User must be logged in
2. **Email from session** - Server uses authenticated user's email, not user input
3. **No enumeration** - Cannot discover other users' invitations
4. **Token included** - Enables immediate acceptance (token useless without matching email)
5. **Filtered results** - Only pending, non-expired invitations shown

**What information is exposed:**

- Household name (user was invited, they should know)
- Owner email (owner shared their email by inviting user)
- Token (needed for acceptance, already tied to user's email)
- Expiration date (helpful UX, no security risk)

### 10.4 Usage Patterns

**Pattern 1: Discovery-Based (Recommended)**

```
1. Owner creates invitation
2. Owner tells invitee: "I invited you to my household" (verbal/chat)
3. Invitee logs into app
4. App calls GET /api/invitations/current
5. App shows: "You have 1 pending invitation from Alice's Kitchen"
6. Invitee clicks "Accept"
7. App calls PATCH /api/invitations/{token}/accept (token from step 4)
```

**Pattern 2: Token-First (Still supported)**

```
1. Owner creates invitation
2. Owner sends token via email/message
3. Invitee receives token
4. Invitee visits app with token link
5. App calls PATCH /api/invitations/{token}/accept
```

### 10.5 Frontend Integration

**Dashboard notification badge:**

```typescript
// Check for pending invitations on login
const { data } = await fetch('/api/invitations/current')
if (data.data.length > 0) {
  showNotification(`You have ${data.data.length} pending invitation(s)`)
}
```

**Invitation banner:**

```tsx
function InvitationBanner() {
  const { invitations } = useCurrentUserInvitations()

  if (invitations.length === 0) return null

  return (
    <div className="banner">
      {invitations.map(inv => (
        <InvitationCard
          key={inv.id}
          householdName={inv.householdName}
          ownerEmail={inv.ownerEmail}
          expiresAt={inv.expiresAt}
          onAccept={() => acceptInvitation(inv.token)}
        />
      ))}
    </div>
  )
}
```

### 10.6 Implementation Details

**Files Added:**

- `src/types/types.ts` - InvitationWithHousehold, CurrentUserInvitationsResponse
- `src/lib/services/invitation.service.ts` - listCurrentUserInvitations()
- `src/app/api/invitations/current/route.ts` - GET endpoint

**Database Query:**

```sql
SELECT
  hi.*,
  h.name AS household_name,
  h.owner_id
FROM household_invitations hi
JOIN households h ON hi.household_id = h.id
WHERE hi.invited_email = $userEmail
  AND hi.status = 'pending'
  AND hi.expires_at > NOW()
ORDER BY hi.created_at DESC
```

**Response enrichment:**

- Joins with households table for name and owner_id
- Fetches owner email using auth.admin.getUserById()
- Transforms to InvitationWithHousehold DTOs with context

---

## 11. Additional Considerations

### 11.1 Email Notifications (Future Enhancement)

When creating an invitation, send an email to the invited user:

- Use Supabase Edge Functions or third-party email service (SendGrid, AWS SES)
- Include invitation token in a clickable link (e.g., `https://app.com/invite?token={token}`)
- Include household name and inviter's email for context
- Handle email failures gracefully - invitation still valid

### 11.2 Invitation Expiration Cleanup

Implement a background job to clean up expired invitations:

- Run daily or weekly
- Delete or mark as 'expired' invitations where `expires_at < now()` and `status = 'pending'`
- Use Supabase cron jobs or external scheduler

### 11.3 Audit Logging

Consider logging invitation events for audit trail:

- Invitation created: who, when, for which email
- Invitation accepted: who, when, which invitation
- Invitation cancelled: who, when, which invitation
- Store in separate audit log table

### 11.4 Rate Limiting Implementation

Add rate limiting to prevent abuse:

- Limit invitation creation to 10 per hour per household
- Limit invitation acceptance attempts to 5 per hour per token
- Use Redis or in-memory cache for rate limit tracking
- Return 429 Too Many Requests when limit exceeded

### 11.5 Multi-household Support

The current design assumes users can belong to multiple households:

- Ensure membership checks handle multiple households correctly
- Consider UI/UX for users with many household memberships

---

## 12. Success Criteria

The implementation is considered complete when:

### Core Implementation (✅ Completed):

1. ✅ All five endpoints are implemented and functional (4 core + 1 enhancement)
2. ✅ All validation schemas are in place (no linting errors)
3. ✅ Service layer handles all business logic correctly
4. ✅ Authentication and authorization work correctly
5. ✅ Error handling returns appropriate status codes and messages
6. ✅ Documentation is complete and accurate

### Testing (Future Work):

7. ⏳ Unit tests cover all service methods (minimum 80% coverage)
8. ⏳ Integration tests cover all API routes
9. ⏳ E2E tests cover complete invitation flows

### Quality Assurance (Future Work):

10. ⏳ Security review passes with no critical issues
11. ⏳ Performance meets requirements (< 500ms p95 latency)
12. ⏳ Load testing validates scalability

---

## 13. References

- **API Specification**: `.ai/api-plan.md` (lines 267-370)
- **Database Schema**: `.ai/db-plan.md` (lines 29-37)
- **Type Definitions**: `src/types/types.ts`
- **Tech Stack**: `.ai/techstack.md`
- **Supabase Documentation**: https://supabase.com/docs
- **Zod Documentation**: https://zod.dev
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

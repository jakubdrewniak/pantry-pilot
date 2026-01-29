# Rejoin Household Feature - Implementation Changes Summary

## Overview

This document summarizes the changes made to implement the "rejoin own household" feature, which allows users who own a household to return to it after accepting an invitation to another household, instead of creating a new one.

## Business Logic Change

### Before

- User B owns Household B
- User B accepts invitation to Household A → becomes member
- User B clicks "Create Own Household" → creates NEW Household C
- Result: Household proliferation (B, C, D, E...)

### After

- User B owns Household B
- User B accepts invitation to Household A → becomes member
- User B clicks "Return to My Household" → rejoins Household B
- Result: User returns to original household with preserved data

## Key Concept

**Ownership vs Membership are separate**:

- `households.owner_id` → defines ownership (persists even when not a member)
- `user_households` table → defines active membership
- When user accepts invitation: membership changes, ownership remains

## API Changes

### 1. GET /api/households

**Changed Response:**

```typescript
interface HouseholdsListResponse {
  data: Household[] // Current household membership (0 or 1)
  ownedHouseholdId: string | null // NEW - ID of household user owns
}
```

**Use Cases:**

- `ownedHouseholdId !== null && ownedHouseholdId !== data[0].id` → User can rejoin
- `ownedHouseholdId === null` → User must create new
- `ownedHouseholdId === data[0].id` → User is in own household (no action)

### 2. POST /api/households

**Changed Request:**

```typescript
interface CreateHouseholdRequest {
  name?: string // OPTIONAL - required only when creating new
}
```

**Changed Response:**

```typescript
interface CreateHouseholdResponse {
  id: string
  name: string
  createdAt: string
  rejoined: boolean // NEW - true if rejoined existing, false if created new
}
```

**Status Codes:**

- `200 OK` → Rejoined existing household
- `201 Created` → Created new household

**Logic Flow:**

```
1. Check if user owns a household (owner_id)
2. Check if user is active member of owned household
   → YES: return 409 Conflict
3. Get current membership (if any)
4. IF user owns household:
   → REJOIN: Remove from current, add to owned, return 200
5. ELSE:
   → CREATE: Validate name required, create new, return 201
```

## Frontend Changes

### 1. HouseholdActions Component

**Changed Props:**

```typescript
interface HouseholdActionsProps {
  userRole: HouseholdRole
  hasOwnHousehold: boolean // NEW
  ownHouseholdName?: string // NEW
  onEditName: () => void
  onReturnOrCreate: () => void // RENAMED from onCreateOwn
  onDelete: () => void
}
```

**Dynamic Button Text:**

- `hasOwnHousehold === true` → "Return to My Household"
- `hasOwnHousehold === false` → "Create Own Household"

### 2. Modal Component

**Renamed:** `CreateOwnHouseholdModal` → `ReturnOrCreateHouseholdModal`

**Changed Props:**

```typescript
interface ReturnOrCreateHouseholdModalProps {
  open: boolean
  currentHouseholdName: string
  hasOwnHousehold: boolean // NEW - determines mode
  ownHouseholdName?: string // NEW - for rejoin display
  onOpenChange: (open: boolean) => void
  onSuccess: (household: Household, rejoined: boolean) => void
}
```

**Conditional UI:**

- **Rejoin Mode** (`hasOwnHousehold === true`):
  - Display: "You will return to: {ownHouseholdName}"
  - No name input
  - Button: "Return to My Household"
  - API call: `POST /api/households` (empty body or no name)
- **Create Mode** (`hasOwnHousehold === false`):
  - Display: Form with name input
  - Validation: 3-50 characters required
  - Button: "Create Household"
  - API call: `POST /api/households` (with name in body)

### 3. Dashboard ViewModel

**Changed:**

```typescript
interface HouseholdDashboardViewModel {
  household: HouseholdWithMembers | null
  userRole: HouseholdRole | null
  ownedHousehold: Household | null // NEW
  hasOwnHousehold: boolean // NEW
  isLoading: boolean
  error: string | null
}
```

### 4. Custom Hooks

**useHouseholdDashboard:**

- Added `fetchOwnedHousehold()` method
- Updated `refresh()` to fetch both current and owned household

**useHouseholdActions:**

- Renamed `createOwnHousehold()` → `returnOrCreateHousehold(name?: string)`
- Returns `{ household: Household, rejoined: boolean }`

## Database Changes

**No schema changes required!** ✅

The existing schema already supports this:

- `households.owner_id` → tracks ownership
- `user_households` → tracks membership
- Separation of ownership and membership enables rejoin logic

**Optional DB Function** (for atomicity):

```sql
CREATE OR REPLACE FUNCTION public.rejoin_own_household(
  p_user_id UUID,
  p_household_id UUID,
  p_current_household_id UUID
)
RETURNS void AS $$
BEGIN
  -- Remove from current household
  IF p_current_household_id IS NOT NULL THEN
    DELETE FROM user_households
    WHERE user_id = p_user_id
    AND household_id = p_current_household_id;
  END IF;

  -- Rejoin own household
  INSERT INTO user_households (user_id, household_id)
  VALUES (p_user_id, p_household_id)
  ON CONFLICT (user_id, household_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
```

## Service Layer Changes

**HouseholdService new/updated methods:**

```typescript
// NEW - Get household user owns (by owner_id)
async getOwnedHousehold(userId: string): Promise<Household | null>

// NEW - Get just the ID (lighter query for GET /api/households)
async getOwnedHouseholdId(userId: string): Promise<string | null>

// UPDATED - Changed from createHousehold to handle both scenarios
async rejoinOrCreateHousehold(
  userId: string,
  name?: string
): Promise<{ household: Household, rejoined: boolean }>
```

## Error Handling Changes

**Error Class Renamed:**

- `AlreadyOwnerError` → `AlreadyActiveMemberError`

**Updated Error Message:**

- Old: "Already own a household" (409)
- New: "Already an active member of own household" (409)

**Context:** Error now only thrown if user is BOTH owner AND active member of that household.

## Benefits

1. **No household proliferation** - Users don't create endless households
2. **Data preservation** - Original household's pantry, recipes, shopping lists intact
3. **Better UX** - Clear "return" vs "create" actions
4. **Invitation flexibility** - Users can try other households without losing their own
5. **Zero schema changes** - Leverages existing database structure

## Migration Path

No data migration needed! Existing users and households work as-is.

**For existing users who already created multiple households:**

- They can manually delete unwanted households (if they're owners with no other members)
- Or keep them - system now prevents further proliferation

## Testing Scenarios

1. **User owns household, is member of own** → Cannot rejoin (409)
2. **User owns household, is member of other** → Can rejoin (200)
3. **User never owned household, is member of other** → Can create (201)
4. **User without any household** → Can create (201)
5. **API returns correct `ownedHouseholdId`** → Frontend displays correct button
6. **Rejoin preserves data** → Pantry/recipes/shopping lists intact
7. **Transaction atomicity** → Membership changes are atomic

## Files Modified

### Backend

- `.ai/households-api-implementation-plan.md` - Updated specification
- `src/lib/services/household.service.ts` - Service logic (to be implemented)
- `src/app/api/households/route.ts` - GET and POST handlers (to be implemented)
- `src/types/types.ts` - Response DTOs (to be updated)

### Frontend

- `.ai/household-dashboard-view-implementation-plan.md` - Updated specification
- `src/app/household/components/HouseholdActions.tsx` - Props and logic (to be updated)
- `src/app/household/components/modals/ReturnOrCreateHouseholdModal.tsx` - Renamed and logic (to be created)
- `src/lib/hooks/useHouseholdDashboard.ts` - Added owned household fetching (to be updated)
- `src/lib/hooks/useHouseholdActions.ts` - Renamed method (to be updated)
- `src/app/household/page.tsx` - Updated to use new props (to be updated)

## Next Steps

1. Update `src/types/types.ts` with new response structures
2. Implement `HouseholdService` changes
3. Update API route handlers
4. Update frontend components and hooks
5. Write tests for rejoin scenarios
6. Update user-facing documentation/help text

---

**Status:** Specification complete, ready for implementation
**Breaking Changes:** None (API additions are backwards compatible)
**Schema Changes:** None required

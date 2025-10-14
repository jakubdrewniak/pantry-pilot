# API Endpoint Implementation Plan: Generate Recipe via AI (`POST /api/recipes/generate`)

## 1. Endpoint Overview

Generates a new recipe by invoking an external LLM (OpenRouter → GPT-4o) while optionally incorporating the user’s current pantry items. The endpoint persists the resulting recipe in the `recipes` table, returns it to the caller, and surfaces any warnings such as an empty pantry. Accepted immediately with 202 to reflect asynchronous model generation, though implementation will complete generation synchronously before responding to simplify MVP.

## 2. Request Details

- **HTTP Method:** POST
- **URL:** `/api/recipes/generate`
- **Auth:** `Authorization: Bearer <JWT>` (Supabase session)
- **Headers:** `Content-Type: application/json`

### 2.1 Parameters

| Name             | In   | Type    | Required | Notes                                                 |
| ---------------- | ---- | ------- | -------- | ----------------------------------------------------- |
| `hint`           | body | string  | Yes      | Additional user prompt to steer recipe (1‒200 chars). |
| `usePantryItems` | body | boolean | Yes      | If true, pantry ingredients are supplied to the LLM.  |

### 2.2 Request Body JSON (GenerateRecipeRequest)

```json
{
  "hint": "spicy chicken",
  "usePantryItems": true
}
```

Validation Rules:

- `hint` max 200 chars, sanitized (no HTML).
- `usePantryItems` required boolean.

## 3. Used Types

- **Command Model:** `GenerateRecipeRequest` (src/types/types.ts lines 183-186)
- **Response DTO:** `GenerateRecipeResponse` (lines 280-283)
- **Domain Models:** `Recipe`, `Ingredient`, `PantryItem`
- **Supabase Enum:** `recipe_creation_method` (expects value `ai_generated`).

## 4. Response Details

### 4.1 Success – 202 Accepted

```json
{
  "recipe": {
    "id": "uuid",
    "title": "Spicy Chicken & Rice",
    "ingredients": [{ "name": "Chicken", "quantity": 1, "unit": "kg" }],
    "instructions": "...",
    "mealType": "dinner",
    "creationMethod": "ai_generated",
    "prepTime": 15,
    "cookTime": 25,
    "createdAt": "2025-10-14T12:00:00Z",
    "householdId": "uuid"
  },
  "warnings": ["Pantry empty, using defaults"]
}
```

- **Headers**: `X-Pantry-Empty: true` when applicable.

### 4.2 Error Codes

| Status                    | When                            |
| ------------------------- | ------------------------------- |
| 400 Bad Request           | Invalid body (Zod)              |
| 401 Unauthorized          | Missing/invalid JWT             |
| 404 Not Found             | Household/pantry missing (rare) |
| 503 Service Unavailable   | Upstream LLM error or timeout   |
| 500 Internal Server Error | Unhandled server failure        |

## 5. Data Flow

1. **Auth** – Validate JWT via `getUser` helper; retrieve `user.id`.
2. **Household Lookup** – Select household via `user_households` (1↔1). Fail 404 if none.
3. **Pantry Retrieval** – If `usePantryItems`, fetch pantry & `pantry_items` for household.
4. **Construct LLM Prompt** – Build system/user messages combining hint and pantry list.
5. **Call OpenRouter** – `POST https://openrouter.ai/v1/chat/completions` with API key (stored in Vercel/Supabase secret).
6. **Parse LLM Output** – Expected JSON; validate against `RecipeSchema` (Zod) with strict fields.
7. **Persist Recipe** – Insert into `recipes` with `creation_method = 'ai_generated'`, `content` JSONB.
8. **Respond** – Return 202 JSON DTO + optional warnings + `X-Pantry-Empty` header.
9. **Logging** – On error, capture and store in centralized logger (e.g., `lib/utils.ts::logError`) with context.

## 6. Security Considerations

- **RLS** – Supabase policies already restrict CRUD by household membership.
- **Auth** – Require valid Supabase session; reject otherwise (401).
- **Prompt Injection** – Sanitize `hint`; surround in delimiters when embedding in prompt.
- **Rate Limiting** – Re-use existing middleware (`middleware.ts`) to throttle (e.g., 5 req/min per user).
- **Secrets** – Store OpenRouter key in environment variable `OPENROUTER_API_KEY` (Next.js runtime).
- **Input Validation** – Use Zod to prevent malformed or oversized input.

## 7. Error Handling

| Scenario                                     | Response      | Notes                                |
| -------------------------------------------- | ------------- | ------------------------------------ |
| Missing `usePantryItems`                     | 400           | Zod message array.                   |
| Pantry empty but `usePantryItems=true`       | 202 + warning | Add `X-Pantry-Empty: true`.          |
| LLM returns non-JSON                         | 503           | `{"error":"LLM response invalid"}`.  |
| LLM timeout (>30 s)                          | 503           | Abort controller; surface `timeout`. |
| DB insert fails (duplicate title constraint) | 500           | Logged; generic error to caller.     |

All errors pass through a centralized `errorHandler()` that sets status code and JSON `{ error: string }`.

## 8. Performance Considerations

- **Timeouts** – 30 s upstream timeout with abort; prevents function from hanging.
- **Caching** – None (response unique per invocation).
- **Indexes** – Recipe GIN/BTREE indexes already exist; insert overhead minimal.
- **Payload Size** – Limit prompt + response to 4 k tokens.

## 9. Implementation Steps

1. **Define Zod Schema** `GenerateRecipeRequestSchema` in `src/lib/validation/recipes.ts`.
2. **Create API Route** `src/pages/api/recipes/generate.ts`.
3. Inside handler:
   1. `authUser = requireAuth(req)` (helper).
   2. `body = validate(req, GenerateRecipeRequestSchema)`.
   3. Fetch household & pantry via Supabase server client.
   4. Build prompt (`buildRecipePrompt(hint, pantryItems)` in `lib/ai/prompt.ts`).
   5. Call `generateRecipe(prompt)` (new service in `lib/ai/recipeGenerator.ts`).
   6. Validate LLM JSON against `RecipeSchema`.
   7. Insert into `recipes` table via RPC; map DB row → DTO via transformer.
   8. Send 202 response with DTO + warnings.
4. **Add Unit Tests** in `__tests__/api/recipes.generate.test.ts` using Vitest + `vi.mock()` for OpenRouter call.
5. **Update Supabase RLS** if necessary to permit inserts by authenticated users.
6. **Document** endpoint in API docs (`.ai/api-plan.md`).
7. **Add rate-limit entry** in `middleware.ts`.
8. **Deploy & Monitor** – Observe logs for LLM failures; adjust prompt or timeout.

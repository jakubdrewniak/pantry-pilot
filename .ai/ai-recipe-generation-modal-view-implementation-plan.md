# AI Recipe Generation Modal - View Implementation Plan

## 1. Overview

This modal (or bottom sheet on mobile) lets users request an AI-generated recipe based on a free-text hint and optionally current pantry items. The modal shows progress (spinner), warnings (e.g., empty pantry), and a concise preview of the resulting recipe. Persisting or editing the recipe happens outside of this modal.

## 2. View routing

- Triggered from the Recipes List view.
- In Next.js 19 (app router), implement as UI state in the list page or as a parallel route segment with a `Modal` layer.
- Recommended: control with local UI state (`isOpen`)

## 3. Component structure

- `RecipesPage` (existing or upcoming list view)
  - `AiRecipeGenerationButton`
  - `AiRecipeGenerationModal` (new)
    - `AiRecipeGenerationForm` (new)
      - `HintInput` (use `Input`/`Textarea` from `src/components/ui`)
      - `UsePantryCheckbox` (use `Checkbox` or `Switch` — add shadcn/ui piece if missing)
      - `SubmitButton` (use `Button`)
      - `CancelButton` (use `Button`)
    - `LoadingState` (spinner — add if missing)
    - `WarningsPanel` (new)
    - `RecipePreview` (new, simplified preview aligned with `Recipe`)

## 4. Component details

### AiRecipeGenerationButton

- Description: Button on the recipes list to open the generation modal.
- Elements: `Button` with optional icon and label “Generate with AI”.
- Events: `onClick` → open modal.
- Validation: None.
- Types: None new; callback `onOpen(): void`.
- Props:
  - `onOpen: () => void`

### AiRecipeGenerationModal

- Description: Dialog container with ARIA role="dialog", focus trap, scrim disabling background.
- Elements: header, `AiRecipeGenerationForm`, `LoadingState`, `WarningsPanel`, `RecipePreview`, close controls.
- Events:
  - `onOpenChange(isOpen)` — visibility toggle.
  - `onRequestClose()` — closing on ESC/backdrop or cancel; optionally confirm if a request is in-flight.
- Validation: none locally; delegated to the form.
- Types: uses `GenerateRecipeResponse` and `Recipe` from `src/types/types`.
- Props:
  - `open: boolean`
  - `onOpenChange: (open: boolean) => void`

### AiRecipeGenerationForm

- Description: Form that posts to `/api/recipes/generate`.
- Elements: `Label`, `Input`/`Textarea` for `hint`, `Checkbox`/`Switch` for `usePantryItems`, submit `Button`.
- Events:
  - `onSubmit` → client validation → `fetch` POST.
  - Disable inputs while loading.
- Validation (per API/Zod):
  - `hint`: string, min 1, max 200, regex `^[^<>&]*$`.
  - `usePantryItems`: boolean (required).
- Types:
  - Request: `GenerateRecipeRequest` (client model mirroring `src/lib/validation/recipes.ts`).
  - Response: `GenerateRecipeResponse`.
- Props:
  - `onSuccess: (response: GenerateRecipeResponse) => void`
  - `onError: (errorMessage: string) => void`

### WarningsPanel

- Description: Displays warnings returned by the endpoint (e.g., empty pantry) and info derived from the `X-Pantry-Empty` header.
- Elements: `Card`/`Alert` with a list of strings.
- Events: None.
- Validation: None.
- Types: `warnings?: string[]`, `pantryEmpty?: boolean`.
- Props:
  - `warnings?: string[]`
  - `pantryEmpty?: boolean`

### LoadingState

- Description: Spinner and “Generating…” status.
- Elements: spinner/animation and label.
- Events: None.
- Validation: None.
- Types: `loading: boolean`.
- Props:
  - `loading: boolean`

### RecipePreview

- Description: Minimal preview: title, ingredients list, instructions excerpt; badge “AI-original”.
- Elements: `Card`, `Badge`, lists and text.
- Events: None in the modal; save/edit actions are out of scope here.
- Validation: Ensure `ingredients` is non-empty; `instructions` length ≥ 10.
- Types: `Recipe`.
- Props:
  - `recipe: Recipe`

## 5. Types

- Existing:
  - `GenerateRecipeRequest`, `GenerateRecipeResponse`, `Recipe`, `Ingredient` from `src/types/types` and `src/lib/validation/recipes.ts`.
- New (ViewModel — UI only):
  - `AiGenerateFormState`:
    - `hint: string`
    - `usePantryItems: boolean`
    - `isSubmitting: boolean`
    - `error?: string`
  - `AiGenerateResultState`:
    - `recipe?: Recipe`
    - `warnings?: string[]`
    - `pantryEmptyHeader?: boolean`

## 6. State management

- Modal state in `RecipesPage` (local) or synced via a query param.
- In `AiRecipeGenerationModal`:
  - `formState: AiGenerateFormState` (controlled inputs, `isSubmitting`).
  - `resultState: AiGenerateResultState` (API output and warnings).
- Custom hook `useAiRecipeGeneration()` encapsulates fetch, client validation, and header mapping.
  - API: `generate({ hint, usePantryItems }): Promise<{ data?: GenerateRecipeResponse; pantryEmptyHeader?: boolean; error?: string }>`
  - Usage: `const { generate, isLoading, error } = useAiRecipeGeneration()`.

## 7. API integration

- Endpoint: `POST /api/recipes/generate`
- Request body (TS):
  - `{ hint: string; usePantryItems: boolean }`
- Response body (TS):
  - `{ recipe: Recipe; warnings?: string[] }`
- Status codes:
  - Success: `202 Accepted`
  - Errors: `400` (validation), `503` (LLM error), `500` (other)
- Headers:
  - `X-Pantry-Empty: true` (optional; when present set `pantryEmptyHeader = true`)
- Fetch implementation:
  - `fetch('/api/recipes/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })`
  - Read header: `res.headers.get('X-Pantry-Empty') === 'true'`
  - For `res.status === 202`, parse as `GenerateRecipeResponse`.

## 8. User interactions

- Click “Generate with AI” → open modal.
- Enter `hint` → validate length (1–200), disallow `<`, `>`, `&`.
- Toggle “Use pantry items”.
- Submit → lock form, show `LoadingState`.
- On success (202):
  - Show `WarningsPanel` (if `warnings` or `X-Pantry-Empty`).
  - Show `RecipePreview` with an “AI-original” badge.
- On error:
  - Friendly inline message; allow retry.

## 9. Conditions and validation

- Client:
  - `hint`: min 1, max 200, regex `^[^<>&]*$` — aligned with server Zod.
  - `usePantryItems`: boolean.
- UI lock:
  - Disable fields and submit while submitting.
- Visibility:
  - `LoadingState` only when `isSubmitting`.
  - `WarningsPanel` when `warnings?.length` or `pantryEmptyHeader`.
  - `RecipePreview` when `recipe` exists and `ingredients.length > 0` and `instructions.length >= 10`.

## 10. Error handling

- 400 (validation): show server message or map to “Invalid request body …”.
- 503 (LLM): “Recipe generation is temporarily unavailable. Please try again.”
- 500: “An error occurred. Please try again later.”
- Timeout/Network: offline notice and retry option.
- Cancellation: prevent closing while in-flight or confirm before closing.

## 11. Implementation steps

1. Add missing UI atoms if needed (`Checkbox`/`Switch`, `Alert/Spinner`) in `src/components/ui/`.
2. Create `src/components/modals/AiRecipeGenerationModal.tsx` and subcomponents (`Form`, `WarningsPanel`, `RecipePreview`).
3. Add hook `src/lib/hooks/useAiRecipeGeneration.ts` for fetch and header mapping.
4. Integrate `AiRecipeGenerationButton` and modal into the recipes list; manage `open`/`onOpenChange` or query param.
5. Implement client-side validation mirroring server Zod; consider light Zod on client for DRY.
6. Implement states: `isSubmitting`, `error`, `warnings`, `pantryEmptyHeader`, `recipe`.
7. Ensure accessibility: role="dialog", aria-labelledby, focus trap, ESC support, backdrop and scroll lock.
8. Add unit tests (Vitest + React Testing Library):
   - Form validation (bounds, invalid characters).
   - API calls and handling of 202/400/500/503.
   - Rendering `WarningsPanel` and `RecipePreview` in relevant states.
9. Polish Tailwind 4 styles and shadcn/ui consistency.
10. Add short usage docs in `README` Recipes section: how to open the modal and expected outcomes.

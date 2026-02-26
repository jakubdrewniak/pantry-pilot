# API Endpoint Implementation Plan: Generate Shopping List from Recipes

## 1. Przegląd punktu końcowego

Endpoint `POST /api/shopping-lists/generate` pozwala użytkownikowi wybrać zestaw przepisów i automatycznie wygenerować pozycje na liście zakupów na podstawie ich składników. Wszystkie składniki z wybranych przepisów są łączone (duplikaty mergowane przez sumowanie ilości), a następnie wstawiane do aktywnej listy zakupów gospodarstwa domowego użytkownika.

Endpoint wpisuje się w architekturę aplikacji jako akcja "write" — analogia z Angulara: to jak wywołanie `store.dispatch(generateShoppingList({ recipeIds }))`. Realtime events (INSERT) są emitowane automatycznie przez Supabase dla każdego dodanego elementu, dzięki czemu wszyscy członkowie gospodarstwa otrzymują aktualizacje na żywo.

---

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/shopping-lists/generate`
- **Plik route'a**: `src/app/api/shopping-lists/generate/route.ts`
- **Parametry ścieżki**: brak (endpoint płaski — household wyznaczany z sesji użytkownika)
- **Parametry query**: brak
- **Request Body**:
  ```json
  {
    "recipeIds": ["uuid-1", "uuid-2"]
  }
  ```
- **Wymagane pola**: `recipeIds` (min 1, max 20 elementów, każdy musi być poprawnym UUID v4)
- **Opcjonalne pola**: brak

---

## 3. Wykorzystywane typy

Wszystkie poniższe typy **już istnieją** w `src/types/types.ts` i nie wymagają modyfikacji:

```typescript
// Request
GenerateShoppingListRequest // { recipeIds: string[] }

// Response
GenerateShoppingListResponse // { items: ShoppingListItem[] }

// Item shape
ShoppingListItem // { id, name, quantity, shoppingListId, unit, isPurchased }
```

**Nowy typ błędu** do dodania w `src/lib/services/shoppingList.service.ts`:

```typescript
export class RecipeNotFoundError extends Error {
  constructor(
    public notFoundIds: string[],
    message = 'One or more recipes not found or access denied'
  ) {
    super(message)
    this.name = 'RecipeNotFoundError'
  }
}
```

**Nowy schema Zod** do dodania w `src/lib/validation/shoppingList.ts`:

```typescript
export const generateShoppingListSchema = z.object({
  recipeIds: z
    .array(z.string().uuid('Invalid recipe ID format'))
    .min(1, 'At least one recipe required')
    .max(20, 'Maximum 20 recipes allowed'),
})

export type GenerateShoppingListInput = z.infer<typeof generateShoppingListSchema>
```

---

## 4. Szczegóły odpowiedzi

**Sukces — 201 Created**:

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Chicken",
      "quantity": 1,
      "unit": "kg",
      "isPurchased": false,
      "shoppingListId": "uuid"
    }
  ]
}
```

**Błędy**:
| Status | Przypadek |
|--------|-----------|
| 400 | Nieprawidłowy JSON, brak `recipeIds`, > 20 przepisów, złe UUID |
| 401 | Brak sesji (obsługiwane przez `authenticateRequest`) |
| 404 | Któryś z przepisów nie istnieje lub nie należy do household użytkownika |
| 500 | Błąd bazy danych, brak household, brak pantry |

---

## 5. Przepływ danych

```
POST /api/shopping-lists/generate
        │
        ▼
[1] authenticateRequest(request)
    → user.id, supabase client
        │
        ▼
[2] Zod validate body (generateShoppingListSchema)
    → { recipeIds: string[] }
        │
        ▼
[3] ShoppingListService.generateFromRecipes(userId, recipeIds)
        │
        ├─► [3a] Pobierz household_id użytkownika
        │         SELECT household_id FROM user_households WHERE user_id = userId
        │
        ├─► [3b] Pobierz przepisy należące do household
        │         SELECT id, content FROM recipes
        │         WHERE id = ANY(recipeIds) AND household_id = householdId
        │         → Jeśli liczba wyników < recipeIds.length → throw RecipeNotFoundError
        │
        ├─► [3c] Ekstrakcja i merge składników (in-memory)
        │         Map<name.toLowerCase(), { name, quantity, unit }>
        │         → sumuj quantity dla tych samych nazw
        │
        ├─► [3d] Get or create shopping list
        │         SELECT id FROM shopping_lists WHERE household_id = householdId
        │         lub INSERT INTO shopping_lists (household_id) → id
        │
        ├─► [3e] Pobierz istniejące elementy listy zakupów (do merge z bazą)
        │         SELECT id, name, quantity FROM shopping_list_items
        │         WHERE shopping_list_id = listId
        │
        ├─► [3f] Podziel merged składniki na:
        │         - toInsert[]  → nazwy nieistniejące na liście
        │         - toUpdate[]  → nazwy już istniejące (nowa ilość = stara + wygenerowana)
        │
        ├─► [3g] Batch UPDATE dla istniejących (jeśli toUpdate.length > 0)
        │         UPDATE shopping_list_items SET quantity = newQty WHERE id = itemId
        │         (wykonane sekwencyjnie lub z Promise.all)
        │
        └─► [3h] Batch INSERT dla nowych (atomowy, jeden INSERT z wieloma wierszami)
                  INSERT INTO shopping_list_items (...) VALUES (...) RETURNING *
                  → Supabase emituje INSERT event dla każdego wiersza → Realtime
        │
        ▼
[4] NextResponse.json({ items: [...insertedItems, ...updatedItems] }, { status: 201 })
```

**Kluczowa decyzja architektoniczna — merge z istniejącą listą**:
Specyfikacja mówi "Combines duplicate ingredients; sums quantities" — dotyczy to duplikatów **wewnątrz zapytania**. Dla duplikatów istniejących już na liście zakupów przyjęto podejście **merge** (aktualizacja ilości), a nie odrzucanie — jest to bardziej user-friendly i zgodne z intencją funkcji "generowania".

---

## 6. Względy bezpieczeństwa

1. **Uwierzytelnianie**: Cookie-based session przez `authenticateRequest` (identycznie jak inne route'y)
2. **Autoryzacja przepisów**: Zapytanie do bazy filtruje po `household_id` — użytkownik nie może użyć przepisów z innego household
3. **Autoryzacja listy zakupów**: `getOrCreateShoppingList` sprawdza membership w household
4. **Limit przepisów**: Max 20 (`generateShoppingListSchema`) — ochrona przed DoS / abuse
5. **UUID validation**: Każdy recipeId jest walidowany jako UUID v4 przez Zod przed zapytaniem do bazy
6. **Principle of least privilege**: Używamy RLS Supabase (anon key z sesją użytkownika, nie service key)
7. **Information disclosure**: `RecipeNotFoundError` nie ujawnia czy przepis istnieje (ale należy do innego household) — zwracamy 404 w obu przypadkach

---

## 7. Obsługa błędów

| Błąd serwisu                         | HTTP Status | Komunikat                                        |
| ------------------------------------ | ----------- | ------------------------------------------------ |
| Brak sesji (z `authenticateRequest`) | 401         | "Unauthorized"                                   |
| Zod validation failure               | 400         | "Validation failed" + details                    |
| `RecipeNotFoundError`                | 404         | "One or more recipes not found"                  |
| `ShoppingListNotFoundError`          | 404         | "Shopping list not found or access denied"       |
| DB insert error                      | 500         | "An unexpected error occurred"                   |
| Nieznany błąd                        | 500         | "An unexpected error occurred" (z console.error) |

Wzorzec obsługi — identyczny z istniejącymi route'ami:

```typescript
} catch (error) {
  if (error instanceof RecipeNotFoundError) {
    return NextResponse.json({ error: 'Not Found', message: error.message }, { status: 404 })
  }
  if (error instanceof ShoppingListNotFoundError) {
    return NextResponse.json({ error: 'Not Found', message: error.message }, { status: 404 })
  }
  console.error('[POST /api/shopping-lists/generate] Unexpected error:', { ... })
  return NextResponse.json({ error: 'Internal Server Error', ... }, { status: 500 })
}
```

---

## 8. Rozważania dotyczące wydajności

1. **Batch insert**: Wszystkie nowe elementy insertuję jednym `INSERT ... VALUES (...), (...), (...)` — to O(1) round-tripów do bazy, nie O(n)
2. **Merge in-memory**: Łączenie duplikatów składników dzieje się w JavaScript `Map` — O(n) gdzie n = całkowita liczba składników ze wszystkich przepisów (akceptowalne przy max 20 przepisach)
3. **Optymalizacja zapytania o przepisy**: Jedno zapytanie z `id = ANY(recipeIds)` zamiast N osobnych zapytań
4. **Sekwencyjne update'y**: Aktualizacja istniejących elementów listy może być N zapytań — przy małych liczbach (max ~50 składników z 20 przepisów) jest akceptowalne. Optymalizacja możliwa przez bulk update z CASE WHEN
5. **Realtime**: Supabase emituje eventy automatycznie — brak dodatkowego overhead po stronie API

---

## 9. Etapy implementacji

### Krok 1: Dodaj nowy schema Zod

**Plik**: `src/lib/validation/shoppingList.ts`

Dodaj na końcu pliku (przed sekcją TypeScript types):

```typescript
export const generateShoppingListSchema = z.object({
  recipeIds: z
    .array(z.string().uuid('Invalid recipe ID format'))
    .min(1, 'At least one recipe required')
    .max(20, 'Maximum 20 recipes allowed'),
})

export type GenerateShoppingListInput = z.infer<typeof generateShoppingListSchema>
```

---

### Krok 2: Dodaj `RecipeNotFoundError` do serwisu

**Plik**: `src/lib/services/shoppingList.service.ts`

Dodaj nową klasę błędu wraz z pozostałymi (po `TransferToPantryError`):

```typescript
export class RecipeNotFoundError extends Error {
  constructor(
    public notFoundIds: string[],
    message = 'One or more recipes not found or access denied'
  ) {
    super(message)
    this.name = 'RecipeNotFoundError'
  }
}
```

---

### Krok 3: Dodaj metodę `generateFromRecipes` do `ShoppingListService`

**Plik**: `src/lib/services/shoppingList.service.ts`

Dodaj nową metodę publiczną do klasy `ShoppingListService`:

```typescript
/**
 * Generate shopping list items from selected recipes
 *
 * @param userId - The authenticated user's UUID (for authorization)
 * @param recipeIds - Array of recipe UUIDs to generate from (max 20)
 * @returns Array of created/updated ShoppingListItem DTOs
 * @throws RecipeNotFoundError if any recipe doesn't exist or belong to user's household
 * @throws ShoppingListNotFoundError if user not authorized to access household
 *
 * Business logic:
 * - Fetches ingredients from all selected recipes
 * - Merges duplicate ingredient names (case-insensitive, sums quantities)
 * - Gets or creates shopping list for user's household
 * - For ingredients already on the list: updates quantity (adds to existing)
 * - For new ingredients: inserts as batch (atomic)
 * - Real-time INSERT events emitted automatically by Supabase for new items
 */
async generateFromRecipes(userId: string, recipeIds: string[]): Promise<ShoppingListItem[]> {
  // 1. Get user's household ID
  const { data: membership, error: membershipError } = await this.supabase
    .from('user_households')
    .select('household_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (membershipError || !membership) {
    throw new ShoppingListNotFoundError('User does not belong to any household')
  }

  const householdId = membership.household_id

  // 2. Fetch all recipes ensuring they belong to user's household
  const { data: recipes, error: recipesError } = await this.supabase
    .from('recipes')
    .select('id, content')
    .eq('household_id', householdId)
    .in('id', recipeIds)

  if (recipesError) {
    console.error('[ShoppingListService] Error fetching recipes:', recipesError)
    throw new Error('Failed to fetch recipes')
  }

  // Verify all requested recipes were found
  const foundIds = new Set((recipes || []).map(r => r.id))
  const notFoundIds = recipeIds.filter(id => !foundIds.has(id))

  if (notFoundIds.length > 0) {
    throw new RecipeNotFoundError(notFoundIds)
  }

  // 3. Extract and merge ingredients (in-memory, case-insensitive by name)
  const mergedIngredients = new Map<string, { name: string; quantity: number; unit: string | null }>()

  for (const recipe of recipes || []) {
    const content = recipe.content as { ingredients?: Array<{ name: string; quantity: number; unit?: string }> }
    const ingredients = content.ingredients || []

    for (const ingredient of ingredients) {
      const key = ingredient.name.toLowerCase()
      const existing = mergedIngredients.get(key)

      if (existing) {
        existing.quantity += ingredient.quantity
      } else {
        mergedIngredients.set(key, {
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit ?? null,
        })
      }
    }
  }

  if (mergedIngredients.size === 0) {
    return [] // Recipes have no ingredients
  }

  // 4. Get or create shopping list for household
  const { data: existingList, error: listError } = await this.supabase
    .from('shopping_lists')
    .select('id')
    .eq('household_id', householdId)
    .maybeSingle()

  if (listError) {
    console.error('[ShoppingListService] Error fetching shopping list:', listError)
    throw new Error('Failed to fetch shopping list')
  }

  let listId: string

  if (existingList) {
    listId = existingList.id
  } else {
    const { data: newList, error: createError } = await this.supabase
      .from('shopping_lists')
      .insert({ household_id: householdId })
      .select('id')
      .single()

    if (createError || !newList) {
      console.error('[ShoppingListService] Error creating shopping list:', createError)
      throw new Error('Failed to create shopping list')
    }

    listId = newList.id
  }

  // 5. Fetch existing items to determine what to insert vs update
  const { data: existingItems, error: existingError } = await this.supabase
    .from('shopping_list_items')
    .select('id, name, quantity')
    .eq('shopping_list_id', listId)

  if (existingError) {
    console.error('[ShoppingListService] Error fetching existing items:', existingError)
    throw new Error('Failed to fetch existing shopping list items')
  }

  const existingByName = new Map(
    (existingItems || []).map(item => [item.name.toLowerCase(), item])
  )

  // 6. Split merged ingredients into: new items vs items to update
  const toInsert: Array<{ shopping_list_id: string; name: string; quantity: number; unit: string | null }> = []
  const toUpdate: Array<{ id: string; newQuantity: number }> = []

  for (const ingredient of mergedIngredients.values()) {
    const existing = existingByName.get(ingredient.name.toLowerCase())

    if (existing) {
      toUpdate.push({
        id: existing.id,
        newQuantity: Number(existing.quantity) + ingredient.quantity,
      })
    } else {
      toInsert.push({
        shopping_list_id: listId,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
      })
    }
  }

  const resultItems: ShoppingListItem[] = []

  // 7. Update existing items (sequential, small count expected)
  for (const update of toUpdate) {
    const { data: updatedItem, error: updateError } = await this.supabase
      .from('shopping_list_items')
      .update({ quantity: update.newQuantity })
      .eq('id', update.id)
      .select('id, name, quantity, shopping_list_id, unit, is_purchased')
      .single()

    if (updateError || !updatedItem) {
      console.error('[ShoppingListService] Error updating item during generate:', updateError)
      throw new Error('Failed to update existing shopping list item')
    }

    resultItems.push({
      id: updatedItem.id,
      name: updatedItem.name,
      quantity: Number(updatedItem.quantity),
      shoppingListId: updatedItem.shopping_list_id,
      unit: updatedItem.unit,
      isPurchased: updatedItem.is_purchased,
    })
  }

  // 8. Batch insert new items (atomic — single INSERT statement)
  if (toInsert.length > 0) {
    const { data: insertedItems, error: insertError } = await this.supabase
      .from('shopping_list_items')
      .insert(toInsert)
      .select('id, name, quantity, shopping_list_id, unit, is_purchased')

    if (insertError || !insertedItems) {
      console.error('[ShoppingListService] Error inserting generated items:', insertError)
      throw new Error('Failed to insert generated shopping list items')
    }

    for (const item of insertedItems) {
      resultItems.push({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity),
        shoppingListId: item.shopping_list_id,
        unit: item.unit,
        isPurchased: item.is_purchased,
      })
    }
  }

  return resultItems
}
```

---

### Krok 4: Utwórz plik route handler

**Nowy plik**: `src/app/api/shopping-lists/generate/route.ts`

```typescript
/**
 * Generate Shopping List from Recipes API Route
 *
 * Endpoint: POST /api/shopping-lists/generate
 *
 * Populates the household's shopping list with ingredients from selected recipes.
 * Combines duplicate ingredients by summing quantities. Merges with existing list items.
 * Triggers Supabase Realtime INSERT events for all connected household members.
 *
 * Authentication: Cookie-based (handled by authenticateRequest)
 * Authorization: Recipes must belong to user's household
 *
 * Returns:
 * - 201 Created: Array of created/updated shopping list items
 * - 400 Bad Request: Invalid JSON, missing recipeIds, > 20 recipes, invalid UUIDs
 * - 401 Unauthorized: Authentication required
 * - 404 Not Found: Recipe not found or doesn't belong to user's household
 * - 500 Internal Server Error: Unexpected error
 */
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/api-auth'
import {
  ShoppingListService,
  ShoppingListNotFoundError,
  RecipeNotFoundError,
} from '@/lib/services/shoppingList.service'
import { generateShoppingListSchema } from '@/lib/validation/shoppingList'
import type { GenerateShoppingListResponse } from '@/types/types'
import type { Database } from '@/db/database.types'

/**
 * POST /api/shopping-lists/generate
 *
 * Generate shopping list items from selected recipes
 *
 * Request body:
 * {
 *   "recipeIds": ["uuid1", "uuid2"]
 * }
 *
 * @param request - Next.js request object
 * @returns JSON response with generated items
 */
export async function POST(
  request: NextRequest
): Promise<
  NextResponse<
    GenerateShoppingListResponse | { error: string; message?: string; details?: unknown }
  >
> {
  try {
    // SECTION 1: Authentication
    const { user, supabase, errorResponse } = await authenticateRequest(request)
    if (errorResponse) return errorResponse as NextResponse<{ error: string; message?: string }>

    // SECTION 2: Validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid JSON in request body',
        },
        { status: 400 }
      )
    }

    const bodyValidation = generateShoppingListSchema.safeParse(body)
    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Validation failed',
          details: bodyValidation.error.format(),
        },
        { status: 400 }
      )
    }

    const { recipeIds } = bodyValidation.data

    // SECTION 3: Business logic
    const shoppingListService = new ShoppingListService(
      supabase as unknown as SupabaseClient<Database>
    )

    const items = await shoppingListService.generateFromRecipes(user!.id, recipeIds)

    // SECTION 4: Success response
    return NextResponse.json({ items }, { status: 201 })
  } catch (error) {
    // SECTION 5: Error handling

    if (error instanceof RecipeNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
        },
        { status: 404 }
      )
    }

    if (error instanceof ShoppingListNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
        },
        { status: 404 }
      )
    }

    // SECTION 6: Global error handler
    console.error('[POST /api/shopping-lists/generate] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
```

---

## 10. Kolejność implementacji (checklisty)

```
[ ] Krok 1: Dodaj generateShoppingListSchema + GenerateShoppingListInput do shoppingList.ts
[ ] Krok 2: Dodaj RecipeNotFoundError do shoppingList.service.ts
[ ] Krok 3: Dodaj metodę generateFromRecipes do klasy ShoppingListService
[ ] Krok 4: Utwórz src/app/api/shopping-lists/generate/route.ts
[ ] Weryfikacja: Sprawdź że lint/TypeScript nie zgłaszają błędów
[ ] Test manualny: POST z poprawnymi recipeIds → 201 z items
[ ] Test manualny: POST z nieistniejącym recipeId → 404
[ ] Test manualny: POST z 21 recipeIds → 400 validation error
```

---

## Uwagi implementacyjne

- **Atomowość**: Batch INSERT (`toInsert`) jest atomowy (jeden statement Postgres). UPDATE'y istniejących elementów nie są transakcyjnie spójne z INSERTami — to świadomy kompromis (avoid over-engineering). Przy wymaganiu pełnej atomowości należy rozważyć Supabase RPC z funkcją Postgres.
- **Realtime**: Zdarzenia INSERT są emitowane przez Supabase automatycznie — brak dodatkowego kodu po stronie API.
- **Zawartość przepisów**: Przepisy przechowują składniki w kolumnie JSONB `content` — struktura `{ ingredients: [{ name, quantity, unit }] }` (identyczna jak w `RecipeService.mapDbRecipeToDto`).

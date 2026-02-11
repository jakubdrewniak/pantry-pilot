# Shopping Lists API Implementation Plan

## 1. Przegląd punktów końcowych

Shopping Lists API składa się z 7 endpointów zapewniających kompleksową obsługę list zakupów z funkcjonalnością współpracy w czasie rzeczywistym. System umożliwia:

- **Zarządzanie listami zakupów**: Tworzenie i pobieranie list zakupów dla gospodarstw domowych
- **Operacje CRUD na elementach**: Dodawanie, aktualizacja, usuwanie i listowanie elementów listy zakupów
- **Operacje masowe**: Efektywne zakupy i usuwanie wielu elementów jednocześnie
- **Transfer do spiżarni**: Automatyczny transfer zakupionych produktów do spiżarni
- **Real-time collaboration**: Synchronizacja zmian w czasie rzeczywistym między wszystkimi członkami gospodarstwa domowego za pomocą Supabase Realtime CDC

**Kluczowe funkcje:**

- Każde gospodarstwo domowe ma jedną aktywną listę zakupów
- Wszystkie mutacje (INSERT, UPDATE, DELETE) emitują eventy Realtime
- Operacje zakupu automatycznie przenoszą produkty do spiżarni
- Obsługa częściowego sukcesu w operacjach masowych
- Row Level Security (RLS) zapewnia bezpieczeństwo danych

---

## 2. Szczegóły żądań

### 2.1. GET /api/households/{householdId}/shopping-list

**Cel**: Pobranie lub utworzenie aktywnej listy zakupów dla gospodarstwa domowego.

**Metoda HTTP**: GET

**Struktura URL**: `/api/households/{householdId}/shopping-list`

**Parametry:**

- **Wymagane**:
  - `householdId` (path parameter, UUID): Identyfikator gospodarstwa domowego
  - Authorization header: Bearer token (Supabase JWT)
- **Opcjonalne**: Brak

**Request Body**: Brak

**Walidacja:**

- `householdId` musi być prawidłowym UUID
- Użytkownik musi być członkiem gospodarstwa domowego (RLS)

---

### 2.2. GET /api/shopping-lists/{listId}/items

**Cel**: Pobranie listy elementów z listy zakupów z opcjonalnym filtrowaniem i sortowaniem.

**Metoda HTTP**: GET

**Struktura URL**: `/api/shopping-lists/{listId}/items`

**Parametry:**

- **Wymagane**:
  - `listId` (path parameter, UUID): Identyfikator listy zakupów
  - Authorization header: Bearer token
- **Opcjonalne**:
  - `isPurchased` (query parameter, boolean): Filtruj po statusie zakupu
  - `sort` (query parameter, string): Sortuj po polu (domyślnie: `createdAt`)
    - Dozwolone wartości: `createdAt`, `name`, `isPurchased`

**Request Body**: Brak

**Walidacja:**

- `listId` musi być prawidłowym UUID
- `isPurchased` musi być boolean (jeśli podany)
- `sort` musi być jedną z dozwolonych wartości

---

### 2.3. POST /api/shopping-lists/{listId}/items

**Cel**: Dodanie wielu niestandardowych elementów do listy zakupów.

**Metoda HTTP**: POST

**Struktura URL**: `/api/shopping-lists/{listId}/items`

**Parametry:**

- **Wymagane**:
  - `listId` (path parameter, UUID): Identyfikator listy zakupów
  - Authorization header: Bearer token
- **Opcjonalne**: Brak

**Request Body**:

```json
{
  "items": [
    {
      "name": "Milk",
      "quantity": 2,
      "unit": "L"
    },
    {
      "name": "Eggs",
      "quantity": 12,
      "unit": "pcs"
    }
  ]
}
```

**Walidacja:**

- `items` musi być niepustą tablicą (max 50 elementów)
- Każdy element musi mieć:
  - `name`: niepusty string
  - `quantity`: opcjonalne, liczba >= 0 (domyślnie: 1)
  - `unit`: opcjonalny string
- Nazwy elementów muszą być unikalne w obrębie listy (case-insensitive)
- Pusta nazwa jest odrzucana

---

### 2.4. PATCH /api/shopping-lists/{listId}/items/{itemId}

**Cel**: Aktualizacja właściwości elementu (ilość, jednostka, status zakupu). Gdy `isPurchased` ustawione na `true`, element jest automatycznie przenoszony do spiżarni.

**Metoda HTTP**: PATCH

**Struktura URL**: `/api/shopping-lists/{listId}/items/{itemId}`

**Parametry:**

- **Wymagane**:
  - `listId` (path parameter, UUID): Identyfikator listy zakupów
  - `itemId` (path parameter, UUID): Identyfikator elementu
  - Authorization header: Bearer token
- **Opcjonalne**: Brak

**Request Body** (wszystkie pola opcjonalne):

```json
{
  "quantity": 3,
  "unit": "L",
  "isPurchased": true
}
```

**Walidacja:**

- `listId` i `itemId` muszą być prawidłowymi UUID
- `quantity`: opcjonalne, liczba >= 0
- `unit`: opcjonalny string
- `isPurchased`: opcjonalny boolean
- Przynajmniej jedno pole musi być podane

---

### 2.5. DELETE /api/shopping-lists/{listId}/items/{itemId}

**Cel**: Usunięcie pojedynczego elementu z listy zakupów.

**Metoda HTTP**: DELETE

**Struktura URL**: `/api/shopping-lists/{listId}/items/{itemId}`

**Parametry:**

- **Wymagane**:
  - `listId` (path parameter, UUID): Identyfikator listy zakupów
  - `itemId` (path parameter, UUID): Identyfikator elementu
  - Authorization header: Bearer token
- **Opcjonalne**: Brak

**Request Body**: Brak

---

### 2.6. POST /api/shopping-lists/{listId}/items/bulk-purchase

**Cel**: Oznaczenie wielu elementów jako zakupione i przeniesienie ich do spiżarni w jednej operacji.

**Metoda HTTP**: POST

**Struktura URL**: `/api/shopping-lists/{listId}/items/bulk-purchase`

**Parametry:**

- **Wymagane**:
  - `listId` (path parameter, UUID): Identyfikator listy zakupów
  - Authorization header: Bearer token
- **Opcjonalne**: Brak

**Request Body**:

```json
{
  "itemIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Walidacja:**

- `itemIds` musi być niepustą tablicą (1-50 elementów)
- Wszystkie ID muszą być prawidłowymi UUID
- Elementy muszą należeć do podanej listy zakupów

---

### 2.7. DELETE /api/shopping-lists/{listId}/items/bulk-delete

**Cel**: Usunięcie wielu elementów z listy zakupów w jednej operacji.

**Metoda HTTP**: DELETE (z body)

**Struktura URL**: `/api/shopping-lists/{listId}/items/bulk-delete`

**Parametry:**

- **Wymagane**:
  - `listId` (path parameter, UUID): Identyfikator listy zakupów
  - Authorization header: Bearer token
- **Opcjonalne**: Brak

**Request Body**:

```json
{
  "itemIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Walidacja:**

- `itemIds` musi być niepustą tablicą (1-100 elementów)
- Wszystkie ID muszą być prawidłowymi UUID

---

## 3. Wykorzystywane typy

### 3.1. DTOs (Data Transfer Objects)

**Zdefiniowane w `src/types/types.ts`:**

```typescript
// Shopping List DTOs
export interface ShoppingList {
  id: string
  householdId: string
  createdAt: string
  updatedAt: string
}

export type ShoppingListWithItems = ShoppingList & {
  items: ShoppingListItem[]
}

export interface ShoppingListItem {
  id: string
  name: string
  quantity: number
  shoppingListId: string
  unit: string | null
  isPurchased: boolean
  createdAt: string
  updatedAt: string
}

// Pantry DTOs (for transfer operations)
export interface PantryItem {
  id: string
  name: string
  pantryId: string
  quantity: number
  unit: string | null
}
```

### 3.2. Command Models (Request DTOs)

**Zdefiniowane w `src/types/types.ts`:**

```typescript
export interface AddShoppingListItemsRequest {
  items: Array<{
    name: string
    quantity?: number
    unit?: string | null
    isPurchased?: boolean
  }>
}

export interface UpdateShoppingListItemRequest {
  quantity?: number
  unit?: string | null
  isPurchased?: boolean
}

export interface BulkPurchaseItemsRequest {
  itemIds: string[]
}

export interface BulkDeleteItemsRequest {
  itemIds: string[]
}
```

### 3.3. Response Types

**Zdefiniowane w `src/types/types.ts`:**

```typescript
export type GetShoppingListResponse = ShoppingListWithItems

export interface ListShoppingListItemsResponse {
  data: ShoppingListItem[]
}

export interface AddShoppingListItemsResponse {
  items: ShoppingListItem[]
}

export interface UpdateShoppingListItemResponse {
  item: ShoppingListItem
  pantryItem?: PantryItem // Only present if item was purchased and transferred
}

export interface BulkPurchaseItemsResponse {
  purchased: string[] // IDs of successfully purchased items
  transferred: Array<{
    itemId: string
    pantryItemId: string
  }>
  failed: Array<{
    itemId: string
    reason: string
  }>
  summary: {
    total: number
    successful: number
    failed: number
  }
}

export interface BulkDeleteItemsResponse {
  deleted: string[] // IDs of successfully deleted items
  failed: Array<{
    itemId: string
    reason: string
  }>
  summary: {
    total: number
    successful: number
    failed: number
  }
}
```

### 3.4. Validation Schemas (Zod)

**Do utworzenia w `src/lib/validation/shoppingListValidation.ts`:**

```typescript
import { z } from 'zod'

// Path parameters
export const householdIdParamSchema = z.object({
  householdId: z.string().uuid('Invalid household ID format'),
})

export const listIdParamSchema = z.object({
  listId: z.string().uuid('Invalid list ID format'),
})

export const itemIdParamSchema = z.object({
  itemId: z.string().uuid('Invalid item ID format'),
})

// Query parameters
export const listItemsQuerySchema = z.object({
  isPurchased: z
    .enum(['true', 'false'])
    .optional()
    .transform(val => val === 'true'),
  sort: z.enum(['createdAt', 'name', 'isPurchased']).optional().default('createdAt'),
})

// Request bodies
export const addItemsSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Item name cannot be empty'),
        quantity: z.number().min(0, 'Quantity must be non-negative').optional().default(1),
        unit: z.string().trim().optional().nullable(),
      })
    )
    .min(1, 'At least one item required')
    .max(50, 'Maximum 50 items allowed'),
})

export const updateItemSchema = z
  .object({
    quantity: z.number().min(0, 'Quantity must be non-negative').optional(),
    unit: z.string().trim().optional().nullable(),
    isPurchased: z.boolean().optional(),
  })
  .refine(
    data =>
      data.quantity !== undefined || data.unit !== undefined || data.isPurchased !== undefined,
    'At least one field must be provided'
  )

export const bulkPurchaseSchema = z.object({
  itemIds: z
    .array(z.string().uuid('Invalid item ID format'))
    .min(1, 'At least one item required')
    .max(50, 'Maximum 50 items allowed'),
})

export const bulkDeleteSchema = z.object({
  itemIds: z
    .array(z.string().uuid('Invalid item ID format'))
    .min(1, 'At least one item required')
    .max(100, 'Maximum 100 items allowed'),
})
```

---

## 4. Przepływ danych

### 4.1. GET /api/households/{householdId}/shopping-list

```
1. Walidacja parametrów (householdId)
2. Weryfikacja autentykacji (Supabase session)
3. Sprawdzenie członkostwa w gospodarstwie domowym (RLS)
4. Próba pobrania aktywnej listy zakupów dla gospodarstwa domowego
5. Jeśli nie istnieje:
   - Utworzenie nowej listy zakupów
   - Zwrócenie pustej listy
6. Jeśli istnieje:
   - Pobranie wszystkich elementów listy
   - Zwrócenie listy z elementami
7. Response: ShoppingListWithItems (200)
```

**Interakcje z bazą danych:**

- SELECT na `shopping_lists` (WHERE household_id)
- INSERT na `shopping_lists` (jeśli nie istnieje)
- SELECT na `shopping_list_items` (WHERE shopping_list_id)

**Real-time:**

- Po pobraniu listy, front-end powinien subskrybować kanał Realtime:
  - Kanał: `shopping_list_items:shopping_list_id=eq.{listId}`
  - Eventy: INSERT, UPDATE, DELETE

---

### 4.2. GET /api/shopping-lists/{listId}/items

```
1. Walidacja parametrów (listId, query params)
2. Weryfikacja autentykacji
3. Sprawdzenie dostępu do listy (RLS)
4. Pobranie elementów z opcjonalnym filtrowaniem i sortowaniem
5. Response: ListShoppingListItemsResponse (200)
```

**Interakcje z bazą danych:**

- SELECT na `shopping_list_items` z opcjonalnym WHERE i ORDER BY

**Real-time:**

- Ten endpoint dostarcza początkowy stan
- Aktualizacje w czasie rzeczywistym przychodzą przez subskrypcję CDC

---

### 4.3. POST /api/shopping-lists/{listId}/items

```
1. Walidacja parametrów (listId, items)
2. Weryfikacja autentykacji
3. Sprawdzenie dostępu do listy (RLS)
4. Walidacja unikalności nazw (case-insensitive) w obrębie żądania
5. Sprawdzenie duplikatów w istniejącej liście
6. Wstawienie wszystkich elementów (transakcja atomowa)
7. Response: AddShoppingListItemsResponse (201)
8. Każdy INSERT emituje event (Realtime)
```

**Interakcje z bazą danych:**

- SELECT na `shopping_list_items` (sprawdzenie duplikatów)
- INSERT na `shopping_list_items` (bulk, w transakcji)

**Real-time:**

- Każdy wstawiony element emituje event INSERT

**Obsługa błędów:**

- Jeśli wykryto duplikat: odrzucenie całej partii (409 Conflict)
- Atomowość: wszystkie elementy sukces lub wszystkie fail

---

### 4.4. PATCH /api/shopping-lists/{listId}/items/{itemId}

```
1. Walidacja parametrów (listId, itemId, body)
2. Weryfikacja autentykacji
3. Sprawdzenie dostępu do listy (RLS)
4. Pobranie istniejącego elementu
5. Jeśli isPurchased === true:
   a. Rozpoczęcie transakcji
   b. Pobranie pantryId dla gospodarstwa domowego
   c. Transfer elementu do spiżarni:
      - Sprawdzenie, czy element już istnieje w spiżarni (case-insensitive)
      - Jeśli istnieje: aktualizacja ilości (merge)
      - Jeśli nie istnieje: wstawienie nowego elementu
   d. Usunięcie elementu z listy zakupów
   e. Commit transakcji
   f. Response z item + pantryItem (200)
   g. Emituje event DELETE na shopping_list_items
6. Jeśli isPurchased !== true:
   a. Aktualizacja elementu (quantity, unit)
   b. Response z item (200)
   c. Emituje event UPDATE
```

**Interakcje z bazą danych:**

- SELECT na `shopping_list_items` (WHERE id)
- Jeśli zakup:
  - BEGIN TRANSACTION
  - SELECT na `pantries` (WHERE household_id)
  - SELECT/UPDATE/INSERT na `pantry_items`
  - DELETE na `shopping_list_items`
  - COMMIT
- Jeśli tylko aktualizacja:
  - UPDATE na `shopping_list_items`

**Real-time:**

- UPDATE: emituje event UPDATE
- Zakup: emituje event DELETE (element usunięty z listy)

**Obsługa błędów:**

- 404: element lub lista nie istnieje
- 409: konflikt nazwy w spiżarni
- 500: błąd transakcji

---

### 4.5. DELETE /api/shopping-lists/{listId}/items/{itemId}

```
1. Walidacja parametrów (listId, itemId)
2. Weryfikacja autentykacji
3. Sprawdzenie dostępu do listy (RLS)
4. Usunięcie elementu
5. Response: 204 No Content
6. Emituje event DELETE (Realtime)
```

**Interakcje z bazą danych:**

- DELETE na `shopping_list_items` (WHERE id AND shopping_list_id)

**Real-time:**

- DELETE emituje event do wszystkich klientów

---

### 4.6. POST /api/shopping-lists/{listId}/items/bulk-purchase

```
1. Walidacja parametrów (listId, itemIds)
2. Weryfikacja autentykacji
3. Sprawdzenie dostępu do listy (RLS)
4. Pobranie pantryId dla gospodarstwa domowego
5. Dla każdego itemId (niezależnie):
   a. Rozpoczęcie transakcji dla elementu
   b. Pobranie elementu z listy zakupów
   c. Jeśli nie istnieje lub już zakupiony: dodanie do 'failed'
   d. Transfer do spiżarni (merge jeśli istnieje)
   e. Usunięcie z listy zakupów
   f. Commit transakcji
   g. Dodanie do 'purchased' i 'transferred'
   h. Emituje event DELETE
6. Response: BulkPurchaseItemsResponse (200)
```

**Interakcje z bazą danych:**

- SELECT na `pantries` (WHERE household_id)
- Dla każdego elementu (niezależna transakcja):
  - BEGIN TRANSACTION
  - SELECT na `shopping_list_items`
  - SELECT/UPDATE/INSERT na `pantry_items`
  - DELETE na `shopping_list_items`
  - COMMIT

**Real-time:**

- Każdy pomyślny zakup emituje event DELETE

**Wzorzec częściowego sukcesu:**

- Niektóre elementy mogą się powieść, inne nie
- Response zawiera szczegółowe wyniki
- Status 200 nawet przy częściowym niepowodzeniu

---

### 4.7. DELETE /api/shopping-lists/{listId}/items/bulk-delete

```
1. Walidacja parametrów (listId, itemIds)
2. Weryfikacja autentykacji
3. Sprawdzenie dostępu do listy (RLS)
4. Dla każdego itemId (niezależnie):
   a. Próba usunięcia elementu
   b. Jeśli sukces: dodanie do 'deleted', emituje DELETE event
   c. Jeśli nie istnieje: dodanie do 'failed'
5. Response: BulkDeleteItemsResponse (200)
```

**Interakcje z bazą danych:**

- DELETE na `shopping_list_items` (dla każdego ID)

**Real-time:**

- Każde pomyślne usunięcie emituje event DELETE

**Idempotentność:**

- Usuwanie już usuniętych elementów zwraca sukces

---

## 5. Względy bezpieczeństwa

### 5.1. Uwierzytelnianie

**Mechanizm:**

- Wszystkie endpointy wymagają uwierzytelnionego użytkownika
- Supabase JWT token w header Authorization: `Bearer <token>`
- Session pobierana przez `supabase.auth.getSession()`

**Implementacja:**

```typescript
const {
  data: { session },
  error,
} = await supabase.auth.getSession()
if (!session?.user) {
  return res.status(401).json({ error: 'Unauthorized' })
}
const userId = session.user.id
```

---

### 5.2. Autoryzacja (RLS)

**Row Level Security Policies:**

Wszystkie zapytania wykonują RLS policies automatycznie:

```sql
-- shopping_lists_access
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_households uh
    WHERE uh.user_id = auth.uid() AND uh.household_id = shopping_lists.household_id
  )
)

-- shopping_list_items_access
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM shopping_lists sl
    JOIN user_households uh ON uh.household_id = sl.household_id
    WHERE sl.id = shopping_list_items.shopping_list_id
      AND uh.user_id = auth.uid()
  )
)
```

**Implikacje:**

- Użytkownik automatycznie widzi tylko listy i elementy dla swoich gospodarstw domowych
- Próba dostępu do cudzej listy: puste wyniki lub błąd 404
- RLS policies stosują się również do eventów Realtime

---

### 5.3. Walidacja danych

**Poziomy walidacji:**

1. **Walidacja schematu (Zod)**:
   - Typy danych (string, number, boolean)
   - Formaty (UUID, email)
   - Limity (min, max, length)

2. **Walidacja biznesowa**:
   - Unikalność nazw elementów (case-insensitive)
   - Istnienie powiązanych zasobów (shopping lists)
   - Limity operacji masowych (50 items)

3. **Sanityzacja**:
   - Trimowanie stringów
   - Escape znaków specjalnych
   - Walidacja numeric inputs (quantity >= 0)

**Przykład walidacji:**

```typescript
// Schema validation
const result = addItemsSchema.safeParse(req.body)
if (!result.success) {
  return res.status(400).json({ error: result.error.format() })
}

// Business validation
const { items } = result.data
const names = items.map(i => i.name.toLowerCase())
const duplicates = names.filter((name, index) => names.indexOf(name) !== index)
if (duplicates.length > 0) {
  return res.status(409).json({ error: 'Duplicate item names', duplicates })
}
```

---

### 5.4. Zapobieganie atakom

**SQL Injection:**

- Używanie Supabase Client z parametryzowanymi zapytaniami
- Nigdy nie konkatenowanie surowych stringów w SQL

**XSS (Cross-Site Scripting):**

- Sanityzacja wszystkich text inputs przed zapisem
- Escape HTML entities w odpowiedziach
- Content Security Policy headers

**CSRF (Cross-Site Request Forgery):**

- Supabase JWT tokens są odporne na CSRF
- Same-Site cookies dla session storage

**Rate Limiting:**

- Limity na poziomie Supabase (API quotas)
- Opcjonalnie: middleware rate limiting dla bulk operations
- Limity na poziomie schemy (max 50 items per request)

---

### 5.5. Real-time Security

**CDC Event Filtering:**

- RLS policies automatycznie filtrują eventy CDC
- Użytkownik otrzymuje tylko eventy dla swoich list
- Supabase automatycznie stosuje RLS do Realtime

**Subskrypcja:**

```typescript
const channel = supabase
  .channel('shopping-list-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'shopping_list_items',
      filter: `shopping_list_id=eq.${listId}`,
    },
    payload => {
      // Handle event (RLS automatically applied)
    }
  )
  .subscribe()
```

---

## 6. Obsługa błędów

### 6.1. Kody statusu HTTP

| Status                        | Znaczenie                    | Przykłady użycia                                                           |
| ----------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| **200 OK**                    | Sukces odczytu/aktualizacji  | GET items, PATCH item, bulk operations (nawet z częściowym niepowodzeniem) |
| **201 Created**               | Sukces tworzenia             | POST add items                                                             |
| **204 No Content**            | Sukces usunięcia             | DELETE item                                                                |
| **400 Bad Request**           | Nieprawidłowe dane wejściowe | Błędy walidacji, nieprawidłowe UUID, przekroczone limity                   |
| **401 Unauthorized**          | Brak lub nieprawidłowy token | Brak session, wygasły JWT                                                  |
| **403 Forbidden**             | Brak uprawnień               | Nie-członek gospodarstwa domowego (RLS)                                    |
| **404 Not Found**             | Zasób nie istnieje           | Lista/element/przepis nie znaleziony                                       |
| **409 Conflict**              | Konflikt danych              | Duplikat nazwy elementu, konflikt w spiżarni                               |
| **500 Internal Server Error** | Błąd serwera                 | Błąd bazy danych, błąd transakcji                                          |

---

### 6.2. Scenariusze błędów

#### GET /api/households/{householdId}/shopping-list

| Scenariusz         | Status  | Response                                     |
| ------------------ | ------- | -------------------------------------------- |
| Nieprawidłowy UUID | 400     | `{ "error": "Invalid household ID format" }` |
| Brak autoryzacji   | 401     | `{ "error": "Unauthorized" }`                |
| Nie-członek        | 403/404 | `{ "error": "Household not found" }`         |
| Błąd bazy danych   | 500     | `{ "error": "Database error" }`              |

#### GET /api/shopping-lists/{listId}/items

| Scenariusz         | Status | Response                                 |
| ------------------ | ------ | ---------------------------------------- |
| Nieprawidłowy UUID | 400    | `{ "error": "Invalid list ID format" }`  |
| Nieprawidłowy sort | 400    | `{ "error": "Invalid sort field" }`      |
| Lista nie istnieje | 404    | `{ "error": "Shopping list not found" }` |

#### POST /api/shopping-lists/{listId}/items

| Scenariusz          | Status | Response                                                      |
| ------------------- | ------ | ------------------------------------------------------------- |
| Pusta tablica items | 400    | `{ "error": "At least one item required" }`                   |
| Za dużo items (>50) | 400    | `{ "error": "Maximum 50 items allowed" }`                     |
| Pusta nazwa         | 400    | `{ "error": "Item name cannot be empty" }`                    |
| Ujemna ilość        | 400    | `{ "error": "Quantity must be non-negative" }`                |
| Duplikat nazwy      | 409    | `{ "error": "Duplicate item names", "duplicates": ["milk"] }` |

#### PATCH /api/shopping-lists/{listId}/items/{itemId}

| Scenariusz               | Status | Response                                             |
| ------------------------ | ------ | ---------------------------------------------------- |
| Brak pól do aktualizacji | 400    | `{ "error": "At least one field must be provided" }` |
| Ujemna ilość             | 400    | `{ "error": "Quantity must be non-negative" }`       |
| Element nie istnieje     | 404    | `{ "error": "Item not found" }`                      |
| Konflikt w spiżarni      | 409    | `{ "error": "Pantry item name conflict" }`           |
| Błąd transakcji          | 500    | `{ "error": "Failed to transfer to pantry" }`        |

#### DELETE /api/shopping-lists/{listId}/items/{itemId}

| Scenariusz           | Status | Response                        |
| -------------------- | ------ | ------------------------------- |
| Element nie istnieje | 404    | `{ "error": "Item not found" }` |
| Brak autoryzacji     | 401    | `{ "error": "Unauthorized" }`   |

#### POST /api/shopping-lists/{listId}/items/bulk-purchase

| Scenariusz              | Status | Response                                                    |
| ----------------------- | ------ | ----------------------------------------------------------- |
| Pusta tablica itemIds   | 400    | `{ "error": "At least one item required" }`                 |
| Za dużo items (>50)     | 400    | `{ "error": "Maximum 50 items allowed" }`                   |
| Częściowe niepowodzenie | 200    | `{ "purchased": [...], "failed": [...], "summary": {...} }` |
| Wszystkie niepowodzenia | 200    | `{ "purchased": [], "failed": [...], "summary": {...} }`    |

#### DELETE /api/shopping-lists/{listId}/items/bulk-delete

| Scenariusz              | Status | Response                                                  |
| ----------------------- | ------ | --------------------------------------------------------- |
| Pusta tablica itemIds   | 400    | `{ "error": "At least one item required" }`               |
| Za dużo items (>100)    | 400    | `{ "error": "Maximum 100 items allowed" }`                |
| Częściowe niepowodzenie | 200    | `{ "deleted": [...], "failed": [...], "summary": {...} }` |

---

### 6.3. Format odpowiedzi błędów

**Struktura błędu:**

```typescript
interface ApiError {
  error: string // Human-readable message
  details?: unknown // Additional context (e.g., validation errors)
  code?: string // Machine-readable error code
}
```

**Przykłady:**

```json
// Simple error
{
  "error": "Unauthorized"
}

// Validation error
{
  "error": "Validation failed",
  "details": {
    "items": {
      "_errors": ["At least one item required"]
    }
  }
}

// Conflict error
{
  "error": "Duplicate item names",
  "duplicates": ["milk", "eggs"],
  "code": "DUPLICATE_ITEMS"
}
```

---

### 6.4. Logowanie błędów

**Co logować:**

- Błędy bazy danych (500)
- Błędy transakcji
- Nieoczekiwane wyjątki
- Błędy RLS (403)
- Nieudane transfery do spiżarni

**Format logu:**

```typescript
console.error('[ShoppingListAPI]', {
  endpoint: 'POST /api/shopping-lists/generate',
  userId: session.user.id,
  householdId: '...',
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString(),
})
```

**Czego NIE logować:**

- Prawidłowe żądania (200, 201, 204)
- Błędy walidacji użytkownika (400)
- Informacje wrażliwe (hasła, tokeny)

---

## 7. Rozważania dotyczące wydajności

### 7.1. Optymalizacje zapytań

**Indeksy (zdefiniowane w migracji):**

```sql
CREATE INDEX idx_shopping_list_items_list_id
  ON shopping_list_items(shopping_list_id);

CREATE INDEX idx_shopping_list_items_purchased
  ON shopping_list_items(is_purchased);

CREATE INDEX idx_shopping_lists_household_id
  ON shopping_lists(household_id);
```

**Strategia:**

- Używanie indeksów dla częstych filtrów (shopping_list_id, is_purchased)
- Unikanie N+1 queries przez używanie JOINs
- Ograniczenie SELECT do potrzebnych kolumn

---

### 7.2. Operacje masowe

**Bulk Insert:**

- Używanie transakcji dla atomowości
- Wstawianie wielu rekordów jednym zapytaniem
- Limit 50 items per request zapobiega timeout

```typescript
// Bulk insert with Supabase
const { data, error } = await supabase.from('shopping_list_items').insert(items).select()
```

**Bulk Purchase/Delete:**

- Przetwarzanie każdego elementu niezależnie
- Wzorzec częściowego sukcesu: niektóre mogą się powieść
- Transaction per item zapobiega deadlockom
- Limit 50 items dla bulk purchase, 100 dla bulk delete

---

### 7.3. Real-time wydajność

**Strategia CDC:**

- Supabase automatycznie batches eventy
- Klient powinien debounce updates UI
- Używanie optimistic updates dla lepszego UX

**Ograniczenia:**

- Nie więcej niż 1 subskrypcja per shopping list per client
- Unsubscribe przy unmount komponentu
- Używanie presence dla śledzenia aktywnych użytkowników (opcjonalne)

---

### 7.4. Caching

**Strategie:**

- **Client-side**: React Query lub SWR dla cache stanu
- **Stale-while-revalidate**: Pokazywanie cached data podczas revalidation
- **Optimistic updates**: Natychmiastowa aktualizacja UI przed potwierdzeniem serwera

**Przykład z React Query:**

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['shoppingList', listId],
  queryFn: () => fetchShoppingList(listId),
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

---

### 7.5. Potencjalne wąskie gardła

| Wąskie gardło                 | Wpływ                     | Rozwiązanie                                      |
| ----------------------------- | ------------------------- | ------------------------------------------------ |
| **Bulk operations**           | Timeout dla dużych partii | Limity (50/100 items), timeout per item          |
| **Real-time scalability**     | Dużo połączeń             | Supabase auto-scales, używanie presence tracking |
| **RLS queries**               | Dodatkowy overhead        | Indeksy na foreign keys, cache membership        |
| **Pantry transfer conflicts** | Deadlocki                 | Row-level locking, retry logic                   |

---

## 8. Etapy wdrożenia

### Krok 1: Przygotowanie infrastruktury

**1.1. Utworzenie validation schemas**

- Plik: `src/lib/validation/shoppingListValidation.ts`
- Zdefiniowanie wszystkich Zod schemas (parametry, body, query)
- Eksport schemas dla użycia w API routes

**1.2. Utworzenie service layer**

- Plik: `src/lib/services/shoppingListService.ts`
- Implementacja logiki biznesowej (wydzielonej z API routes)
- Funkcje:
  - `getOrCreateShoppingList()`
  - `listItems()`
  - `addItems()`
  - `updateItem()`
  - `deleteItem()`
  - `bulkPurchase()`
  - `bulkDelete()`
  - `transferToPantry()` (helper)

**1.3. Utworzenie helper utilities**

- Plik: `src/lib/utils/errorHandlers.ts`
- Centralizacja obsługi błędów

---

### Krok 2: Implementacja endpointów CRUD

**2.1. GET /api/households/[householdId]/shopping-list**

- Plik: `src/pages/api/households/[householdId]/shopping-list.ts`
- Walidacja parametrów
- Weryfikacja sesji
- Get or create logic
- Response z items

**2.2. GET /api/shopping-lists/[listId]/items**

- Plik: `src/pages/api/shopping-lists/[listId]/items.ts`
- Walidacja parametrów i query
- Filtrowanie i sortowanie
- Response z data array

**2.3. POST /api/shopping-lists/[listId]/items**

- Walidacja body (items array)
- Sprawdzenie duplikatów
- Bulk insert w transakcji
- Response z utworzonymi items

**2.4. PATCH /api/shopping-lists/[listId]/items/[itemId]**

- Plik: `src/pages/api/shopping-lists/[listId]/items/[itemId].ts`
- Walidacja parametrów i body
- If isPurchased: transfer to pantry logic
- Else: simple update
- Response z item (+ pantryItem jeśli zakup)

**2.5. DELETE /api/shopping-lists/[listId]/items/[itemId]**

- Walidacja parametrów
- Simple delete
- Response 204

---

### Krok 3: Implementacja operacji masowych

**3.1. POST /api/shopping-lists/[listId]/items/bulk-purchase**

- Plik: `src/pages/api/shopping-lists/[listId]/items/bulk-purchase.ts`
- Walidacja itemIds array
- Iteracja przez items (niezależne transakcje)
- Zbieranie wyników (purchased, transferred, failed)
- Response z podsumowaniem

**3.2. DELETE /api/shopping-lists/[listId]/items/bulk-delete**

- Plik: `src/pages/api/shopping-lists/[listId]/items/bulk-delete.ts`
- Walidacja itemIds array
- Iteracja przez items
- Zbieranie wyników (deleted, failed)
- Response z podsumowaniem

---

### Krok 4: Integracja z Realtime

**4.1. Weryfikacja konfiguracji Realtime w Supabase**

- Dashboard → Database → Replication
- Włączenie dla `shopping_lists` i `shopping_list_items`
- Weryfikacja publication `supabase_realtime`

**4.2. Testowanie eventów CDC**

- Manualne INSERT/UPDATE/DELETE w Supabase SQL Editor
- Weryfikacja, że eventy są emitowane
- Sprawdzenie, czy RLS policies są stosowane

**4.3. Dokumentacja dla front-end**

- Plik: `docs/REALTIME_INTEGRATION.md`
- Przykłady subskrypcji
- Obsługa eventów (INSERT, UPDATE, DELETE)
- Best practices (optimistic updates, debouncing)

---

### Krok 5: Testowanie

**5.1. Unit testy dla validation schemas**

- Test file: `src/lib/validation/__tests__/shoppingListValidation.test.ts`
- Testowanie wszystkich edge cases
- Przykłady prawidłowych i nieprawidłowych danych

**5.2. Unit testy dla service layer**

- Test file: `src/lib/services/__tests__/shoppingListService.test.ts`
- Mockowanie Supabase client
- Testowanie logiki biznesowej (transfer)
- Edge cases (duplikaty, konflikty)

**5.3. Integration testy dla API endpoints**

- Test files: `src/pages/api/__tests__/shopping-lists/*.test.ts`
- Testowanie pełnego flow (request → response)
- Mockowanie auth session
- Testowanie wszystkich kodów statusu

**5.4. E2E testy (Playwright)**

- Test file: `tests/e2e/shopping-lists.spec.ts`
- Scenariusze:
  - Utworzenie listy zakupów
  - Dodanie items
  - Zakup items (transfer do spiżarni)
  - Real-time synchronizacja między dwoma klientami

---

### Krok 6: Dokumentacja i review

**6.1. API dokumentacja**

- Aktualizacja `api-plan.md` o implementacyjne szczegóły
- Przykłady curl requests
- Przykłady response bodies

**6.2. Code review checklist**

- [ ] Wszystkie endpointy zaimplementowane
- [ ] Walidacja Zod dla wszystkich inputs
- [ ] Obsługa wszystkich error scenarios
- [ ] Logowanie błędów
- [ ] RLS policies działają poprawnie
- [ ] Real-time eventy emitowane
- [ ] Testy pokrywają > 80% kodu
- [ ] Dokumentacja aktualna

**6.3. Performance review**

- [ ] Indeksy na kluczowych kolumnach
- [ ] Bulk operations używają transakcji
- [ ] Limity zapobiegają abuse
- [ ] Real-time subskrypcje nie wyciekają

---

### Krok 7: Deployment i monitoring

**7.1. Pre-deployment checklist**

- [ ] Wszystkie testy przechodzą
- [ ] Migracje bazy danych zastosowane
- [ ] RLS policies włączone i przetestowane
- [ ] Real-time włączony w Supabase
- [ ] Environment variables skonfigurowane

**7.2. Deployment**

- Push do main branch
- GitHub Actions deploy workflow
- Weryfikacja w staging environment

**7.3. Monitoring po deployment**

- Sprawdzenie error rates w Supabase dashboard
- Monitorowanie performance metrics
- Weryfikacja Real-time connection counts
- User feedback collection

**7.4. Post-deployment tasks**

- [ ] Dokumentacja dla użytkowników
- [ ] Training materials dla zespołu
- [ ] Incident response plan
- [ ] Backup strategy

---

## 9. Dodatkowe uwagi

### 9.1. Współpraca w czasie rzeczywistym

**Best practices dla front-end:**

- Używanie optimistic updates dla lepszego UX
- Debouncing UI updates (np. 100ms) dla batch eventów
- Pokazywanie wskaźnika online users (opcjonalne, przez Presence)
- Obsługa konfliktów (np. przez timestamps lub "last write wins")
- Graceful fallback gdy Realtime niedostępny

### 9.2. Migracja danych

Jeśli wdrażamy system z istniejącymi danymi:

- Script migracyjny dla konwersji starych list zakupów
- Walidacja integralności danych po migracji
- Backup przed migracją

### 9.3. Przyszłe usprawnienia

**Możliwe rozszerzenia (poza MVP):**

- Kategoryzacja items (dairy, meat, vegetables)
- Smart suggestions przy dodawaniu items
- Historia zakupów
- Statystyki (najczęściej kupowane)
- Eksport listy do PDF
- Udostępnianie listy poza gospodarstwo (read-only link)
- Push notifications dla zmian w liście
- Offline support z sync

### 9.4. Zależności między endpointami

**Kolejność implementacji:**

1. GET shopping-list (fundament)
2. GET items, POST items, PATCH item, DELETE item (CRUD)
3. POST bulk-purchase, DELETE bulk-delete (wykorzystują PATCH/DELETE logic)

**Współdzielona logika:**

- `transferToPantry()` używana przez PATCH i bulk-purchase
- `checkDuplicates()` używana przez POST items
- `verifyListAccess()` używana przez wszystkie endpointy

---

## 10. Podsumowanie

Ten plan implementacji obejmuje:

✅ **7 endpointów REST API** dla kompleksowego zarządzania listami zakupów  
✅ **Real-time collaboration** przez Supabase CDC  
✅ **Bezpieczeństwo** przez JWT auth i RLS policies  
✅ **Walidacja** przez Zod schemas  
✅ **Obsługa błędów** dla wszystkich scenariuszy  
✅ **Optymalizacja wydajności** przez indeksy i bulk operations  
✅ **Testowanie** na trzech poziomach (unit, integration, E2E)  
✅ **Dokumentacja** dla zespołu i użytkowników

**Kluczowe decyzje architektoniczne:**

- **Service layer** dla wydzielenia logiki biznesowej
- **Partial success pattern** dla operacji masowych
- **Atomic transactions** dla transfer to pantry
- **RLS policies** jako główny mechanizm autoryzacji
- **Real-time CDC** dla współpracy bez polling

**Szacowany czas implementacji:**

- Krok 1-2: 2 dni (infrastruktura + CRUD)
- Krok 3: 1 dzień (bulk operations)
- Krok 4: 0.5 dnia (Realtime integration)
- Krok 5: 2 dni (testowanie)
- Krok 6-7: 1 dzień (dokumentacja + deployment)

**Całkowity czas: ~6.5 dni** (dla doświadczonego developera)

---

**Plan gotowy do użycia przez zespół programistów! 🚀**

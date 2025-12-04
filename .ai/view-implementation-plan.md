# API Endpoint Implementation Plan: GET /api/recipes

## Kontekst: Istniejący kod

Ten endpoint rozszerza istniejącą funkcjonalność `/api/recipes` (obecnie tylko POST).

### Istniejące elementy do wykorzystania:

**`src/lib/services/recipe.service.ts`:**

- ✅ `RecipeService` class - główny serwis biznesowy
- ✅ `getUserHouseholdId(userId)` - pobiera household_id (z DEFAULT_HOUSEHOLD_ID fallback)
- ✅ `mapDbRecipeToDto()` - transformuje DB record → Recipe DTO
- ✅ `RecipeContent` interface - struktura JSONB z bazy danych
- ✅ Pattern: console logging, error handling

**`src/lib/validation/recipes.ts`:**

- ✅ `CreateRecipeSchema` - wzór do modelowania nowych schematów Zod
- ✅ `IngredientSchema` - reużywalny schema dla składników
- ✅ Pattern: enum validation, error messages

**`src/app/api/recipes/route.ts`:**

- ✅ POST handler - wzór error handling i response format
- ✅ Integracja z `authenticateRequest()`
- ✅ Pattern: try-catch, status codes, JSDoc comments

**`src/lib/api-auth.ts`:**

- ✅ `authenticateRequest()` - helper do weryfikacji Bearer token

### Co dodajemy:

- ⭐ Nowy Zod schema: `ListRecipesQuerySchema`
- ⭐ Nowa metoda: `RecipeService.listRecipes()`
- ⭐ Nowy handler: `export async function GET()`
- ⭐ Helper function: `parseSortParam()`

---

## 1. Przegląd punktu końcowego

Endpoint `GET /api/recipes` zwraca paginowaną listę przepisów należących do household użytkownika, z opcjonalnym wyszukiwaniem pełnotekstowym oraz filtrowaniem według typu posiłku i metody utworzenia.

**Cel biznesowy:**

- Umożliwienie użytkownikom przeglądania ich przepisów
- Wyszukiwanie przepisów po tytule i składnikach
- Filtrowanie według kategorii (śniadanie/obiad/kolacja)
- Odróżnienie przepisów utworzonych ręcznie od wygenerowanych przez AI

**Kontekst w architekturze:**

- Endpoint read-only, nie modyfikuje danych
- Wykorzystuje GIN index dla full-text search na JSONB content
- Wykorzystuje BTREE index dla filtrowania po meal_type
- Row Level Security (RLS) na poziomie Supabase zapewnia izolację danych między households

## 2. Szczegóły żądania

### HTTP Method

`GET`

### Struktura URL

`/api/recipes`

### Headers

- `Authorization: Bearer <token>` (wymagany)
- `Content-Type: application/json`

### Parametry zapytania (Query Parameters)

#### Wymagane

Brak – wszystkie parametry są opcjonalne.

#### Opcjonalne

| Parametr         | Typ    | Domyślna wartość | Opis                                     | Ograniczenia                                                                       |
| ---------------- | ------ | ---------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| `search`         | string | –                | Full-text search po tytule i składnikach | Max 200 znaków, sanityzacja                                                        |
| `mealType`       | enum   | –                | Filtrowanie według typu posiłku          | `'breakfast' \| 'lunch' \| 'dinner'`                                               |
| `creationMethod` | enum   | –                | Filtrowanie według metody utworzenia     | `'manual' \| 'ai_generated' \| 'ai_generated_modified'`                            |
| `page`           | number | 1                | Numer strony (1-indexed)                 | Min: 1, integer                                                                    |
| `pageSize`       | number | 20               | Liczba wyników na stronę                 | Min: 1, Max: 100, integer                                                          |
| `sort`           | string | `-createdAt`     | Sortowanie                               | Dozwolone: `createdAt`, `-createdAt`, `title`, `-title`, `updatedAt`, `-updatedAt` |

### Request Body

Brak (metoda GET)

### Przykład żądania

```http
GET /api/recipes?search=chicken&mealType=dinner&page=1&pageSize=10&sort=-createdAt
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Wykorzystywane typy

### Istniejące typy (src/types/types.ts)

```typescript
// Recipe DTO - główna struktura przepisu
export interface Recipe {
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

// Ingredient - składnik przepisu
export interface Ingredient {
  name: string
  quantity: number
  unit?: string
}

// Pagination - informacje o paginacji
export interface Pagination {
  page: number
  pageSize: number
  total: number
}

// RecipesListResponse - odpowiedź z listą przepisów
export interface RecipesListResponse {
  data: Recipe[]
  pagination: Pagination
}

// RecipeCreationMethod - metoda utworzenia przepisu
export type RecipeCreationMethod = Enums<'recipe_creation_method'>
// Możliwe wartości: 'manual' | 'ai_generated' | 'ai_generated_modified'
```

### Nowe typy do utworzenia (src/lib/validation/recipes.ts)

```typescript
import { z } from 'zod'

/**
 * Dozwolone wartości sortowania
 * Prefix '-' oznacza sortowanie malejące (descending)
 */
const ALLOWED_SORT_VALUES = [
  'createdAt',
  '-createdAt',
  'title',
  '-title',
  'updatedAt',
  '-updatedAt',
] as const

/**
 * Zod schema dla parametrów zapytania GET /api/recipes
 * Waliduje i parsuje query parameters z URL
 */
export const ListRecipesQuerySchema = z.object({
  search: z
    .string()
    .max(200, 'Search query must be at most 200 characters')
    .optional()
    .transform(val => val?.trim()), // Trim whitespace

  mealType: z
    .enum(['breakfast', 'lunch', 'dinner'], {
      errorMap: () => ({
        message: "Meal type must be 'breakfast', 'lunch', or 'dinner'",
      }),
    })
    .optional(),

  creationMethod: z
    .enum(['manual', 'ai_generated', 'ai_generated_modified'], {
      errorMap: () => ({
        message: "Creation method must be 'manual', 'ai_generated', or 'ai_generated_modified'",
      }),
    })
    .optional(),

  page: z
    .string()
    .optional()
    .default('1')
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int('Page must be an integer').min(1, 'Page must be at least 1')),

  pageSize: z
    .string()
    .optional()
    .default('20')
    .transform(val => parseInt(val, 10))
    .pipe(
      z
        .number()
        .int('Page size must be an integer')
        .min(1, 'Page size must be at least 1')
        .max(100, 'Page size must be at most 100')
    ),

  sort: z
    .enum(ALLOWED_SORT_VALUES, {
      errorMap: () => ({
        message: 'Sort must be one of: createdAt, -createdAt, title, -title, updatedAt, -updatedAt',
      }),
    })
    .optional()
    .default('-createdAt'),
})

/**
 * TypeScript type inferred from schema
 */
export type ListRecipesQuery = z.infer<typeof ListRecipesQuerySchema>

/**
 * Filters for recipe listing (used internally in service layer)
 */
export interface RecipeFilters {
  search?: string
  mealType?: string
  creationMethod?: string
  page: number
  pageSize: number
  sortField: string
  sortDirection: 'asc' | 'desc'
}
```

## 4. Szczegóły odpowiedzi

### Struktura odpowiedzi (Success - 200 OK)

```typescript
{
  data: Recipe[],
  pagination: {
    page: number,
    pageSize: number,
    total: number
  }
}
```

### Przykład odpowiedzi sukcesu (200 OK)

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Fried Rice",
      "ingredients": [
        {
          "name": "Rice",
          "quantity": 2,
          "unit": "cup"
        },
        {
          "name": "Eggs",
          "quantity": 2,
          "unit": null
        },
        {
          "name": "Soy Sauce",
          "quantity": 2,
          "unit": "tbsp"
        }
      ],
      "instructions": "1. Cook rice according to package directions...",
      "mealType": "dinner",
      "creationMethod": "manual",
      "prepTime": 10,
      "cookTime": 20,
      "createdAt": "2025-10-13T12:00:00Z",
      "updatedAt": "2025-10-13T12:00:00Z",
      "householdId": "00000000-0000-0000-0000-000000000001"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

### Kody statusu HTTP

| Kod     | Znaczenie             | Kiedy                                                                                                               |
| ------- | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 200     | OK                    | Pomyślnie zwrócono listę przepisów (może być pusta)                                                                 |
| 400     | Bad Request           | Nieprawidłowe parametry zapytania (np. pageSize > 100)                                                              |
| 401     | Unauthorized          | Brak tokenu lub nieprawidłowy/wygasły token                                                                         |
| ~~404~~ | ~~Not Found~~         | ~~Użytkownik nie należy do żadnego household~~ (TEMPORARY: obecnie nie używane, service używa DEFAULT_HOUSEHOLD_ID) |
| 500     | Internal Server Error | Nieoczekiwany błąd serwera lub błąd bazy danych                                                                     |

### Przykłady odpowiedzi błędów

#### 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "pageSize",
      "message": "Page size must be at most 100"
    }
  ]
}
```

#### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

#### ~~404 Not Found~~ (TEMPORARY: not used currently)

```json
// FUTURE: When household management is implemented
{
  "error": "Not Found",
  "message": "User is not a member of any household"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Przepływ danych

### Diagram przepływu (Request → Response)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CLIENT REQUEST                                               │
│    GET /api/recipes?search=chicken&mealType=dinner&page=1       │
│    Authorization: Bearer <token>                                │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. NEXT.JS API ROUTE HANDLER (route.ts)                        │
│    export async function GET(request)                           │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. AUTHENTICATION (src/lib/api-auth.ts)                        │
│    authenticateRequest(request)                                 │
│    ├─ Extract Bearer token from Authorization header           │
│    ├─ Verify with Supabase Auth                                │
│    └─ Return { user, supabase } or errorResponse (401)         │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. PARSE & VALIDATE QUERY PARAMS (Zod)                         │
│    ListRecipesQuerySchema.safeParse(rawQuery)                   │
│    ├─ Transform string → number (page, pageSize)               │
│    ├─ Validate enums (mealType, creationMethod, sort)          │
│    ├─ Apply defaults (page=1, pageSize=20, sort=-createdAt)    │
│    └─ Return validatedQuery or validation errors (400)         │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. TRANSFORM TO SERVICE FILTERS                                 │
│    parseSortParam(sort) → { field, direction }                  │
│    Build RecipeFilters object                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. RECIPE SERVICE - BUSINESS LOGIC                              │
│    RecipeService.listRecipes(userId, filters)                   │
│    ├─ getUserHouseholdId(userId) [EXISTING]                    │
│    │  └─ Fallback to DEFAULT_HOUSEHOLD_ID (temporary)          │
│    ├─ Build Supabase Query:                                     │
│    │  ├─ .from('recipes').select('*', { count: 'exact' })      │
│    │  ├─ .eq('household_id', householdId)                       │
│    │  ├─ .or() for search (title + ingredients)                │
│    │  ├─ .eq() for mealType filter                              │
│    │  ├─ .eq() for creationMethod filter                        │
│    │  ├─ .order() for sorting                                   │
│    │  └─ .range() for pagination                                │
│    ├─ Execute query → { data, error, count }                   │
│    └─ Transform: data.map(mapDbRecipeToDto) [EXISTING]         │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. DATABASE QUERY (Supabase/PostgreSQL)                        │
│    - RLS policy filters by auth.uid()                           │
│    - GIN index for JSONB search                                 │
│    - BTREE index for meal_type                                  │
│    - Returns paginated results + total count                    │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. BUILD RESPONSE                                               │
│    RecipesListResponse {                                        │
│      data: Recipe[],                                            │
│      pagination: { page, pageSize, total }                      │
│    }                                                            │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. RETURN HTTP RESPONSE                                         │
│    NextResponse.json(result, { status: 200 })                   │
│    Content-Type: application/json                               │
└─────────────────────────────────────────────────────────────────┘

ERROR PATHS:
├─ Step 3: Missing/invalid token → 401 Unauthorized
├─ Step 4: Invalid query params → 400 Bad Request
├─ Step 6: Database error → 500 Internal Server Error
└─ Any step: Unexpected error → 500 Internal Server Error
```

### Szczegóły interakcji z bazą danych

#### Krok 1: Pobranie household_id użytkownika

```sql
SELECT household_id
FROM user_households
WHERE user_id = $1
```

#### Krok 2: Zapytanie główne (z filtrami i paginacją)

```sql
SELECT * FROM recipes
WHERE household_id = $1
  AND ($2::text IS NULL OR
       content->>'title' ILIKE '%' || $2 || '%' OR
       content::text ILIKE '%' || $2 || '%')  -- full-text search
  AND ($3::text IS NULL OR content->>'meal_type' = $3)
  AND ($4::text IS NULL OR creation_method = $4)
ORDER BY created_at DESC  -- lub inne pole według sort param
LIMIT $5 OFFSET $6
```

#### Krok 3: Zapytanie zliczające (dla paginacji)

```sql
SELECT COUNT(*) FROM recipes
WHERE household_id = $1
  AND ($2::text IS NULL OR
       content->>'title' ILIKE '%' || $2 || '%' OR
       content::text ILIKE '%' || $2 || '%')
  AND ($3::text IS NULL OR content->>'meal_type' = $3)
  AND ($4::text IS NULL OR creation_method = $4)
```

### Transformacja danych

**Database Record → Recipe DTO:**

- JSONB `content` → flat structure (title, ingredients, instructions, etc.)
- snake_case → camelCase (prep_time → prepTime)
- Timestamptz → ISO 8601 string

## 6. Względy bezpieczeństwa

### Uwierzytelnienie (Authentication)

- **Mechanizm**: Bearer token w nagłówku `Authorization`
- **Implementacja**: Funkcja `authenticateRequest()` z `src/lib/api-auth.ts`
- **Weryfikacja**: Token weryfikowany przez Supabase Auth (`supabase.auth.getUser()`)
- **Błędy**: 401 Unauthorized przy braku tokenu lub nieprawidłowym tokenie

### Autoryzacja (Authorization)

- **Row Level Security (RLS)**: Włączone na tabeli `recipes`
- **Policy**: Użytkownik może widzieć tylko przepisy z household, do którego należy
- **Implementacja**: RLS policy sprawdza `user_households.user_id = auth.uid()`
- **Dodatkowa kontrola**: Serwis sprawdza `household_id` przed zapytaniem

### Walidacja danych wejściowych

#### Query Parameters

- **Zod schema**: `ListRecipesQuerySchema` waliduje wszystkie parametry
- **Sanityzacja search**: Trim whitespace, escape special characters
- **Enum validation**: mealType i creationMethod ograniczone do dozwolonych wartości
- **Numeric limits**: page >= 1, 1 <= pageSize <= 100
- **Sort validation**: Tylko dozwolone wartości sortowania

#### Zapobieganie atakom

| Atak                        | Obrona                                                  |
| --------------------------- | ------------------------------------------------------- |
| **SQL Injection**           | Parametryzowane zapytania Supabase, Zod validation      |
| **Search Injection**        | Sanityzacja, escape special chars, limit długości (200) |
| **DoS przez duże pageSize** | Max limit 100                                           |
| **Unauthorized access**     | RLS + authenticateRequest()                             |
| **XSS w search results**    | Frontend sanitization (nie dotyczy backend)             |

### Rate Limiting

- **Zalecenie**: Middleware Next.js z limitem 100 req/min per IP
- **Nie zaimplementowane w tym endpointcie**: Globalny middleware

### Wrażliwe dane

- **Nie logować**: Bearer tokens, user_id w plaintext
- **Logować**: Request ID, timestamp, general error messages
- **PII**: Email użytkownika NIE jest zwracany w response

## 7. Obsługa błędów

### Hierarchia błędów (od najbardziej do najmniej specyficznych)

#### 1. Błędy walidacji (400 Bad Request)

**Kiedy:**

- Nieprawidłowe query parameters
- pageSize > 100 lub < 1
- page < 1
- mealType nie należy do ['breakfast', 'lunch', 'dinner']
- creationMethod nie należy do dozwolonych wartości
- sort nie należy do dozwolonych wartości
- search > 200 znaków

**Obsługa:**

```typescript
const validationResult = ListRecipesQuerySchema.safeParse({
  search: searchParams.get('search') || undefined,
  mealType: searchParams.get('mealType') || undefined,
  // ... inne parametry
})

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
```

#### 2. Błędy uwierzytelnienia (401 Unauthorized)

**Kiedy:**

- Brak nagłówka Authorization
- Token nieprawidłowy lub wygasły
- Token nie może być zweryfikowany przez Supabase

**Obsługa:**

```typescript
const { user, supabase, errorResponse } = await authenticateRequest(request)
if (errorResponse) return errorResponse // 401 Unauthorized
```

#### 3. Błędy autoryzacji/nie znaleziono (404 Not Found)

**Kiedy:**

- ~~Użytkownik nie należy do żadnego household~~ (TEMPORARY: obecnie używamy DEFAULT_HOUSEHOLD_ID)
- Próba dostępu do przepisu spoza swojego household (obsługiwane przez RLS)

**Obsługa:**

```typescript
// UWAGA: Currently NOT returning 404 for missing household
// Service uses DEFAULT_HOUSEHOLD_ID as fallback (temporary workaround)
// This 404 block will be needed once household management is fully implemented

// Future implementation:
// const householdId = await recipeService.getUserHouseholdId(user.id)
// if (!householdId) {
//   return NextResponse.json(
//     { error: 'Not Found', message: 'User is not a member of any household' },
//     { status: 404 }
//   )
// }
```

#### 4. Błędy bazy danych (500 Internal Server Error)

**Kiedy:**

- Błąd połączenia z Supabase
- Timeout zapytania
- Błąd wewnętrzny PostgreSQL
- RLS policy failure

**Obsługa:**

```typescript
try {
  const result = await recipeService.listRecipes(user.id, filters)
  // ...
} catch (error) {
  console.error('[GET /api/recipes] Database error:', {
    userId: user.id,
    error: error instanceof Error ? error.message : 'Unknown error',
  })

  return NextResponse.json(
    {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while fetching recipes',
    },
    { status: 500 }
  )
}
```

#### 5. Nieoczekiwane błędy (500 Internal Server Error)

**Kiedy:**

- Wyjątki nie obsłużone przez powyższe kategorie
- Błędy parsowania JSON
- Błędy transformacji danych

**Obsługa:**

```typescript
export async function GET(request: NextRequest) {
  try {
    // ... cała logika
  } catch (error) {
    // Global catch-all
    console.error('[GET /api/recipes] Unexpected error:', error)

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

### Logging strategy

```typescript
// Success
console.log('[GET /api/recipes] Success:', {
  userId: user.id,
  householdId,
  resultCount: result.data.length,
  page: filters.page,
  totalResults: result.pagination.total,
})

// Errors
console.error('[GET /api/recipes] Error type:', {
  userId: user?.id || 'unknown',
  errorType: 'validation' | 'auth' | 'notFound' | 'database' | 'unexpected',
  error: error instanceof Error ? error.message : 'Unknown',
})
```

### Edge cases

| Sytuacja                              | Obsługa                                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| Brak przepisów w household            | Zwróć pustą tablicę `data: []` z `total: 0`, status `200`                              |
| page przekracza liczbę stron          | Zwróć pustą tablicę `data: []`, `total` odzwierciedla rzeczywistą liczbę, status `200` |
| search nie zwraca wyników             | Zwróć pustą tablicę `data: []` z `total: 0`, status `200`                              |
| Household istnieje ale brak przepisów | Zwróć `200 OK` z pustą tablicą (valid state)                                           |
| Multiple filters nie zwracają wyników | Zwróć `200 OK` z pustą tablicą (valid state)                                           |
| User bez household (TEMPORARY)        | Service używa DEFAULT_HOUSEHOLD_ID - zwraca przepisy z tego household                  |
| Search z special characters           | Zod trim i sanityzacja - bezpieczne przekazanie do Supabase                            |
| Sort po title w JSONB                 | Użyj `order('content->title')` zamiast bezpośredniej kolumny                           |

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Full-text search na dużych zbiorach danych**
   - Problem: ILIKE queries mogą być wolne dla tysięcy przepisów
   - Mitygacja: GIN index na `content` JSONB column
2. **Dwa zapytania (data + count)**
   - Problem: Każde żądanie wykonuje 2 zapytania do bazy
   - Mitygacja: Index na kolumnach filtrowania; rozważyć caching count dla częstych zapytań

3. **Transformacja JSONB → DTO**
   - Problem: Parsowanie JSONB i transformacja dla każdego rekordu
   - Mitygacja: Limit pageSize do 100; rozważyć pagination cursors dla dużych zbiorów

4. **N+1 problem z household lookup**
   - Problem: Obecnie każde żądanie pobiera household_id
   - Mitygacja: Rozważyć caching household_id w session/token claims

### Strategie optymalizacji

#### 1. Database Indexing (już zaimplementowane w schemacie)

```sql
-- GIN index dla full-text search na JSONB
CREATE INDEX idx_recipes_content_gin
ON recipes USING gin (content jsonb_path_ops);

-- BTREE index dla meal_type
CREATE INDEX idx_recipes_meal_type
ON recipes ((content->>'meal_type'));

-- BTREE index dla creation_method
CREATE INDEX idx_recipes_creation_method
ON recipes (creation_method);

-- Index dla sortowania
CREATE INDEX idx_recipes_created_at
ON recipes (household_id, created_at DESC);
```

#### 2. Query Optimization

- Użyj `select('*')` zamiast pobierania wszystkich kolumn gdy nie potrzebne
- Combine filters w jednym WHERE clause
- Use prepared statements (Supabase handles this)

#### 3. Pagination Best Practices

- Limit default pageSize do 20 (balance między UX a performance)
- Max pageSize 100 (zapobiega DoS)
- Rozważyć cursor-based pagination dla bardzo dużych zbiorów (future improvement)

#### 4. Caching Strategy (future)

- Cache household_id per user session (Redis/memory)
- Cache total count dla popularnych filtrów (TTL 5min)
- Response caching z CDN dla często używanych zapytań (np. `/api/recipes?page=1`)

#### 5. Monitoring

- Log execution time dla długich zapytań (> 1000ms)
- Alert gdy średni czas odpowiedzi > 500ms
- Monitor database connection pool usage

### Benchmarki (szacunkowe)

| Scenariusz                      | Oczekiwany czas |
| ------------------------------- | --------------- |
| 10 recipes, no filters          | < 50ms          |
| 100 recipes, no filters         | < 100ms         |
| 1000 recipes, search query      | < 200ms         |
| 10000 recipes, multiple filters | < 500ms         |

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie - Typy i walidacja

**Plik**: `src/lib/validation/recipes.ts`

**Imports (już istniejące):**

```typescript
import { z } from 'zod'
// Wszystkie potrzebne importy już są na miejscu
```

1. **Dodać typy i Zod schema dla query parameters (na końcu pliku)**

   ```typescript
   - Utworzyć ListRecipesQuerySchema
   - Utworzyć type ListRecipesQuery
   - Utworzyć interface RecipeFilters (internal service type)
   - Zdefiniować ALLOWED_SORT_VALUES
   - Export wszystkich nowych typów
   ```

2. **Dodać helper function do parsowania sort**
   ```typescript
   /**
    * Parses sort parameter into field and direction
    *
    * @param sort - Sort string (e.g., 'createdAt', '-createdAt')
    * @returns Object with field and direction
    *
    * @example
    * parseSortParam('createdAt')   // { field: 'created_at', direction: 'asc' }
    * parseSortParam('-createdAt')  // { field: 'created_at', direction: 'desc' }
    * parseSortParam('title')       // { field: 'title', direction: 'asc' }
    */
   export function parseSortParam(sort: string): {
     field: string
     direction: 'asc' | 'desc'
   } {
     const isDescending = sort.startsWith('-')
     const fieldName = isDescending ? sort.slice(1) : sort

     // Map camelCase to snake_case for database columns
     const fieldMapping: Record<string, string> = {
       createdAt: 'created_at',
       updatedAt: 'updated_at',
       title: 'title', // title is in JSONB, handled separately in query
     }

     return {
       field: fieldMapping[fieldName] || fieldName,
       direction: isDescending ? 'desc' : 'asc',
     }
   }
   ```

### Faza 2: Warstwa serwisowa

**Plik**: `src/lib/services/recipe.service.ts`

**Imports (dodać nowe):**

```typescript
// Istniejące importy (już są):
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { CreateRecipeInput } from '@/lib/validation/recipes'
import type { Recipe } from '@/types/types'

// DODAĆ nowe importy:
import type { RecipeFilters } from '@/lib/validation/recipes'
import type { Pagination } from '@/types/types'
```

3. **Dodać metodę listRecipes do RecipeService (po metodzie createManualRecipe)**

   ```typescript
   async listRecipes(
     userId: string,
     filters: RecipeFilters
   ): Promise<{ data: Recipe[], pagination: Pagination }>
   ```

4. **Implementacja metody listRecipes:**

   a. **Pobierz household_id użytkownika (wykorzystaj istniejący pattern z DEFAULT_HOUSEHOLD_ID)**

   ```typescript
   // UWAGA: Wykorzystuj istniejący pattern z createManualRecipe()
   let householdId = await this.getUserHouseholdId(userId)

   // TEMPORARY WORKAROUND: Użyj default household dla development
   // TODO: Usuń gdy household management będzie zaimplementowane
   if (!householdId) {
     console.warn(
       `[RecipeService] User ${userId} has no household. Using DEFAULT_HOUSEHOLD_ID for development.`
     )
     householdId = DEFAULT_HOUSEHOLD_ID
   }
   ```

   b. **Zbuduj query Supabase z filtrami**

   ```typescript
   let query = this.supabase
     .from('recipes')
     .select('*', { count: 'exact' })
     .eq('household_id', householdId)
   ```

   c. **Dodaj search filter (jeśli podany)**

   ```typescript
   if (filters.search) {
     query = query.or(
       `content->title.ilike.%${filters.search}%,` + `content::text.ilike.%${filters.search}%`
     )
   }
   ```

   d. **Dodaj mealType filter**

   ```typescript
   if (filters.mealType) {
     query = query.eq('content->meal_type', filters.mealType)
   }
   ```

   e. **Dodaj creationMethod filter**

   ```typescript
   if (filters.creationMethod) {
     query = query.eq('creation_method', filters.creationMethod)
   }
   ```

   f. **Dodaj sortowanie**

   ```typescript
   const ascending = filters.sortDirection === 'asc'

   if (filters.sortField === 'title') {
     query = query.order('content->title', { ascending })
   } else {
     // created_at, updated_at - bezpośrednie kolumny
     query = query.order(filters.sortField, { ascending })
   }
   ```

   g. **Dodaj paginację**

   ```typescript
   const from = (filters.page - 1) * filters.pageSize
   const to = from + filters.pageSize - 1
   query = query.range(from, to)
   ```

   h. **Wykonaj query**

   ```typescript
   const { data, error, count } = await query

   if (error) {
     console.error('[RecipeService] Error listing recipes:', error)
     throw new Error('Failed to fetch recipes')
   }
   ```

   i. **Transformuj rekordy do DTOs używając istniejącej metody**

   ```typescript
   // Wykorzystaj istniejącą prywatną metodę mapDbRecipeToDto()
   const recipes = data?.map(record => this.mapDbRecipeToDto(record)) || []
   ```

   j. **Zwróć wynik z paginacją**

   ```typescript
   return {
     data: recipes,
     pagination: {
       page: filters.page,
       pageSize: filters.pageSize,
       total: count || 0,
     },
   }
   ```

   **Pełna implementacja metody listRecipes():**

   ```typescript
   /**
    * Lists recipes for a user's household with filtering and pagination
    *
    * @param userId - The authenticated user's ID
    * @param filters - Filter, sort, and pagination options
    * @returns Paginated list of recipes with metadata
    * @throws Error if database operation fails
    *
    * Similar to Angular's service pattern - encapsulates complex query logic.
    */
   async listRecipes(
     userId: string,
     filters: RecipeFilters
   ): Promise<{ data: Recipe[]; pagination: Pagination }> {
     // 1. Get household_id (with DEFAULT_HOUSEHOLD_ID fallback)
     let householdId = await this.getUserHouseholdId(userId)

     if (!householdId) {
       console.warn(
         `[RecipeService] User ${userId} has no household. Using DEFAULT_HOUSEHOLD_ID for development.`
       )
       householdId = DEFAULT_HOUSEHOLD_ID
     }

     // 2. Build base query
     let query = this.supabase
       .from('recipes')
       .select('*', { count: 'exact' })
       .eq('household_id', householdId)

     // 3. Apply search filter
     if (filters.search) {
       // Search in title and ingredients (JSONB content)
       query = query.or(
         `content->title.ilike.%${filters.search}%,` +
         `content::text.ilike.%${filters.search}%`
       )
     }

     // 4. Apply mealType filter
     if (filters.mealType) {
       query = query.eq('content->meal_type', filters.mealType)
     }

     // 5. Apply creationMethod filter
     if (filters.creationMethod) {
       query = query.eq('creation_method', filters.creationMethod)
     }

     // 6. Apply sorting
     const ascending = filters.sortDirection === 'asc'

     if (filters.sortField === 'title') {
       // Title is in JSONB content
       query = query.order('content->title', { ascending })
     } else {
       // created_at, updated_at are direct columns
       query = query.order(filters.sortField, { ascending })
     }

     // 7. Apply pagination
     const from = (filters.page - 1) * filters.pageSize
     const to = from + filters.pageSize - 1
     query = query.range(from, to)

     // 8. Execute query
     const { data, error, count } = await query

     if (error) {
       console.error('[RecipeService] Error listing recipes:', error)
       throw new Error('Failed to fetch recipes')
     }

     // 9. Transform to DTOs using existing method
     const recipes = data?.map(record => this.mapDbRecipeToDto(record)) || []

     // 10. Return with pagination metadata
     return {
       data: recipes,
       pagination: {
         page: filters.page,
         pageSize: filters.pageSize,
         total: count || 0,
       },
     }
   }
   ```

### Faza 3: API Route Handler

**Plik**: `src/app/api/recipes/route.ts`

**Imports (dodać nowe):**

```typescript
// Istniejące importy (już są):
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api-auth'
import { RecipeService } from '@/lib/services/recipe.service'
import { CreateRecipeSchema } from '@/lib/validation/recipes'
import type { CreateRecipeResponse } from '@/types/types'

// DODAĆ nowe importy:
import { ListRecipesQuerySchema, parseSortParam } from '@/lib/validation/recipes'
import type { RecipeFilters } from '@/lib/validation/recipes'
import type { RecipesListResponse } from '@/types/types'
```

5. **Dodać export funkcji GET do istniejącego pliku (po funkcji POST)**

   ```typescript
   // UWAGA: Plik już zawiera export async function POST()
   // Dodaj GET handler w tym samym pliku
   export async function GET(request: NextRequest): Promise<NextResponse<...>>
   ```

6. **Implementacja handlera GET (wzorowany na istniejącym POST):**

   a. **Try-catch wrapper (tak jak w POST)**

   ```typescript
   try {
     // implementacja
   } catch (error) {
     // global error handler - identyczny pattern jak POST
   }
   ```

   b. **Uwierzytelnienie (identyczne jak w POST)**

   ```typescript
   // ========================================================================
   // 1. AUTHENTICATION
   // ========================================================================
   const { user, supabase, errorResponse } = await authenticateRequest(request)
   if (errorResponse) return errorResponse
   ```

   c. **Parse query parameters z URL**

   ```typescript
   // ========================================================================
   // 2. PARSE & VALIDATE QUERY PARAMETERS
   // ========================================================================
   const { searchParams } = new URL(request.url)
   const rawQuery = {
     search: searchParams.get('search') || undefined,
     mealType: searchParams.get('mealType') || undefined,
     creationMethod: searchParams.get('creationMethod') || undefined,
     page: searchParams.get('page') || undefined,
     pageSize: searchParams.get('pageSize') || undefined,
     sort: searchParams.get('sort') || undefined,
   }
   ```

   d. **Walidacja z Zod (identyczny pattern jak POST z request body)**

   ```typescript
   // Validate with Zod schema
   const validationResult = ListRecipesQuerySchema.safeParse(rawQuery)

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

   const validatedQuery = validationResult.data
   ```

   e. **Transformuj do RecipeFilters**

   ```typescript
   const { field, direction } = parseSortParam(validatedQuery.sort)

   const filters: RecipeFilters = {
     search: validatedQuery.search,
     mealType: validatedQuery.mealType,
     creationMethod: validatedQuery.creationMethod,
     page: validatedQuery.page,
     pageSize: validatedQuery.pageSize,
     sortField: field,
     sortDirection: direction,
   }
   ```

   f. **Wywołaj serwis**

   ```typescript
   const recipeService = new RecipeService(supabase)
   const result = await recipeService.listRecipes(user.id, filters)
   ```

   g. **Zwróć sukces**

   ```typescript
   // UWAGA: Nie sprawdzamy if (!result) - service używa DEFAULT_HOUSEHOLD_ID
   // Możliwy edge case: result może być { data: [], pagination: {...} }
   return NextResponse.json(result, { status: 200 })
   ```

   i. **Global error handler w catch (identyczny pattern jak POST)**

   ```typescript
   catch (error) {
     // ========================================================================
     // 5. GLOBAL ERROR HANDLER
     // ========================================================================
     console.error('[GET /api/recipes] Unexpected error:', error)

     return NextResponse.json(
       {
         error: 'Internal Server Error',
         message: 'An unexpected error occurred',
       },
       { status: 500 }
     )
   }
   ```

   **Pełna implementacja GET handlera:**

   ```typescript
   /**
    * GET /api/recipes
    *
    * Lists recipes with optional filtering, search, and pagination.
    * Returns recipes from the authenticated user's household.
    *
    * Headers:
    * - Authorization: Bearer <token>
    *
    * Query Parameters:
    * - search?: string (max 200 chars) - Full-text search across title/ingredients
    * - mealType?: 'breakfast' | 'lunch' | 'dinner'
    * - creationMethod?: 'manual' | 'ai_generated' | 'ai_generated_modified'
    * - page?: number (min 1, default 1)
    * - pageSize?: number (min 1, max 100, default 20)
    * - sort?: string (default '-createdAt')
    *
    * Response:
    * - 200 OK: Returns RecipesListResponse with data and pagination
    * - 400 Bad Request: Invalid query parameters
    * - 401 Unauthorized: Missing or invalid authentication
    * - 500 Internal Server Error: Unexpected server error
    *
    * @see src/lib/api-auth.ts - authentication helper
    */
   export async function GET(
     request: NextRequest
   ): Promise<
     NextResponse<RecipesListResponse | { error: string; message?: string; details?: unknown }>
   > {
     try {
       // ========================================================================
       // 1. AUTHENTICATION
       // ========================================================================

       const { user, supabase, errorResponse } = await authenticateRequest(request)
       if (errorResponse) return errorResponse

       // ========================================================================
       // 2. PARSE & VALIDATE QUERY PARAMETERS
       // ========================================================================

       const { searchParams } = new URL(request.url)
       const rawQuery = {
         search: searchParams.get('search') || undefined,
         mealType: searchParams.get('mealType') || undefined,
         creationMethod: searchParams.get('creationMethod') || undefined,
         page: searchParams.get('page') || undefined,
         pageSize: searchParams.get('pageSize') || undefined,
         sort: searchParams.get('sort') || undefined,
       }

       // Validate with Zod schema
       const validationResult = ListRecipesQuerySchema.safeParse(rawQuery)

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

       const validatedQuery = validationResult.data

       // ========================================================================
       // 3. TRANSFORM TO SERVICE FILTERS
       // ========================================================================

       const { field, direction } = parseSortParam(validatedQuery.sort)

       const filters: RecipeFilters = {
         search: validatedQuery.search,
         mealType: validatedQuery.mealType,
         creationMethod: validatedQuery.creationMethod,
         page: validatedQuery.page,
         pageSize: validatedQuery.pageSize,
         sortField: field,
         sortDirection: direction,
       }

       // ========================================================================
       // 4. BUSINESS LOGIC - LIST RECIPES
       // ========================================================================

       const recipeService = new RecipeService(supabase)
       const result = await recipeService.listRecipes(user.id, filters)

       // ========================================================================
       // 5. SUCCESS RESPONSE
       // ========================================================================

       return NextResponse.json(result, { status: 200 })
     } catch (error) {
       // ========================================================================
       // 6. GLOBAL ERROR HANDLER
       // ========================================================================

       console.error('[GET /api/recipes] Unexpected error:', error)

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

### Faza 4: Dokumentacja i komentarze

7. **Dodać JSDoc do metody listRecipes**

   ```typescript
   /**
    * Lists recipes for a user's household with filtering and pagination
    *
    * @param userId - The authenticated user's ID
    * @param filters - Filter, sort, and pagination options
    * @returns Paginated list of recipes, or null if user has no household
    * @throws Error if database operation fails
    */
   ```

8. **Dodać JSDoc do handlera GET**
   ```typescript
   /**
    * GET /api/recipes
    *
    * Lists recipes with optional filtering, search, and pagination.
    * Requires authentication.
    *
    * Query Parameters:
    * - search?: string - Full-text search across title/ingredients
    * - mealType?: 'breakfast' | 'lunch' | 'dinner'
    * - creationMethod?: 'manual' | 'ai_generated' | 'ai_generated_modified'
    * - page?: number (default 1)
    * - pageSize?: number (default 20, max 100)
    * - sort?: string (default '-createdAt')
    *
    * Response:
    * - 200 OK: Returns RecipesListResponse with data and pagination
    * - 400 Bad Request: Invalid query parameters
    * - 401 Unauthorized: Missing or invalid authentication
    * - 404 Not Found: User is not a member of any household
    * - 500 Internal Server Error: Unexpected error
    */
   ```

### Faza 5: Testowanie (manual testing checklist)

**Setup testowania:**

- Użyj narzędzia REST client (np. Postman, Insomnia, Thunder Client w VS Code)
- Uzyskaj Bearer token przez wywołanie POST /api/auth/login
- Dodaj kilka przepisów przez POST /api/recipes dla różnorodnych testów

9. **Testy podstawowe:**
   - [ ] GET `/api/recipes` bez parametrów zwraca default pagination (page=1, pageSize=20)
   - [ ] GET bez tokenu zwraca 401
   - [ ] GET z nieprawidłowym tokenem zwraca 401
   - [ ] ~~GET dla użytkownika bez household zwraca 404~~ (SKIP: obecnie używamy DEFAULT_HOUSEHOLD_ID)
   - [ ] GET zwraca puste `data: []` gdy brak przepisów w household

10. **Testy walidacji:**
    - [ ] pageSize > 100 zwraca 400
    - [ ] page = 0 zwraca 400
    - [ ] nieprawidłowy mealType zwraca 400
    - [ ] nieprawidłowy creationMethod zwraca 400
    - [ ] nieprawidłowy sort zwraca 400
    - [ ] search > 200 znaków zwraca 400

11. **Testy funkcjonalności:**
    - [ ] search po tytule działa
    - [ ] search po składnikach działa
    - [ ] filtrowanie po mealType działa
    - [ ] filtrowanie po creationMethod działa
    - [ ] sortowanie rosnące (createdAt) działa
    - [ ] sortowanie malejące (-createdAt) działa
    - [ ] sortowanie po title działa
    - [ ] paginacja zwraca poprawne total
    - [ ] paginacja zwraca poprawne page i pageSize
    - [ ] page 2 zwraca inne wyniki niż page 1

12. **Testy wydajności:**
    - [ ] GET z 1000 przepisów < 500ms
    - [ ] GET z search query < 500ms
    - [ ] GET z multiple filters < 500ms

**Przykładowe curl commands do testowania:**

```bash
# 1. Basic GET (no filters)
curl -X GET "http://localhost:3000/api/recipes" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Search query
curl -X GET "http://localhost:3000/api/recipes?search=chicken" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Filter by mealType
curl -X GET "http://localhost:3000/api/recipes?mealType=dinner" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Multiple filters + pagination
curl -X GET "http://localhost:3000/api/recipes?mealType=dinner&creationMethod=manual&page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Sort ascending by title
curl -X GET "http://localhost:3000/api/recipes?sort=title" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. Sort descending by createdAt (default)
curl -X GET "http://localhost:3000/api/recipes?sort=-createdAt" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 7. Combined: search + filter + sort + pagination
curl -X GET "http://localhost:3000/api/recipes?search=rice&mealType=dinner&sort=-createdAt&page=2&pageSize=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 8. Invalid pageSize (should return 400)
curl -X GET "http://localhost:3000/api/recipes?pageSize=101" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 9. Invalid mealType (should return 400)
curl -X GET "http://localhost:3000/api/recipes?mealType=snack" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 10. No auth token (should return 401)
curl -X GET "http://localhost:3000/api/recipes"
```

### Faza 6: Integracja z frontendem (future)

13. **Utworzyć API client function** (np. `src/lib/api/recipes.ts`):

    ```typescript
    export async function fetchRecipes(
      token: string,
      filters?: Partial<ListRecipesQuery>
    ): Promise<RecipesListResponse> {
      const params = new URLSearchParams(
        Object.entries(filters || {}).filter(([_, v]) => v != null)
      )

      const response = await fetch(`/api/recipes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recipes')
      }

      return response.json()
    }
    ```

14. **Utworzyć React hook** (np. `src/hooks/useRecipes.ts`):
    ```typescript
    export function useRecipes(filters?: Partial<ListRecipesQuery>) {
      // Implementation using React Query or SWR
    }
    ```

---

## Podsumowanie zmian

### Nowe pliki:

Brak (wszystkie zmiany w istniejących plikach)

### Zmodyfikowane pliki:

1. `src/lib/validation/recipes.ts` - dodać ListRecipesQuerySchema, parseSortParam() i typy
2. `src/lib/services/recipe.service.ts` - dodać metodę listRecipes()
3. `src/app/api/recipes/route.ts` - dodać export async function GET()

### Wykorzystane istniejące elementy:

- **RecipeService.getUserHouseholdId()** - już zaimplementowana, z DEFAULT_HOUSEHOLD_ID fallback
- **RecipeService.mapDbRecipeToDto()** - prywatna metoda do transformacji DB → DTO
- **RecipeContent interface** - struktura JSONB w bazie danych
- **authenticateRequest()** - helper do auth z Bearer token
- **CreateRecipeSchema pattern** - wzór walidacji Zod już ustalony
- **Error handling pattern** - z POST endpoint (consistent response format)

### Zależności:

- Wszystkie potrzebne zależności już zainstalowane (Zod, Supabase, Next.js)
- Żadnych nowych zewnętrznych bibliotek nie potrzeba

### Szacowany czas implementacji:

**Poziom trudności:** Średni (wykorzystuje istniejące wzorce)

- **Faza 1**: 45-60 minut (Zod schemas + parseSortParam)
- **Faza 2**: 60-90 minut (listRecipes w RecipeService)
- **Faza 3**: 45-60 minut (GET handler w route.ts)
- **Faza 4**: 15-30 minut (JSDoc + komentarze)
- **Faza 5**: 30-45 minut (manual testing)

**Łącznie**: ~3-4.5 godziny (dla developera z doświadczeniem w Angular/TypeScript)

**Tips dla szybszej implementacji:**

- Skopiuj strukturę POST handlera jako template dla GET
- Wykorzystaj istniejące metody RecipeService (getUserHouseholdId, mapDbRecipeToDto)
- Testuj inkrementalnie - najpierw podstawowe GET, potem dodawaj filtry jeden po drugim

---

## Dodatki

### Przydatne zasoby:

- [Supabase Query Operators](https://supabase.com/docs/reference/javascript/filter)
- [Zod Documentation](https://zod.dev/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [PostgreSQL JSONB Indexing](https://www.postgresql.org/docs/current/datatype-json.html)

### Common Pitfalls & Troubleshooting:

**Problem 1: Query parameters nie są walidowane poprawnie**

- Symptom: Wszystkie parametry przychodzą jako `string` lub `null`
- Rozwiązanie: Użyj `.transform()` w Zod schema do konwersji string → number

**Problem 2: Search nie działa dla ingredients**

- Symptom: Search znajduje tylko tytuły, nie składniki
- Rozwiązanie: Upewnij się że używasz `content::text.ilike` dla pełnego JSONB search

**Problem 3: Sortowanie po title nie działa**

- Symptom: Błąd sortowania lub błędna kolejność
- Rozwiązanie: Title jest w JSONB, użyj `order('content->title')` zamiast bezpośredniej kolumny

**Problem 4: Count jest zawsze null**

- Symptom: `pagination.total` zawsze 0
- Rozwiązanie: Upewnij się że używasz `.select('*', { count: 'exact' })`

**Problem 5: RLS policy blokuje zapytania**

- Symptom: Zwracane są puste wyniki mimo że przepisy istnieją
- Rozwiązanie: Sprawdź czy RLS policy jest poprawnie skonfigurowane dla `auth.uid()`

**Problem 6: TypeScript errors z RecipeFilters**

- Symptom: TS nie rozpoznaje typu RecipeFilters
- Rozwiązanie: Upewnij się że eksportujesz interface RecipeFilters z recipes.ts

### Future improvements:

1. Cursor-based pagination dla lepszej wydajności (offset-based ma problemy z dużymi zbiorami)
2. Response caching z Redis (cache popular queries)
3. Elasticsearch dla zaawansowanego full-text search (ranking, fuzzy matching)
4. Agregacje (np. count per mealType) - dodatkowy endpoint /api/recipes/stats
5. Saved filters/searches (user preferences)
6. Export do CSV/PDF (generowanie raportów)
7. Debounce dla search queries (frontend optimization)
8. Faceted search (multiple filters with counts)

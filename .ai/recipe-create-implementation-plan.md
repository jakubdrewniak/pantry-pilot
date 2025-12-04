# API Endpoint Implementation Plan: Create Manual Recipe

## 1. Przegląd punktu końcowego

**Endpoint**: POST `/api/recipes`

**Cel**: Utworzenie nowego przepisu ręcznie przez użytkownika. Endpoint ten umożliwia zapisanie przepisu zawierającego tytuł, listę składników, instrukcje oraz opcjonalne informacje o czasie przygotowania, gotowania i typie posiłku. Przepis jest przypisywany do household użytkownika i oznaczany jako utworzony manualnie (`creation_method: 'manual'`).

**Kontekst biznesowy**:

- Użytkownik może tworzyć własne przepisy obok tych generowanych przez AI
- Przepisy są współdzielone z innymi członkami household
- Przepisy mogą być później wykorzystane do generowania list zakupów

## 2. Szczegóły żądania

### HTTP Method

- **POST**

### Struktura URL

```
POST /api/recipes
```

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Parametry

#### Wymagane (Request Body):

- **title** (string): Tytuł przepisu
  - Długość: 3-100 znaków
  - Przykład: `"Fried Rice"`

- **ingredients** (array): Tablica składników
  - Minimum: 1 element
  - Struktura pojedynczego składnika:
    - `name` (string, wymagane): Nazwa składnika
    - `quantity` (number, wymagane): Ilość
    - `unit` (string, opcjonalne): Jednostka miary
  - Przykład:
    ```json
    [
      { "name": "Rice", "quantity": 2, "unit": "cup" },
      { "name": "Eggs", "quantity": 2 }
    ]
    ```

- **instructions** (string): Instrukcje przygotowania
  - Minimum: 1 znak
  - Może zawierać Markdown
  - Przykład: `"1. Cook rice\n2. Fry eggs\n3. Mix together"`

#### Opcjonalne (Request Body):

- **prepTime** (number): Czas przygotowania w minutach
  - Warunek: >= 0
  - Przykład: `10`

- **cookTime** (number): Czas gotowania w minutach
  - Warunek: >= 0
  - Przykład: `20`

- **mealType** (string): Typ posiłku
  - Wartości: `'breakfast'`, `'lunch'`, `'dinner'`
  - Przykład: `"dinner"`

### Przykładowe żądanie

```json
POST /api/recipes
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "title": "Classic Fried Rice",
  "ingredients": [
    { "name": "Rice", "quantity": 2, "unit": "cup" },
    { "name": "Eggs", "quantity": 2 },
    { "name": "Soy sauce", "quantity": 2, "unit": "tbsp" },
    { "name": "Vegetables", "quantity": 1, "unit": "cup" }
  ],
  "instructions": "1. Cook rice and let it cool\n2. Beat eggs and scramble in pan\n3. Add rice and vegetables\n4. Season with soy sauce\n5. Stir-fry for 5 minutes",
  "prepTime": 10,
  "cookTime": 15,
  "mealType": "dinner"
}
```

## 3. Wykorzystywane typy

### Request Types

```typescript
// z src/types/types.ts
interface CreateRecipeRequest {
  title: string
  ingredients: Ingredient[]
  instructions: string
  prepTime?: number
  cookTime?: number
  mealType?: string
}

interface Ingredient {
  name: string
  quantity: number
  unit?: string
}
```

### Response Types

```typescript
// z src/types/types.ts
type CreateRecipeResponse = Recipe

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

type RecipeCreationMethod = 'manual' | 'ai_generated' | 'ai_generated_modified'
```

### Database Types

```typescript
// Struktura JSONB w kolumnie recipes.content
interface RecipeContent {
  title: string
  ingredients: Array<{
    name: string
    quantity: number
    unit?: string
  }>
  instructions: string
  meal_type?: string
  creation_method: 'manual' | 'ai_generated' | 'ai_generated_modified'
  prep_time?: number
  cook_time?: number
}
```

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

**Status Code**: 201 Created

**Headers**:

```
Content-Type: application/json
Location: /api/recipes/{recipeId}
```

**Body**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Classic Fried Rice",
  "ingredients": [
    { "name": "Rice", "quantity": 2, "unit": "cup" },
    { "name": "Eggs", "quantity": 2 },
    { "name": "Soy sauce", "quantity": 2, "unit": "tbsp" },
    { "name": "Vegetables", "quantity": 1, "unit": "cup" }
  ],
  "instructions": "1. Cook rice and let it cool\n2. Beat eggs and scramble in pan\n3. Add rice and vegetables\n4. Season with soy sauce\n5. Stir-fry for 5 minutes",
  "mealType": "dinner",
  "creationMethod": "manual",
  "prepTime": 10,
  "cookTime": 15,
  "createdAt": "2025-12-01T14:30:00Z",
  "updatedAt": "2025-12-01T14:30:00Z",
  "householdId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

### Błędy

#### 400 Bad Request

**Przyczyny**:

- Brak wymaganych pól
- Title poza zakresem 3-100 znaków
- Brak składników lub pusta tablica
- Składnik bez nazwy lub quantity
- Ujemne wartości prepTime lub cookTime
- Nieprawidłowy format JSON
- Nieprawidłowy mealType

**Przykładowa odpowiedź**:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title must be between 3 and 100 characters"
    }
  ]
}
```

#### 401 Unauthorized

**Przyczyny**:

- Brak tokena JWT
- Token wygasły
- Token nieprawidłowy

**Przykładowa odpowiedź**:

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 404 Not Found

**Przyczyny**:

- Użytkownik nie należy do żadnego household

**Przykładowa odpowiedź**:

```json
{
  "error": "Not Found",
  "message": "User is not a member of any household"
}
```

#### 500 Internal Server Error

**Przyczyny**:

- Błąd bazy danych
- Nieoczekiwany błąd serwera

**Przykładowa odpowiedź**:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Przepływ danych

### Diagram przepływu

```
1. Client
   ↓ POST /api/recipes + JWT token
2. Next.js API Route (/api/recipes/route.ts)
   ↓ Walidacja JWT token
3. Middleware / Auth Helper
   ↓ Pobranie user.id z tokena
4. Validation Layer (Zod)
   ↓ Walidacja request body
5. Service Layer (RecipeService)
   ↓ Pobranie household_id dla użytkownika
6. Database Query (user_households)
   ↓ Jeśli brak household → 404
7. Service Layer
   ↓ Transformacja danych do JSONB + dodanie creation_method: 'manual'
8. Database Insert (recipes)
   ↓ INSERT INTO recipes
9. Database Response
   ↓ Zwrócenie nowego rekordu
10. Service Layer
    ↓ Transformacja JSONB → Recipe DTO
11. API Route
    ↓ 201 Created + Location header
12. Client
```

### Szczegółowy przepływ

#### Krok 1: Uwierzytelnianie

```typescript
// Pobierz JWT token z nagłówka Authorization
const token = request.headers.get('Authorization')?.replace('Bearer ', '')
if (!token) return 401

// Weryfikuj token i pobierz użytkownika
const {
  data: { user },
  error,
} = await supabase.auth.getUser(token)
if (error || !user) return 401
```

#### Krok 2: Walidacja danych wejściowych

```typescript
// Użyj Zod do walidacji request body
const CreateRecipeSchema = z.object({
  title: z.string().min(3).max(100),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.number().positive(),
        unit: z.string().optional(),
      })
    )
    .min(1),
  instructions: z.string().min(1),
  prepTime: z.number().min(0).optional(),
  cookTime: z.number().min(0).optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner']).optional(),
})

const validatedData = CreateRecipeSchema.parse(requestBody)
```

#### Krok 3: Pobranie household_id

```typescript
// Zapytanie do user_households
const { data: membership, error } = await supabase
  .from('user_households')
  .select('household_id')
  .eq('user_id', user.id)
  .single()

if (error || !membership) return 404
```

#### Krok 4: Przygotowanie danych do zapisu

```typescript
// Transformacja do formatu JSONB
const recipeContent = {
  title: validatedData.title,
  ingredients: validatedData.ingredients,
  instructions: validatedData.instructions,
  creation_method: 'manual',
  ...(validatedData.prepTime && { prep_time: validatedData.prepTime }),
  ...(validatedData.cookTime && { cook_time: validatedData.cookTime }),
  ...(validatedData.mealType && { meal_type: validatedData.mealType }),
}
```

#### Krok 5: Zapis do bazy danych

```typescript
const { data: recipe, error } = await supabase
  .from('recipes')
  .insert({
    household_id: membership.household_id,
    content: recipeContent,
  })
  .select()
  .single()

if (error) return 500
```

#### Krok 6: Transformacja odpowiedzi

```typescript
// Konwersja z formatu DB (JSONB) do DTO
const response: Recipe = {
  id: recipe.id,
  title: recipe.content.title,
  ingredients: recipe.content.ingredients,
  instructions: recipe.content.instructions,
  creationMethod: recipe.content.creation_method,
  prepTime: recipe.content.prep_time,
  cookTime: recipe.content.cook_time,
  mealType: recipe.content.meal_type,
  createdAt: recipe.created_at,
  updatedAt: recipe.updated_at,
  householdId: recipe.household_id,
}

return Response.json(response, {
  status: 201,
  headers: { Location: `/api/recipes/${recipe.id}` },
})
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie

- **JWT Token**: Wszystkie requesty muszą zawierać prawidłowy token JWT w nagłówku `Authorization: Bearer <token>`
- **Token Verification**: Token jest weryfikowany przez Supabase Auth SDK
- **Expired Tokens**: Wygasłe tokeny są odrzucane z kodem 401

### Autoryzacja

- **Membership Check**: System weryfikuje, czy użytkownik należy do jakiegokolwiek household
- **RLS Policies**: Row Level Security w Supabase zapewnia, że użytkownik może tworzyć przepisy tylko dla swojego household
- **Implicit Access**: Użytkownik automatycznie otrzymuje dostęp do utworzonego przepisu poprzez swoją przynależność do household

### Walidacja danych wejściowych

- **Zod Schema**: Wszystkie dane wejściowe są walidowane przed przetworzeniem
- **SQL Injection Prevention**: Supabase SDK używa parametryzowanych zapytań
- **XSS Prevention**:
  - Title i ingredient names są sanityzowane
  - Instructions mogą zawierać Markdown, ale będą renderowane bezpiecznie w komponencie UI
- **Type Safety**: TypeScript zapewnia bezpieczeństwo typów na poziomie kompilacji

### Rate Limiting

- **Middleware**: Implementacja rate limiting na poziomie API middleware
- **Limit**: 100 requestów na minutę per IP address
- **Response**: 429 Too Many Requests po przekroczeniu limitu

### Data Privacy

- **Household Isolation**: RLS policies zapewniają, że przepisy są widoczne tylko dla członków danego household
- **No Data Leakage**: Błędy 404 zamiast 403 dla zasobów spoza household użytkownika (zapobiega ujawnianiu istnienia zasobów)

### CORS

- **Configuration**: Skonfiguruj CORS w Next.js API routes
- **Allowed Origins**: Tylko dozwolone domeny mogą wywoływać API

## 7. Obsługa błędów

### Hierarchia obsługi błędów

```
try {
  1. Uwierzytelnianie → 401
  2. Walidacja danych → 400
  3. Autoryzacja (household membership) → 404
  4. Business logic → 400
  5. Database operations → 500
} catch (error) {
  → Error handler middleware
}
```

### Szczegółowe scenariusze błędów

#### 1. Błędy uwierzytelniania (401)

**Scenariusz A: Brak tokena**

```typescript
if (!token) {
  return Response.json(
    { error: 'Unauthorized', message: 'Authentication token is required' },
    { status: 401 }
  )
}
```

**Scenariusz B: Nieprawidłowy token**

```typescript
const {
  data: { user },
  error,
} = await supabase.auth.getUser(token)
if (error) {
  return Response.json(
    { error: 'Unauthorized', message: 'Invalid or expired token' },
    { status: 401 }
  )
}
```

#### 2. Błędy walidacji (400)

**Scenariusz A: Zod validation error**

```typescript
try {
  const validatedData = CreateRecipeSchema.parse(requestBody)
} catch (error) {
  if (error instanceof z.ZodError) {
    return Response.json(
      {
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
      { status: 400 }
    )
  }
}
```

**Przykładowe błędy walidacji**:

- Title < 3 znaków: `"Title must be between 3 and 100 characters"`
- Title > 100 znaków: `"Title must be between 3 and 100 characters"`
- Brak składników: `"Array must contain at least 1 element(s)"`
- Składnik bez nazwy: `"Required"`
- Ujemny prepTime: `"Number must be greater than or equal to 0"`
- Nieprawidłowy mealType: `"Invalid enum value. Expected 'breakfast' | 'lunch' | 'dinner'"`

**Scenariusz B: Nieprawidłowy JSON**

```typescript
try {
  const body = await request.json()
} catch (error) {
  return Response.json({ error: 'Bad Request', message: 'Invalid JSON format' }, { status: 400 })
}
```

#### 3. Błędy autoryzacji (404)

**Scenariusz: Użytkownik nie należy do household**

```typescript
const { data: membership, error } = await supabase
  .from('user_households')
  .select('household_id')
  .eq('user_id', user.id)
  .single()

if (error || !membership) {
  return Response.json(
    { error: 'Not Found', message: 'User is not a member of any household' },
    { status: 404 }
  )
}
```

**Uwaga**: Używamy 404 zamiast 403, aby nie ujawniać informacji o istnieniu zasobów.

#### 4. Błędy bazy danych (500)

**Scenariusz A: Błąd INSERT**

```typescript
const { data: recipe, error } = await supabase
  .from('recipes')
  .insert({ ... })
  .select()
  .single()

if (error) {
  console.error('Database error:', error)
  return Response.json(
    { error: 'Internal Server Error', message: 'Failed to create recipe' },
    { status: 500 }
  )
}
```

**Scenariusz B: CHECK constraint violation**

```typescript
// DB rzuca błąd jeśli prep_time lub cook_time < 0
// Powinna być już złapana przez Zod, ale jako backup:
if (error?.code === '23514') {
  // CHECK constraint violation
  return Response.json(
    { error: 'Bad Request', message: 'Time values must be non-negative' },
    { status: 400 }
  )
}
```

#### 5. Nieoczekiwane błędy (500)

**Global error handler**:

```typescript
try {
  // ... cała logika endpointa
} catch (error) {
  console.error('Unexpected error in POST /api/recipes:', error)
  return Response.json(
    { error: 'Internal Server Error', message: 'An unexpected error occurred' },
    { status: 500 }
  )
}
```

### Logging strategia

```typescript
// Loguj wszystkie błędy dla debugowania
if (error) {
  console.error('[POST /api/recipes]', {
    userId: user?.id,
    error: error,
    timestamp: new Date().toISOString(),
    requestBody: sanitizedRequestBody, // bez wrażliwych danych
  })
}
```

### Format odpowiedzi błędów

Wszystkie błędy zwracają spójny format:

```typescript
{
  error: string,        // Krótki opis typu błędu
  message: string,      // Szczegółowy komunikat dla użytkownika
  details?: Array<{     // Opcjonalne szczegóły (głównie dla walidacji)
    field: string,
    message: string
  }>
}
```

## 8. Etapy wdrożenia

### Faza 1: Struktura i konfiguracja

#### Krok 1.1: Utworzenie struktury plików

```bash
src/
├── app/
│   └── api/
│       └── recipes/
│           └── route.ts          # POST endpoint
├── lib/
│   ├── services/
│   │   └── recipe.service.ts     # Business logic
│   └── validators/
│       └── recipe.validators.ts  # Zod schemas
├── db/
│   ├── supabase.client.ts        # Już istnieje
│   └── database.types.ts         # Już istnieje
└── types/
    └── types.ts                   # Już istnieje
```

#### Krok 1.2: Konfiguracja środowiska

- Weryfikacja zmiennych środowiskowych:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (jeśli potrzebne)

### Faza 2: Walidacja (Zod schemas)

#### Krok 2.1: Utworzenie `recipe.validators.ts`

```typescript
// src/lib/validators/recipe.validators.ts
import { z } from 'zod'

export const IngredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().optional(),
})

export const CreateRecipeSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  ingredients: z.array(IngredientSchema).min(1, 'At least one ingredient is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  prepTime: z.number().min(0, 'Prep time must be non-negative').optional(),
  cookTime: z.number().min(0, 'Cook time must be non-negative').optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner']).optional(),
})

export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>
```

**Testy jednostkowe dla walidacji**:

```typescript
// src/lib/validators/recipe.validators.test.ts
describe('CreateRecipeSchema', () => {
  it('should validate correct input', () => {
    const valid = {
      title: 'Test Recipe',
      ingredients: [{ name: 'Rice', quantity: 2, unit: 'cup' }],
      instructions: 'Cook it'
    }
    expect(() => CreateRecipeSchema.parse(valid)).not.toThrow()
  })

  it('should reject title < 3 chars', () => {
    const invalid = { title: 'Ab', ingredients: [...], instructions: '...' }
    expect(() => CreateRecipeSchema.parse(invalid)).toThrow()
  })

  // ... więcej testów
})
```

### Faza 3: Service Layer

#### Krok 3.1: Utworzenie `recipe.service.ts`

```typescript
// src/lib/services/recipe.service.ts
import type { SupabaseClient } from '@/db/supabase.client'
import type { CreateRecipeInput } from '@/lib/validators/recipe.validators'
import type { Recipe } from '@/types/types'

export class RecipeService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Pobiera household_id dla użytkownika
   */
  async getUserHouseholdId(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('user_households')
      .select('household_id')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return data.household_id
  }

  /**
   * Tworzy nowy przepis manualny
   */
  async createManualRecipe(userId: string, input: CreateRecipeInput): Promise<Recipe> {
    // 1. Pobierz household_id
    const householdId = await this.getUserHouseholdId(userId)
    if (!householdId) {
      throw new Error('User is not a member of any household')
    }

    // 2. Przygotuj dane do zapisu (transformacja do JSONB)
    const recipeContent = {
      title: input.title,
      ingredients: input.ingredients,
      instructions: input.instructions,
      creation_method: 'manual' as const,
      ...(input.prepTime !== undefined && { prep_time: input.prepTime }),
      ...(input.cookTime !== undefined && { cook_time: input.cookTime }),
      ...(input.mealType !== undefined && { meal_type: input.mealType }),
    }

    // 3. Zapisz do bazy
    const { data, error } = await this.supabase
      .from('recipes')
      .insert({
        household_id: householdId,
        content: recipeContent,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error creating recipe:', error)
      throw new Error('Failed to create recipe')
    }

    // 4. Transformuj odpowiedź z JSONB do DTO
    return this.mapDbRecipeToDto(data)
  }

  /**
   * Mapuje rekord z bazy danych do DTO Recipe
   */
  private mapDbRecipeToDto(dbRecipe: any): Recipe {
    return {
      id: dbRecipe.id,
      title: dbRecipe.content.title,
      ingredients: dbRecipe.content.ingredients,
      instructions: dbRecipe.content.instructions,
      creationMethod: dbRecipe.content.creation_method,
      prepTime: dbRecipe.content.prep_time,
      cookTime: dbRecipe.content.cook_time,
      mealType: dbRecipe.content.meal_type,
      createdAt: dbRecipe.created_at,
      updatedAt: dbRecipe.updated_at,
      householdId: dbRecipe.household_id,
    }
  }
}
```

**Testy jednostkowe dla service**:

```typescript
// src/lib/services/recipe.service.test.ts
describe('RecipeService', () => {
  let service: RecipeService
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    service = new RecipeService(mockSupabase)
  })

  it('should create recipe successfully', async () => {
    // Mock household query
    mockSupabase.from('user_households').select().single.mockResolvedValue({
      data: { household_id: 'household-123' },
      error: null
    })

    // Mock recipe insert
    mockSupabase.from('recipes').insert().select().single.mockResolvedValue({
      data: { id: 'recipe-123', content: {...}, ... },
      error: null
    })

    const input = { title: 'Test', ingredients: [...], instructions: '...' }
    const result = await service.createManualRecipe('user-123', input)

    expect(result.id).toBe('recipe-123')
    expect(result.creationMethod).toBe('manual')
  })

  it('should throw error when user has no household', async () => {
    mockSupabase.from('user_households').select().single.mockResolvedValue({
      data: null,
      error: { message: 'Not found' }
    })

    await expect(
      service.createManualRecipe('user-123', input)
    ).rejects.toThrow('User is not a member of any household')
  })

  // ... więcej testów
})
```

### Faza 4: API Route Handler

#### Krok 4.1: Utworzenie `app/api/recipes/route.ts`

```typescript
// src/app/api/recipes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/db/supabase.client'
import { RecipeService } from '@/lib/services/recipe.service'
import { CreateRecipeSchema } from '@/lib/validators/recipe.validators'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // 1. Uwierzytelnianie
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication token is required' },
        { status: 401 }
      )
    }

    // 2. Weryfikacja tokena i pobranie użytkownika
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // 3. Parsowanie i walidacja request body
    let body: unknown
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid JSON format' },
        { status: 400 }
      )
    }

    // 4. Walidacja danych wejściowych
    let validatedInput
    try {
      validatedInput = CreateRecipeSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        )
      }
      throw error
    }

    // 5. Business logic - utworzenie przepisu
    const recipeService = new RecipeService(supabase)

    try {
      const recipe = await recipeService.createManualRecipe(user.id, validatedInput)

      // 6. Zwróć odpowiedź 201 Created
      return NextResponse.json(recipe, {
        status: 201,
        headers: {
          Location: `/api/recipes/${recipe.id}`,
        },
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'User is not a member of any household') {
        return NextResponse.json({ error: 'Not Found', message: error.message }, { status: 404 })
      }
      throw error
    }
  } catch (error) {
    // 7. Global error handler
    console.error('Unexpected error in POST /api/recipes:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
```

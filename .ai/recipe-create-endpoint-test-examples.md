# POST /api/recipes - Test Examples

Endpoint do tworzenia ręcznych przepisów.

## Status: ✅ Zaimplementowany (Development Ready)

**Uwaga**: Endpoint używa tymczasowego `DEFAULT_HOUSEHOLD_ID` dla development. Po zaimplementowaniu households będzie walidować przynależność użytkownika.

---

## Przykładowe żądania

### 1. Minimalny przepis (tylko wymagane pola)

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Quick Scrambled Eggs",
    "ingredients": [
      { "name": "Eggs", "quantity": 2 },
      { "name": "Butter", "quantity": 10, "unit": "g" }
    ],
    "instructions": "1. Heat butter in pan\n2. Add beaten eggs\n3. Stir until cooked"
  }'
```

**Oczekiwana odpowiedź: 201 Created**

```json
{
  "id": "uuid-here",
  "title": "Quick Scrambled Eggs",
  "ingredients": [
    { "name": "Eggs", "quantity": 2 },
    { "name": "Butter", "quantity": 10, "unit": "g" }
  ],
  "instructions": "1. Heat butter in pan\n2. Add beaten eggs\n3. Stir until cooked",
  "creationMethod": "manual",
  "createdAt": "2025-12-01T10:30:00Z",
  "updatedAt": "2025-12-01T10:30:00Z",
  "householdId": "00000000-0000-0000-0000-000000000001"
}
```

---

### 2. Pełny przepis (wszystkie pola)

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
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
  }'
```

**Oczekiwana odpowiedź: 201 Created + Location header**

```
Location: /api/recipes/{recipe-id}
```

---

### 3. Przepis śniadaniowy

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Oatmeal with Berries",
    "ingredients": [
      { "name": "Oats", "quantity": 50, "unit": "g" },
      { "name": "Milk", "quantity": 200, "unit": "ml" },
      { "name": "Blueberries", "quantity": 50, "unit": "g" },
      { "name": "Honey", "quantity": 1, "unit": "tbsp" }
    ],
    "instructions": "1. Boil milk\n2. Add oats and cook for 5 minutes\n3. Top with berries and honey",
    "prepTime": 2,
    "cookTime": 5,
    "mealType": "breakfast"
  }'
```

---

## Przypadki błędów

### Błąd 400: Brak wymaganych pól

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Ab",
    "ingredients": [],
    "instructions": ""
  }'
```

**Odpowiedź: 400 Bad Request**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title must be at least 3 characters"
    },
    {
      "field": "ingredients",
      "message": "At least one ingredient is required"
    },
    {
      "field": "instructions",
      "message": "Instructions are required"
    }
  ]
}
```

---

### Błąd 400: Nieprawidłowy mealType

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Recipe",
    "ingredients": [{ "name": "Test", "quantity": 1 }],
    "instructions": "Test instructions",
    "mealType": "snack"
  }'
```

**Odpowiedź: 400 Bad Request**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "mealType",
      "message": "Meal type must be 'breakfast', 'lunch', or 'dinner'"
    }
  ]
}
```

---

### Błąd 400: Ujemne wartości czasu

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Recipe",
    "ingredients": [{ "name": "Test", "quantity": 1 }],
    "instructions": "Test instructions",
    "prepTime": -5
  }'
```

**Odpowiedź: 400 Bad Request**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "prepTime",
      "message": "Prep time must be non-negative"
    }
  ]
}
```

---

### Błąd 400: Nieprawidłowy JSON

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d 'not-valid-json'
```

**Odpowiedź: 400 Bad Request**

```json
{
  "error": "Bad Request",
  "message": "Invalid JSON format"
}
```

---

### Błąd 401: Brak tokena

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Recipe",
    "ingredients": [{ "name": "Test", "quantity": 1 }],
    "instructions": "Test instructions"
  }'
```

**Odpowiedź: 401 Unauthorized**

```json
{
  "error": "Unauthorized",
  "message": "Authentication token is required"
}
```

---

### Błąd 401: Nieprawidłowy token

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token-12345" \
  -d '{
    "title": "Test Recipe",
    "ingredients": [{ "name": "Test", "quantity": 1 }],
    "instructions": "Test instructions"
  }'
```

**Odpowiedź: 401 Unauthorized**

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

---

## Jak uzyskać JWT token dla testów?

### Opcja 1: Zaloguj się przez UI

1. Uruchom aplikację: `npm run dev`
2. Zaloguj się przez UI (http://localhost:3000/auth/login)
3. Otwórz DevTools → Application → Cookies/Local Storage
4. Znajdź token Supabase

### Opcja 2: API login endpoint

```bash
# Jeśli istnieje endpoint logowania
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'
```

### Opcja 3: Supabase Dashboard

1. Wejdź na https://app.supabase.com
2. Wybierz projekt
3. Authentication → Users
4. Wygeneruj token dla użytkownika testowego

---

## Checklist testowania

- [ ] **Happy path**: Utworzenie przepisu z wszystkimi polami
- [ ] **Minimal**: Utworzenie przepisu tylko z wymaganymi polami
- [ ] **Validation**: Sprawdzenie wszystkich walidacji (title, ingredients, times, mealType)
- [ ] **Auth**: Sprawdzenie braku tokena i nieprawidłowego tokena
- [ ] **JSON**: Sprawdzenie nieprawidłowego formatu JSON
- [ ] **Location header**: Weryfikacja czy header Location jest zwracany
- [ ] **Database**: Sprawdzenie czy przepis jest zapisany w bazie danych
- [ ] **Response structure**: Weryfikacja struktury odpowiedzi (wszystkie pola obecne)

---

## Struktura bazy danych

### Tabela: `recipes`

```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id),
  content JSONB NOT NULL,
  creation_method recipe_creation_method DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Struktura JSONB w `content`:

```json
{
  "title": "string",
  "ingredients": [
    { "name": "string", "quantity": number, "unit": "string?" }
  ],
  "instructions": "string",
  "meal_type": "breakfast | lunch | dinner",
  "prep_time": number,
  "cook_time": number
}
```

---

## Następne kroki po testach

1. **Implementacja households** - usunięcie `DEFAULT_HOUSEHOLD_ID` workaround
2. **GET /api/recipes** - listowanie przepisów
3. **GET /api/recipes/:id** - pobieranie pojedynczego przepisu
4. **PUT/PATCH /api/recipes/:id** - aktualizacja przepisu
5. **DELETE /api/recipes/:id** - usuwanie przepisu
6. **Testy jednostkowe** - RecipeService
7. **Testy integracyjne** - API endpoint (Playwright/Vitest)

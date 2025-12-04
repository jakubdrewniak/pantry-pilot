# Testing Guide: GET /api/recipes

## 🎯 Cel testowania

Weryfikacja poprawnego działania endpointu GET /api/recipes z:

- Uwierzytelnieniem
- Filtrowaniem (search, mealType, creationMethod)
- Sortowaniem (różne pola, kierunki)
- Paginacją (page, pageSize)
- Walidacją parametrów

---

## 📋 Przygotowanie

### 1. Uruchom serwer dev

```bash
npm run dev
```

### 2. Uzyskaj Bearer token

**Opcja A: Przez API**

```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "twoj@email.com",
    "password": "twojehaslo"
  }'
```

Skopiuj wartość `token` z odpowiedzi.

**Opcja B: Przez Postman/Insomnia**

- POST `/api/auth/login`
- Body: `{ "email": "...", "password": "..." }`
- Zapisz token z odpowiedzi

### 3. Dodaj testowe przepisy (opcjonalnie)

Jeśli baza jest pusta, dodaj kilka przepisów:

```bash
# Przepis 1 - Dinner
curl -X POST "http://localhost:3000/api/recipes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Chicken Fried Rice",
    "ingredients": [
      {"name": "Rice", "quantity": 2, "unit": "cup"},
      {"name": "Chicken", "quantity": 200, "unit": "g"},
      {"name": "Soy Sauce", "quantity": 2, "unit": "tbsp"}
    ],
    "instructions": "Cook rice, fry chicken, mix together",
    "mealType": "dinner",
    "prepTime": 10,
    "cookTime": 20
  }'

# Przepis 2 - Breakfast
curl -X POST "http://localhost:3000/api/recipes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Scrambled Eggs",
    "ingredients": [
      {"name": "Eggs", "quantity": 3},
      {"name": "Butter", "quantity": 1, "unit": "tbsp"}
    ],
    "instructions": "Beat eggs, melt butter, scramble",
    "mealType": "breakfast",
    "prepTime": 5,
    "cookTime": 5
  }'

# Przepis 3 - Lunch
curl -X POST "http://localhost:3000/api/recipes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tomato Soup",
    "ingredients": [
      {"name": "Tomatoes", "quantity": 5},
      {"name": "Onion", "quantity": 1},
      {"name": "Garlic", "quantity": 2, "unit": "clove"}
    ],
    "instructions": "Saute onion and garlic, add tomatoes, simmer",
    "mealType": "lunch",
    "prepTime": 10,
    "cookTime": 30
  }'
```

---

## ✅ Testy funkcjonalne

### Test 1: Basic GET (no filters)

**Expected:** 200 OK, all recipes, default pagination

```bash
curl -X GET "http://localhost:3000/api/recipes" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 200
- ✅ Response zawiera `data` (array) i `pagination`
- ✅ `pagination.page` = 1
- ✅ `pagination.pageSize` = 20
- ✅ `pagination.total` = liczba przepisów w household

---

### Test 2: Search by title

**Expected:** 200 OK, only recipes matching search term

```bash
curl -X GET "http://localhost:3000/api/recipes?search=chicken" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 200
- ✅ Zwrócone przepisy zawierają "chicken" w tytule lub składnikach
- ✅ Przepisy nie zawierające "chicken" są wykluczone

---

### Test 3: Search by ingredient

**Expected:** 200 OK, recipes containing ingredient

```bash
curl -X GET "http://localhost:3000/api/recipes?search=eggs" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 200
- ✅ Zwrócone przepisy zawierają "eggs" w składnikach

---

### Test 4: Filter by mealType

**Expected:** 200 OK, only dinner recipes

```bash
curl -X GET "http://localhost:3000/api/recipes?mealType=dinner" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 200
- ✅ Wszystkie zwrócone przepisy mają `mealType: "dinner"`

---

### Test 5: Filter by creationMethod

**Expected:** 200 OK, only manual recipes

```bash
curl -X GET "http://localhost:3000/api/recipes?creationMethod=manual" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 200
- ✅ Wszystkie zwrócone przepisy mają `creationMethod: "manual"`

---

### Test 6: Sort ascending by title

**Expected:** 200 OK, recipes sorted A-Z by title

```bash
curl -X GET "http://localhost:3000/api/recipes?sort=title" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 200
- ✅ Przepisy posortowane alfabetycznie (A → Z)
- ✅ Pierwszy przepis ma tytuł wcześniej w alfabecie niż ostatni

---

### Test 7: Sort descending by createdAt

**Expected:** 200 OK, newest recipes first (default)

```bash
curl -X GET "http://localhost:3000/api/recipes?sort=-createdAt" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 200
- ✅ Najnowszy przepis jest pierwszy
- ✅ `createdAt` pierwszego przepisu > `createdAt` ostatniego

---

### Test 8: Pagination - page 1

**Expected:** 200 OK, first page of results

```bash
curl -X GET "http://localhost:3000/api/recipes?page=1&pageSize=2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 200
- ✅ `data` zawiera max 2 przepisy
- ✅ `pagination.page` = 1
- ✅ `pagination.pageSize` = 2
- ✅ `pagination.total` = całkowita liczba przepisów

---

### Test 9: Pagination - page 2

**Expected:** 200 OK, second page of results (different from page 1)

```bash
curl -X GET "http://localhost:3000/api/recipes?page=2&pageSize=2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 200
- ✅ `data` zawiera inne przepisy niż page 1
- ✅ `pagination.page` = 2
- ✅ `pagination.total` = ta sama wartość co page 1

---

### Test 10: Combined filters

**Expected:** 200 OK, matching all criteria

```bash
curl -X GET "http://localhost:3000/api/recipes?search=rice&mealType=dinner&sort=-createdAt&page=1&pageSize=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 200
- ✅ Przepisy zawierają "rice"
- ✅ Przepisy mają `mealType: "dinner"`
- ✅ Sortowanie od najnowszych
- ✅ Max 5 wyników

---

### Test 11: Empty results

**Expected:** 200 OK, empty array (not 404)

```bash
curl -X GET "http://localhost:3000/api/recipes?search=nonexistentrecipe12345" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 200 (NIE 404!)
- ✅ `data` = []
- ✅ `pagination.total` = 0

---

## ❌ Testy walidacji (expected 400)

### Test 12: Invalid pageSize (too large)

**Expected:** 400 Bad Request

```bash
curl -X GET "http://localhost:3000/api/recipes?pageSize=101" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 400
- ✅ Response zawiera `error: "Validation failed"`
- ✅ `details` zawiera info o `pageSize`

---

### Test 13: Invalid page (zero)

**Expected:** 400 Bad Request

```bash
curl -X GET "http://localhost:3000/api/recipes?page=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 400
- ✅ Error message o `page` musi być >= 1

---

### Test 14: Invalid mealType

**Expected:** 400 Bad Request

```bash
curl -X GET "http://localhost:3000/api/recipes?mealType=snack" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 400
- ✅ Error message o dozwolonych wartościach mealType

---

### Test 15: Invalid creationMethod

**Expected:** 400 Bad Request

```bash
curl -X GET "http://localhost:3000/api/recipes?creationMethod=imported" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 400
- ✅ Error message o dozwolonych wartościach creationMethod

---

### Test 16: Invalid sort

**Expected:** 400 Bad Request

```bash
curl -X GET "http://localhost:3000/api/recipes?sort=invalidField" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 400
- ✅ Error message o dozwolonych wartościach sort

---

### Test 17: Search too long

**Expected:** 400 Bad Request

```bash
# Search > 200 characters
curl -X GET "http://localhost:3000/api/recipes?search=$(printf 'a%.0s' {1..201})" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Sprawdź:**

- ✅ Status: 400
- ✅ Error message o max długości search

---

## 🔒 Testy uwierzytelnienia (expected 401)

### Test 18: No auth token

**Expected:** 401 Unauthorized

```bash
curl -X GET "http://localhost:3000/api/recipes"
```

**Sprawdź:**

- ✅ Status: 401
- ✅ `error: "Unauthorized"`
- ✅ Message o wymaganym tokenie

---

### Test 19: Invalid token

**Expected:** 401 Unauthorized

```bash
curl -X GET "http://localhost:3000/api/recipes" \
  -H "Authorization: Bearer invalid_token_12345"
```

**Sprawdź:**

- ✅ Status: 401
- ✅ `error: "Unauthorized"`
- ✅ Message o nieprawidłowym tokenie

---

## 📊 Checklist testów

### ✅ Funkcjonalność

- [ ] Basic GET zwraca wszystkie przepisy
- [ ] Search po tytule działa
- [ ] Search po składnikach działa
- [ ] Filter mealType działa
- [ ] Filter creationMethod działa
- [ ] Sort ascending działa
- [ ] Sort descending działa
- [ ] Pagination (różne strony) działa
- [ ] Kombinacja filtrów działa
- [ ] Empty results zwraca 200 z pustą tablicą

### ✅ Walidacja

- [ ] pageSize > 100 zwraca 400
- [ ] page < 1 zwraca 400
- [ ] Nieprawidłowy mealType zwraca 400
- [ ] Nieprawidłowy creationMethod zwraca 400
- [ ] Nieprawidłowy sort zwraca 400
- [ ] Search > 200 znaków zwraca 400

### ✅ Uwierzytelnienie

- [ ] Brak tokenu zwraca 401
- [ ] Nieprawidłowy token zwraca 401

### ✅ Performance (opcjonalnie)

- [ ] GET z 100 przepisów < 200ms
- [ ] GET z search < 200ms
- [ ] GET z multiple filters < 200ms

---

## 🐛 Troubleshooting

### Problem: Wszystkie testy zwracają 404

**Rozwiązanie:** Sprawdź czy serwer dev jest uruchomiony (`npm run dev`)

### Problem: 401 Unauthorized mimo poprawnego tokenu

**Rozwiązanie:**

- Token mógł wygasnąć - zaloguj się ponownie
- Sprawdź czy token nie ma białych znaków na początku/końcu
- Upewnij się że format to `Bearer <token>` (ze spacją)

### Problem: Puste wyniki mimo istniejących przepisów

**Rozwiązanie:**

- Sprawdź czy przepisy należą do tego samego household co użytkownik
- Sprawdź console logi serwera - może być problem z RLS policy

### Problem: Search nie znajduje wyników

**Rozwiązanie:**

- Search jest case-insensitive i używa ILIKE
- Sprawdź czy nie masz literówki w wyszukiwanej frazie
- Sprawdź console logi - może być problem z GIN indexem

---

## 📖 Automatyczne testowanie

Użyj dostarczonego skryptu:

```bash
# Edytuj skrypt i wstaw swój token
nano .ai/test-get-recipes.sh

# Uruchom wszystkie testy
./.ai/test-get-recipes.sh
```

---

## ✅ Kryteria akceptacji

Implementacja jest gotowa gdy:

1. ✅ Wszystkie testy funkcjonalne (1-11) zwracają 200
2. ✅ Wszystkie testy walidacji (12-17) zwracają 400
3. ✅ Wszystkie testy auth (18-19) zwracają 401
4. ✅ Pagination działa poprawnie (różne strony, różne rozmiary)
5. ✅ Filtry można łączyć (search + mealType + sort)
6. ✅ Empty results zwraca 200 z pustą tablicą (nie 404)
7. ✅ Response time < 500ms dla typowych zapytań

---

**Powodzenia w testowaniu! 🚀**

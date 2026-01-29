# API Endpoint Implementation Plan: Households & Memberships

## 1. Przegląd punktu końcowego

Moduł Households & Memberships zarządza gospodarstwami domowymi użytkowników oraz ich członkostwem. Jest to fundamentalny element aplikacji Pantry Pilot, ponieważ wszystkie inne zasoby (spiżarnie, przepisy, listy zakupów) są powiązane z konkretnym gospodarstwem domowym.

### Kluczowe reguły biznesowe

1. **Jeden użytkownik = jedno gospodarstwo** - użytkownik może należeć tylko do jednego gospodarstwa w danym momencie
2. **Automatyczne tworzenie** - pierwsze gospodarstwo tworzone jest automatycznie przy rejestracji (database trigger)
3. **Własność** - użytkownik który tworzy gospodarstwo staje się jego właścicielem (owner)
4. **Zasoby powiązane** - każde gospodarstwo ma automatycznie tworzone: pantry (spiżarnia) i shopping_list (lista zakupów)
5. **Opuszczenie cudzego gospodarstwa** - członek cudzego gospodarstwa może stworzyć własne, co automatycznie usuwa go z poprzedniego

### Endpointy objęte planem

| Metoda | Ścieżka                                 | Opis                                     |
| ------ | --------------------------------------- | ---------------------------------------- |
| GET    | `/api/households`                       | Pobierz gospodarstwo użytkownika         |
| POST   | `/api/households`                       | Utwórz własne gospodarstwo (opuść cudze) |
| GET    | `/api/households/{householdId}`         | Szczegóły gospodarstwa                   |
| PATCH  | `/api/households/{householdId}`         | Zmiana nazwy gospodarstwa                |
| DELETE | `/api/households/{householdId}`         | Usunięcie gospodarstwa (kaskadowe)       |
| GET    | `/api/households/{householdId}/members` | Lista członków                           |
| POST   | `/api/households/{householdId}/members` | Zaproszenie użytkownika                  |

---

## 2. Szczegóły żądania

### 2.1 GET /api/households

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/households`
- **Opis**: Pobiera gospodarstwo do którego należy zalogowany użytkownik. Zwraca maksymalnie 1 element (constraint 1:1).
- **Parametry**:
  - Wymagane: Uwierzytelnienie (cookie session)
  - Opcjonalne: brak
- **Request Body**: brak

### 2.2 POST /api/households

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/households`
- **Opis**: Powrót do własnego gospodarstwa lub utworzenie nowego. Dostępne tylko gdy użytkownik jest członkiem cudzego gospodarstwa. Jeśli użytkownik posiada własne gospodarstwo (jako owner_id), automatycznie wraca do niego. Jeśli nie, tworzy nowe gospodarstwo. W obu przypadkach automatycznie usuwa użytkownika z poprzedniego gospodarstwa.
- **Parametry**:
  - Wymagane: Uwierzytelnienie (cookie session)
- **Request Body**:

```json
{
  "name": "string" // 3-50 znaków, OPCJONALNE - używane tylko gdy tworzone jest nowe gospodarstwo
}
```

- **Warunki dostępności**:
  - ❌ User jest aktywnym członkiem własnego gospodarstwa → 409 Conflict
  - ✅ User jest członkiem cudzego gospodarstwa i ma własne gospodarstwo → Powrót do własnego (rejoin)
  - ✅ User jest członkiem cudzego gospodarstwa i NIE ma własnego → Utworzenie nowego (wymaga name)
  - ⚠️ User bez gospodarstwa (edge case) → Utworzenie nowego (wymaga name)

### 2.3 GET /api/households/{householdId}

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/households/{householdId}`
- **Parametry**:
  - Wymagane: `householdId` (UUID v4 w path)
  - Wymagane: Uwierzytelnienie (cookie session)
- **Request Body**: brak

### 2.4 PATCH /api/households/{householdId}

- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/households/{householdId}`
- **Opis**: Zmienia nazwę gospodarstwa. Dostępne tylko dla właściciela.
- **Parametry**:
  - Wymagane: `householdId` (UUID v4 w path)
  - Wymagane: Uwierzytelnienie (cookie session)
- **Request Body**:

```json
{
  "name": "string" // 3-50 znaków
}
```

### 2.5 DELETE /api/households/{householdId}

- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/households/{householdId}`
- **Opis**: Usuwa gospodarstwo wraz ze wszystkimi zasobami. Dostępne tylko dla właściciela i tylko gdy nie ma innych członków.
- **Parametry**:
  - Wymagane: `householdId` (UUID v4 w path)
  - Wymagane: Uwierzytelnienie (cookie session)
- **Request Body**: brak

### 2.6 GET /api/households/{householdId}/members

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/households/{householdId}/members`
- **Parametry**:
  - Wymagane: `householdId` (UUID v4 w path)
  - Wymagane: Uwierzytelnienie (cookie session)
- **Request Body**: brak

### 2.7 POST /api/households/{householdId}/members

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/households/{householdId}/members`
- **Opis**: Wysyła zaproszenie do gospodarstwa. Dostępne tylko dla właściciela. Szczegóły w osobnym workflow zaproszeń.
- **Parametry**:
  - Wymagane: `householdId` (UUID v4 w path)
  - Wymagane: Uwierzytelnienie (cookie session)
- **Request Body**:

```json
{
  "invitedEmail": "string" // poprawny format email
}
```

---

## 3. Wykorzystywane typy

### 3.1 Istniejące typy DTO (z `src/types/types.ts`)

```typescript
// Response DTOs
interface Household {
  id: string
  name: string
  createdAt: string
  memberCount?: number
}

type HouseholdWithMembers = Household & {
  members: User[]
}

interface User {
  id: string
  email: string
  createdAt?: string
}

interface Invitation {
  id: string
  householdId: string
  invitedEmail: string
  token: string
  expiresAt: string
  createdAt: string
}

// Request DTOs (Command Models)
interface CreateHouseholdRequest {
  name?: string // Opcjonalne - wymagane tylko gdy tworzenie nowego gospodarstwa
}

interface InviteMemberRequest {
  invitedEmail: string
}

// Response Types
interface HouseholdsListResponse {
  data: Household[] // Zawsze 0 lub 1 element
  ownedHouseholdId: string | null // NOWE - ID gospodarstwa którego user jest właścicielem
}

type CreateHouseholdResponse = Household & {
  rejoined: boolean // true = wrócił do istniejącego, false = utworzył nowe
}
type GetHouseholdResponse = HouseholdWithMembers

interface MembersListResponse {
  data: User[]
}

interface InviteMemberResponse {
  invitation: Invitation
}
```

### 3.2 Nowe schematy walidacji Zod (do utworzenia)

Plik: `src/lib/validation/households.ts`

```typescript
import { z } from 'zod'

// UUID v4 validation
export const UUIDSchema = z.string().uuid('Invalid UUID format')

// Create/Update household request
export const HouseholdNameSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be at most 50 characters')
    .trim(),
})

// Invite member request
export const InviteMemberSchema = z.object({
  invitedEmail: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must be at most 255 characters')
    .toLowerCase()
    .trim(),
})

export type HouseholdNameInput = z.infer<typeof HouseholdNameSchema>
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>
```

---

## 4. Szczegóły odpowiedzi

### 4.1 GET /api/households

**Sukces (200 OK)**:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Doe Family",
      "createdAt": "2025-10-13T12:00:00Z",
      "memberCount": 3
    }
  ],
  "ownedHouseholdId": "uuid-or-null" // NOWE - ID gospodarstwa którego user jest właścicielem (może być różne od data[0])
}
```

> **Uwaga**: Tablica zawsze zawiera 0 lub 1 element (constraint 1:1). Format tablicy zachowany dla spójności API.
>
> **Nowe pole `ownedHouseholdId`**: Pozwala frontendowi określić czy user ma własne gospodarstwo:
>
> - Jeśli `ownedHouseholdId !== null && ownedHouseholdId !== data[0].id` → user jest członkiem cudzego gospodarstwa ale ma własne (rejoin możliwy)
> - Jeśli `ownedHouseholdId === null` → user nigdy nie był właścicielem (tylko create możliwy)
> - Jeśli `ownedHouseholdId === data[0].id` → user jest w swoim własnym gospodarstwie (ani rejoin ani create)

**Błędy**:

- 401 Unauthorized - brak lub nieprawidłowe uwierzytelnienie

### 4.2 POST /api/households

**Sukces (200 OK lub 201 Created)**:

```json
{
  "id": "uuid",
  "name": "Moje gospodarstwo",
  "createdAt": "2025-10-13T12:05:00Z",
  "rejoined": false // true jeśli wrócił do istniejącego, false jeśli utworzył nowe
}
```

**Kody sukcesu**:

- `200 OK` - powrót do istniejącego gospodarstwa (rejoin)
- `201 Created` - utworzenie nowego gospodarstwa

**Nagłówki odpowiedzi** (tylko dla 201 Created):

- `Location: /api/households/{id}`

**Błędy**:

- 400 Bad Request - nieprawidłowe dane (brak nazwy gdy tworzenie nowego, lub nazwa < 3 lub > 50 znaków)
- 401 Unauthorized - brak uwierzytelnienia
- 409 Conflict - użytkownik już jest aktywnym członkiem własnego gospodarstwa

### 4.3 GET /api/households/{householdId}

**Sukces (200 OK)**:

```json
{
  "id": "uuid",
  "name": "Doe Family",
  "createdAt": "2025-10-13T12:05:00Z",
  "members": [
    {
      "id": "uuid",
      "email": "owner@example.com"
    }
  ]
}
```

**Błędy**:

- 401 Unauthorized - brak uwierzytelnienia
- 404 Not Found - gospodarstwo nie istnieje LUB użytkownik nie jest członkiem

### 4.4 PATCH /api/households/{householdId}

**Sukces (200 OK)**:

```json
{
  "id": "uuid",
  "name": "Nowa nazwa",
  "createdAt": "2025-10-13T12:05:00Z"
}
```

**Błędy**:

- 400 Bad Request - nieprawidłowe dane
- 401 Unauthorized - brak uwierzytelnienia
- 403 Forbidden - użytkownik nie jest właścicielem
- 404 Not Found - gospodarstwo nie istnieje LUB użytkownik nie jest członkiem

### 4.5 DELETE /api/households/{householdId}

**Sukces (204 No Content)**: brak ciała odpowiedzi

**Błędy**:

- 401 Unauthorized - brak uwierzytelnienia
- 403 Forbidden - użytkownik nie jest właścicielem
- 404 Not Found - gospodarstwo nie istnieje LUB użytkownik nie jest członkiem
- 409 Conflict - gospodarstwo ma innych członków (muszą najpierw odejść)

### 4.6 GET /api/households/{householdId}/members

**Sukces (200 OK)**:

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "member@example.com",
      "role": "owner",
      "joinedAt": "2025-10-13T12:10:00Z"
    }
  ]
}
```

**Błędy**:

- 401 Unauthorized - brak uwierzytelnienia
- 404 Not Found - gospodarstwo nie istnieje LUB użytkownik nie jest członkiem

### 4.7 POST /api/households/{householdId}/members

**Sukces (201 Created)**:

```json
{
  "invitation": {
    "id": "uuid",
    "householdId": "uuid",
    "invitedEmail": "friend@example.com",
    "token": "secure-random-token",
    "expiresAt": "2025-10-20T12:00:00Z",
    "createdAt": "2025-10-13T12:00:00Z"
  }
}
```

**Błędy**:

- 400 Bad Request - nieprawidłowy email
- 401 Unauthorized - brak uwierzytelnienia
- 403 Forbidden - użytkownik nie jest właścicielem
- 404 Not Found - gospodarstwo nie istnieje
- 409 Conflict - użytkownik już jest członkiem

---

## 5. Przepływ danych

### 5.1 Architektura warstwowa

```
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                        │
│  (src/app/api/households/route.ts)                         │
│  - Uwierzytelnienie (authenticateRequest)                   │
│  - Parsowanie i walidacja Zod                              │
│  - Mapowanie błędów na kody HTTP                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    HouseholdService                         │
│  (src/lib/services/household.service.ts)                   │
│  - Logika biznesowa                                        │
│  - Sprawdzanie uprawnień (owner/member)                    │
│  - Transformacja danych DB → DTO                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Client                          │
│  - Operacje CRUD na tabelach                               │
│  - RLS (Row Level Security)                                │
│  - Transakcje dla operacji atomowych                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Tables                          │
│  - households                                              │
│  - user_households                                         │
│  - household_invitations                                   │
│  - pantries                                                │
│  - shopping_lists                                          │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Database Trigger: Automatyczne tworzenie gospodarstwa

Przy rejestracji użytkownika (insert do `auth.users`) trigger automatycznie tworzy:

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- 1. Create household for new user
  INSERT INTO public.households (owner_id, name)
  VALUES (NEW.id, 'My household')
  RETURNING id INTO new_household_id;

  -- 2. Add user to household
  INSERT INTO public.user_households (user_id, household_id)
  VALUES (NEW.id, new_household_id);

  -- 3. Create pantry
  INSERT INTO public.pantries (household_id)
  VALUES (new_household_id);

  -- 4. Create shopping list
  INSERT INTO public.shopping_lists (household_id)
  VALUES (new_household_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5.3 Przepływy dla poszczególnych endpointów

#### GET /api/households

```
1. authenticateRequest() → user
2. householdService.getUserHousehold(user.id)
   └── SELECT households
       JOIN user_households ON user_id = userId
       WITH member count
3. householdService.getOwnedHouseholdId(user.id)  // NOWE
   └── SELECT id FROM households WHERE owner_id = userId
4. Transformacja do Household[]
5. Return {
     data: [household] lub [],
     ownedHouseholdId: ownedId lub null  // NOWE
   }
```

#### POST /api/households

```
1. authenticateRequest() → user
2. householdService.rejoinOrCreateHousehold(user.id, name?)
   ├── Sprawdzenie: czy user posiada własne gospodarstwo (owner_id)?
   │   └── SELECT households WHERE owner_id = userId
   ├── Sprawdzenie: czy user jest aktywnym członkiem własnego gospodarstwa?
   │   └── TAK → throw AlreadyActiveMemberError (409)
   ├── Pobranie obecnego członkostwa
   │   └── currentHouseholdId = getUserMembership(userId)
   │
   ├── JEŚLI user MA własne gospodarstwo (rejoin):
   │   ├── BEGIN TRANSACTION
   │   │   ├── DELETE FROM user_households WHERE user_id AND household_id = current
   │   │   └── INSERT INTO user_households (user_id, household_id = owned)
   │   │       ON CONFLICT DO NOTHING
   │   └── COMMIT
   │   └── Return ownedHousehold (200, rejoined: true)
   │
   └── JEŚLI user NIE MA własnego gospodarstwa (create new):
       ├── Walidacja Zod (HouseholdNameSchema - name wymagane)
       ├── BEGIN TRANSACTION
       │   ├── INSERT INTO households (owner_id, name)
       │   ├── INSERT INTO user_households (user_id, household_id)
       │   ├── INSERT INTO pantries (household_id)
       │   ├── INSERT INTO shopping_lists (household_id)
       │   └── IF currentHouseholdId:
       │       └── DELETE FROM user_households WHERE user_id AND household_id = current
       └── COMMIT
       └── Return newHousehold (201, rejoined: false)
```

#### DELETE /api/households/{householdId}

```
1. authenticateRequest() → user
2. Walidacja UUID
3. householdService.deleteHousehold(householdId, user.id)
   ├── Sprawdzenie: czy user jest owner?
   │   └── NIE → throw NotOwnerError
   ├── Sprawdzenie: czy są inni członkowie?
   │   └── TAK → throw HasOtherMembersError
   ├── BEGIN TRANSACTION (lub CASCADE w FK)
   │   ├── DELETE FROM pantry_items WHERE pantry_id IN (...)
   │   ├── DELETE FROM pantries WHERE household_id = ...
   │   ├── DELETE FROM recipes WHERE household_id = ...
   │   ├── DELETE FROM shopping_list_items WHERE shopping_list_id IN (...)
   │   ├── DELETE FROM shopping_lists WHERE household_id = ...
   │   ├── DELETE FROM household_invitations WHERE household_id = ...
   │   ├── DELETE FROM user_households WHERE household_id = ...
   │   └── DELETE FROM households WHERE id = ...
   └── COMMIT
4. Return 204 No Content
```

---

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnienie

- Wszystkie endpointy wymagają uwierzytelnienia poprzez `authenticateRequest()`
- Sesja oparta na cookie (Supabase Auth)
- Automatyczne odświeżanie tokenu w middleware

### 6.2 Autoryzacja

| Operacja               | Wymagane uprawnienia                         |
| ---------------------- | -------------------------------------------- |
| Pobierz gospodarstwo   | Uwierzytelniony użytkownik                   |
| Utwórz gospodarstwo    | Członek cudzego gospodarstwa (nie owner)     |
| Szczegóły gospodarstwa | Członkostwo                                  |
| Zmień nazwę            | Właściciel (owner_id)                        |
| Usuń gospodarstwo      | Właściciel (owner_id) + brak innych członków |
| Lista członków         | Członkostwo                                  |
| Zaproś członka         | Właściciel (owner_id)                        |

### 6.3 Ochrona przed wyciekiem informacji

- Dla nie-członków zwracany jest 404 zamiast 403
- Ukrywa to istnienie gospodarstwa przed nieautoryzowanymi użytkownikami
- Wzorzec: "Resource not found" dla braku dostępu LUB nieistniejącego zasobu

### 6.4 Walidacja danych wejściowych

- Wszystkie dane wejściowe walidowane przez schematy Zod
- UUID v4 walidowane przed użyciem w zapytaniach
- Email normalizowany (lowercase, trim) przed zapisem
- Nazwa gospodarstwa: trim + walidacja długości

### 6.5 Ochrona przed atakami

| Zagrożenie             | Mitygacja                           |
| ---------------------- | ----------------------------------- |
| SQL Injection          | Parametryzowane zapytania Supabase  |
| XSS                    | Zod walidacja, brak HTML w nazwach  |
| CSRF                   | Cookie SameSite, Next.js middleware |
| Brute Force            | Rate limiting (do rozważenia)       |
| Information Disclosure | 404 dla braku dostępu               |

---

## 7. Obsługa błędów

### 7.1 Tabela kodów błędów

| Kod | Scenariusz                                | Odpowiedź                                                                      |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| 400 | Nieprawidłowy JSON                        | `{ error: "Bad Request", message: "Invalid JSON format" }`                     |
| 400 | Walidacja Zod                             | `{ error: "Validation failed", details: [...] }`                               |
| 401 | Brak uwierzytelnienia                     | `{ error: "Unauthorized", message: "Authentication required" }`                |
| 403 | Brak uprawnień właściciela                | `{ error: "Forbidden", message: "Only the owner can perform this action" }`    |
| 404 | Nie znaleziono/brak dostępu               | `{ error: "Not Found", message: "Household not found" }`                       |
| 409 | User już jest aktywnym członkiem własnego | `{ error: "Conflict", message: "Already an active member of own household" }`  |
| 409 | Użytkownik już członkiem                  | `{ error: "Conflict", message: "User is already a member" }`                   |
| 409 | Gospodarstwo ma członków                  | `{ error: "Conflict", message: "Cannot delete household with other members" }` |
| 500 | Błąd serwera                              | `{ error: "Internal Server Error", message: "An unexpected error occurred" }`  |

### 7.2 Wzorzec obsługi błędów w serwisie

```typescript
// Errors thrown by service layer
export class HouseholdNotFoundError extends Error {
  constructor() {
    super('Household not found')
    this.name = 'HouseholdNotFoundError'
  }
}

export class NotOwnerError extends Error {
  constructor() {
    super('Only the owner can perform this action')
    this.name = 'NotOwnerError'
  }
}

export class AlreadyActiveMemberError extends Error {
  constructor() {
    super('Already an active member of own household')
    this.name = 'AlreadyActiveMemberError'
  }
}

export class AlreadyMemberError extends Error {
  constructor() {
    super('User is already a member')
    this.name = 'AlreadyMemberError'
  }
}

export class HasOtherMembersError extends Error {
  constructor() {
    super('Cannot delete household with other members')
    this.name = 'HasOtherMembersError'
  }
}
```

### 7.3 Mapowanie błędów w route handler

```typescript
} catch (error) {
  if (error instanceof HouseholdNotFoundError) {
    return NextResponse.json(
      { error: 'Not Found', message: error.message },
      { status: 404 }
    )
  }
  if (error instanceof NotOwnerError) {
    return NextResponse.json(
      { error: 'Forbidden', message: error.message },
      { status: 403 }
    )
  }
  if (error instanceof AlreadyActiveMemberError) {
    return NextResponse.json(
      { error: 'Conflict', message: error.message },
      { status: 409 }
    )
  }
  if (error instanceof AlreadyMemberError) {
    return NextResponse.json(
      { error: 'Conflict', message: error.message },
      { status: 409 }
    )
  }
  if (error instanceof HasOtherMembersError) {
    return NextResponse.json(
      { error: 'Conflict', message: error.message },
      { status: 409 }
    )
  }
  // Log unexpected errors
  console.error('[API] Unexpected error:', error)
  return NextResponse.json(
    { error: 'Internal Server Error', message: 'An unexpected error occurred' },
    { status: 500 }
  )
}
```

---

## 8. Rozważania dotyczące wydajności

### 8.1 Optymalizacja zapytań

- **Pobierz gospodarstwo**: Pojedyncze zapytanie z JOIN do obliczenia memberCount
- **Szczegóły gospodarstwa**: Pojedyncze zapytanie z JOIN do pobrania członków
- **Tworzenie gospodarstwa**: Transakcja z 4-5 INSERT (atomowe)
- **Usuwanie kaskadowe**: Wykorzystanie ON DELETE CASCADE w FK lub transakcji

### 8.2 Indeksy bazy danych

Zalecane indeksy (jeśli nie istnieją):

```sql
-- Szybkie wyszukiwanie gospodarstwa użytkownika
CREATE INDEX idx_user_households_user_id ON user_households(user_id);

-- Szybkie wyszukiwanie członków gospodarstwa
CREATE INDEX idx_user_households_household_id ON user_households(household_id);

-- Szybkie wyszukiwanie zaproszeń
CREATE INDEX idx_invitations_email ON household_invitations(invited_email);
CREATE INDEX idx_invitations_token ON household_invitations(token);

-- Właściciel gospodarstwa
CREATE INDEX idx_households_owner_id ON households(owner_id);
```

### 8.3 Potencjalne wąskie gardła

| Operacja                     | Problem                   | Rozwiązanie                               |
| ---------------------------- | ------------------------- | ----------------------------------------- |
| Tworzenie gospodarstwa       | Wiele INSERT w transakcji | Atomowa transakcja, rollback przy błędzie |
| Usuwanie dużego gospodarstwa | Długa transakcja          | ON DELETE CASCADE w FK                    |
| Trigger przy rejestracji     | Opóźnienie rejestracji    | Trigger jest szybki (4 INSERT)            |

---

## 9. Etapy wdrożenia

### Krok 1: Migracja bazy danych (Database Trigger)

**Plik**: `supabase/migrations/XXXXXX_create_household_trigger.sql`

1. Utwórz funkcję `handle_new_user()`
2. Utwórz trigger `on_auth_user_created`
3. Przetestuj trigger na nowym użytkowniku
4. Zweryfikuj że tworzone są: household, user_households, pantry, shopping_list

### Krok 2: Przygotowanie schematów walidacji Zod

**Plik**: `src/lib/validation/households.ts`

1. Utwórz schemat `HouseholdNameSchema`
2. Utwórz schemat `InviteMemberSchema`
3. Utwórz schemat `UUIDSchema` (lub użyj wspólnego)
4. Wyeksportuj typy TypeScript

### Krok 3: Implementacja serwisu HouseholdService

**Plik**: `src/lib/services/household.service.ts`

1. Utwórz klasę `HouseholdService` z konstruktorem przyjmującym Supabase client
2. Zaimplementuj metody pomocnicze:
   - `isMember(householdId, userId): Promise<boolean>`
   - `isOwner(householdId, userId): Promise<boolean>`
   - `getUserMembership(userId): Promise<{ householdId, isOwner } | null>`
   - `getOwnedHousehold(userId): Promise<Household | null>` (NOWE - pobiera gospodarstwo gdzie user jest owner_id)
3. Zaimplementuj metody CRUD:
   - `getUserHousehold(userId): Promise<Household | null>`
   - `rejoinOrCreateHousehold(userId, name?): Promise<{ household: Household, rejoined: boolean }>` (ZMIENIONE - logika rejoin/create)
   - `getHousehold(householdId, userId): Promise<HouseholdWithMembers>`
   - `updateHousehold(householdId, userId, name): Promise<Household>`
   - `deleteHousehold(householdId, userId): Promise<void>`
4. Zaimplementuj metody członkostwa:
   - `listMembers(householdId, userId): Promise<User[]>`
   - `inviteMember(householdId, userId, email): Promise<Invitation>`
5. Utwórz niestandardowe klasy błędów

### Krok 4: Implementacja route handlers

**Pliki**:

- `src/app/api/households/route.ts` (GET, POST)
- `src/app/api/households/[householdId]/route.ts` (GET, PATCH, DELETE)
- `src/app/api/households/[householdId]/members/route.ts` (GET, POST)

Dla każdego handlera:

1. Uwierzytelnienie przez `authenticateRequest()`
2. Walidacja parametrów path (UUID) jeśli dotyczy
3. Parsowanie i walidacja body przez Zod (dla POST/PATCH)
4. Wywołanie odpowiedniej metody serwisu
5. Obsługa błędów i mapowanie na kody HTTP
6. Zwrócenie odpowiedzi

### Krok 5: Aktualizacja typów DTO

**Plik**: `src/types/types.ts`

1. Dodaj brakujące typy jeśli potrzebne
2. Upewnij się, że typy odpowiedzi są spójne z API

### Krok 6: Testy jednostkowe serwisu

**Plik**: `src/lib/services/household.service.test.ts`

1. Testy dla każdej metody serwisu
2. Mockowanie Supabase client
3. Testy scenariuszy błędów
4. Testy edge cases:
   - User jest właścicielem → nie może stworzyć nowego
   - User jest członkiem cudzego → może stworzyć nowe
   - Usunięcie z innymi członkami → błąd

### Krok 7: Testy integracyjne API

**Plik**: `src/app/api/households/route.test.ts`

1. Testy E2E dla każdego endpointu
2. Testy uwierzytelnienia
3. Testy walidacji
4. Testy autoryzacji (owner vs member)

### Krok 8: Aktualizacja RecipeService (cleanup)

**Plik**: `src/lib/services/recipe.service.ts`

1. Usuń `DEFAULT_HOUSEHOLD_ID` fallback
2. Rzuć błąd gdy użytkownik nie ma gospodarstwa
3. Zaktualizuj logikę `getUserHouseholdId`

---

## 10. Powiązane workflow (osobne dokumenty)

### 10.1 Workflow zaproszeń

Szczegóły dotyczące:

- Akceptacji zaproszeń
- Migracji zasobów przy przejściu do nowego gospodarstwa
- Automatycznego usuwania starego gospodarstwa

→ Opisane w osobnym dokumencie workflow zaproszeń

### 10.2 Usuwanie członków

- `DELETE /api/households/{householdId}/members/{userId}` - właściciel usuwa członka
- Co się dzieje z członkiem po usunięciu?

→ Do rozważenia w workflow zaproszeń lub osobnym dokumencie

---

## 11. Checklist przed wdrożeniem

- [ ] Database trigger utworzony i przetestowany
- [ ] Schematy walidacji Zod utworzone i przetestowane
- [ ] HouseholdService zaimplementowany z pełną obsługą błędów
- [ ] Wszystkie route handlers zaimplementowane
- [ ] Testy jednostkowe pokrywają główne scenariusze
- [ ] Testy integracyjne dla happy path i error cases
- [ ] Kody HTTP zgodne ze specyfikacją API
- [ ] Logowanie błędów (console.error) dla 500 errors
- [ ] DEFAULT_HOUSEHOLD_ID usunięty z RecipeService
- [ ] Przegląd kodu przez drugiego developera

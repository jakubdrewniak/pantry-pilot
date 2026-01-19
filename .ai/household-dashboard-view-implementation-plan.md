# Plan implementacji widoku Household Dashboard

## 1. Przegląd

Widok Household Dashboard to główny panel zarządzania gospodarstwem domowym, który umożliwia użytkownikom przeglądanie informacji o swoim gospodarstwie, zarządzanie jego nazwą oraz wyświetlanie listy członków. Widok zapewnia właścicielowi gospodarstwa możliwość zmiany nazwy oraz usuwania gospodarstwa, podczas gdy zwykli członkowie mają ograniczone uprawnienia tylko do odczytu.

**Ważne ograniczenia w obecnej wersji:**

- **Brak funkcjonalności zaproszeń** - nie ma możliwości zapraszania nowych członków ani dołączania do innych gospodarstw
- **Jeden household per user** - użytkownik ma zawsze dostęp do dokładnie jednego gospodarstwa:
  - Swojego własnego (jeśli jest właścicielem)
  - Tego, do którego został dodany podczas rejestracji (jeśli jest członkiem)
- **Brak przełączania gospodarstw** - nie ma możliwości bycia członkiem wielu gospodarstw jednocześnie

Kluczowe funkcjonalności:

- Wyświetlanie nazwy gospodarstwa i liczby członków
- Lista członków z ich adresami email i rolami (właściciel/członek)
- Edycja nazwy gospodarstwa (tylko właściciel)
- Tworzenie nowego własnego gospodarstwa (tylko członkowie, nie właściciele) - **uwaga: opuszcza obecne gospodarstwo**
- Usuwanie gospodarstwa (tylko właściciel, gdy brak innych członków)

**Funkcjonalności przyszłościowe (nie w obecnej wersji):**

- Zapraszanie nowych członków przez właściciela
- Wyświetlanie i zarządzanie zaproszeniami
- Dołączanie do innych gospodarstw poprzez zaproszenia
- Możliwość bycia członkiem wielu gospodarstw

## 2. Routing widoku

**Ścieżka:** `/household` (liczba pojedyncza - użytkownik ma zawsze dostęp do jednego gospodarstwa)

**Dostęp:** Wymaga uwierzytelnienia (middleware przekieruje niezalogowanych użytkowników do `/login`)

**Nawigacja:** Widok powinien być dostępny z głównego menu aplikacji

## 3. Struktura komponentów

**Uwaga:** Komponenty związane z zaproszeniami (InvitationsList, InviteMemberModal, etc.) nie są implementowane w obecnej wersji.

```
HouseholdDashboardPage (src/app/household/page.tsx)
├── HouseholdHeader
│   ├── HouseholdTitle (nazwa + badge liczby członków)
│   └── HouseholdActions (przyciski akcji w zależności od roli)
│       ├── EditHouseholdNameButton (tylko właściciel)
│       ├── CreateOwnHouseholdButton (tylko członek)
│       └── DeleteHouseholdButton (tylko właściciel)
├── HouseholdInfoCard
│   ├── HouseholdMetadata (data utworzenia, ID)
│   └── OwnerIndicator (badge właściciela)
├── MembersList
│   ├── MembersListHeader (nagłówek z liczbą członków)
│   └── MemberCard[] (lista członków)
│       └── MemberInfo (email, rola, data dołączenia)
└── Modals (komponenty dialogowe)
    ├── EditHouseholdNameModal
    ├── CreateOwnHouseholdModal
    └── DeleteHouseholdModal

NIEIMPLEMENTOWANE W OBECNEJ WERSJI (przyszłość):
├── InvitationsList
│   ├── InvitationsListHeader
│   ├── InviteMemberButton (tylko właściciel)
│   └── InvitationCard[]
│       ├── InvitationInfo
│       └── CancelInvitationButton
└── Modals
    ├── InviteMemberModal
    └── RemoveMemberModal
```

## 4. Szczegóły komponentów

### HouseholdDashboardPage

- **Opis komponentu:** Główny komponent strony, kontener dla całego widoku dashboard. Odpowiedzialny za pobieranie danych gospodarstwa i zarządzanie stanem całego widoku.
- **Główne elementy:**
  - Container div z odpowiednim paddingiem i max-width
  - Komponenty: `HouseholdHeader`, `HouseholdInfoCard`, `MembersList`, `InvitationsList`, modals
- **Obsługiwane zdarzenia:**
  - `onLoad` - pobieranie danych gospodarstwa z API
  - `onRefresh` - odświeżanie danych po akcjach CRUD
- **Warunki walidacji:** Sprawdzenie czy użytkownik ma gospodarstwo (jeśli nie, wyświetlić pustą stronę z opcją utworzenia)
- **Typy:**
  - `HouseholdDashboardViewModel` - model widoku
  - `HouseholdWithMembers` - DTO z API
  - `HouseholdRole` - rola użytkownika
- **Propsy:** Brak (page component)

### HouseholdHeader

- **Opis komponentu:** Nagłówek sekcji wyświetlający nazwę gospodarstwa i przyciski akcji dostępne w zależności od roli użytkownika.
- **Główne elementy:**
  - `div` z flexbox layout (justify-between)
  - `HouseholdTitle` - wyświetla nazwę i badge z liczbą członków
  - `HouseholdActions` - grupa przycisków akcji
- **Obsługiwane zdarzenia:**
  - Przekazuje handlery do przycisków akcji
- **Warunki walidacji:** Brak (logika w child components)
- **Typy:**
  - `Household` z `src/types/types`
  - `HouseholdRole` - rola użytkownika
- **Propsy:**
  ```typescript
  interface HouseholdHeaderProps {
    household: Household
    userRole: HouseholdRole
    onEditName: () => void
    onCreateOwn: () => void
    onDelete: () => void
  }
  ```

### HouseholdTitle

- **Opis komponentu:** Wyświetla nazwę gospodarstwa jako nagłówek H1 oraz badge z liczbą członków.
- **Główne elementy:**
  - `h1` z nazwą gospodarstwa
  - `Badge` z liczbą członków (shadcn/ui)
- **Obsługiwane zdarzenia:** Brak (tylko prezentacja)
- **Warunki walidacji:** Brak
- **Typy:** `Household`
- **Propsy:**
  ```typescript
  interface HouseholdTitleProps {
    name: string
    memberCount: number
  }
  ```

### HouseholdActions

- **Opis komponentu:** Grupa przycisów akcji, które są dostępne w zależności od roli użytkownika (właściciel vs członek).
- **Główne elementy:**
  - `div` z gap spacing
  - Warunkowe renderowanie przycisków: `EditHouseholdNameButton`, `CreateOwnHouseholdButton`, `DeleteHouseholdButton`
- **Obsługiwane zdarzenia:**
  - Przekazuje handlery onClick do odpowiednich przycisków
- **Warunki walidacji:**
  - `EditHouseholdNameButton` - tylko dla właściciela
  - `DeleteHouseholdButton` - tylko dla właściciela
  - `CreateOwnHouseholdButton` - tylko dla członków (nie właścicieli)
- **Typy:** `HouseholdRole`
- **Propsy:**
  ```typescript
  interface HouseholdActionsProps {
    userRole: HouseholdRole
    onEditName: () => void
    onCreateOwn: () => void
    onDelete: () => void
  }
  ```

### HouseholdInfoCard

- **Opis komponentu:** Karta informacyjna wyświetlająca metadane gospodarstwa: data utworzenia, ID, badge właściciela.
- **Główne elementy:**
  - `Card` (shadcn/ui) z `CardHeader` i `CardContent`
  - Lista definicji (dl/dt/dd) z metadanymi
  - `OwnerIndicator` - badge jeśli użytkownik jest właścicielem
- **Obsługiwane zdarzenia:** Brak
- **Warunki walidacji:** Brak
- **Typy:** `Household`, `HouseholdRole`
- **Propsy:**
  ```typescript
  interface HouseholdInfoCardProps {
    household: Household
    userRole: HouseholdRole
  }
  ```

### MembersList

- **Opis komponentu:** Sekcja listy członków gospodarstwa z nagłówkiem i kartami członków. **Brak funkcjonalności zapraszania i usuwania członków w obecnej wersji.**
- **Główne elementy:**
  - `Card` container
  - `MembersListHeader` z tytułem "Członkowie" i liczbą
  - Lista `MemberCard` komponentów (tylko do odczytu)
- **Obsługiwane zdarzenia:** Brak (tylko prezentacja)
- **Warunki walidacji:**
  - Lista nie może być pusta (zawsze co najmniej właściciel)
- **Typy:**
  - `User[]` z `src/types/types`
  - `HouseholdRole`
  - `MemberWithRole` (ViewModel)
- **Propsy:**
  ```typescript
  interface MembersListProps {
    members: MemberWithRole[]
    currentUserId: string
    userRole: HouseholdRole
  }
  ```

### MemberCard

- **Opis komponentu:** Karta pojedynczego członka wyświetlająca email, rolę i datę dołączenia. **Tylko do odczytu - brak możliwości usuwania członków w obecnej wersji.**
- **Główne elementy:**
  - `div` z flexbox layout
  - `MemberInfo` - email, rola (badge), data dołączenia
  - Indicator jeśli to aktualny użytkownik
- **Obsługiwane zdarzenia:** Brak (tylko prezentacja)
- **Warunki walidacji:** Brak
- **Typy:** `MemberWithRole`
- **Propsy:**
  ```typescript
  interface MemberCardProps {
    member: MemberWithRole
    isCurrentUser: boolean
  }
  ```

### InvitationsList (NIEIMPLEMENTOWANE - przyszłość)

**Uwaga:** Ten komponent nie jest implementowany w obecnej wersji z powodu braku funkcjonalności zaproszeń.

- **Opis komponentu:** Opcjonalna sekcja wyświetlająca listę oczekujących zaproszeń (tylko widoczna dla właściciela jeśli są zaproszenia).
- **Status:** Zarezerwowane dla przyszłej implementacji

### InvitationCard (NIEIMPLEMENTOWANE - przyszłość)

**Uwaga:** Ten komponent nie jest implementowany w obecnej wersji z powodu braku funkcjonalności zaproszeń.

- **Opis komponentu:** Karta pojedynczego zaproszenia wyświetlająca email zaproszonej osoby, datę wygaśnięcia i przycisk anulowania.
- **Status:** Zarezerwowane dla przyszłej implementacji

### EditHouseholdNameModal

- **Opis komponentu:** Dialog do edycji nazwy gospodarstwa. Zawiera formularz z inputem i przyciskami zapisz/anuluj.
- **Główne elementy:**
  - `Dialog` (shadcn/ui) z `DialogHeader`, `DialogContent`, `DialogFooter`
  - `Form` z `Input` dla nazwy
  - `Button` zapisz i anuluj
  - Wyświetlanie błędów walidacji
- **Obsługiwane zdarzenia:**
  - `onSubmit` - walidacja i wywołanie API PATCH
  - `onOpenChange` - otwarcie/zamknięcie modala
- **Warunki walidacji:**
  - Nazwa: 3-50 znaków, wymagana, trimmed
  - Zgodność z `HouseholdNameSchema` z `src/lib/validation/households.ts`
- **Typy:**
  - `EditHouseholdNameFormData` (ViewModel)
  - Request: `{ name: string }`
  - Response: `Household`
- **Propsy:**
  ```typescript
  interface EditHouseholdNameModalProps {
    open: boolean
    currentName: string
    householdId: string
    onOpenChange: (open: boolean) => void
    onSuccess: (updatedHousehold: Household) => void
  }
  ```

### CreateOwnHouseholdModal

- **Opis komponentu:** Dialog do utworzenia własnego gospodarstwa dla członka cudzego gospodarstwa. Ostrzeżenie o opuszczeniu obecnego gospodarstwa.
- **Główne elementy:**
  - `Dialog` (shadcn/ui)
  - `Alert` z ostrzeżeniem o opuszczeniu obecnego gospodarstwa
  - `Form` z `Input` dla nazwy nowego gospodarstwa
  - `Button` utwórz i anuluj
- **Obsługiwane zdarzenia:**
  - `onSubmit` - walidacja i wywołanie API POST
  - `onOpenChange` - otwarcie/zamknięcie modala
- **Warunki walidacji:**
  - Nazwa: 3-50 znaków, wymagana, trimmed
  - Zgodność z `HouseholdNameSchema`
- **Typy:**
  - `CreateHouseholdRequest` z `src/types/types`
  - Response: `CreateHouseholdResponse`
- **Propsy:**
  ```typescript
  interface CreateOwnHouseholdModalProps {
    open: boolean
    currentHouseholdName: string
    onOpenChange: (open: boolean) => void
    onSuccess: (newHousehold: Household) => void
  }
  ```

### DeleteHouseholdModal

- **Opis komponentu:** Dialog potwierdzenia usunięcia gospodarstwa. Wyświetla ostrzeżenie o trwałym usunięciu wszystkich danych.
- **Główne elementy:**
  - `AlertDialog` (shadcn/ui) z `AlertDialogHeader`, `AlertDialogContent`, `AlertDialogFooter`
  - Tekst ostrzeżenia o konsekwencjach usunięcia
  - Warunek: gospodarstwo nie może mieć innych członków
  - `Button` usuń (destructive) i anuluj
- **Obsługiwane zdarzenia:**
  - `onConfirm` - wywołanie API DELETE
  - `onOpenChange` - otwarcie/zamknięcie modala
- **Warunki walidacji:**
  - Właściciel nie może usunąć gospodarstwa z innymi członkami (API zwróci 409)
  - Wyświetlenie błędu jeśli są inni członkowie
- **Typy:** Brak request body, response: 204 No Content
- **Propsy:**
  ```typescript
  interface DeleteHouseholdModalProps {
    open: boolean
    householdId: string
    householdName: string
    hasOtherMembers: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
  }
  ```

### InviteMemberModal (NIEIMPLEMENTOWANE - przyszłość)

**Uwaga:** Ten komponent nie jest implementowany w obecnej wersji z powodu braku funkcjonalności zaproszeń.

- **Opis komponentu:** Dialog do zapraszania nowych członków. Formularz z inputem email.
- **Status:** Zarezerwowane dla przyszłej implementacji

### RemoveMemberModal (NIEIMPLEMENTOWANE - przyszłość)

**Uwaga:** Ten komponent nie jest implementowany w obecnej wersji z powodu braku funkcjonalności zarządzania członkami.

- **Opis komponentu:** Dialog potwierdzenia usunięcia członka z gospodarstwa.
- **Status:** Zarezerwowane dla przyszłej implementacji

## 5. Typy

### Istniejące typy z `src/types/types.ts`:

```typescript
// DTOs z API
interface Household {
  id: string
  name: string
  createdAt: string
  memberCount?: number
}

interface HouseholdWithMembers extends Household {
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

// Request/Response types
interface CreateHouseholdRequest {
  name: string
}

interface InviteMemberRequest {
  invitedEmail: string
}

type CreateHouseholdResponse = Household
type GetHouseholdResponse = HouseholdWithMembers
interface HouseholdsListResponse {
  data: Household[]
}
interface MembersListResponse {
  data: User[]
}
interface InviteMemberResponse {
  invitation: Invitation
}
```

### Nowe typy (ViewModels dla UI):

```typescript
// Rola użytkownika w gospodarstwie
type HouseholdRole = 'owner' | 'member'

// Model widoku strony dashboard
// Uwaga: invitations[] usunięte - brak funkcjonalności zaproszeń w obecnej wersji
interface HouseholdDashboardViewModel {
  household: HouseholdWithMembers | null
  userRole: HouseholdRole | null
  isLoading: boolean
  error: string | null
}

// Członek z rolą (rozszerzenie User o informacje o roli)
interface MemberWithRole extends User {
  role: HouseholdRole
  joinedAt: string
  isCurrentUser: boolean
}

// Stan formularza edycji nazwy
interface EditHouseholdNameFormData {
  name: string
  isSubmitting: boolean
  error: string | null
}

// Stan formularza tworzenia gospodarstwa
interface CreateHouseholdFormData {
  name: string
  isSubmitting: boolean
  error: string | null
}

// NIEUŻYWANE W OBECNEJ WERSJI (przyszłość):
// Stan formularza zaproszenia
interface InviteMemberFormData {
  email: string
  isSubmitting: boolean
  error: string | null
}

// Status zaproszenia (do wyświetlenia w UI)
type InvitationStatus = 'pending' | 'expired'

// Rozszerzenie Invitation o status UI
interface InvitationViewModel extends Invitation {
  status: InvitationStatus
  isExpired: boolean
}
```

### Typy błędów:

```typescript
// Błędy API mapowane na przyjazne komunikaty
interface HouseholdError {
  code: 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'VALIDATION' | 'NETWORK' | 'UNKNOWN'
  message: string
  details?: unknown
}
```

## 6. Zarządzanie stanem

### Stan lokalny komponentu strony (HouseholdDashboardPage):

```typescript
const [viewModel, setViewModel] = useState<HouseholdDashboardViewModel>({
  household: null,
  userRole: null,
  isLoading: true,
  error: null,
})

// Stany modali (każdy modal kontrolowany osobnym stanem)
// Uwaga: brak modali dla zaproszeń i usuwania członków w obecnej wersji
const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false)
const [isCreateOwnModalOpen, setIsCreateOwnModalOpen] = useState(false)
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
```

### Custom hook: `useHouseholdDashboard`

Encapsulacja logiki pobierania i zarządzania danymi gospodarstwa:

```typescript
/**
 * Hook do zarządzania danymi dashboard gospodarstwa
 * Uwaga: fetchInvitations usunięte - brak funkcjonalności zaproszeń w obecnej wersji
 *
 * @returns {UseHouseholdDashboardReturn} Stan i metody do zarządzania gospodarstwem
 */
function useHouseholdDashboard(): UseHouseholdDashboardReturn {
  const [viewModel, setViewModel] = useState<HouseholdDashboardViewModel>(...)

  // Pobranie danych gospodarstwa
  const fetchHousehold = useCallback(async () => { ... })

  // Odświeżenie danych
  const refresh = useCallback(async () => {
    await fetchHousehold()
  })

  // Inicjalizacja przy montowaniu
  useEffect(() => {
    fetchHousehold()
  }, [])

  return {
    viewModel,
    refresh,
    fetchHousehold,
  }
}

interface UseHouseholdDashboardReturn {
  viewModel: HouseholdDashboardViewModel
  refresh: () => Promise<void>
  fetchHousehold: () => Promise<void>
}
```

### Custom hook: `useHouseholdActions`

Encapsulacja akcji CRUD na gospodarstwie:

```typescript
/**
 * Hook do wykonywania akcji na gospodarstwie
 * Uwaga: inviteMember, removeMember, cancelInvitation usunięte -
 * brak funkcjonalności zaproszeń i zarządzania członkami w obecnej wersji
 *
 * @param householdId - ID gospodarstwa
 * @param onSuccess - Callback po udanej operacji
 * @returns {UseHouseholdActionsReturn} Metody akcji
 */
function useHouseholdActions(
  householdId: string,
  onSuccess: () => void
): UseHouseholdActionsReturn {
  const updateName = useCallback(async (name: string): Promise<void> => {
    // PATCH /api/households/{householdId}
  })

  const deleteHousehold = useCallback(async (): Promise<void> => {
    // DELETE /api/households/{householdId}
  })

  const createOwnHousehold = useCallback(async (name: string): Promise<Household> => {
    // POST /api/households
  })

  return {
    updateName,
    deleteHousehold,
    createOwnHousehold,
  }
}

interface UseHouseholdActionsReturn {
  updateName: (name: string) => Promise<void>
  deleteHousehold: () => Promise<void>
  createOwnHousehold: (name: string) => Promise<Household>
}
```

## 7. Integracja API

### Endpoint: GET /api/households

**Cel:** Pobranie gospodarstwa użytkownika

**Request:**

- Metoda: GET
- Headers: Cookie-based auth (automatyczne)
- Body: brak

**Response:**

```typescript
// 200 OK
{
  data: Household[] // array z 0 lub 1 elementem
}

// Typy:
type Response = HouseholdsListResponse
```

**Wykorzystanie:**

```typescript
const response = await fetch('/api/households', {
  method: 'GET',
  credentials: 'include',
})

if (response.ok) {
  const { data }: HouseholdsListResponse = await response.json()
  const household = data[0] ?? null
}
```

### Endpoint: GET /api/households/{householdId}

**Cel:** Pobranie szczegółów gospodarstwa z listą członków

**Request:**

- Metoda: GET
- Path params: `householdId` (UUID)
- Headers: Cookie-based auth

**Response:**

```typescript
// 200 OK
{
  id: string
  name: string
  createdAt: string
  memberCount: number
  members: User[]
}

// Typy:
type Response = GetHouseholdResponse // alias HouseholdWithMembers
```

**Kody błędów:**

- 400 Bad Request - invalid UUID format
- 401 Unauthorized - brak autentykacji
- 404 Not Found - gospodarstwo nie istnieje lub użytkownik nie jest członkiem

### Endpoint: PATCH /api/households/{householdId}

**Cel:** Zmiana nazwy gospodarstwa (tylko właściciel)

**Request:**

- Metoda: PATCH
- Path params: `householdId` (UUID)
- Headers: Cookie-based auth, Content-Type: application/json
- Body:

```typescript
{
  name: string // 3-50 znaków, trimmed
}

// Typ:
// Zgodny z HouseholdNameSchema z src/lib/validation/households.ts
```

**Response:**

```typescript
// 200 OK
{
  id: string
  name: string
  createdAt: string
}

// Typ:
type Response = Household
```

**Kody błędów:**

- 400 Bad Request - walidacja nie powiodła się
- 401 Unauthorized
- 403 Forbidden - użytkownik nie jest właścicielem
- 404 Not Found

### Endpoint: DELETE /api/households/{householdId}

**Cel:** Usunięcie gospodarstwa (tylko właściciel, brak innych członków)

**Request:**

- Metoda: DELETE
- Path params: `householdId` (UUID)
- Headers: Cookie-based auth
- Body: brak

**Response:**

```typescript
// 204 No Content
// Brak body
```

**Kody błędów:**

- 401 Unauthorized
- 403 Forbidden - użytkownik nie jest właścicielem
- 404 Not Found
- 409 Conflict - gospodarstwo ma innych członków

### Endpoint: POST /api/households

**Cel:** Utworzenie nowego gospodarstwa (tylko dla członków cudzego gospodarstwa)

**Request:**

- Metoda: POST
- Headers: Cookie-based auth, Content-Type: application/json
- Body:

```typescript
{
  name: string // 3-50 znaków, trimmed
}

// Typ:
type Request = CreateHouseholdRequest
```

**Response:**

```typescript
// 201 Created
{
  id: string
  name: string
  createdAt: string
}

// Headers:
// Location: /api/households/{id}

// Typ:
type Response = CreateHouseholdResponse // alias Household
```

**Kody błędów:**

- 400 Bad Request - walidacja
- 401 Unauthorized
- 409 Conflict - użytkownik już jest właścicielem gospodarstwa

### Endpoint: POST /api/households/{householdId}/members (NIEUŻYWANE - przyszłość)

**Uwaga:** Ten endpoint nie jest używany w obecnej wersji z powodu braku funkcjonalności zaproszeń.

**Cel:** Zaproszenie członka (tylko właściciel)

**Status:** Zarezerwowane dla przyszłej implementacji

### Endpoint: GET /api/households/{householdId}/members

**Cel:** Lista członków gospodarstwa

**Request:**

- Metoda: GET
- Path params: `householdId` (UUID)
- Headers: Cookie-based auth

**Response:**

```typescript
// 200 OK
{
  data: User[] // array z User objects
}

// Typ:
type Response = MembersListResponse
```

**Uwaga:** Endpoint nie zwraca informacji o rolach. Rola (owner/member) musi być określona przez porównanie `household.owner_id` z `user.id` lub przez dodatkowe zapytanie do tabeli `user_households`.

## 8. Interakcje użytkownika

### 1. Wczytanie strony

**Użytkownik:** Nawiguje do `/household`

**System:**

1. Sprawdza autentykację (middleware)
2. Pobiera gospodarstwo użytkownika: `GET /api/households`
3. Jeśli gospodarstwo istnieje:
   - Pobiera szczegóły: `GET /api/households/{householdId}`
   - Określa rolę użytkownika (owner/member)
4. Wyświetla dashboard lub pusty stan

**Warunki:**

- Loading state podczas pobierania
- Empty state jeśli brak gospodarstwa (opcja utworzenia)
- Error state jeśli błąd API

**Uwaga:** Brak pobierania zaproszeń - funkcjonalność nieobecna w tej wersji

### 2. Edycja nazwy gospodarstwa (tylko właściciel)

**Użytkownik:** Klika "Edytuj nazwę"

**System:**

1. Otwiera `EditHouseholdNameModal`
2. Wyświetla input z aktualną nazwą
3. Użytkownik wprowadza nową nazwę (3-50 znaków)
4. Walidacja na poziomie UI (live lub onBlur)
5. Po kliknięciu "Zapisz":
   - Wywołanie `PATCH /api/households/{householdId}`
   - Loading state na przycisku
6. Po sukcesie:
   - Zamknięcie modala
   - Odświeżenie danych gospodarstwa
   - Toast: "Nazwa gospodarstwa została zmieniona"
7. Po błędzie:
   - Wyświetlenie komunikatu błędu w modalu
   - Modal pozostaje otwarty

**Warunki:**

- Przycisk widoczny tylko dla właściciela
- Walidacja: nazwa 3-50 znaków, wymagana
- Obsługa błędów: 400 (walidacja), 403 (nie właściciel), 404

### 3. Utworzenie własnego gospodarstwa (tylko członek)

**Użytkownik:** Klika "Utwórz własne gospodarstwo"

**System:**

1. Otwiera `CreateOwnHouseholdModal`
2. Wyświetla ostrzeżenie: "Opuścisz obecne gospodarstwo: {name}"
3. Użytkownik wprowadza nazwę nowego gospodarstwa
4. Walidacja na poziomie UI
5. Po kliknięciu "Utwórz":
   - Wywołanie `POST /api/households`
   - Loading state
6. Po sukcesie:
   - Zamknięcie modala
   - Przekierowanie lub odświeżenie do nowego gospodarstwa
   - Toast: "Utworzono nowe gospodarstwo"
7. Po błędzie:
   - Wyświetlenie błędu
   - Modal pozostaje otwarty

**Warunki:**

- Przycisk widoczny tylko dla członków (nie właścicieli)
- Automatyczne opuszczenie poprzedniego gospodarstwa (API)
- Walidacja: nazwa 3-50 znaków
- Obsługa błędów: 400 (walidacja), 409 (już właściciel)

### 4. Usunięcie gospodarstwa (tylko właściciel)

**Użytkownik:** Klika "Usuń gospodarstwo"

**System:**

1. Sprawdza czy są inni członkowie
2. Jeśli są inni członkowie:
   - Wyświetla błąd: "Nie można usunąć gospodarstwa z członkami"
   - Nie otwiera modala
3. Jeśli nie ma innych członków:
   - Otwiera `DeleteHouseholdModal`
   - Wyświetla ostrzeżenie o trwałym usunięciu
4. Użytkownik potwierdza usunięcie
5. Wywołanie `DELETE /api/households/{householdId}`
6. Po sukcesie:
   - Przekierowanie do strony tworzenia nowego gospodarstwa
   - Toast: "Gospodarstwo zostało usunięte"
7. Po błędzie:
   - Wyświetlenie komunikatu błędu
   - Modal pozostaje otwarty

**Warunki:**

- Przycisk widoczny tylko dla właściciela
- Możliwe tylko gdy `memberCount === 1`
- Obsługa błędów: 403 (nie właściciel), 409 (są członkowie)
- Cascade delete wszystkich danych (pantry, recipes, shopping lists)

### 5. Zaproszenie członka (NIEIMPLEMENTOWANE - przyszłość)

**Uwaga:** Ta funkcjonalność nie jest dostępna w obecnej wersji.

**Status:** Zarezerwowane dla przyszłej implementacji

### 6. Usunięcie członka (NIEIMPLEMENTOWANE - przyszłość)

**Uwaga:** Ta funkcjonalność nie jest dostępna w obecnej wersji.

**Status:** Zarezerwowane dla przyszłej implementacji

### 7. Anulowanie zaproszenia (NIEIMPLEMENTOWANE - przyszłość)

**Uwaga:** Ta funkcjonalność nie jest dostępna w obecnej wersji.

**Status:** Zarezerwowane dla przyszłej implementacji

## 9. Warunki i walidacja

### Walidacja na poziomie UI (client-side):

#### Edycja nazwy gospodarstwa:

- **Pole:** `name`
- **Warunki:**
  - Wymagane (nie może być puste)
  - Min 3 znaki
  - Max 50 znaków
  - Trimmed (usunięcie białych znaków na początku i końcu)
- **Komunikaty błędów:**
  - Puste: "Nazwa gospodarstwa jest wymagana"
  - Za krótka: "Nazwa musi mieć minimum 3 znaki"
  - Za długa: "Nazwa może mieć maksymalnie 50 znaków"
- **Moment walidacji:** onBlur lub onChange (live feedback)

#### Zaproszenie członka:

- **Pole:** `invitedEmail`
- **Warunki:**
  - Wymagane
  - Format email (regex lub HTML5 validation)
  - Max 255 znaków
  - Lowercase (automatyczna konwersja)
  - Trimmed
- **Komunikaty błędów:**
  - Puste: "Email jest wymagany"
  - Nieprawidłowy format: "Wprowadź prawidłowy adres email"
  - Za długi: "Email może mieć maksymalnie 255 znaków"
- **Moment walidacji:** onBlur lub onChange

### Warunki widoczności elementów UI:

#### Przyciski akcji (HouseholdActions):

- **"Edytuj nazwę":**
  - Warunek: `userRole === 'owner'`
  - Disabled gdy: `isLoading`
- **"Usuń gospodarstwo":**
  - Warunek: `userRole === 'owner' && memberCount === 1`
  - Disabled gdy: `isLoading || memberCount > 1`
  - Tooltip gdy disabled: "Nie można usunąć gospodarstwa z innymi członkami"
- **"Utwórz własne gospodarstwo":**
  - Warunek: `userRole === 'member'`
  - Disabled gdy: `isLoading`

#### Lista członków:

- **Lista tylko do odczytu** - brak przycisków akcji w obecnej wersji
- **Indicator aktualnego użytkownika:**
  - Warunek: `member.isCurrentUser === true`
  - Wyświetlenie badge "Ty"

#### Sekcja zaproszeń (NIEIMPLEMENTOWANE):

**Uwaga:** Cała sekcja zaproszeń nie jest implementowana w obecnej wersji.

### Warunki biznesowe (weryfikowane przez API):

#### Edycja nazwy:

- Tylko właściciel (403 jeśli nie)
- Użytkownik musi być członkiem (404 jeśli nie)

#### Usunięcie gospodarstwa:

- Tylko właściciel (403 jeśli nie)
- Brak innych członków (409 jeśli są)
- Użytkownik musi być członkiem (404 jeśli nie)

#### Utworzenie własnego gospodarstwa:

- Użytkownik nie może już być właścicielem (409 jeśli jest)
- Automatyczne opuszczenie poprzedniego gospodarstwa (jeśli był członkiem)

#### Zaproszenie członka (NIEIMPLEMENTOWANE):

**Uwaga:** Funkcjonalność niedostępna w obecnej wersji.

#### Usunięcie członka (NIEIMPLEMENTOWANE):

**Uwaga:** Funkcjonalność niedostępna w obecnej wersji.

### Walidacja zgodności z Zod schemas:

Wszystkie formularze muszą być zgodne z odpowiednimi schematami z `src/lib/validation/households.ts`:

```typescript
// HouseholdNameSchema - używany do edycji nazwy i tworzenia gospodarstwa
{
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be at most 50 characters')
    .trim()
}

// UUIDSchema - walidacja UUID w path params
z.string().uuid('Invalid UUID format')

// NIEUŻYWANE W OBECNEJ WERSJI (przyszłość):
// InviteMemberSchema - używany do zapraszania członków
{
  invitedEmail: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be at most 255 characters')
    .toLowerCase()
    .trim()
}
```

## 10. Obsługa błędów

### Mapowanie kodów błędów API na komunikaty UI:

#### 400 Bad Request (Validation Error):

```typescript
// API response:
{
  error: "Validation failed",
  details: [
    { field: "name", message: "Name must be at least 3 characters" }
  ]
}

// UI action:
// Wyświetlenie szczegółowych błędów walidacji przy odpowiednich polach formularza
// Nie zamykanie modala, umożliwienie poprawki
```

**Komunikat:**

- Dla pola: wyświetlić `details[].message`
- Ogólny: "Sprawdź poprawność wprowadzonych danych"

#### 401 Unauthorized:

```typescript
// UI action:
// Przekierowanie do strony logowania
// Toast: "Sesja wygasła. Zaloguj się ponownie."
```

#### 403 Forbidden:

```typescript
// API response:
{
  error: "Forbidden",
  message: "Only the owner can perform this action"
}

// UI action:
// Wyświetlenie komunikatu błędu
// Odświeżenie strony (może być desynchronizacja danych)
```

**Komunikat:** "Nie masz uprawnień do wykonania tej akcji"

#### 404 Not Found:

```typescript
// API response:
{
  error: "Not Found",
  message: "Household not found"
}

// UI action:
// Toast: "Gospodarstwo nie zostało znalezione"
// Przekierowanie do strony głównej lub pustego stanu
```

**Komunikat:** "Gospodarstwo nie zostało znalezione lub nie masz do niego dostępu"

#### 409 Conflict:

```typescript
// Przykłady z różnych endpointów:

// 1. Tworzenie gospodarstwa gdy już jesteś właścicielem
{
  error: "Conflict",
  message: "Already own a household"
}
// Komunikat: "Posiadasz już własne gospodarstwo"

// 2. Usuwanie gospodarstwa z członkami
{
  error: "Conflict",
  message: "Cannot delete household with other members"
}
// Komunikat: "Nie można usunąć gospodarstwa, które ma innych członków. Najpierw usuń wszystkich członków."

// 3. Zapraszanie członka który już jest w gospodarstwie
{
  error: "Conflict",
  message: "User is already a member"
}
// Komunikat: "Ten użytkownik jest już członkiem gospodarstwa"
```

#### 500 Internal Server Error:

```typescript
// API response:
{
  error: "Internal Server Error",
  message: "An unexpected error occurred"
}

// UI action:
// Toast: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."
// Logowanie błędu do konsoli
// Opcjonalnie: retry button
```

**Komunikat:** "Coś poszło nie tak. Spróbuj ponownie za chwilę."

### Obsługa błędów sieciowych:

```typescript
// Network error (fetch failed)
try {
  const response = await fetch(...)
} catch (error) {
  // Toast: "Brak połączenia z internetem. Sprawdź swoje połączenie."
  // Przycisk retry w komunikacie
}

// Timeout
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 10000)

try {
  const response = await fetch(..., { signal: controller.signal })
} catch (error) {
  if (error.name === 'AbortError') {
    // Toast: "Żądanie przekroczyło limit czasu. Spróbuj ponownie."
  }
}
```

### Strategia wyświetlania błędów:

1. **Błędy formularzy (400):**
   - Inline errors przy polach formularza
   - Wyróżnienie pól z błędami (czerwona ramka)
   - Alert na górze formularza z ogólnym komunikatem

2. **Błędy autoryzacji (401, 403):**
   - Toast notification (krótki komunikat)
   - Automatyczne przekierowanie (401) lub odświeżenie strony (403)

3. **Błędy nie znaleziono (404):**
   - Toast notification
   - Przekierowanie do bezpiecznego stanu (lista lub pusty stan)

4. **Błędy konfliktu (409):**
   - Alert w modalu z szczegółowym wyjaśnieniem
   - Propozycja alternatywnego działania (np. usuń członków przed usunięciem gospodarstwa)

5. **Błędy serwera (500) i sieciowe:**
   - Toast notification z przyciskiem "Spróbuj ponownie"
   - Opcjonalnie: przycisk "Odśwież stronę"
   - Logowanie do konsoli dla debugowania

### Komponenty UI do obsługi błędów:

```typescript
// ErrorAlert - komponent do wyświetlania błędów w modalach
<ErrorAlert
  error={error}
  onRetry={handleRetry}
  onDismiss={() => setError(null)}
/>

// Toast notifications - globalny system toastów
toast.error('Komunikat błędu', {
  action: {
    label: 'Spróbuj ponownie',
    onClick: handleRetry,
  },
})

// EmptyState - gdy brak gospodarstwa
<EmptyState
  icon={HomeIcon}
  title="Nie masz jeszcze gospodarstwa"
  description="Utwórz nowe gospodarstwo aby rozpocząć"
  action={
    <Button onClick={openCreateModal}>
      Utwórz gospodarstwo
    </Button>
  }
/>
```

### Logging błędów:

```typescript
// Funkcja helper do logowania błędów
function logError(context: string, error: unknown) {
  console.error(`[HouseholdDashboard] ${context}:`, {
    error,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  })

  // W przyszłości: wysyłanie do service monitoringu (np. Sentry)
}

// Użycie:
try {
  await updateName(newName)
} catch (error) {
  logError('Failed to update household name', error)
  setError('Nie udało się zaktualizować nazwy gospodarstwa')
}
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie typów i struktury projektu

**Zadania:**

1. Dodać nowe typy ViewModels do `src/types/types.ts`:
   - `HouseholdRole`
   - `HouseholdDashboardViewModel`
   - `MemberWithRole`
   - `EditHouseholdNameFormData`
   - `CreateHouseholdFormData`
   - `InviteMemberFormData`
   - `InvitationViewModel`
   - `HouseholdError`

2. Sprawdzić czy istnieją schematy walidacji w `src/lib/validation/households.ts`:
   - `HouseholdNameSchema`
   - `InviteMemberSchema`
   - `UUIDSchema`
   - Jeśli nie istnieją - utworzyć

3. Utworzyć strukturę folderów:

   ```
   src/app/household/
     page.tsx (główna strona)
     components/ (komponenty specyficzne dla tego widoku)
       HouseholdHeader.tsx
       HouseholdInfoCard.tsx
       MembersList.tsx
       MemberCard.tsx
       modals/
         EditHouseholdNameModal.tsx
         CreateOwnHouseholdModal.tsx
         DeleteHouseholdModal.tsx

   NIEIMPLEMENTOWANE W OBECNEJ WERSJI:
       InvitationsList.tsx
       InvitationCard.tsx
       modals/
         InviteMemberModal.tsx
         RemoveMemberModal.tsx
   ```

**Rezultat:** Struktura projektu i typy gotowe do implementacji komponentów

### Krok 2: Utworzenie custom hooks

**Zadania:**

1. Utworzyć `src/lib/hooks/useHouseholdDashboard.ts`:
   - Hook do pobierania i zarządzania danymi gospodarstwa
   - Implementacja `fetchHousehold()`
   - Implementacja `refresh()`
   - Zarządzanie stanem `HouseholdDashboardViewModel`
   - **Uwaga:** Brak `fetchInvitations()` - funkcjonalność nieobecna

2. Utworzyć `src/lib/hooks/useHouseholdActions.ts`:
   - Hook do wykonywania akcji CRUD
   - Implementacja `updateName()`
   - Implementacja `deleteHousehold()`
   - Implementacja `createOwnHousehold()`
   - Obsługa błędów i mapowanie na przyjazne komunikaty
   - **Uwaga:** Brak `inviteMember()`, `removeMember()`, `cancelInvitation()` - funkcjonalności nieobecne

3. Utworzyć helper do określania roli użytkownika:

   ```typescript
   // src/lib/utils/household.ts
   export function determineUserRole(
     household: HouseholdWithMembers,
     userId: string
   ): HouseholdRole {
     // Logika określania czy user jest owner czy member
   }

   export function enrichMembersWithRoles(
     members: User[],
     ownerId: string,
     currentUserId: string
   ): MemberWithRole[] {
     // Logika dodawania informacji o rolach do członków
   }
   ```

**Rezultat:** Custom hooks gotowe do użycia w komponentach

### Krok 3: Implementacja komponentów podstawowych (atomów)

**Zadania:**

1. Sprawdzić dostępność komponentów shadcn/ui:
   - Card, CardHeader, CardContent, CardFooter
   - Button
   - Badge
   - Dialog, DialogHeader, DialogContent, DialogFooter
   - AlertDialog + warianty
   - Input
   - Label
   - Alert
   - Jeśli brakuje - dodać przez CLI shadcn

2. Utworzyć komponenty pomocnicze:
   - `ErrorAlert` - do wyświetlania błędów w modalach
   - `EmptyState` - dla pustego stanu gdy brak gospodarstwa
   - `LoadingSpinner` - jeśli nie istnieje

**Rezultat:** Wszystkie potrzebne komponenty UI dostępne

### Krok 4: Implementacja komponentów prezentacyjnych

**Zadania:**

1. Zaimplementować `HouseholdTitle`:
   - Wyświetlanie nazwy jako h1
   - Badge z liczbą członków
   - Stylowanie Tailwind

2. Zaimplementować `HouseholdInfoCard`:
   - Layout z Card
   - Wyświetlanie metadanych (data utworzenia, ID)
   - Badge właściciela jeśli userRole === 'owner'
   - Formatowanie dat

3. Zaimplementować `MemberCard`:
   - Layout z flexbox
   - Wyświetlanie email, roli (badge), daty dołączenia
   - Warunkowy przycisk "Usuń" (tylko dla właściciela, nie dla siebie)
   - Hover states

**Rezultat:** Komponenty prezentacyjne gotowe

**Uwaga:** `InvitationCard` nie jest implementowany w obecnej wersji

### Krok 5: Implementacja komponentów kontenerowych

**Zadania:**

1. Zaimplementować `HouseholdActions`:
   - Grupa przycisków
   - Warunkowe renderowanie na podstawie `userRole`
   - Przekazywanie handlerów onClick
   - Tooltips dla disabled buttons

2. Zaimplementować `HouseholdHeader`:
   - Kompozycja HouseholdTitle + HouseholdActions
   - Responsive layout (stack na mobile)
   - Przekazywanie props

3. Zaimplementować `MembersList`:
   - Header z tytułem i liczbą
   - Mapowanie members na MemberCard
   - Empty state jeśli brak członków (nie powinno się zdarzyć)
   - **Uwaga:** Brak przycisku "Zaproś członka" - funkcjonalność nieobecna

**Rezultat:** Komponenty kontenerowe gotowe

**Uwaga:** `InvitationsList` nie jest implementowany w obecnej wersji

### Krok 6: Implementacja modali

**Zadania:**

1. Zaimplementować `EditHouseholdNameModal`:
   - Dialog z shadcn/ui
   - Formularz z kontrolowanym Input
   - Walidacja (live lub onBlur)
   - Obsługa submit (wywołanie API)
   - Loading state na przycisku
   - Wyświetlanie błędów
   - Callbacks: onSuccess, onOpenChange

2. Zaimplementować `CreateOwnHouseholdModal`:
   - Podobna struktura do EditHouseholdNameModal
   - Alert z ostrzeżeniem o opuszczeniu obecnego gospodarstwa
   - Formularz z nazwą
   - Walidacja
   - Obsługa submit

3. Zaimplementować `DeleteHouseholdModal`:
   - AlertDialog (destructive variant)
   - Wyświetlenie ostrzeżenia
   - Check czy są inni członkowie (props)
   - Przycisk "Usuń" (destructive style)
   - Loading state
   - Obsługa submit

**Rezultat:** Wszystkie modale gotowe

**Uwaga:** `InviteMemberModal` i `RemoveMemberModal` nie są implementowane w obecnej wersji

### Krok 7: Implementacja głównej strony (HouseholdDashboardPage)

**Zadania:**

1. Utworzyć `src/app/household/page.tsx` (liczba pojedyncza!)
2. Użyć hooków:

   ```typescript
   const { viewModel, refresh } = useHouseholdDashboard()
   const actions = useHouseholdActions(viewModel.household?.id, refresh)
   ```

3. Zarządzanie stanem modali:

   ```typescript
   const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false)
   const [isCreateOwnModalOpen, setIsCreateOwnModalOpen] = useState(false)
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
   // Uwaga: brak modali dla zaproszeń i usuwania członków
   ```

4. Obsługa stanów:
   - Loading state (skeleton lub spinner)
   - Empty state (brak gospodarstwa)
   - Error state (błąd pobierania danych)
   - Success state (wyświetlenie dashboard)

5. Kompozycja komponentów:

   ```tsx
   <div className="container mx-auto py-8">
     <HouseholdHeader ... />
     <HouseholdInfoCard ... />
     <MembersList ... />

     {/* Modals */}
     <EditHouseholdNameModal ... />
     <CreateOwnHouseholdModal ... />
     <DeleteHouseholdModal ... />
   </div>
   ```

   **Uwaga:** Brak `InvitationsList` i związanych modali

6. Implementacja handlerów dla modali:
   ```typescript
   const handleEditNameSuccess = (updated: Household) => {
     setIsEditNameModalOpen(false)
     refresh()
     toast.success('Nazwa gospodarstwa została zmieniona')
   }
   // ... podobne dla innych akcji
   ```

**Rezultat:** Pełna strona dashboard działająca

### Krok 8: Stylowanie i responsywność

**Zadania:**

1. Dopracować layout i spacing:
   - Container width i padding
   - Gap między sekcjami
   - Card spacing

2. Responsywność:
   - Mobile: stack HouseholdHeader (kolumna)
   - Tablet: grid dla kart
   - Desktop: optymalne użycie przestrzeni

3. Hover states i transitions:
   - Buttons hover
   - Cards hover (subtle)
   - Smooth transitions

4. Accessibility:
   - ARIA labels dla przycisków
   - Focus management w modalach
   - Keyboard navigation
   - Screen reader support

5. Dark mode (jeśli używany):
   - Sprawdzenie czy kolory działają w dark mode
   - Dostosowanie jeśli potrzeba

**Rezultat:** Przyjazny UI, responsive, accessible

## Podsumowanie

Ten plan implementacji dostarcza kompleksowy przewodnik do stworzenia widoku Household Dashboard. Plan obejmuje:

- **Strukturę komponentów:** Hierarchiczna struktura z atomami, molekułami i organizmami
- **Typy:** Szczegółowe DTOs i ViewModels
- **Stan:** Custom hooks do zarządzania danymi i akcjami
- **API:** Integracja z endpointami households (GET, PATCH, POST, DELETE)
- **UX:** Intuicyjne interakcje z role-based permissions
- **Walidacja:** Client-side i server-side validation
- **Błędy:** Comprehensive error handling i user-friendly messages
- **Kroki:** Step-by-step implementation guide

**Ważne ograniczenia obecnej wersji:**

- **Brak funkcjonalności zaproszeń** - nie można zapraszać nowych członków
- **Brak usuwania członków** - lista członków tylko do odczytu
- **Jeden household per user** - użytkownik ma dostęp tylko do jednego gospodarstwa
- **Routing:** `/household` (liczba pojedyncza, nie `/households`)

**Zakres implementacji:**

- ✅ Wyświetlanie informacji o gospodarstwie
- ✅ Lista członków (read-only)
- ✅ Edycja nazwy gospodarstwa (właściciel)
- ✅ Tworzenie własnego gospodarstwa (członek)
- ✅ Usuwanie gospodarstwa (właściciel, bez innych członków)
- ❌ Zapraszanie członków (przyszłość)
- ❌ Usuwanie członków (przyszłość)
- ❌ Zarządzanie zaproszeniami (przyszłość)

Implementacja powinna zająć ok. 2-3 dni roboczych dla doświadczonego frontend developera (zakładając, że API endpoints już istnieją i działają). Czas jest krótszy niż pierwotnie zakładane 3-5 dni ze względu na brak funkcjonalności zaproszeń.

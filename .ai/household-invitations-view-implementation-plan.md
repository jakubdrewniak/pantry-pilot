# Plan implementacji widoku: Zaproszenia w Gospodarstwie Domowym

## 1. Przegląd

Widok zaproszeń w gospodarstwie domowym umożliwia właścicielom gospodarstw zapraszanie nowych członków oraz pozwala zaproszonym użytkownikom przeglądać i akceptować otrzymane zaproszenia. Funkcjonalność ta jest zintegrowana z istniejącą stroną `/household` i składa się z dwóch głównych perspektyw:

- **Perspektywa właściciela (owner)**: tworzenie zaproszeń, przeglądanie wysłanych zaproszeń i ich anulowanie
- **Perspektywa użytkownika (any authenticated user)**: przeglądanie otrzymanych zaproszeń i ich akceptacja

Dodatkowo, w nawigacji aplikacji wyświetlany jest badge informujący o liczbie oczekujących zaproszeń dla zalogowanego użytkownika.

## 2. Routing widoku

Widok jest zintegrowany z istniejącą stroną:

- **Ścieżka główna**: `/household`
- **Plik**: `src/app/household/page.tsx`

Dodatkowo badge z powiadomieniami jest dodawany do komponentu nawigacji (główny layout).

## 3. Struktura komponentów

```
/household page (existing - src/app/household/page.tsx)
├── [Existing household content]
└── HouseholdInvitationsSection (new)
    ├── [Conditional: if userRole === 'owner']
    │   ├── CreateInvitationForm (new)
    │   └── SentInvitationsList (new)
    │       └── SentInvitationItem (new) × N
    └── [Always visible]
        └── ReceivedInvitationsList (new)
            └── ReceivedInvitationCard (new) × N

Navigation component (existing - modify)
└── InvitationNotificationBadge (new)
```

**Nowe komponenty do utworzenia:**

1. `InvitationNotificationBadge` - badge w nawigacji
2. `HouseholdInvitationsSection` - główny kontener sekcji zaproszeń
3. `CreateInvitationForm` - formularz tworzenia zaproszenia
4. `SentInvitationsList` - lista wysłanych zaproszeń
5. `SentInvitationItem` - pojedyncze wysłane zaproszenie
6. `ReceivedInvitationsList` - lista otrzymanych zaproszeń
7. `ReceivedInvitationCard` - karta otrzymanego zaproszenia

## 4. Szczegóły komponentów

### 4.1 InvitationNotificationBadge

**Lokalizacja**: `src/app/household/components/InvitationNotificationBadge.tsx`

**Opis komponentu:**
Badge wyświetlany w głównej nawigacji aplikacji, informujący użytkownika o liczbie oczekujących zaproszeń. Widoczny tylko gdy użytkownik ma co najmniej jedno oczekujące zaproszenie. Badge jest odświeżany automatycznie co 30 sekund.

**Główne elementy HTML:**

- `<div>` z klasami Tailwind dla badge (rounded, background, padding)
- `<span>` zawierający liczbę zaproszeń
- Opcjonalnie ikona dzwonka (z lucide-react)

**Komponenty dzieci:**
Brak (komponent atomowy)

**Obsługiwane zdarzenia:**

- `onClick` - przekierowanie do `/household` (scroll do sekcji zaproszeń)

**Warunki walidacji:**
Brak - komponent read-only, wyświetla dane pobrane z API.

**Typy:**

- `InvitationNotificationViewModel` (ViewModel)
- `CurrentUserInvitationsResponse` (Response DTO)

**Propsy:**

```typescript
interface InvitationNotificationBadgeProps {
  className?: string
}
```

---

### 4.2 HouseholdInvitationsSection

**Lokalizacja**: `src/app/household/components/HouseholdInvitationsSection.tsx`

**Opis komponentu:**
Główny kontener zarządzający sekcją zaproszeń na stronie gospodarstwa domowego. Odpowiedzialny za warunkowe renderowanie komponentów w zależności od roli użytkownika (owner vs member). Wyświetla sekcję wysłanych zaproszeń tylko dla właściciela, ale sekcję otrzymanych zaproszeń dla wszystkich użytkowników.

**Główne elementy HTML:**

- `<section>` - główny kontener z odpowiednim padding i margin
- `<h2>` - nagłówek "Zaproszenia" lub "Invitations"
- `<div>` - kontenery dla poszczególnych podsekcji

**Komponenty dzieci:**

- `CreateInvitationForm` (conditional - tylko dla owner)
- `SentInvitationsList` (conditional - tylko dla owner)
- `ReceivedInvitationsList` (zawsze)

**Obsługiwane zdarzenia:**
Brak (komponent kontenerowy przekazuje propsy do dzieci)

**Warunki walidacji:**
Brak - komponent kontenerowy

**Typy:**

- `HouseholdRole` (z types.ts)
- `Household` (z types.ts)

**Propsy:**

```typescript
interface HouseholdInvitationsSectionProps {
  householdId: string
  userRole: HouseholdRole
  className?: string
}
```

---

### 4.3 CreateInvitationForm

**Lokalizacja**: `src/app/household/components/CreateInvitationForm.tsx`

**Opis komponentu:**
Formularz umożliwiający właścicielowi gospodarstwa domowego wysłanie zaproszenia do nowego użytkownika poprzez wprowadzenie adresu email. Po pomyślnym utworzeniu zaproszenia, formularz jest czyszczony, a lista wysłanych zaproszeń jest odświeżana.

**Główne elementy HTML:**

- `<form>` - główny kontener formularza
- `<label>` - etykieta dla pola email
- `<input type="email">` - pole wprowadzania adresu email (lub shadcn/ui Input)
- `<button type="submit">` - przycisk "Wyślij zaproszenie" (lub shadcn/ui Button)
- `<span>` lub `<p>` - komunikat błędu walidacji/API

**Komponenty dzieci:**

- shadcn/ui `Input`
- shadcn/ui `Button`
- shadcn/ui `Label`
- Opcjonalnie: shadcn/ui `Alert` dla błędów

**Obsługiwane zdarzenia:**

- `onSubmit` - wysłanie formularza (preventDefault, walidacja, POST request)
- `onChange` - zmiana wartości pola email (czyszczenie błędów, live validation)
- `onBlur` - utrata focusa (walidacja pola)

**Warunki walidacji:**

1. **Email required**: pole nie może być puste
   - Błąd: "Adres email jest wymagany"
2. **Email format**: musi być poprawny format email (regex: RFC 5322)
   - Błąd: "Nieprawidłowy format adresu email"
3. **Email max length**: maksymalnie 255 znaków
   - Błąd: "Adres email może mieć maksymalnie 255 znaków"
4. **API validation errors**:
   - 403 Forbidden: "Nie masz uprawnień do wysyłania zaproszeń"
   - 404 Not Found: "Gospodarstwo domowe nie zostało znalezione"
   - 409 Conflict (already member): "Ten użytkownik jest już członkiem gospodarstwa"
   - 409 Conflict (already invited): "Zaproszenie dla tego adresu email już istnieje"
   - 400 Bad Request: "Nieprawidłowe dane wejściowe"

**Typy:**

- `CreateInvitationFormData` (ViewModel - nowy)
- `CreateInvitationRequest` (Request DTO)
- `CreateInvitationResponse` (Response DTO)

**Propsy:**

```typescript
interface CreateInvitationFormProps {
  householdId: string
  onInvitationCreated?: () => void // callback do odświeżenia listy
}
```

---

### 4.4 SentInvitationsList

**Lokalizacja**: `src/app/household/components/SentInvitationsList.tsx`

**Opis komponentu:**
Lista wszystkich oczekujących zaproszeń wysłanych przez właściciela gospodarstwa domowego. Wyświetla stan ładowania, komunikaty o błędach oraz pustą listę gdy brak zaproszeń. Każde zaproszenie jest renderowane jako osobny komponent `SentInvitationItem`.

**Główne elementy HTML:**

- `<div>` - główny kontener listy
- `<h3>` - nagłówek "Wysłane zaproszenia"
- `<ul>` lub `<div>` - kontener dla elementów listy
- `<p>` - komunikat gdy lista jest pusta: "Brak wysłanych zaproszeń"
- Opcjonalnie: `<div>` dla loading spinner

**Komponenty dzieci:**

- `SentInvitationItem` × N
- shadcn/ui `Skeleton` (loading state)
- shadcn/ui `Alert` (error state)

**Obsługiwane zdarzenia:**
Brak - przekazuje callback do dzieci

**Warunki walidacji:**
Brak - komponent read-only list

**Typy:**

- `SentInvitationsViewModel` (ViewModel - nowy)
- `InvitationsListResponse` (Response DTO)
- `Invitation` (DTO)

**Propsy:**

```typescript
interface SentInvitationsListProps {
  householdId: string
  refreshTrigger?: number // do wymuszenia odświeżenia po create
}
```

---

### 4.5 SentInvitationItem

**Lokalizacja**: `src/app/household/components/SentInvitationItem.tsx`

**Opis komponentu:**
Wyświetla pojedyncze wysłane zaproszenie z informacjami o zaproszonym adresie email, dacie utworzenia i dacie wygaśnięcia. Zawiera przycisk "Anuluj" umożliwiający właścicielowi usunięcie zaproszenia. Przed anulowaniem wyświetlany jest dialog potwierdzenia.

**Główne elementy HTML:**

- `<li>` lub `<div>` - kontener elementu (Card z shadcn/ui)
- `<div>` - informacje o zaproszeniu (email, daty)
- `<span>` lub `<p>` - zaproszony email (invitedEmail)
- `<span>` - data utworzenia (formatowana relatywnie: "2 dni temu")
- `<span>` - data wygaśnięcia (formatowana relatywnie: "wygasa za 5 dni")
- `<button>` - przycisk "Anuluj" (shadcn/ui Button variant destructive)

**Komponenty dzieci:**

- shadcn/ui `Card`, `CardContent`, `CardFooter`
- shadcn/ui `Button`
- shadcn/ui `AlertDialog` (confirmation)

**Obsługiwane zdarzenia:**

- `onClick` (przycisk Anuluj) - otwarcie dialogu potwierdzenia
- `onConfirm` (dialog) - DELETE request do API, następnie callback onDeleted

**Warunki walidacji:**

1. **Confirmation required**: przed anulowaniem wymagane potwierdzenie użytkownika
   - Dialog: "Czy na pewno chcesz anulować to zaproszenie?"
2. **API validation errors**:
   - 403 Forbidden: "Nie masz uprawnień do anulowania zaproszeń"
   - 404 Not Found: "Zaproszenie nie zostało znalezione"

**Typy:**

- `Invitation` (DTO)

**Propsy:**

```typescript
interface SentInvitationItemProps {
  invitation: Invitation
  householdId: string
  onDeleted?: (invitationId: string) => void
}
```

---

### 4.6 ReceivedInvitationsList

**Lokalizacja**: `src/app/household/components/ReceivedInvitationsList.tsx`

**Opis komponentu:**
Lista wszystkich oczekujących zaproszeń otrzymanych przez zalogowanego użytkownika. Wyświetla zaproszenia z kontekstem gospodarstwa domowego (nazwa, email właściciela). Widoczna dla wszystkich zalogowanych użytkowników. Obsługuje stany: ładowanie, błąd, pusta lista.

**Główne elementy HTML:**

- `<div>` - główny kontener listy
- `<h3>` - nagłówek "Otrzymane zaproszenia"
- `<div>` - kontener dla kart zaproszeń (grid lub flex)
- `<p>` - komunikat gdy lista jest pusta: "Nie masz oczekujących zaproszeń"
- Opcjonalnie: `<div>` dla loading spinner

**Komponenty dzieci:**

- `ReceivedInvitationCard` × N
- shadcn/ui `Skeleton` (loading state)
- shadcn/ui `Alert` (error state)

**Obsługiwane zdarzenia:**
Brak - przekazuje callback do dzieci

**Warunki walidacji:**
Brak - komponent read-only list

**Typy:**

- `ReceivedInvitationsViewModel` (ViewModel - nowy)
- `CurrentUserInvitationsResponse` (Response DTO)
- `InvitationWithHousehold` (DTO)

**Propsy:**

```typescript
interface ReceivedInvitationsListProps {
  refreshTrigger?: number // do wymuszenia odświeżenia po accept
}
```

---

### 4.7 ReceivedInvitationCard

**Lokalizacja**: `src/app/household/components/ReceivedInvitationCard.tsx`

**Opis komponentu:**
Karta wyświetlająca szczegóły otrzymanego zaproszenia z kontekstem gospodarstwa domowego: nazwa gospodarstwa, email właściciela, data wygaśnięcia. Zawiera przycisk "Akceptuj" umożliwiający dołączenie do gospodarstwa. Opcjonalnie wyświetla dialog potwierdzenia przed akceptacją.

**Główne elementy HTML:**

- `<div>` - kontener karty (Card z shadcn/ui)
- `<div>` - nagłówek z nazwą gospodarstwa (householdName)
- `<p>` - email właściciela (ownerEmail)
- `<p>` - zaproszony email (invitedEmail) - dla weryfikacji
- `<span>` - data wygaśnięcia (formatowana relatywnie: "wygasa za 3 dni")
- `<button>` - przycisk "Akceptuj" (shadcn/ui Button variant default)

**Komponenty dzieci:**

- shadcn/ui `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- shadcn/ui `Button`
- Opcjonalnie: shadcn/ui `AlertDialog` (confirmation)
- Ikony (lucide-react): `Mail`, `User`, `Calendar`

**Obsługiwane zdarzenia:**

- `onClick` (przycisk Akceptuj) - opcjonalnie dialog potwierdzenia, następnie PATCH request
- `onConfirm` (optional dialog) - PATCH request do API, następnie callback onAccepted

**Warunki walidacji:**

1. **Optional confirmation**: opcjonalne potwierdzenie przed akceptacją
   - Dialog: "Czy na pewno chcesz dołączyć do gospodarstwa [nazwa]?"
2. **API validation errors**:
   - 400 Bad Request (expired): "To zaproszenie wygasło"
   - 403 Forbidden: "To zaproszenie nie jest przeznaczone dla Ciebie"
   - 404 Not Found: "Zaproszenie nie zostało znalezione"
   - 409 Conflict: "Jesteś już członkiem tego gospodarstwa"

**Typy:**

- `InvitationWithHousehold` (DTO)
- `AcceptInvitationRequest` (Request DTO)
- `AcceptInvitationResponse` (Response DTO)

**Propsy:**

```typescript
interface ReceivedInvitationCardProps {
  invitation: InvitationWithHousehold
  onAccepted?: (householdId: string) => void
}
```

---

## 5. Typy

### 5.1 Typy istniejące (z src/types/types.ts)

Następujące typy są już zdefiniowane i będą używane bez zmian:

**DTOs (Data Transfer Objects):**

```typescript
// Zaproszenie - podstawowy typ
export interface Invitation {
  id: string
  householdId: string
  invitedEmail: string
  token: string
  expiresAt: string
  createdAt: string
}

// Zaproszenie z kontekstem gospodarstwa - dla otrzymanych zaproszeń
export interface InvitationWithHousehold extends Invitation {
  householdName: string
  ownerEmail: string
}

// Gospodarstwo domowe
export interface Household {
  id: string
  name: string
  createdAt: string
  memberCount?: number
  ownerId?: string
}

// Rola użytkownika w gospodarstwie
export type HouseholdRole = 'owner' | 'member'
```

**Request DTOs:**

```typescript
// Żądanie utworzenia zaproszenia
export interface CreateInvitationRequest {
  invitedEmail: string
}

// Żądanie akceptacji zaproszenia
export interface AcceptInvitationRequest {
  token: string
}
```

**Response DTOs:**

```typescript
// Odpowiedź: lista zaproszeń (wysłane przez owner)
export interface InvitationsListResponse {
  data: Invitation[]
}

// Odpowiedź: utworzone zaproszenie
export interface CreateInvitationResponse {
  invitation: Invitation
}

// Odpowiedź: zaakceptowane zaproszenie
export interface AcceptInvitationResponse {
  membership: Membership
}

// Odpowiedź: lista zaproszeń dla zalogowanego użytkownika
export interface CurrentUserInvitationsResponse {
  data: InvitationWithHousehold[]
}
```

### 5.2 Nowe typy ViewModel (do dodania do src/types/types.ts)

Następujące typy ViewModels należy dodać do pliku `src/types/types.ts` w sekcji "VIEW MODELS":

```typescript
// ============================================================================
// INVITATION VIEW MODELS
// ============================================================================

/**
 * View model dla badge'a z powiadomieniami o zaproszeniach
 * Używany w: InvitationNotificationBadge
 */
export interface InvitationNotificationViewModel {
  count: number // liczba oczekujących zaproszeń
  isLoading: boolean
}

/**
 * View model dla formularza tworzenia zaproszenia
 * Używany w: CreateInvitationForm
 */
export interface CreateInvitationFormData {
  invitedEmail: string // adres email zapraszanej osoby
  isSubmitting: boolean // czy formularz jest w trakcie wysyłania
  error: string | null // błąd walidacji lub API
}

/**
 * View model dla listy wysłanych zaproszeń
 * Używany w: SentInvitationsList
 */
export interface SentInvitationsViewModel {
  invitations: Invitation[] // lista wysłanych zaproszeń
  isLoading: boolean // czy dane są w trakcie ładowania
  error: string | null // błąd pobierania danych
}

/**
 * View model dla listy otrzymanych zaproszeń
 * Używany w: ReceivedInvitationsList
 */
export interface ReceivedInvitationsViewModel {
  invitations: InvitationWithHousehold[] // lista otrzymanych zaproszeń z kontekstem
  isLoading: boolean // czy dane są w trakcie ładowania
  error: string | null // błąd pobierania danych
}
```

### 5.3 Szczegółowy opis nowych typów ViewModel

#### InvitationNotificationViewModel

- **Cel**: Przechowywanie stanu badge'a powiadomień w nawigacji
- **Pola**:
  - `count: number` - liczba oczekujących zaproszeń (wynik z API)
  - `isLoading: boolean` - czy dane są ładowane (pokazać loader?)

#### CreateInvitationFormData

- **Cel**: Stan formularza tworzenia zaproszenia
- **Pola**:
  - `invitedEmail: string` - wartość wprowadzona przez użytkownika
  - `isSubmitting: boolean` - czy formularz jest wysyłany (disable przycisku)
  - `error: string | null` - komunikat błędu do wyświetlenia (walidacja lub API)

#### SentInvitationsViewModel

- **Cel**: Stan listy wysłanych zaproszeń (dla owner)
- **Pola**:
  - `invitations: Invitation[]` - tablica zaproszeń z API
  - `isLoading: boolean` - stan ładowania (skeleton loader)
  - `error: string | null` - błąd pobierania danych (Alert component)

#### ReceivedInvitationsViewModel

- **Cel**: Stan listy otrzymanych zaproszeń (dla zalogowanego użytkownika)
- **Pola**:
  - `invitations: InvitationWithHousehold[]` - tablica zaproszeń z kontekstem
  - `isLoading: boolean` - stan ładowania (skeleton loader)
  - `error: string | null` - błąd pobierania danych (Alert component)

---

## 6. Zarządzanie stanem

### 6.1 Strategia zarządzania stanem

Stan będzie zarządzany przy użyciu **custom hooks** implementujących wzorzec data fetching z wykorzystaniem React hooks (`useState`, `useEffect`). Każdy custom hook odpowiada za konkretny aspekt funkcjonalności zaproszeń:

1. **Lokalne stany komponentów**: dla form inputs, UI state (dialogs)
2. **Custom hooks dla API calls**: dla pobierania i mutacji danych zaproszeń
3. **Współdzielony context (opcjonalnie)**: dla synchronizacji badge'a z listami

### 6.2 Custom Hooks

#### 6.2.1 useInvitationNotifications()

**Lokalizacja**: `src/hooks/useInvitationNotifications.ts`

**Cel**: Pobieranie liczby oczekujących zaproszeń dla zalogowanego użytkownika, używane w badge'u nawigacji.

**Implementacja:**

```typescript
export function useInvitationNotifications() {
  const [count, setCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchInvitations = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/invitations/current')
        const data: CurrentUserInvitationsResponse = await response.json()
        setCount(data.data.length)
      } catch (error) {
        console.error('Failed to fetch invitations:', error)
        setCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitations()

    // Polling co 30 sekund
    const interval = setInterval(fetchInvitations, 30000)
    return () => clearInterval(interval)
  }, [])

  return { count, isLoading }
}
```

**Zwracane wartości:**

- `count: number` - liczba oczekujących zaproszeń
- `isLoading: boolean` - czy dane są ładowane

**Refresh strategy**: Automatyczny polling co 30 sekund

---

#### 6.2.2 useSentInvitations(householdId)

**Lokalizacja**: `src/hooks/useSentInvitations.ts`

**Cel**: Pobieranie listy wysłanych zaproszeń dla gospodarstwa domowego (tylko dla owner) oraz funkcja anulowania zaproszenia.

**Implementacja:**

```typescript
export function useSentInvitations(householdId: string) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState<number>(0)

  useEffect(() => {
    const fetchInvitations = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/households/${householdId}/invitations`)

        if (!response.ok) {
          throw new Error('Failed to fetch invitations')
        }

        const data: InvitationsListResponse = await response.json()
        setInvitations(data.data)
      } catch (err) {
        setError('Nie udało się pobrać listy zaproszeń')
        console.error('Failed to fetch sent invitations:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitations()
  }, [householdId, refreshKey])

  const cancelInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/households/${householdId}/invitations/${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to cancel invitation')
      }

      // Odśwież listę
      setRefreshKey(prev => prev + 1)
      return true
    } catch (err) {
      console.error('Failed to cancel invitation:', err)
      return false
    }
  }

  return {
    invitations,
    isLoading,
    error,
    cancelInvitation,
    refresh: () => setRefreshKey(prev => prev + 1),
  }
}
```

**Parametry:**

- `householdId: string` - ID gospodarstwa domowego

**Zwracane wartości:**

- `invitations: Invitation[]` - lista wysłanych zaproszeń
- `isLoading: boolean` - czy dane są ładowane
- `error: string | null` - komunikat błędu
- `cancelInvitation: (id: string) => Promise<boolean>` - funkcja anulująca zaproszenie
- `refresh: () => void` - funkcja wymuszająca odświeżenie listy

**Refresh strategy**: Po create (wywołanie `refresh()`) lub po cancel (automatyczne)

---

#### 6.2.3 useReceivedInvitations()

**Lokalizacja**: `src/hooks/useReceivedInvitations.ts`

**Cel**: Pobieranie listy otrzymanych zaproszeń dla zalogowanego użytkownika oraz funkcja akceptacji zaproszenia.

**Implementacja:**

```typescript
export function useReceivedInvitations() {
  const [invitations, setInvitations] = useState<InvitationWithHousehold[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState<number>(0)

  useEffect(() => {
    const fetchInvitations = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/invitations/current')

        if (!response.ok) {
          throw new Error('Failed to fetch invitations')
        }

        const data: CurrentUserInvitationsResponse = await response.json()
        setInvitations(data.data)
      } catch (err) {
        setError('Nie udało się pobrać listy zaproszeń')
        console.error('Failed to fetch received invitations:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitations()
  }, [refreshKey])

  const acceptInvitation = async (
    token: string
  ): Promise<{ success: boolean; householdId?: string }> => {
    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to accept invitation')
      }

      const data: AcceptInvitationResponse = await response.json()

      // Odśwież listę
      setRefreshKey(prev => prev + 1)

      return { success: true, householdId: data.membership.householdId }
    } catch (err) {
      console.error('Failed to accept invitation:', err)
      return { success: false }
    }
  }

  return {
    invitations,
    isLoading,
    error,
    acceptInvitation,
    refresh: () => setRefreshKey(prev => prev + 1),
  }
}
```

**Zwracane wartości:**

- `invitations: InvitationWithHousehold[]` - lista otrzymanych zaproszeń
- `isLoading: boolean` - czy dane są ładowane
- `error: string | null` - komunikat błędu
- `acceptInvitation: (token: string) => Promise<{ success: boolean; householdId?: string }>` - funkcja akceptująca zaproszenie
- `refresh: () => void` - funkcja wymuszająca odświeżenie listy

**Refresh strategy**: Po accept (automatyczne)

---

#### 6.2.4 useCreateInvitation(householdId)

**Lokalizacja**: `src/hooks/useCreateInvitation.ts`

**Cel**: Tworzenie nowego zaproszenia dla gospodarstwa domowego.

**Implementacja:**

```typescript
export function useCreateInvitation(householdId: string) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const createInvitation = async (
    invitedEmail: string
  ): Promise<{ success: boolean; invitation?: Invitation }> => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/households/${householdId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitedEmail }),
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Mapowanie błędów API na user-friendly komunikaty
        switch (response.status) {
          case 403:
            setError('Nie masz uprawnień do wysyłania zaproszeń')
            break
          case 404:
            setError('Gospodarstwo domowe nie zostało znalezione')
            break
          case 409:
            setError(
              errorData.error?.message || 'Zaproszenie już istnieje lub użytkownik jest członkiem'
            )
            break
          case 400:
            setError('Nieprawidłowy format adresu email')
            break
          default:
            setError('Nie udało się wysłać zaproszenia')
        }

        return { success: false }
      }

      const data: CreateInvitationResponse = await response.json()
      return { success: true, invitation: data.invitation }
    } catch (err) {
      console.error('Failed to create invitation:', err)
      setError('Wystąpił błąd podczas wysyłania zaproszenia')
      return { success: false }
    } finally {
      setIsSubmitting(false)
    }
  }

  return { createInvitation, isSubmitting, error, clearError: () => setError(null) }
}
```

**Parametry:**

- `householdId: string` - ID gospodarstwa domowego

**Zwracane wartości:**

- `createInvitation: (email: string) => Promise<{ success: boolean; invitation?: Invitation }>` - funkcja tworząca zaproszenie
- `isSubmitting: boolean` - czy zapytanie jest w trakcie
- `error: string | null` - komunikat błędu
- `clearError: () => void` - funkcja czyszcząca błąd

---

### 6.3 Synchronizacja stanu

**Problem**: Badge w nawigacji i lista otrzymanych zaproszeń używają tego samego endpointa (`/api/invitations/current`).

**Rozwiązanie**:

1. **Opcja A (prostsza)**: Każdy komponent używa własnego hooka, refresh jest niezależny
2. **Opcja B (lepsza)**: Shared Context dla zaproszeń użytkownika

**Rekomendacja**: Opcja A dla MVP, ewentualnie refaktoryzacja do Opcji B w przyszłości.

---

## 7. Integracja API

### 7.1 Endpoints używane w widoku

#### 7.1.1 GET /api/invitations/current

**Cel**: Pobranie listy zaproszeń dla zalogowanego użytkownika (używane w badge i ReceivedInvitationsList).

**Request:**

- Method: `GET`
- Headers: `Cookie` (sesja Supabase - automatycznie)
- Body: brak

**Response (200 OK):**

```typescript
CurrentUserInvitationsResponse {
  data: InvitationWithHousehold[] // tablica zaproszeń z kontekstem gospodarstwa
}
```

**Przykład odpowiedzi:**

```json
{
  "data": [
    {
      "id": "uuid-1",
      "householdId": "uuid-household",
      "householdName": "Kuchnia Alicji",
      "ownerEmail": "alice@example.com",
      "invitedEmail": "bob@example.com",
      "token": "secure-token-123",
      "expiresAt": "2026-01-31T12:00:00Z",
      "createdAt": "2026-01-24T12:00:00Z"
    }
  ]
}
```

**Error codes:**

- `401 Unauthorized` - użytkownik niezalogowany

**Używane w:**

- `useInvitationNotifications()` - badge
- `useReceivedInvitations()` - lista otrzymanych zaproszeń

---

#### 7.1.2 GET /api/households/{householdId}/invitations

**Cel**: Pobranie listy zaproszeń wysłanych przez właściciela gospodarstwa domowego.

**Request:**

- Method: `GET`
- URL params: `householdId` (UUID)
- Headers: `Cookie` (sesja Supabase - automatycznie)
- Body: brak

**Response (200 OK):**

```typescript
InvitationsListResponse {
  data: Invitation[] // tablica zaproszeń
}
```

**Przykład odpowiedzi:**

```json
{
  "data": [
    {
      "id": "uuid-1",
      "householdId": "uuid-household",
      "invitedEmail": "friend@example.com",
      "token": "secure-token-456",
      "expiresAt": "2026-02-01T12:00:00Z",
      "createdAt": "2026-01-25T12:00:00Z"
    }
  ]
}
```

**Error codes:**

- `401 Unauthorized` - użytkownik niezalogowany
- `403 Forbidden` - użytkownik nie jest członkiem gospodarstwa
- `404 Not Found` - gospodarstwo nie istnieje

**Używane w:**

- `useSentInvitations(householdId)` - lista wysłanych zaproszeń

---

#### 7.1.3 POST /api/households/{householdId}/invitations

**Cel**: Utworzenie nowego zaproszenia dla gospodarstwa domowego.

**Request:**

- Method: `POST`
- URL params: `householdId` (UUID)
- Headers:
  - `Cookie` (sesja Supabase - automatycznie)
  - `Content-Type: application/json`
- Body:

```typescript
CreateInvitationRequest {
  invitedEmail: string
}
```

**Przykład żądania:**

```json
{
  "invitedEmail": "friend@example.com"
}
```

**Response (201 Created):**

```typescript
CreateInvitationResponse {
  invitation: Invitation
}
```

**Przykład odpowiedzi:**

```json
{
  "invitation": {
    "id": "uuid-new",
    "householdId": "uuid-household",
    "invitedEmail": "friend@example.com",
    "token": "secure-token-789",
    "expiresAt": "2026-02-01T12:00:00Z",
    "createdAt": "2026-01-25T12:00:00Z"
  }
}
```

**Error codes:**

- `400 Bad Request` - nieprawidłowy format email
- `401 Unauthorized` - użytkownik niezalogowany
- `403 Forbidden` - użytkownik nie jest właścicielem gospodarstwa
- `404 Not Found` - gospodarstwo nie istnieje
- `409 Conflict` - użytkownik już jest członkiem lub zaproszenie już istnieje

**Używane w:**

- `useCreateInvitation(householdId)` - formularz tworzenia zaproszenia

---

#### 7.1.4 PATCH /api/invitations/{token}/accept

**Cel**: Akceptacja zaproszenia i dołączenie do gospodarstwa domowego.

**Request:**

- Method: `PATCH`
- URL params: `token` (string)
- Headers:
  - `Cookie` (sesja Supabase - automatycznie)
  - `Content-Type: application/json`
- Body (opcjonalny):

```typescript
AcceptInvitationRequest {
  token: string
}
```

**Przykład żądania:**

```json
{
  "token": "secure-token-123"
}
```

**Response (200 OK):**

```typescript
AcceptInvitationResponse {
  membership: Membership
}
```

**Przykład odpowiedzi:**

```json
{
  "membership": {
    "householdId": "uuid-household",
    "userId": "uuid-user",
    "role": "member",
    "joinedAt": "2026-01-25T12:30:00Z",
    "createdAt": "2026-01-25T12:30:00Z"
  }
}
```

**Error codes:**

- `400 Bad Request` - token wygasł lub już użyty
- `401 Unauthorized` - użytkownik niezalogowany
- `403 Forbidden` - zaproszenie nie jest dla tego email
- `404 Not Found` - zaproszenie nie istnieje
- `409 Conflict` - użytkownik już jest członkiem

**Używane w:**

- `useReceivedInvitations()` - akceptacja zaproszenia

---

#### 7.1.5 DELETE /api/households/{householdId}/invitations/{id}

**Cel**: Anulowanie zaproszenia przez właściciela gospodarstwa domowego.

**Request:**

- Method: `DELETE`
- URL params:
  - `householdId` (UUID)
  - `id` (UUID - invitation ID)
- Headers: `Cookie` (sesja Supabase - automatycznie)
- Body: brak

**Response (204 No Content):**

- Pusta odpowiedź

**Error codes:**

- `401 Unauthorized` - użytkownik niezalogowany
- `403 Forbidden` - użytkownik nie jest właścicielem gospodarstwa
- `404 Not Found` - zaproszenie nie istnieje

**Używane w:**

- `useSentInvitations(householdId)` - anulowanie zaproszenia

---

### 7.2 Error Handling w API Calls

Wszystkie hooki implementują jednolity wzorzec obsługi błędów:

1. **Network errors**: catch w try/catch, ustawienie generycznego error message
2. **HTTP errors**: sprawdzanie `response.ok`, parsowanie error body
3. **Mapowanie błędów**: konwersja kodów HTTP na user-friendly komunikaty
4. **Logging**: console.error dla debugowania
5. **State update**: ustawienie error state dla komponentów

---

## 8. Interakcje użytkownika

### 8.1 Właściciel gospodarstwa domowego (Owner)

#### 8.1.1 Tworzenie zaproszenia

**Scenariusz:**

1. Użytkownik (owner) otwiera stronę `/household`
2. Widzi sekcję "Wysłane zaproszenia" z formularzem
3. Wprowadza adres email zapraszanej osoby w pole "Email"
4. Klika przycisk "Wyślij zaproszenie"

**Flow:**

```
User input (email)
  → onChange: aktualizacja stanu, czyszczenie błędów
  → onBlur: walidacja formatu email
  → onSubmit: preventDefault()
    → Walidacja frontend (required, format, max length)
      → Jeśli błąd: wyświetl komunikat pod polem
      → Jeśli OK: wywołaj useCreateInvitation.createInvitation()
        → POST /api/households/{id}/invitations
          → 201: Sukces
            → Wyczyść formularz
            → Odśwież SentInvitationsList (callback)
            → Toast: "Zaproszenie wysłane"
          → 400/403/404/409: Błąd
            → Wyświetl error message w formularzu
            → Focus na pole email
```

**Komunikaty:**

- Sukces: "Zaproszenie wysłane do [email]"
- Błędy: patrz sekcja 4.3 (warunki walidacji)

---

#### 8.1.2 Przeglądanie wysłanych zaproszeń

**Scenariusz:**

1. Użytkownik (owner) otwiera stronę `/household`
2. Widzi sekcję "Wysłane zaproszenia" z listą

**Wyświetlane informacje dla każdego zaproszenia:**

- Email zaproszony (invitedEmail)
- Data utworzenia (createdAt) - formatowana relatywnie: "Wysłane 2 dni temu"
- Data wygaśnięcia (expiresAt) - formatowana relatywnie: "Wygasa za 5 dni"
- Przycisk "Anuluj"

**Stany listy:**

- Loading: skeleton placeholders (3 items)
- Empty: "Brak wysłanych zaproszeń"
- Error: Alert z komunikatem błędu i przyciskiem "Spróbuj ponownie"
- Success: lista zaproszeń

---

#### 8.1.3 Anulowanie zaproszenia

**Scenariusz:**

1. Użytkownik (owner) widzi listę wysłanych zaproszeń
2. Klika przycisk "Anuluj" przy konkretnym zaproszeniu

**Flow:**

```
User click "Anuluj"
  → Otwórz AlertDialog z potwierdzeniem
    → Treść: "Czy na pewno chcesz anulować zaproszenie dla [email]?"
    → Przyciski: "Anuluj" (cancel) | "Usuń" (confirm, destructive)
  → User click "Usuń"
    → Wywołaj useSentInvitations.cancelInvitation(id)
      → DELETE /api/households/{id}/invitations/{invitationId}
        → 204: Sukces
          → Usuń zaproszenie z listy (automatyczny refresh)
          → Toast: "Zaproszenie anulowane"
        → 403/404: Błąd
          → Toast: komunikat błędu
          → Pozostaw zaproszenie na liście
  → User click "Anuluj" (dialog)
    → Zamknij dialog, brak akcji
```

**Komunikaty:**

- Sukces: "Zaproszenie anulowane"
- Błędy:
  - 403: "Nie masz uprawnień do anulowania tego zaproszenia"
  - 404: "Zaproszenie nie zostało znalezione"

---

### 8.2 Zaproszony użytkownik (Any authenticated user)

#### 8.2.1 Powiadomienie o zaproszeniach (Badge)

**Scenariusz:**

1. Użytkownik loguje się do aplikacji
2. W nawigacji widzi badge z liczbą oczekujących zaproszeń (jeśli > 0)

**Wyświetlanie badge:**

- Jeśli count = 0: badge niewidoczny
- Jeśli count > 0: badge widoczny z liczbą (np. "2")
- Jeśli count > 9: badge pokazuje "9+"

**Interakcja:**

- Click na badge → przekierowanie do `/household` i scroll do sekcji "Otrzymane zaproszenia"

---

#### 8.2.2 Przeglądanie otrzymanych zaproszeń

**Scenariusz:**

1. Użytkownik otwiera stronę `/household`
2. Widzi sekcję "Otrzymane zaproszenia" z kartami zaproszeń

**Wyświetlane informacje dla każdego zaproszenia (karta):**

- Nazwa gospodarstwa domowego (householdName) - nagłówek karty
- Email właściciela (ownerEmail) - z ikoną User
- Zaproszony email (invitedEmail) - "Zaproszenie dla: [email]"
- Data wygaśnięcia (expiresAt) - z ikoną Calendar, formatowana: "Wygasa za 3 dni"
- Przycisk "Akceptuj"

**Stany listy:**

- Loading: skeleton placeholders (2 cards)
- Empty: "Nie masz oczekujących zaproszeń"
- Error: Alert z komunikatem błędu i przyciskiem "Spróbuj ponownie"
- Success: grid kart zaproszeń (responsive: 1 col mobile, 2 cols tablet, 3 cols desktop)

---

#### 8.2.3 Akceptacja zaproszenia

**Scenariusz:**

1. Użytkownik widzi listę otrzymanych zaproszeń
2. Klika przycisk "Akceptuj" przy konkretnym zaproszeniu

**Flow:**

```
User click "Akceptuj"
  → [Opcjonalnie] Otwórz AlertDialog z potwierdzeniem
    → Treść: "Czy na pewno chcesz dołączyć do gospodarstwa [householdName]?"
    → Przyciski: "Anuluj" (cancel) | "Dołącz" (confirm)
  → User confirm (lub bezpośrednio jeśli bez dialogu)
    → Wywołaj useReceivedInvitations.acceptInvitation(token)
      → PATCH /api/invitations/{token}/accept
        → 200: Sukces
          → Usuń zaproszenie z listy (automatyczny refresh)
          → Odśwież badge (zmniejsz count)
          → Toast: "Dołączyłeś do gospodarstwa [householdName]"
          → Opcjonalnie: przekierowanie do dashboard nowego gospodarstwa
        → 400/403/404/409: Błąd
          → Toast: komunikat błędu
          → Jeśli 400 (expired): usuń zaproszenie z listy
          → Jeśli 409 (already member): usuń zaproszenie z listy
```

**Komunikaty:**

- Sukces: "Dołączyłeś do gospodarstwa [householdName]"
- Błędy:
  - 400 (expired): "To zaproszenie wygasło"
  - 403: "To zaproszenie nie jest przeznaczone dla Ciebie"
  - 404: "Zaproszenie nie zostało znalezione"
  - 409: "Jesteś już członkiem tego gospodarstwa"

---

## 9. Warunki i walidacja

### 9.1 Walidacja formularza CreateInvitationForm

**Komponent:** `CreateInvitationForm`

**Pole:** `invitedEmail`

**Warunki walidacji (frontend):**

1. **Required validation**
   - Warunek: pole nie może być puste
   - Trigger: onSubmit, onBlur (optional)
   - Komunikat: "Adres email jest wymagany"
   - UI state: error message pod polem, red border

2. **Email format validation**
   - Warunek: musi być poprawny format email (RFC 5322)
   - Implementacja: regex lub HTML5 `type="email"` + custom validation
   - Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Trigger: onBlur, onSubmit
   - Komunikat: "Nieprawidłowy format adresu email"
   - UI state: error message pod polem, red border

3. **Max length validation**
   - Warunek: maksymalnie 255 znaków
   - Trigger: onChange (prevent typing), onBlur, onSubmit
   - Komunikat: "Adres email może mieć maksymalnie 255 znaków"
   - UI state: character counter (optional), error message

4. **Normalizacja**
   - Przed wysłaniem: `.trim().toLowerCase()`
   - Automatyczna, bez komunikatu użytkownikowi

**Warunki walidacji (backend/API):**

5. **Authorization validation**
   - Warunek: user musi być owner gospodarstwa
   - Response: 403 Forbidden
   - Komunikat: "Nie masz uprawnień do wysyłania zaproszeń"
   - UI state: disable form, show alert

6. **Resource existence validation**
   - Warunek: household musi istnieć
   - Response: 404 Not Found
   - Komunikat: "Gospodarstwo domowe nie zostało znalezione"
   - UI state: error alert, opcjonalnie redirect

7. **Duplicate member validation**
   - Warunek: użytkownik o tym email nie może być już członkiem
   - Response: 409 Conflict
   - Komunikat: "Ten użytkownik jest już członkiem gospodarstwa"
   - UI state: error message w formularzu

8. **Duplicate invitation validation**
   - Warunek: nie może istnieć aktywne zaproszenie dla tego email
   - Response: 409 Conflict
   - Komunikat: "Zaproszenie dla tego adresu email już istnieje"
   - UI state: error message w formularzu

**Wpływ na UI:**

- Valid state: przycisk enabled, brak error messages
- Invalid state: przycisk disabled (dla frontend validation), error messages visible
- Submitting state: przycisk disabled, loading spinner, formularz disabled
- Error state (API): przycisk enabled, error message visible, focus na pole email

---

### 9.2 Walidacja akcji Cancel Invitation (SentInvitationItem)

**Komponent:** `SentInvitationItem`

**Warunki walidacji (frontend):**

1. **Confirmation required**
   - Warunek: użytkownik musi potwierdzić akcję
   - Trigger: click "Anuluj"
   - UI state: AlertDialog z przyciskami "Anuluj" i "Usuń"
   - Komunikat dialogu: "Czy na pewno chcesz anulować zaproszenie dla [email]?"

**Warunki walidacji (backend/API):**

2. **Authorization validation**
   - Warunek: user musi być owner gospodarstwa
   - Response: 403 Forbidden
   - Komunikat: "Nie masz uprawnień do anulowania zaproszeń"
   - UI state: Toast z błędem, zaproszenie pozostaje na liście

3. **Resource existence validation**
   - Warunek: zaproszenie musi istnieć
   - Response: 404 Not Found
   - Komunikat: "Zaproszenie nie zostało znalezione"
   - UI state: Toast z błędem, odśwież listę (zaproszenie może zostało już usunięte)

**Wpływ na UI:**

- Przed akcją: przycisk "Anuluj" enabled
- Podczas akcji: przycisk disabled, loading state
- Sukces: zaproszenie znika z listy, toast sukcesu
- Błąd: toast z błędem, zaproszenie pozostaje (lub odświeżenie listy)

---

### 9.3 Walidacja akcji Accept Invitation (ReceivedInvitationCard)

**Komponent:** `ReceivedInvitationCard`

**Warunki walidacji (frontend):**

1. **Optional confirmation**
   - Warunek: opcjonalne potwierdzenie przed akcją
   - Trigger: click "Akceptuj"
   - UI state: AlertDialog (opcjonalnie)
   - Komunikat dialogu: "Czy na pewno chcesz dołączyć do gospodarstwa [householdName]?"

**Warunki walidacji (backend/API):**

2. **Token validity validation**
   - Warunek: token nie może być wygasły
   - Response: 400 Bad Request (code: EXPIRED_TOKEN)
   - Komunikat: "To zaproszenie wygasło"
   - UI state: Toast z błędem, usuń zaproszenie z listy

3. **Token status validation**
   - Warunek: zaproszenie musi być w statusie 'pending'
   - Response: 400 Bad Request (code: INVALID_TOKEN)
   - Komunikat: "To zaproszenie zostało już użyte"
   - UI state: Toast z błędem, usuń zaproszenie z listy

4. **Email match validation**
   - Warunek: invited_email musi zgadzać się z email zalogowanego użytkownika
   - Response: 403 Forbidden
   - Komunikat: "To zaproszenie nie jest przeznaczone dla Ciebie"
   - UI state: Toast z błędem, zaproszenie pozostaje (to błąd systemu)

5. **Resource existence validation**
   - Warunek: zaproszenie musi istnieć w bazie
   - Response: 404 Not Found
   - Komunikat: "Zaproszenie nie zostało znalezione"
   - UI state: Toast z błędem, usuń zaproszenie z listy

6. **Duplicate membership validation**
   - Warunek: użytkownik nie może być już członkiem gospodarstwa
   - Response: 409 Conflict
   - Komunikat: "Jesteś już członkiem tego gospodarstwa"
   - UI state: Toast z informacją, usuń zaproszenie z listy

**Wpływ na UI:**

- Przed akcją: przycisk "Akceptuj" enabled
- Podczas akcji: przycisk disabled, loading state
- Sukces: zaproszenie znika z listy, badge count -1, toast sukcesu
- Błąd: toast z błędem, dla niektórych błędów (expired, already member) usuń z listy

---

### 9.4 Walidacja wyświetlania (conditional rendering)

**Komponent:** `HouseholdInvitationsSection`

**Warunki:**

1. **Owner-only sections**
   - Warunek: `userRole === 'owner'`
   - Komponenty: `CreateInvitationForm`, `SentInvitationsList`
   - UI state: widoczne tylko dla owner

2. **All users sections**
   - Warunek: zawsze (authenticated user)
   - Komponenty: `ReceivedInvitationsList`
   - UI state: zawsze widoczne

**Komponent:** `InvitationNotificationBadge`

**Warunki:**

1. **Badge visibility**
   - Warunek: `count > 0`
   - UI state: badge visible
   - Jeśli `count === 0`: badge hidden

---

## 10. Obsługa błędów

### 10.1 Błędy sieciowe (Network Errors)

**Scenariusz:** Brak połączenia z internetem lub serwer niedostępny.

**Wykrywanie:** `catch` w try/catch, `response` jest undefined lub network error.

**Obsługa:**

- Ustawienie `error` state: "Wystąpił błąd połączenia. Sprawdź połączenie z internetem."
- Wyświetlenie Toast (ephemeral) lub Alert (persistent)
- Logowanie: `console.error('Network error:', error)`
- UI state: przycisk "Spróbuj ponownie" do retry

**Przykład (useCreateInvitation):**

```typescript
catch (err) {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    setError('Brak połączenia z internetem')
  } else {
    setError('Wystąpił nieoczekiwany błąd')
  }
  console.error('Network error:', err)
}
```

---

### 10.2 Błędy autoryzacji (401 Unauthorized)

**Scenariusz:** Użytkownik nie jest zalogowany lub sesja wygasła.

**Wykrywanie:** `response.status === 401`

**Obsługa:**

- Przekierowanie do `/login` z `redirect` query param: `?redirect=/household`
- Toast: "Sesja wygasła. Zaloguj się ponownie."
- Czyszczenie lokalnego stanu sesji (jeśli istnieje)

**Implementacja (globalny interceptor lub w każdym hooku):**

```typescript
if (response.status === 401) {
  window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
  return
}
```

---

### 10.3 Błędy uprawnień (403 Forbidden)

**Scenariusz:** Użytkownik nie ma uprawnień do wykonania akcji.

**Wykrywanie:** `response.status === 403`

**Obsługa:**

- Wyświetlenie Toast lub Alert: "Nie masz uprawnień do wykonania tej akcji"
- Disable form/przycisk (nie powinno się wydarzyć jeśli UI jest poprawnie renderowany)
- Opcjonalnie: odświeżenie stanu użytkownika (może role się zmieniła)

**Przykłady:**

- CreateInvitationForm: "Nie masz uprawnień do wysyłania zaproszeń" (nie powinien być renderowany dla non-owner)
- CancelInvitation: "Nie masz uprawnień do anulowania zaproszeń"
- AcceptInvitation: "To zaproszenie nie jest przeznaczone dla Ciebie"

---

### 10.4 Błędy zasobów (404 Not Found)

**Scenariusz:** Zasób (household, invitation) nie istnieje.

**Wykrywanie:** `response.status === 404`

**Obsługa:**

- Wyświetlenie Toast: "Zasób nie został znaleziony"
- Odświeżenie listy (zasób mógł zostać usunięty przez innego użytkownika)
- Jeśli household 404: redirect do dashboard głównego lub komunikat o braku gospodarstwa

**Przykłady:**

- SentInvitationsList: odświeżenie listy po 404 (zaproszenie usunięte)
- AcceptInvitation: "Zaproszenie nie zostało znalezione" + usuń z listy

---

### 10.5 Błędy konfliktów (409 Conflict)

**Scenariusz:** Próba utworzenia zaproszenia dla użytkownika, który już jest członkiem lub ma oczekujące zaproszenie. Lub próba akceptacji zaproszenia gdy już jest się członkiem.

**Wykrywanie:** `response.status === 409`

**Obsługa:**

- Parsowanie error body dla szczegółowego komunikatu
- Wyświetlenie Toast lub error message w formularzu
- Dla AcceptInvitation: usuń zaproszenie z listy (już jest członkiem)

**Przykłady:**

- CreateInvitation:
  - "Ten użytkownik jest już członkiem gospodarstwa"
  - "Zaproszenie dla tego adresu email już istnieje"
- AcceptInvitation:
  - "Jesteś już członkiem tego gospodarstwa" + usuń z listy

---

### 10.6 Błędy walidacji (400 Bad Request)

**Scenariusz:** Nieprawidłowe dane wejściowe (format email, expired token).

**Wykrywanie:** `response.status === 400`

**Obsługa:**

- Parsowanie error body dla szczegółów
- Wyświetlenie field-specific error message (jeśli dotyczy formularza)
- Focus na pole z błędem

**Przykłady:**

- CreateInvitation: "Nieprawidłowy format adresu email"
- AcceptInvitation:
  - "To zaproszenie wygasło" (EXPIRED_TOKEN) + usuń z listy
  - "To zaproszenie zostało już użyte" (INVALID_TOKEN) + usuń z listy

---

### 10.7 Błędy wewnętrzne serwera (500 Internal Server Error)

**Scenariusz:** Nieoczekiwany błąd po stronie serwera.

**Wykrywanie:** `response.status === 500` lub `5xx`

**Obsługa:**

- Wyświetlenie Toast: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Logowanie błędu do monitoring service (np. Sentry)
- Przycisk "Spróbuj ponownie"

---

### 10.8 Przypadki brzegowe (Edge Cases)

#### 10.8.1 Pusta lista zaproszeń

**Scenariusz:** Brak zaproszeń (sent lub received).

**Obsługa:**

- Empty state message:
  - SentInvitationsList: "Brak wysłanych zaproszeń. Zaproś kogoś, aby współdzielić gospodarstwo."
  - ReceivedInvitationsList: "Nie masz oczekujących zaproszeń."
- UI: centered text z ikoną (optional)

#### 10.8.2 Wygasłe zaproszenia w liście

**Scenariusz:** Lista zawiera wygasłe zaproszenia (backend powinien je filtrować, ale może wystąpić race condition).

**Obsługa:**

- Wyświetlić zaproszenie z oznaczeniem "Wygasło"
- Disable przycisk "Akceptuj"
- Opcjonalnie: link "Usuń" do czyszczenia ręcznego
- Backend cleanup job powinien usuwać expired invitations

#### 10.8.3 Długi email address

**Scenariusz:** Email przekracza max length (255 znaków).

**Obsługa:**

- Walidacja frontend: prevent typing powyżej 255 znaków (maxLength attribute)
- Walidacja frontend: error message onBlur jeśli przekroczono
- Truncate w wyświetlaniu (z ellipsis) jeśli konieczne

#### 10.8.4 Wiele zaproszeń jednocześnie

**Scenariusz:** Użytkownik otrzymał wiele zaproszeń od różnych gospodarstw.

**Obsługa:**

- ReceivedInvitationsList: responsive grid (1-3 kolumny w zależności od viewport)
- Scrollable container jeśli > 6 zaproszeń
- Sorting: najnowsze na górze (createdAt DESC)

#### 10.8.5 Race condition: akceptacja podczas anulowania

**Scenariusz:** Owner anuluje zaproszenie w tym samym momencie gdy zaproszony je akceptuje.

**Obsługa:**

- Jeden z requestów zakończy się błędem (404 lub 409)
- Wyświetlić odpowiedni komunikat błędu
- Odświeżyć listy po błędzie

---

### 10.9 Strategia logowania błędów

**Poziomy logowania:**

- `console.error()`: błędy krytyczne (network, 500, unexpected)
- `console.warn()`: błędy walidacji, 400, 409
- `console.info()`: 404, expected errors

**Informacje do logowania:**

- Endpoint URL
- HTTP method
- Response status
- Error message
- User ID (jeśli dostępny)
- Timestamp (automatyczny w console)

**Przyszłość:** Integracja z monitoring service (Sentry, LogRocket) dla produkcji.

---

## 11. Kroki implementacji

### Krok 1: Dodanie nowych typów ViewModel

**Plik:** `src/types/types.ts`

**Akcje:**

1. Otwórz plik `src/types/types.ts`
2. Znajdź sekcję "VIEW MODELS" (lub dodaj nową sekcję przed końcem pliku)
3. Dodaj nowe typy ViewModels zgodnie z sekcją 5.2 tego dokumentu:
   - `InvitationNotificationViewModel`
   - `CreateInvitationFormData`
   - `SentInvitationsViewModel`
   - `ReceivedInvitationsViewModel`
4. Zapisz plik
5. Sprawdź linting (uruchom `npm run lint`)

---

### Krok 2: Implementacja Custom Hooks

**Folder:** `src/hooks/`

**Kroki:**

#### 2.1 Hook useInvitationNotifications

**Plik:** `src/hooks/useInvitationNotifications.ts`

**Akcje:**

1. Utwórz plik `src/hooks/useInvitationNotifications.ts`
2. Zaimportuj potrzebne typy z `src/types/types.ts`
3. Zaimplementuj hook zgodnie z sekcją 6.2.1 tego dokumentu
4. Dodaj polling co 30 sekund używając `setInterval` w `useEffect`
5. Cleanup: `clearInterval` w return function `useEffect`
6. Export hook
7. Test: uruchom development server i sprawdź czy dane są pobierane

#### 2.2 Hook useSentInvitations

**Plik:** `src/hooks/useSentInvitations.ts`

**Akcje:**

1. Utwórz plik `src/hooks/useSentInvitations.ts`
2. Zaimportuj potrzebne typy
3. Zaimplementuj hook zgodnie z sekcją 6.2.2
4. Dodaj funkcję `cancelInvitation` z DELETE request
5. Dodaj refresh mechanism używając `refreshKey` state
6. Export hook

#### 2.3 Hook useReceivedInvitations

**Plik:** `src/hooks/useReceivedInvitations.ts`

**Akcje:**

1. Utwórz plik `src/hooks/useReceivedInvitations.ts`
2. Zaimportuj potrzebne typy
3. Zaimplementuj hook zgodnie z sekcją 6.2.3
4. Dodaj funkcję `acceptInvitation` z PATCH request
5. Dodaj refresh mechanism
6. Export hook

#### 2.4 Hook useCreateInvitation

**Plik:** `src/hooks/useCreateInvitation.ts`

**Akcje:**

1. Utwórz plik `src/hooks/useCreateInvitation.ts`
2. Zaimportuj potrzebne typy
3. Zaimplementuj hook zgodnie z sekcją 6.2.4
4. Dodaj mapowanie błędów API na user-friendly komunikaty
5. Export hook

---

### Krok 3: Implementacja komponentów atomowych

**Folder:** `src/app/household/components/`

#### 3.1 Komponent InvitationNotificationBadge

**Plik:** `src/app/household/components/InvitationNotificationBadge.tsx`

**Akcje:**

1. Utwórz plik komponentu
2. Zaimportuj `useInvitationNotifications` hook
3. Zaimplementuj komponent zgodnie z sekcją 4.1
4. Stylizacja z Tailwind CSS:
   - Badge: `rounded-full bg-red-500 text-white px-2 py-1 text-xs`
   - Pozycjonowanie: absolute względem parent
5. Conditional rendering: render tylko jeśli `count > 0`
6. Dodaj onClick handler do scroll/navigate do `/household#invitations`
7. Export komponentu

#### 3.2 Komponent SentInvitationItem

**Plik:** `src/app/household/components/SentInvitationItem.tsx`

**Akcje:**

1. Utwórz plik komponentu
2. Zaimportuj shadcn/ui components: Card, Button, AlertDialog
3. Zaimportuj library do formatowania dat: `date-fns` (instalacja: `npm install date-fns`)
4. Zaimplementuj komponent zgodnie z sekcją 4.5
5. Użyj `formatDistanceToNow` z date-fns dla relative dates
6. Dodaj AlertDialog dla potwierdzenia przed anulowaniem
7. Obsługa onClick: wywołaj callback `onDeleted` po DELETE
8. Export komponentu

#### 3.3 Komponent ReceivedInvitationCard

**Plik:** `src/app/household/components/ReceivedInvitationCard.tsx`

**Akcje:**

1. Utwórz plik komponentu
2. Zaimportuj shadcn/ui components: Card, Button, AlertDialog (opcjonalnie)
3. Zaimportuj ikony z lucide-react: Mail, User, Calendar
4. Zaimportuj date-fns
5. Zaimplementuj komponent zgodnie z sekcją 4.7
6. Stylizacja karty: atrakcyjny layout z ikonami
7. Obsługa onClick: wywołaj callback `onAccepted` po PATCH
8. Export komponentu

---

### Krok 4: Implementacja komponentów kontenerowych

#### 4.1 Komponent CreateInvitationForm

**Plik:** `src/app/household/components/CreateInvitationForm.tsx`

**Akcje:**

1. Utwórz plik komponentu
2. Zaimportuj `useCreateInvitation` hook
3. Zaimportuj shadcn/ui components: Input, Button, Label, Alert
4. Zaimplementuj lokalny state dla `invitedEmail` (useState)
5. Dodaj walidację frontend (required, email format, max length)
6. Zaimplementuj handleSubmit zgodnie z sekcją 8.1.1
7. Wyświetlanie błędów: pod polem input, conditional rendering
8. Po sukcesie: wyczyść formularz, wywołaj callback `onInvitationCreated`
9. Export komponentu

#### 4.2 Komponent SentInvitationsList

**Plik:** `src/app/household/components/SentInvitationsList.tsx`

**Akcje:**

1. Utwórz plik komponentu
2. Zaimportuj `useSentInvitations` hook
3. Zaimportuj `SentInvitationItem` component
4. Zaimportuj shadcn/ui: Skeleton, Alert
5. Zaimplementuj komponent zgodnie z sekcją 4.4
6. Obsługa stanów:
   - Loading: render Skeleton × 3
   - Error: render Alert z przyciskiem "Spróbuj ponownie"
   - Empty: render empty state message
   - Success: map przez invitations i render SentInvitationItem
7. Przekaż `householdId` i `onDeleted` callback do SentInvitationItem
8. Export komponentu

#### 4.3 Komponent ReceivedInvitationsList

**Plik:** `src/app/household/components/ReceivedInvitationsList.tsx`

**Akcje:**

1. Utwórz plik komponentu
2. Zaimportuj `useReceivedInvitations` hook
3. Zaimportuj `ReceivedInvitationCard` component
4. Zaimportuj shadcn/ui: Skeleton, Alert
5. Zaimplementuj komponent zgodnie z sekcją 4.6
6. Obsługa stanów (podobnie do SentInvitationsList)
7. Layout: responsive grid (grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
8. Przekaż `onAccepted` callback do ReceivedInvitationCard
9. Po accept: opcjonalnie redirect lub refresh całej strony
10. Export komponentu

#### 4.4 Komponent HouseholdInvitationsSection

**Plik:** `src/app/household/components/HouseholdInvitationsSection.tsx`

**Akcje:**

1. Utwórz plik komponentu
2. Zaimportuj wszystkie podkomponenty (CreateInvitationForm, SentInvitationsList, ReceivedInvitationsList)
3. Zaimplementuj komponent zgodnie z sekcją 4.2
4. Conditional rendering:
   ```tsx
   {
     userRole === 'owner' && (
       <>
         <CreateInvitationForm householdId={householdId} onInvitationCreated={handleRefreshSent} />
         <SentInvitationsList householdId={householdId} />
       </>
     )
   }
   ;<ReceivedInvitationsList />
   ```
5. Stylizacja: sekcja z padding, border, margin
6. Nagłówki dla każdej subsekcji (h3)
7. Export komponentu

---

### Krok 5: Integracja z istniejącą stroną /household

**Plik:** `src/app/household/page.tsx`

**Akcje:**

1. Otwórz istniejący plik `src/app/household/page.tsx`
2. Zaimportuj `HouseholdInvitationsSection` component
3. Pobierz `userRole` i `householdId` z istniejącego stanu strony
4. Dodaj komponent na końcu strony (po istniejących sekcjach):
   ```tsx
   <HouseholdInvitationsSection householdId={household.id} userRole={userRole} />
   ```
5. Opcjonalnie: dodaj separator (divider) przed sekcją
6. Dodaj ID do sekcji dla scroll anchoring: `id="invitations"`
7. Zapisz plik

---

### Krok 6: Dodanie badge do nawigacji

**Plik:** `src/components/Navigation.tsx` (lub odpowiedni plik layoutu)

**Akcje:**

1. Znajdź komponent nawigacji głównej aplikacji
2. Zaimportuj `InvitationNotificationBadge` component
3. Dodaj badge obok linku do `/household` lub jako overlay na ikonie:
   ```tsx
   <Link href="/household" className="relative">
     Gospodarstwo
     <InvitationNotificationBadge className="absolute -top-1 -right-1" />
   </Link>
   ```
4. Opcjonalnie: badge może być też osobnym elementem w prawym górnym rogu nawigacji
5. Sprawdź responsywność na mobile
6. Zapisz plik

---

### Krok 7: Instalacja zależności

**Akcje:**

1. Jeśli jeszcze nie zainstalowano, dodaj `date-fns`:
   ```bash
   npm install date-fns
   ```
2. Sprawdź czy shadcn/ui komponenty są zainstalowane:
   - Card, Button, Input, Label, Alert, AlertDialog, Skeleton
3. Jeśli brakuje, zainstaluj używając shadcn/ui CLI:
   ```bash
   npx shadcn-ui@latest add card button input label alert alert-dialog skeleton
   ```

---

### Krok 8: Stylizacja i UI polish

**Akcje:**

1. Przejrzyj wszystkie komponenty i upewnij się, że:
   - Używają spójnych kolorów z motywu aplikacji
   - Mają odpowiednie spacing (padding, margin)
   - Są responsywne (mobile-first approach)
   - Przyciski mają odpowiednie variants (default, destructive)
2. Dodaj transitions dla hover states
3. Sprawdź accessibility:
   - Aria labels dla przycisków
   - Focus states dla keyboard navigation
   - Proper heading hierarchy (h2 > h3)
4. Dark mode support (jeśli aplikacja używa)

---

### Krok 9: Toast/Notification system

**Akcje:**

1. Wybierz toast library lub użyj shadcn/ui toast:
   ```bash
   npx shadcn-ui@latest add toast
   ```
2. Dodaj Toaster do root layout (jeśli nie istnieje):

   ```tsx
   // src/app/layout.tsx
   import { Toaster } from '@/components/ui/toaster'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Toaster />
         </body>
       </html>
     )
   }
   ```

3. Użyj `useToast()` hook w komponentach do wyświetlania powiadomień:

   ```tsx
   import { useToast } from '@/components/ui/use-toast'

   const { toast } = useToast()

   toast({
     title: 'Sukces',
     description: 'Zaproszenie wysłane',
   })
   ```

4. Dodaj toast notifications do wszystkich akcji (create, cancel, accept)

---

### Krok 10: Testowanie manualne

**Akcje:**

1. **Test flow Owner:**
   - Zaloguj się jako owner
   - Otwórz `/household`
   - Wypełnij formularz i wyślij zaproszenie
   - Sprawdź czy zaproszenie pojawia się w liście wysłanych
   - Anuluj zaproszenie
   - Sprawdź walidację formularza (empty, invalid email)
   - Test error cases (409, 400)

2. **Test flow Member:**
   - Zaloguj się jako inny użytkownik (zaproszony)
   - Sprawdź badge w nawigacji (czy pokazuje liczbę)
   - Otwórz `/household`
   - Sprawdź listę otrzymanych zaproszeń
   - Akceptuj zaproszenie
   - Sprawdź czy badge zniknął / count się zmniejszył
   - Sprawdź czy jesteś członkiem gospodarstwa

3. **Test edge cases:**
   - Pusta lista zaproszeń (sent i received)
   - Wiele zaproszeń jednocześnie
   - Long email addresses
   - Expired invitations (jeśli można zasymulować)

4. **Test responsywności:**
   - Mobile (320px, 375px, 414px)
   - Tablet (768px, 1024px)
   - Desktop (1280px, 1920px)

5. **Test accessibility:**
   - Keyboard navigation (Tab, Enter, Escape)
   - Screen reader (jeśli możliwe)
   - Focus states

---

### Krok 11: Code review i refaktoryzacja

**Akcje:**

1. Przejrzyj kod pod kątem:
   - DRY (Don't Repeat Yourself) - czy są powtórzenia?
   - Naming conventions - czy nazwy są jasne?
   - Comments - czy kod jest zrozumiały bez komentarzy?
   - Type safety - czy wszystkie typy są poprawne?
2. Sprawdź linting:
   ```bash
   npm run lint
   ```
3. Popraw wszystkie linting errors/warnings
4. Opcjonalnie: uruchom Prettier dla formatowania:
   ```bash
   npm run format
   ```

---

### Krok 12: Dokumentacja (opcjonalnie)

**Akcje:**

1. Dodaj JSDoc comments do custom hooks
2. Dodaj README.md dla folderu `src/hooks/` (jeśli nie istnieje)
3. Zaktualizuj główny README projektu o nową funkcjonalność
4. Dodaj screenshots do dokumentacji (opcjonalnie)

---

### Krok 13: Commit i deploy

**Akcje:**

1. Stage changes:
   ```bash
   git add .
   ```
2. Commit z opisową wiadomością:

   ```bash
   git commit -m "feat: implement household invitations UI

   - Add invitation notification badge in navigation
   - Add invitation management section to /household page
   - Implement create, list, cancel, and accept invitation flows
   - Add custom hooks for invitation API integration
   - Add new ViewModel types for invitation components

   Implements US-016: Invite collaborator"
   ```

3. Push do repozytorium:
   ```bash
   git push origin feature/household-invitations-ui
   ```
4. Utwórz Pull Request
5. Po merge: verify w staging environment

---

### Podsumowanie kroków:

1. ✅ Dodaj typy ViewModel
2. ✅ Implementuj Custom Hooks (4 hooki)
3. ✅ Implementuj komponenty atomowe (3 komponenty)
4. ✅ Implementuj komponenty kontenerowe (4 komponenty)
5. ✅ Integruj z stroną /household
6. ✅ Dodaj badge do nawigacji
7. ✅ Zainstaluj zależności
8. ✅ Stylizacja i UI polish
9. ✅ Dodaj toast notifications
10. ✅ Testowanie manualne (wszystkie flow)
11. ✅ Code review i linting
12. ✅ Dokumentacja (opcjonalnie)
13. ✅ Commit i deploy

**Szacowany czas implementacji:** 8-12 godzin (dla doświadczonego frontend developera)

---

## Appendix A: Wykorzystywane biblioteki

- **React 19**: UI framework
- **TypeScript 5**: Type safety
- **Next.js**: Routing, API calls
- **Tailwind CSS 4**: Styling
- **shadcn/ui**: UI components (Card, Button, Input, Alert, AlertDialog, Skeleton, Toast)
- **lucide-react**: Ikony (Mail, User, Calendar, Bell)
- **date-fns**: Formatowanie dat (formatDistanceToNow)

## Appendix B: Pliki do utworzenia/modyfikacji

**Nowe pliki (13):**

1. `src/hooks/useInvitationNotifications.ts`
2. `src/hooks/useSentInvitations.ts`
3. `src/hooks/useReceivedInvitations.ts`
4. `src/hooks/useCreateInvitation.ts`
5. `src/app/household/components/InvitationNotificationBadge.tsx`
6. `src/app/household/components/SentInvitationItem.tsx`
7. `src/app/household/components/ReceivedInvitationCard.tsx`
8. `src/app/household/components/CreateInvitationForm.tsx`
9. `src/app/household/components/SentInvitationsList.tsx`
10. `src/app/household/components/ReceivedInvitationsList.tsx`
11. `src/app/household/components/HouseholdInvitationsSection.tsx`

**Modyfikowane pliki (3):**

1. `src/types/types.ts` - dodanie nowych ViewModels
2. `src/app/household/page.tsx` - integracja HouseholdInvitationsSection
3. `src/components/Navigation.tsx` (lub odpowiedni plik layoutu) - dodanie InvitationNotificationBadge

**Łącznie:** 11 nowych plików, 3 modyfikacje

---

**Koniec dokumentu**

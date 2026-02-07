# Plan implementacji widoku Pantry

## 1. Przegląd

Widok Pantry służy do zarządzania spiżarnią gospodarstwa domowego. Użytkownicy mogą przeglądać listę produktów w spiżarni, dodawać nowe produkty (pojedynczo lub grupowo), edytować ilość i jednostkę produktu oraz usuwać produkty z potwierdzeniem. System zapobiega dodawaniu duplikatów (bez względu na wielkość liter) i zapewnia przyjazne dla użytkownika komunikaty o błędach.

Główne funkcje:

- Wyświetlanie listy produktów w spiżarni (nazwa, ilość, jednostka)
- Dodawanie nowych produktów z walidacją i ostrzeżeniem o duplikatach
- Edycja ilości i jednostki produktu
- Usuwanie produktów z potwierdzeniem
- Stany ładowania i puste stany
- Responsywny design (lista → karty na urządzeniach mobilnych)
- Pełna dostępność (klawiatura, ARIA)

## 2. Routing widoku

**Ścieżka**: `/pantry`

**Typ strony**: Client Component (wymaga interakcji użytkownika i stanu)

**Plik**: `src/app/pantry/page.tsx`

**Wymagania autoryzacji**:

- Użytkownik musi być zalogowany (weryfikacja przez middleware)
- Użytkownik musi być członkiem gospodarstwa domowego (weryfikacja przez API)

## 3. Struktura komponentów

```
PantryPage (src/app/pantry/page.tsx)
├── PageHeader
│   ├── Tytuł strony ("Spiżarnia")
│   └── Przycisk "Dodaj produkt"
├── PantryItemsList (src/components/pantry/PantryItemsList.tsx)
│   ├── SkeletonLoader (stan ładowania)
│   ├── EmptyState (brak produktów)
│   └── PantryItemRow[] (lista produktów)
│       ├── Nazwa produktu
│       ├── Ilość i jednostka
│       ├── Przycisk edycji
│       └── Przycisk usuwania
├── AddItemDialog (src/components/pantry/AddItemDialog.tsx)
│   └── AddItemForm
│       ├── Input nazwa
│       ├── Input ilość
│       ├── Input jednostka
│       ├── Przycisk "Dodaj kolejny" (opcjonalnie)
│       └── Przyciski "Anuluj" / "Zapisz"
├── EditItemDialog (src/components/pantry/EditItemDialog.tsx)
│   └── EditItemForm
│       ├── Nazwa (readonly)
│       ├── Input ilość
│       ├── Input jednostka
│       └── Przyciski "Anuluj" / "Zapisz"
└── DeleteConfirmationDialog (src/components/pantry/DeleteConfirmationDialog.tsx)
    ├── Tekst potwierdzenia
    └── Przyciski "Anuluj" / "Usuń"
```

## 4. Szczegóły komponentów

### PantryPage

**Opis**: Główny komponent strony. Zarządza stanem dialogów, pobiera dane spiżarni i koordynuje komunikację między komponentami potomnymi.

**Główne elementy**:

- Nagłówek strony z tytułem i przyciskiem "Dodaj produkt"
- Komponent listy produktów (PantryItemsList)
- Dialogi modalne (AddItemDialog, EditItemDialog, DeleteConfirmationDialog)
- Toasty z powiadomieniami o sukcesie/błędzie

**Obsługiwane interakcje**:

- Montowanie komponentu → pobranie danych spiżarni
- Kliknięcie "Dodaj produkt" → otwarcie AddItemDialog
- Kliknięcie edycji produktu → otwarcie EditItemDialog z danymi produktu
- Kliknięcie usuwania produktu → otwarcie DeleteConfirmationDialog

**Obsługiwana walidacja**:

- Brak bezpośredniej walidacji (delegowana do formularzy)

**Typy**:

- `PantryViewModel` (ViewModel)
- `PantryWithItems` (DTO z API)
- `PantryItem` (DTO z API)

**Propsy**: Brak (komponent strony, pobiera householdId z kontekstu lub parametrów URL)

---

### PantryItemsList

**Opis**: Komponent wyświetlający listę produktów w spiżarni. Obsługuje stany: ładowanie (skeleton), pusty (empty state) i normalny (lista produktów). Responsywny - tabela na desktopie, karty na mobile.

**Główne elementy**:

- Skeleton loader (podczas ładowania)
- Empty state z komunikatem i przyciskiem CTA
- Tabela/lista produktów:
  - Desktop: `<table>` z kolumnami: Nazwa, Ilość, Jednostka, Akcje
  - Mobile: Karty (Card) dla każdego produktu
- Komunikaty o błędach (jeśli wystąpią)

**Obsługiwane interakcje**:

- Kliknięcie przycisku edycji → wywołanie callbacku `onEdit(item)`
- Kliknięcie przycisku usuwania → wywołanie callbacku `onDelete(item)`
- Nawigacja klawiaturą (Tab, Enter, Space)

**Obsługiwana walidacja**: Brak (komponent prezentacyjny)

**Typy**:

- `PantryItem[]` (lista produktów)
- `boolean` (isLoading)
- `string | null` (error)

**Propsy**:

```typescript
interface PantryItemsListProps {
  items: PantryItem[]
  isLoading: boolean
  error: string | null
  onEdit: (item: PantryItem) => void
  onDelete: (item: PantryItem) => void
  onRetry?: () => void // opcjonalnie, dla powtórzenia przy błędzie
}
```

---

### PantryItemRow

**Opis**: Pojedynczy wiersz produktu w tabeli (desktop) lub karta produktu (mobile). Wyświetla dane produktu i przyciski akcji.

**Główne elementy**:

- Desktop: `<tr>` z `<td>` dla każdego pola (nazwa, ilość, jednostka, akcje)
- Mobile: `<Card>` z układem flexbox
- Przyciski akcji: Edytuj (ikona ołówka), Usuń (ikona kosza)

**Obsługiwane interakcje**:

- Kliknięcie przycisku edycji → wywołanie `onEdit(item)`
- Kliknięcie przycisku usuwania → wywołanie `onDelete(item)`

**Obsługiwana walidacja**: Brak

**Typy**: `PantryItem`

**Propsy**:

```typescript
interface PantryItemRowProps {
  item: PantryItem
  onEdit: (item: PantryItem) => void
  onDelete: (item: PantryItem) => void
}
```

---

### AddItemDialog

**Opis**: Dialog modalny do dodawania nowych produktów do spiżarni. Zawiera formularz z polami: nazwa, ilość, jednostka. Obsługuje dodawanie pojedynczego produktu lub wielu produktów (opcjonalnie, przez przycisk "Dodaj kolejny").

**Główne elementy**:

- shadcn Dialog (modal)
- Tytuł: "Dodaj produkt"
- Formularz (AddItemForm):
  - Input: Nazwa (required, 1-100 znaków)
  - Input: Ilość (number, default 1, min 0.01)
  - Input: Jednostka (optional, max 20 znaków)
- Przyciski:
  - "Anuluj" → zamyka dialog
  - "Dodaj kolejny" → dodaje produkt i resetuje formularz (opcjonalnie)
  - "Zapisz" → dodaje produkt i zamyka dialog
- Komunikat o błędzie (inline, pod formularzem)
- Spinner (podczas submitu)

**Obsługiwane interakcje**:

- Otwarcie dialogu → focus na pierwszym polu (Nazwa)
- Wpisanie danych → walidacja na bieżąco (onChange)
- Kliknięcie "Zapisz" → walidacja, wywołanie API, zamknięcie dialogu lub wyświetlenie błędu
- Kliknięcie "Anuluj" / ESC → zamknięcie dialogu bez zapisywania
- Kliknięcie "Dodaj kolejny" → wywołanie API, reset formularza, pozostawienie dialogu otwartego

**Obsługiwana walidacja**:

- Nazwa:
  - Wymagana (min 1 znak po trim)
  - Max 100 znaków
  - Komunikat: "Nazwa produktu jest wymagana" / "Nazwa może mieć max 100 znaków"
- Ilość:
  - Wymagana
  - Liczba dodatnia (> 0)
  - Komunikat: "Ilość jest wymagana" / "Ilość musi być dodatnia"
- Jednostka:
  - Opcjonalna
  - Max 20 znaków
  - Komunikat: "Jednostka może mieć max 20 znaków"
- Duplikat (błąd z API 409):
  - Komunikat: "Produkt '[nazwa]' już istnieje w spiżarni"

**Typy**:

- `AddItemFormData` (ViewModel)
- `AddPantryItemsRequest` (request DTO)

**Propsy**:

```typescript
interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  householdId: string
  pantryId: string
  onSuccess: () => void // callback po udanym dodaniu
}
```

---

### EditItemDialog

**Opis**: Dialog modalny do edycji ilości i jednostki istniejącego produktu. Nazwa produktu jest wyświetlana jako readonly (nie można jej edytować).

**Główne elementy**:

- shadcn Dialog (modal)
- Tytuł: "Edytuj produkt"
- Formularz (EditItemForm):
  - Nazwa produktu (readonly, jako Label)
  - Input: Ilość (number, required, min 0.01)
  - Input: Jednostka (optional, max 20 znaków)
- Przyciski:
  - "Anuluj" → zamyka dialog
  - "Zapisz" → aktualizuje produkt i zamyka dialog
- Komunikat o błędzie (inline)
- Spinner (podczas submitu)

**Obsługiwane interakcje**:

- Otwarcie dialogu → focus na polu Ilość
- Modyfikacja danych → walidacja na bieżąco
- Kliknięcie "Zapisz" → walidacja, wywołanie API, zamknięcie dialogu lub wyświetlenie błędu
- Kliknięcie "Anuluj" / ESC → zamknięcie dialogu bez zapisywania

**Obsługiwana walidacja**:

- Ilość:
  - Wymagana
  - Liczba dodatnia (> 0)
  - Komunikat: "Ilość jest wymagana" / "Ilość musi być dodatnia"
- Jednostka:
  - Opcjonalna
  - Max 20 znaków
  - Komunikat: "Jednostka może mieć max 20 znaków"
- Przynajmniej jedno pole musi być zmienione (API wymaga):
  - Walidacja po stronie API, ale można też dodać po stronie frontu
  - Komunikat: "Musisz zmienić przynajmniej jedno pole"

**Typy**:

- `EditItemFormData` (ViewModel)
- `UpdatePantryItemRequest` (request DTO)
- `PantryItem` (aktualny produkt)

**Propsy**:

```typescript
interface EditItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: PantryItem | null
  pantryId: string
  onSuccess: () => void // callback po udanej edycji
}
```

---

### DeleteConfirmationDialog

**Opis**: Dialog modalny z potwierdzeniem usunięcia produktu. Wyświetla nazwę produktu i prosi o potwierdzenie.

**Główne elementy**:

- shadcn AlertDialog (modal)
- Tytuł: "Usuń produkt"
- Opis: "Czy na pewno chcesz usunąć produkt '[nazwa]'? Tej operacji nie można cofnąć."
- Przyciski:
  - "Anuluj" → zamyka dialog
  - "Usuń" (variant destructive) → usuwa produkt i zamyka dialog
- Spinner (podczas usuwania, na przycisku "Usuń")
- Komunikat o błędzie (jeśli wystąpi, inline)

**Obsługiwane interakcje**:

- Otwarcie dialogu → focus na przycisku "Anuluj" (bezpieczniejsze)
- Kliknięcie "Usuń" → wywołanie API, zamknięcie dialogu lub wyświetlenie błędu
- Kliknięcie "Anuluj" / ESC → zamknięcie dialogu bez usuwania

**Obsługiwana walidacja**: Brak (potwierdzenie akcji)

**Typy**:

- `DeleteItemData` (ViewModel)
- `PantryItem` (produkt do usunięcia)

**Propsy**:

```typescript
interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: PantryItem | null
  pantryId: string
  onSuccess: () => void // callback po udanym usunięciu
}
```

## 5. Typy

### DTO (Data Transfer Objects) - istniejące w `src/types/types.ts`

```typescript
// Produkt w spiżarni
interface PantryItem {
  id: string // UUID produktu
  name: string // Nazwa produktu
  pantryId: string // UUID spiżarni
  quantity: number // Ilość
  unit: string | null // Jednostka (opcjonalna)
}

// Spiżarnia z produktami
interface Pantry {
  id: string // UUID spiżarni
  householdId: string // UUID gospodarstwa
  createdAt: string // Data utworzenia (ISO 8601)
}

type PantryWithItems = Pantry & {
  items: PantryItem[] // Lista produktów
}

// Request do dodawania produktów
interface AddPantryItemsRequest {
  items: Array<{
    name: string // Nazwa produktu (required, 1-100 znaków)
    quantity?: number // Ilość (optional, default 1, min > 0)
    unit?: string | null // Jednostka (optional, max 20 znaków)
  }>
}

// Request do aktualizacji produktu
interface UpdatePantryItemRequest {
  quantity?: number // Nowa ilość (optional, min > 0)
  unit?: string | null // Nowa jednostka (optional, max 20 znaków)
  // Przynajmniej jedno pole musi być podane
}

// Response z API (GET /api/households/{householdId}/pantry)
type GetPantryResponse = PantryWithItems

// Response z API (POST /api/households/{householdId}/pantry/items)
interface AddPantryItemsResponse {
  items: PantryItem[] // Lista dodanych produktów
}

// Response z API (PATCH /api/pantries/{pantryId}/items/{itemId})
type UpdatePantryItemResponse = PantryItem

// Response z API (GET /api/pantries/{pantryId}/items)
interface ListPantryItemsResponse {
  data: PantryItem[] // Lista produktów
}
```

### ViewModels - nowe typy do utworzenia w `src/types/types.ts`

```typescript
/**
 * ViewModel dla widoku Pantry
 * Używany w: PantryPage
 */
export interface PantryViewModel {
  pantry: PantryWithItems | null // Dane spiżarni z produktami
  isLoading: boolean // Czy dane są wczytywane
  error: string | null // Komunikat błędu (jeśli wystąpił)
}

/**
 * ViewModel dla formularza dodawania produktu
 * Używany w: AddItemDialog
 */
export interface AddItemFormData {
  name: string // Nazwa produktu
  quantity: number // Ilość (default 1)
  unit: string // Jednostka (może być pusty string)
  isSubmitting: boolean // Czy formularz jest wysyłany
  error: string | null // Komunikat błędu (walidacja lub API)
}

/**
 * ViewModel dla formularza edycji produktu
 * Używany w: EditItemDialog
 */
export interface EditItemFormData {
  itemId: string // ID produktu (do identyfikacji)
  itemName: string // Nazwa produktu (readonly, do wyświetlenia)
  quantity: number // Nowa ilość
  unit: string // Nowa jednostka
  isSubmitting: boolean // Czy formularz jest wysyłany
  error: string | null // Komunikat błędu
}

/**
 * ViewModel dla dialogu usuwania produktu
 * Używany w: DeleteConfirmationDialog
 */
export interface DeleteItemData {
  itemId: string // ID produktu do usunięcia
  itemName: string // Nazwa produktu (do wyświetlenia w komunikacie)
  isDeleting: boolean // Czy usuwanie jest w toku
  error: string | null // Komunikat błędu (jeśli wystąpił)
}

/**
 * Błędy walidacji formularza dodawania produktu
 */
export interface AddItemFormErrors {
  name?: string // Błąd pola nazwa
  quantity?: string // Błąd pola ilość
  unit?: string // Błąd pola jednostka
  general?: string // Ogólny błąd (np. duplikat z API)
}

/**
 * Błędy walidacji formularza edycji produktu
 */
export interface EditItemFormErrors {
  quantity?: string // Błąd pola ilość
  unit?: string // Błąd pola jednostka
  general?: string // Ogólny błąd (np. z API)
}
```

### Typy dla custom hooks

```typescript
/**
 * Zwracany typ z hooka usePantry
 */
export interface UsePantryReturn {
  pantry: PantryWithItems | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Zwracany typ z hooka useAddPantryItems
 */
export interface UseAddPantryItemsReturn {
  addItems: (items: AddPantryItemsRequest['items']) => Promise<PantryItem[]>
  isLoading: boolean
  error: Error | null
}

/**
 * Zwracany typ z hooka useUpdatePantryItem
 */
export interface UseUpdatePantryItemReturn {
  updateItem: (itemId: string, data: UpdatePantryItemRequest) => Promise<PantryItem>
  isLoading: boolean
  error: Error | null
}

/**
 * Zwracany typ z hooka useDeletePantryItem
 */
export interface UseDeletePantryItemReturn {
  deleteItem: (itemId: string) => Promise<void>
  isLoading: boolean
  error: Error | null
}
```

## 6. Zarządzanie stanem

### Strategia zarządzania stanem

Widok Pantry wykorzystuje kombinację:

1. **TanStack Query (React Query)** - do zarządzania stanem serwera (dane spiżarni, cache, synchronizacja)
2. **React useState** - do zarządzania stanem lokalnym (dialogi, formularze)
3. **Custom hooks** - do enkapsulacji logiki API i walidacji

### Custom hooki

#### 1. `usePantry(householdId: string)`

**Cel**: Pobranie i cache'owanie danych spiżarni dla danego gospodarstwa.

**Implementacja**: TanStack Query `useQuery`

**Query key**: `['pantry', householdId]`

**Query function**: Wywołanie `GET /api/households/{householdId}/pantry`

**Zwracane dane**:

```typescript
{
  pantry: PantryWithItems | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}
```

**Dodatkowe opcje**:

- `staleTime: 30000` (30s) - dane są świeże przez 30 sekund
- `refetchOnWindowFocus: true` - odświeżanie przy powrocie do okna
- `retry: 1` - jedna próba ponowienia przy błędzie

**Plik**: `src/hooks/usePantry.ts`

---

#### 2. `useAddPantryItems(householdId: string)`

**Cel**: Dodawanie produktów do spiżarni z optymistyczną aktualizacją UI.

**Implementacja**: TanStack Query `useMutation`

**Mutation function**: Wywołanie `POST /api/households/{householdId}/pantry/items`

**Zwracane dane**:

```typescript
{
  addItems: (items: AddPantryItemsRequest['items']) => Promise<PantryItem[]>
  isLoading: boolean
  error: Error | null
}
```

**Optimistic update**:

- `onMutate`: Dodaj produkty do cache przed wywołaniem API (z temporary ID)
- `onSuccess`: Zamień temporary ID na prawdziwe ID z API, odśwież cache
- `onError`: Rollback zmian w cache, pokaż toast z błędem

**Invalidacja**: Invaliduj query `['pantry', householdId]` po sukcesie

**Plik**: `src/hooks/useAddPantryItems.ts`

---

#### 3. `useUpdatePantryItem(pantryId: string)`

**Cel**: Aktualizacja ilości lub jednostki produktu.

**Implementacja**: TanStack Query `useMutation`

**Mutation function**: Wywołanie `PATCH /api/pantries/{pantryId}/items/{itemId}`

**Zwracane dane**:

```typescript
{
  updateItem: (itemId: string, data: UpdatePantryItemRequest) => Promise<PantryItem>
  isLoading: boolean
  error: Error | null
}
```

**Optimistic update**:

- `onMutate`: Aktualizuj produkt w cache przed wywołaniem API
- `onSuccess`: Zaktualizuj cache z danymi z API
- `onError`: Rollback zmian w cache, pokaż toast z błędem

**Invalidacja**: Invaliduj query z pantryId po sukcesie

**Plik**: `src/hooks/useUpdatePantryItem.ts`

---

#### 4. `useDeletePantryItem(pantryId: string)`

**Cel**: Usunięcie produktu z spiżarni.

**Implementacja**: TanStack Query `useMutation`

**Mutation function**: Wywołanie `DELETE /api/pantries/{pantryId}/items/{itemId}`

**Zwracane dane**:

```typescript
{
  deleteItem: (itemId: string) => Promise<void>
  isLoading: boolean
  error: Error | null
}
```

**Optimistic update**:

- `onMutate`: Usuń produkt z cache przed wywołaniem API
- `onSuccess`: Pokaż toast z sukcesem
- `onError`: Rollback zmian w cache, pokaż toast z błędem

**Invalidacja**: Invaliduj query z pantryId po sukcesie

**Plik**: `src/hooks/useDeletePantryItem.ts`

---

### Stan lokalny w komponentach

#### PantryPage

```typescript
const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
const [editingItem, setEditingItem] = useState<PantryItem | null>(null)
const [deletingItem, setDeletingItem] = useState<PantryItem | null>(null)

// Stan z custom hooka
const { pantry, isLoading, error, refetch } = usePantry(householdId)
```

#### AddItemDialog

```typescript
const [formData, setFormData] = useState<AddItemFormData>({
  name: '',
  quantity: 1,
  unit: '',
  isSubmitting: false,
  error: null,
})

const [errors, setErrors] = useState<AddItemFormErrors>({})

// Mutation z custom hooka
const { addItems, isLoading: isMutating } = useAddPantryItems(householdId)
```

#### EditItemDialog

```typescript
const [formData, setFormData] = useState<EditItemFormData>({
  itemId: item?.id || '',
  itemName: item?.name || '',
  quantity: item?.quantity || 1,
  unit: item?.unit || '',
  isSubmitting: false,
  error: null,
})

const [errors, setErrors] = useState<EditItemFormErrors>({})

// Mutation z custom hooka
const { updateItem, isLoading: isMutating } = useUpdatePantryItem(pantryId)
```

#### DeleteConfirmationDialog

```typescript
const [deleteData, setDeleteData] = useState<DeleteItemData>({
  itemId: item?.id || '',
  itemName: item?.name || '',
  isDeleting: false,
  error: null,
})

// Mutation z custom hooka
const { deleteItem, isLoading: isDeleting } = useDeletePantryItem(pantryId)
```

## 7. Integracja API

### Endpoint 1: Pobieranie spiżarni

**HTTP Method**: GET

**URL**: `/api/households/{householdId}/pantry`

**Request**:

- Path param: `householdId` (UUID)
- Headers: Cookie-based auth (automatyczne)
- Body: Brak

**Response (200 OK)**:

```typescript
{
  id: string           // UUID spiżarni
  householdId: string  // UUID gospodarstwa
  createdAt: string    // ISO 8601
  items: PantryItem[]  // Lista produktów
}
```

**Błędy**:

- 400: Invalid householdId format
- 401: Not authenticated
- 404: Pantry not found or user not authorized
- 500: Server error

**Użycie**: Hook `usePantry`, wywoływany przy montowaniu PantryPage

---

### Endpoint 2: Dodawanie produktów

**HTTP Method**: POST

**URL**: `/api/households/{householdId}/pantry/items`

**Request**:

- Path param: `householdId` (UUID)
- Headers: Cookie-based auth, Content-Type: application/json
- Body:

```typescript
{
  items: [
    {
      name: string        // required, 1-100 chars
      quantity?: number   // optional, default 1, > 0
      unit?: string | null // optional, max 20 chars
    }
  ]
}
```

**Response (201 Created)**:

```typescript
{
  items: PantryItem[] // Lista dodanych produktów z UUID
}
```

**Błędy**:

- 400: Validation failed (invalid JSON, required fields, constraints)
- 401: Not authenticated
- 404: Pantry not found or user not authorized
- 409: Duplicate item name (case-insensitive)
- 500: Server error

**Użycie**: Hook `useAddPantryItems`, wywoływany przy submicie AddItemForm

---

### Endpoint 3: Aktualizacja produktu

**HTTP Method**: PATCH

**URL**: `/api/pantries/{pantryId}/items/{itemId}`

**Request**:

- Path params: `pantryId` (UUID), `itemId` (UUID)
- Headers: Cookie-based auth, Content-Type: application/json
- Body:

```typescript
{
  quantity?: number    // optional, > 0
  unit?: string | null // optional, max 20 chars
  // Przynajmniej jedno pole wymagane
}
```

**Response (200 OK)**:

```typescript
{
  id: string
  name: string
  pantryId: string
  quantity: number
  unit: string | null
}
```

**Błędy**:

- 400: Invalid UUID, validation failed, no fields provided
- 401: Not authenticated
- 404: Pantry/item not found or user not authorized
- 500: Server error

**Użycie**: Hook `useUpdatePantryItem`, wywoływany przy submicie EditItemForm

---

### Endpoint 4: Usuwanie produktu

**HTTP Method**: DELETE

**URL**: `/api/pantries/{pantryId}/items/{itemId}`

**Request**:

- Path params: `pantryId` (UUID), `itemId` (UUID)
- Headers: Cookie-based auth
- Body: Brak

**Response (204 No Content)**: Brak body

**Błędy**:

- 400: Invalid UUID format
- 401: Not authenticated
- 404: Pantry/item not found or user not authorized
- 500: Server error

**Użycie**: Hook `useDeletePantryItem`, wywoływany po potwierdzeniu w DeleteConfirmationDialog

## 8. Interakcje użytkownika

### 1. Wyświetlanie spiżarni

**Akcja**: Użytkownik nawiguje do `/pantry`

**Przepływ**:

1. Komponent PantryPage montuje się
2. Hook `usePantry(householdId)` automatycznie pobiera dane
3. Podczas ładowania: wyświetl SkeletonLoader
4. Po udanym pobraniu: wyświetl PantryItemsList z produktami
5. Jeśli spiżarnia pusta: wyświetl EmptyState z przyciskiem "Dodaj pierwszy produkt"
6. Jeśli błąd: wyświetl komunikat błędu z przyciskiem "Spróbuj ponownie"

**Stany UI**:

- Loading: SkeletonLoader (3-5 wierszy placeholderów)
- Success (pusta): EmptyState z ilustracją i CTA
- Success (z danymi): Lista produktów
- Error: Alert z komunikatem i przyciskiem retry

---

### 2. Dodawanie produktu

**Akcja**: Użytkownik klika przycisk "Dodaj produkt"

**Przepływ**:

1. Otwórz AddItemDialog (setIsAddDialogOpen(true))
2. Focus na polu "Nazwa"
3. Użytkownik wypełnia formularz:
   - Nazwa (required)
   - Ilość (default 1)
   - Jednostka (optional)
4. Walidacja on change:
   - Nazwa: min 1 znak, max 100
   - Ilość: > 0
   - Jednostka: max 20 znaków
5. Użytkownik klika "Zapisz":
   - Walidacja całego formularza
   - Jeśli błędy: wyświetl inline errors, nie wysyłaj
   - Jeśli OK: wywołaj `addItems([formData])`
6. Podczas wysyłania:
   - Wyświetl spinner na przycisku "Zapisz"
   - Zablokuj formularz (disabled)
7. Po sukcesie:
   - Zamknij dialog
   - Pokaż toast: "Produkt dodany pomyślnie"
   - Automatyczne odświeżenie listy (przez TanStack Query)
8. Po błędzie:
   - Jeśli 409 (duplikat): wyświetl błąd pod formularzem: "Produkt '[nazwa]' już istnieje w spiżarni"
   - Jeśli 400 (walidacja): wyświetl szczegóły błędów inline
   - Jeśli 500: wyświetl toast: "Wystąpił błąd. Spróbuj ponownie."
   - Pozostaw dialog otwarty

**Opcjonalnie - przycisk "Dodaj kolejny"**:

- Po kliknięciu: wywołaj API, ale NIE zamykaj dialogu
- Reset formularza do wartości domyślnych
- Focus na polu "Nazwa"
- Pokaż toast po każdym dodaniu

---

### 3. Edycja produktu

**Akcja**: Użytkownik klika ikonę edycji przy produkcie

**Przepływ**:

1. Zapisz wybrany produkt do stanu: setEditingItem(item)
2. Otwórz EditItemDialog
3. Formularz wypełniony aktualnymi danymi produktu
4. Focus na polu "Ilość"
5. Użytkownik modyfikuje ilość lub jednostkę
6. Walidacja on change (jak w AddItemDialog)
7. Użytkownik klika "Zapisz":
   - Walidacja
   - Sprawdzenie, czy przynajmniej jedno pole zostało zmienione
   - Wywołaj `updateItem(itemId, { quantity, unit })`
8. Podczas wysyłania:
   - Spinner na przycisku "Zapisz"
   - Zablokuj formularz
9. Po sukcesie:
   - Zamknij dialog
   - Pokaż toast: "Produkt zaktualizowany"
   - Automatyczne odświeżenie listy
10. Po błędzie:
    - Wyświetl błąd pod formularzem
    - Pozostaw dialog otwarty

---

### 4. Usuwanie produktu

**Akcja**: Użytkownik klika ikonę kosza przy produkcie

**Przepływ**:

1. Zapisz wybrany produkt do stanu: setDeletingItem(item)
2. Otwórz DeleteConfirmationDialog
3. Wyświetl komunikat: "Czy na pewno chcesz usunąć produkt '[nazwa]'? Tej operacji nie można cofnąć."
4. Focus na przycisku "Anuluj" (bezpieczniejsza opcja)
5. Użytkownik klika "Usuń":
   - Wywołaj `deleteItem(itemId)`
6. Podczas wysyłania:
   - Spinner na przycisku "Usuń"
   - Zablokuj przyciski
7. Po sukcesie:
   - Zamknij dialog
   - Pokaż toast: "Produkt usunięty"
   - Automatyczne odświeżenie listy
8. Po błędzie:
   - Wyświetl błąd w dialogu (inline)
   - Umożliw ponowną próbę lub anulowanie

**Alternatywny przepływ (Anulowanie)**:

- Użytkownik klika "Anuluj" lub ESC: zamknij dialog bez usuwania

---

### 5. Obsługa duplikatu

**Akcja**: Użytkownik próbuje dodać produkt o nazwie, która już istnieje (case-insensitive)

**Przepływ**:

1. Użytkownik wypełnia formularz AddItemDialog: nazwa = "Mleko" (a "mleko" już istnieje)
2. Użytkownik klika "Zapisz"
3. Walidacja frontendowa przechodzi (nazwa jest unikatowa po stronie klienta)
4. Wywołanie API: POST /api/households/{householdId}/pantry/items
5. API zwraca 409 Conflict z komunikatem: "Item 'mleko' already exists in pantry"
6. Frontend wyświetla błąd pod formularzem: "Produkt 'Mleko' już istnieje w spiżarni"
7. Użytkownik może:
   - Zmienić nazwę i spróbować ponownie
   - Anulować i zamknąć dialog

**Uwaga**: Duplikat jest wykrywany po stronie API (case-insensitive), nie po stronie frontu. Frontend nie próbuje sprawdzać duplikatów lokalnie, ponieważ mogłyby wystąpić race conditions.

---

### 6. Nawigacja klawiaturą

**Wymagania dostępności**:

- Wszystkie interaktywne elementy dostępne przez Tab
- Dialogi obsługują ESC (zamknięcie)
- Focus trap w dialogach (focus nie wychodzi poza dialog)
- Focus przywrócony do trigera po zamknięciu dialogu
- Enter w formularzu = submit
- Przyciski akcji (edytuj, usuń) dostępne przez Enter/Space
- ARIA labels na wszystkich interaktywnych elementach

**Kolejność tabulacji w PantryPage**:

1. Przycisk "Dodaj produkt"
2. Produkty w tabeli (kolejno: edytuj, usuń dla każdego)
3. (jeśli są paginacja/filtry: te elementy)

**Kolejność tabulacji w AddItemDialog**:

1. Input "Nazwa"
2. Input "Ilość"
3. Input "Jednostka"
4. Przycisk "Anuluj"
5. Przycisk "Zapisz" (lub "Dodaj kolejny")
6. Tab poza dialogiem: focus wraca do początku dialogu (focus trap)

## 9. Warunki i walidacja

### Walidacja po stronie frontendu

#### AddItemForm

**Walidowane warunki**:

1. **Nazwa produktu**:
   - **Komponent**: AddItemForm (Input)
   - **Warunek**: Pole wymagane, min 1 znak po trim, max 100 znaków
   - **Gdy niespełniony**:
     - Wyświetl czerwoną ramkę wokół inputa
     - Pokaż komunikat błędu pod inputem: "Nazwa produktu jest wymagana" lub "Nazwa może mieć max 100 znaków"
   - **Stan UI**: Input ma klasę `border-red-500`, tekst błędu w kolorze `text-red-600`

2. **Ilość**:
   - **Komponent**: AddItemForm (Input typu number)
   - **Warunek**: Pole wymagane, wartość > 0
   - **Gdy niespełniony**:
     - Wyświetl czerwoną ramkę
     - Komunikat: "Ilość jest wymagana" lub "Ilość musi być większa od zera"
   - **Stan UI**: Input ma klasę `border-red-500`, tekst błędu

3. **Jednostka**:
   - **Komponent**: AddItemForm (Input)
   - **Warunek**: Pole opcjonalne, max 20 znaków
   - **Gdy niespełniony**:
     - Komunikat: "Jednostka może mieć max 20 znaków"
   - **Stan UI**: Input ma klasę `border-red-500`, tekst błędu

4. **Duplikat (błąd z API)**:
   - **Komponent**: AddItemForm
   - **Warunek**: API zwraca 409 Conflict
   - **Gdy niespełniony**:
     - Wyświetl błąd pod formularzem (nie inline przy polu): "Produkt '[nazwa]' już istnieje w spiżarni"
   - **Stan UI**: Alert (warning) z żółtym tłem i ikoną ostrzeżenia

**Kiedy walidacja jest uruchamiana**:

- **onChange**: Walidacja każdego pola po utracie focusu (onBlur)
- **onSubmit**: Walidacja całego formularza przed wysłaniem
- **Po błędzie z API**: Wyświetlenie błędów z API (409, 400)

**Implementacja walidacji**:

- Użyj Zod schemas (te same co w API, dla spójności)
- Schemat: `AddPantryItemsSchema` z `src/lib/validation/pantry.ts`
- Walidacja: `schema.safeParse(formData)`
- Jeśli błędy: `setErrors(validation.error.format())`

#### EditItemForm

**Walidowane warunki**:

1. **Ilość**:
   - Warunek: Pole wymagane, wartość > 0
   - Komunikat: jak w AddItemForm

2. **Jednostka**:
   - Warunek: Pole opcjonalne, max 20 znaków
   - Komunikat: jak w AddItemForm

3. **Przynajmniej jedno pole zmienione**:
   - **Komponent**: EditItemForm
   - **Warunek**: Przynajmniej quantity lub unit musi być zmienione względem oryginalnych wartości
   - **Gdy niespełniony**:
     - Komunikat: "Musisz zmienić przynajmniej jedno pole"
   - **Stan UI**: Alert pod formularzem

**Implementacja**:

- Użyj `UpdatePantryItemSchema` z `src/lib/validation/pantry.ts`
- Dodatkowa walidacja: sprawdzenie, czy wartości się zmieniły

---

### Warunki API (weryfikowane przez backend)

Te warunki są weryfikowane przez API i błędy są zwracane do frontendu:

1. **UUID validation**:
   - Endpoint: Wszystkie
   - Warunek: householdId, pantryId, itemId muszą być valid UUID v4
   - Błąd: 400 Bad Request
   - Frontend: Pokaż toast "Nieprawidłowy identyfikator"

2. **Authentication**:
   - Endpoint: Wszystkie
   - Warunek: Użytkownik musi być zalogowany (cookie)
   - Błąd: 401 Unauthorized
   - Frontend: Przekieruj do /login

3. **Authorization**:
   - Endpoint: Wszystkie
   - Warunek: Użytkownik musi być członkiem gospodarstwa domowego
   - Błąd: 404 Not Found (celowo, żeby nie ujawniać istnienia zasobów)
   - Frontend: Pokaż toast "Nie masz dostępu do tej spiżarni" lub "Spiżarnia nie znaleziona"

4. **Duplicate item (case-insensitive)**:
   - Endpoint: POST /api/households/{householdId}/pantry/items
   - Warunek: Item name (LOWER) musi być unikalny w ramach pantryId
   - Błąd: 409 Conflict z details.duplicateNames
   - Frontend: Wyświetl inline warning w formularzu: "Produkt '[nazwa]' już istnieje w spiżarni"

5. **Batch size limit**:
   - Endpoint: POST /api/households/{householdId}/pantry/items
   - Warunek: Max 50 items per request
   - Błąd: 400 Bad Request
   - Frontend: Walidacja po stronie klienta (zablokuj wysłanie > 50), jeśli błąd z API: toast "Możesz dodać max 50 produktów na raz"

6. **Empty update**:
   - Endpoint: PATCH /api/pantries/{pantryId}/items/{itemId}
   - Warunek: Przynajmniej jedno pole (quantity lub unit) musi być podane
   - Błąd: 400 Bad Request
   - Frontend: Walidacja po stronie klienta (sprawdzenie przed wysłaniem)

---

### Mapowanie błędów API na komunikaty UI

| HTTP Status | API Error                  | Komunikat dla użytkownika                   | Akcja UI                      |
| ----------- | -------------------------- | ------------------------------------------- | ----------------------------- |
| 400         | Invalid UUID               | "Nieprawidłowy identyfikator"               | Toast (error)                 |
| 400         | Validation failed          | Szczegóły błędów (inline)                   | Wyświetl pod polami           |
| 400         | Invalid JSON               | "Nieprawidłowe dane"                        | Toast (error)                 |
| 400         | No fields provided         | "Musisz zmienić przynajmniej jedno pole"    | Inline w formularzu           |
| 401         | Not authenticated          | "Sesja wygasła"                             | Przekieruj do /login          |
| 404         | Not found / Not authorized | "Spiżarnia nie została znaleziona"          | Toast (error) + powrót        |
| 409         | Duplicate item             | "Produkt '[nazwa]' już istnieje w spiżarni" | Inline w formularzu (warning) |
| 500         | Server error               | "Wystąpił błąd serwera. Spróbuj ponownie."  | Toast (error) + retry button  |
| -           | Network error              | "Brak połączenia z serwerem"                | Toast (error) + retry button  |

## 10. Obsługa błędów

### Kategorie błędów

1. **Błędy walidacji (400)**: Wyświetlane inline w formularzach
2. **Błędy autoryzacji (401, 404)**: Przekierowanie lub komunikat globalny
3. **Błędy biznesowe (409 duplikat)**: Inline warning w formularzu
4. **Błędy serwera (500)**: Toast z możliwością retry
5. **Błędy sieciowe**: Toast z możliwością retry

---

### Obsługa błędów w komponentach

#### PantryPage

**Scenariusze błędów**:

1. **Błąd podczas ładowania spiżarni (GET)**:
   - **Przyczyna**: 404 (brak dostępu), 500 (serwer), network error
   - **Obsługa**:
     - Wyświetl Alert z komunikatem błędu
     - Przycisk "Spróbuj ponownie" → wywołuje `refetch()`
   - **UI**: Alert (red) z ikoną błędu i przyciskiem retry

2. **Użytkownik nie ma dostępu (404)**:
   - **Obsługa**:
     - Wyświetl komunikat: "Nie masz dostępu do tej spiżarni"
     - Przycisk "Powrót do strony głównej" → navigate('/')
   - **UI**: Alert z linkiem

3. **Błąd sieciowy**:
   - **Obsługa**:
     - Komunikat: "Brak połączenia z serwerem"
     - Przycisk "Spróbuj ponownie"
   - **UI**: Alert z przyciskiem retry

#### AddItemDialog

**Scenariusze błędów**:

1. **Błąd walidacji (frontend)**:
   - **Obsługa**: Wyświetl błędy inline pod polami, zablokuj submit
   - **UI**: Czerwone ramki, tekst błędu pod inputami

2. **Duplikat (409 z API)**:
   - **Obsługa**:
     - Parse response: `error.message` lub `error.details.duplicateNames`
     - Wyświetl warning pod formularzem: "Produkt '[nazwa]' już istnieje w spiżarni"
   - **UI**: Alert (yellow) z ikoną ostrzeżenia

3. **Błąd walidacji (400 z API)**:
   - **Obsługa**:
     - Parse `error.details` (Zod errors)
     - Wyświetl błędy inline przy odpowiednich polach
   - **UI**: Czerwone ramki + komunikaty

4. **Błąd serwera (500)**:
   - **Obsługa**:
     - Wyświetl toast: "Wystąpił błąd. Spróbuj ponownie."
     - Pozostaw dialog otwarty
   - **UI**: Toast (destructive)

5. **Błąd sieciowy**:
   - **Obsługa**:
     - Wyświetl toast: "Brak połączenia z serwerem"
     - Przycisk "Spróbuj ponownie" w toa<ście lub w dialogu
   - **UI**: Toast + możliwość retry

#### EditItemDialog

**Scenariusze błędów**: Analogiczne do AddItemDialog, z wyjątkiem duplikatu (nie występuje w PATCH)

#### DeleteConfirmationDialog

**Scenariusze błędów**:

1. **Produkt nie znaleziony (404)**:
   - **Obsługa**:
     - Wyświetl komunikat w dialogu: "Produkt został już usunięty"
     - Zamknij dialog po 2s
     - Odśwież listę
   - **UI**: Alert w dialogu

2. **Błąd serwera (500)**:
   - **Obsługa**:
     - Wyświetl komunikat w dialogu: "Nie udało się usunąć produktu. Spróbuj ponownie."
     - Przycisk "Spróbuj ponownie" lub "Anuluj"
   - **UI**: Alert w dialogu z przyciskiem retry

3. **Błąd sieciowy**:
   - **Obsługa**: Jak w punkcie 2

---

### Logowanie błędów

**Do konsoli**:

- Wszystkie nieoczekiwane błędy (500, network errors)
- Wraz z kontekstem: user ID, household ID, operacja

**Format**:

```typescript
console.error('[PantryPage] Failed to load pantry:', {
  householdId,
  error: error.message,
  stack: error.stack,
})
```

**Przyszłe rozszerzenie**:

- Integracja z Sentry lub podobnym narzędziem
- Tracking błędów 4xx/5xx
- User feedback widget

---

### User feedback (Toasty)

**Biblioteka**: shadcn/ui Toast (oparte na Radix UI)

**Typy toastów**:

1. **Success** (zielony): Udane operacje (dodano, zaktualizowano, usunięto)
2. **Error** (czerwony): Błędy serwera, błędy sieciowe
3. **Warning** (żółty): Ostrzeżenia (opcjonalnie, jeśli duplikat ma być w toaście zamiast inline)

**Przykłady**:

```typescript
// Sukces
toast({
  title: "Produkt dodany",
  description: "Produkt został pomyślnie dodany do spiżarni.",
  variant: "default", // zielony
})

// Błąd
toast({
  title: "Wystąpił błąd",
  description: "Nie udało się dodać produktu. Spróbuj ponownie.",
  variant: "destructive", // czerwony
})

// Błąd sieciowy z retry
toast({
  title: "Brak połączenia",
  description: "Nie można połączyć się z serwerem.",
  action: <Button onClick={retry}>Spróbuj ponownie</Button>,
  variant: "destructive",
})
```

**Kiedy używać toastów**:

- Potwierdzenia akcji (sukces)
- Błędy globalne (serwer, sieć)
- Błędy, które nie są związane z konkretnym polem formularza

**Kiedy NIE używać toastów**:

- Błędy walidacji (inline w formularzach)
- Błędy duplikatów (inline w formularzach, jako warning)

## 11. Kroki implementacji

### Faza 1: Przygotowanie (Typy i hooki)

#### Krok 1.1: Dodaj nowe typy do `src/types/types.ts`

- [ ] Dodaj `PantryViewModel`
- [ ] Dodaj `AddItemFormData` i `AddItemFormErrors`
- [ ] Dodaj `EditItemFormData` i `EditItemFormErrors`
- [ ] Dodaj `DeleteItemData`
- [ ] Dodaj typy zwracane z hooków: `UsePantryReturn`, `UseAddPantryItemsReturn`, `UseUpdatePantryItemReturn`, `UseDeletePantryItemReturn`
- [ ] Sprawdź zgodność z istniejącymi DTO (PantryItem, PantryWithItems, itp.)

#### Krok 1.2: Utwórz custom hook `usePantry`

**Plik**: `src/hooks/usePantry.ts`

- [ ] Zaimportuj `useQuery` z TanStack Query
- [ ] Zdefiniuj query key: `['pantry', householdId]`
- [ ] Zaimplementuj query function: fetch `GET /api/households/{householdId}/pantry`
- [ ] Obsłuż błędy (401 → redirect, 404 → error state, 500 → error state)
- [ ] Zwróć: `{ pantry, isLoading, error, refetch }`
- [ ] Dodaj opcje: `staleTime: 30000`, `refetchOnWindowFocus: true`

#### Krok 1.3: Utwórz custom hook `useAddPantryItems`

**Plik**: `src/hooks/useAddPantryItems.ts`

- [ ] Zaimportuj `useMutation` i `useQueryClient` z TanStack Query
- [ ] Zdefiniuj mutation function: fetch `POST /api/households/{householdId}/pantry/items`
- [ ] Zaimplementuj optimistic update:
  - `onMutate`: Dodaj produkty do cache z temporary ID
  - `onSuccess`: Zamień temporary ID na prawdziwe, odśwież cache
  - `onError`: Rollback, pokaż toast z błędem
- [ ] Invaliduj query `['pantry', householdId]` po sukcesie
- [ ] Zwróć: `{ addItems, isLoading, error }`

#### Krok 1.4: Utwórz custom hook `useUpdatePantryItem`

**Plik**: `src/hooks/useUpdatePantryItem.ts`

- [ ] Analogicznie do `useAddPantryItems`, ale dla PATCH
- [ ] Mutation function: `PATCH /api/pantries/{pantryId}/items/{itemId}`
- [ ] Optimistic update: zaktualizuj produkt w cache
- [ ] Zwróć: `{ updateItem, isLoading, error }`

#### Krok 1.5: Utwórz custom hook `useDeletePantryItem`

**Plik**: `src/hooks/useDeletePantryItem.ts`

- [ ] Analogicznie, dla DELETE
- [ ] Mutation function: `DELETE /api/pantries/{pantryId}/items/{itemId}`
- [ ] Optimistic update: usuń produkt z cache
- [ ] Zwróć: `{ deleteItem, isLoading, error }`

---

### Faza 2: Komponenty UI (Dialogi)

#### Krok 2.1: Utwórz `AddItemDialog`

**Plik**: `src/components/pantry/AddItemDialog.tsx`

- [ ] Użyj shadcn `Dialog` component
- [ ] Zaimplementuj formularz:
  - Input: Nazwa (required, max 100)
  - Input: Ilość (number, default 1, min > 0)
  - Input: Jednostka (optional, max 20)
- [ ] Dodaj walidację frontendową (Zod schema)
- [ ] Połącz z hookiem `useAddPantryItems`
- [ ] Obsłuż submit:
  - Waliduj formularz
  - Wywołaj `addItems`
  - Obsłuż błędy (409 → inline warning, 400 → inline errors, 500 → toast)
  - Po sukcesie: zamknij dialog, pokaż toast, reset formularza
- [ ] Dodaj przyciski: "Anuluj", "Zapisz"
- [ ] Zaimplementuj focus trap i ESC handling
- [ ] Dodaj spinner podczas submitu

#### Krok 2.2: Utwórz `EditItemDialog`

**Plik**: `src/components/pantry/EditItemDialog.tsx`

- [ ] Analogicznie do `AddItemDialog`, ale:
  - Nazwa jest readonly (Label)
  - Tylko pola: Ilość, Jednostka
  - Walidacja: przynajmniej jedno pole zmienione
- [ ] Połącz z hookiem `useUpdatePantryItem`
- [ ] Obsłuż submit (analogicznie)
- [ ] Focus na polu "Ilość" przy otwarciu

#### Krok 2.3: Utwórz `DeleteConfirmationDialog`

**Plik**: `src/components/pantry/DeleteConfirmationDialog.tsx`

- [ ] Użyj shadcn `AlertDialog` component
- [ ] Wyświetl komunikat: "Czy na pewno chcesz usunąć produkt '[nazwa]'? Tej operacji nie można cofnąć."
- [ ] Połącz z hookiem `useDeletePantryItem`
- [ ] Obsłuż kliknięcie "Usuń":
  - Wywołaj `deleteItem(itemId)`
  - Po sukcesie: zamknij dialog, pokaż toast
  - Po błędzie: wyświetl komunikat w dialogu
- [ ] Przyciski: "Anuluj" (default focus), "Usuń" (destructive variant)
- [ ] Spinner na przycisku "Usuń" podczas usuwania

---

### Faza 3: Komponenty UI (Lista produktów)

#### Krok 3.1: Utwórz `PantryItemRow`

**Plik**: `src/components/pantry/PantryItemRow.tsx`

- [ ] Desktop: `<tr>` z kolumnami:
  - Nazwa
  - Ilość
  - Jednostka (lub "-" jeśli null)
  - Akcje (przyciski Edytuj, Usuń)
- [ ] Mobile: `<Card>` z layoutem flexbox
- [ ] Dodaj przyciski akcji z ikonami (Edit, Trash)
- [ ] Obsłuż kliknięcia: wywołaj `onEdit(item)` i `onDelete(item)`
- [ ] Dodaj ARIA labels: "Edytuj [nazwa]", "Usuń [nazwa]"
- [ ] Responsywność: conditionally render `<tr>` vs `<Card>` based on breakpoint

#### Krok 3.2: Utwórz `PantryItemsList`

**Plik**: `src/components/pantry/PantryItemsList.tsx`

- [ ] Wyświetl skeleton loader podczas ładowania (isLoading)
- [ ] Wyświetl empty state gdy lista pusta:
  - Ilustracja (opcjonalnie)
  - Tekst: "Twoja spiżarnia jest pusta"
  - Przycisk CTA: "Dodaj pierwszy produkt"
- [ ] Wyświetl listę produktów:
  - Desktop: `<table>` z nagłówkami kolumn
  - Mobile: Grid lub stack kart
  - Każdy produkt jako `PantryItemRow`
- [ ] Obsłuż błędy: wyświetl Alert z przyciskiem "Spróbuj ponownie" (onRetry)
- [ ] Dodaj ARIA: `role="table"`, `role="row"`, itp.

#### Krok 3.3: Utwórz `SkeletonLoader`

**Plik**: `src/components/pantry/PantrySkeletonLoader.tsx` (lub reuse istniejący)

- [ ] Wyświetl 5 wierszy placeholderów (Skeleton z shadcn)
- [ ] Desktop: wiersze tabeli
- [ ] Mobile: karty

#### Krok 3.4: Utwórz `EmptyState`

**Plik**: `src/components/pantry/PantryEmptyState.tsx`

- [ ] Wyświetl ilustrację (opcjonalnie, np. ikona spiżarni)
- [ ] Tekst: "Twoja spiżarnia jest pusta"
- [ ] Podtekst: "Dodaj pierwsze produkty, aby zacząć planować posiłki"
- [ ] Przycisk: "Dodaj produkt" → wywołaj `onAddClick`

---

### Faza 4: Strona główna (PantryPage)

#### Krok 4.1: Utwórz `PantryPage`

**Plik**: `src/app/pantry/page.tsx`

- [ ] Pobierz householdId z kontekstu lub URL params (jeśli wymagane)
- [ ] Użyj hooka `usePantry(householdId)` do pobrania danych
- [ ] Zarządzaj stanem dialogów:
  - `isAddDialogOpen`
  - `editingItem` (PantryItem | null)
  - `deletingItem` (PantryItem | null)
- [ ] Zaimplementuj layout:
  - Nagłówek: Tytuł "Spiżarnia" + przycisk "Dodaj produkt"
  - Lista produktów: `PantryItemsList`
  - Dialogi: `AddItemDialog`, `EditItemDialog`, `DeleteConfirmationDialog`
- [ ] Obsłuż interakcje:
  - Kliknięcie "Dodaj produkt" → otwórz AddItemDialog
  - Callback onEdit → ustaw editingItem, otwórz EditItemDialog
  - Callback onDelete → ustaw deletingItem, otwórz DeleteConfirmationDialog
- [ ] Obsłuż błędy: wyświetl Alert lub przekieruj do /login (401)

#### Krok 4.2: Dodaj routing

**Plik**: Sprawdź, czy routing do `/pantry` jest skonfigurowany

- [ ] Upewnij się, że middleware chroni tę ścieżkę (wymaga logowania)
- [ ] Dodaj link do nawigacji (jeśli jeszcze nie ma)

---

### Faza 5: Stylowanie i responsywność

#### Krok 5.1: Stylowanie komponentów

- [ ] Zastosuj Tailwind classes zgodnie z designem
- [ ] Upewnij się, że kolory, odstępy i fonty są zgodne z systemem designu (shadcn)
- [ ] Dodaj hover states, focus states dla interaktywnych elementów
- [ ] Użyj wariantów shadcn (destructive, outline, ghost) dla przycisków

#### Krok 5.2: Responsywność

- [ ] Desktop (>= 768px):
  - Tabela produktów
  - Dialogi wyśrodkowane
- [ ] Mobile (< 768px):
  - Karty zamiast tabeli
  - Dialogi full-screen lub bottom sheet (opcjonalnie)
  - Przyciski akcji większe (łatwiejsze do kliknięcia palcem)
- [ ] Testuj na różnych rozdzielczościach

---

### Faza 6: Dostępność (A11y)

#### Krok 6.1: ARIA labels i roles

- [ ] Dodaj `aria-label` na przyciskach akcji (Edytuj, Usuń)
- [ ] Dodaj `role="table"`, `role="row"`, `role="cell"` na elementach tabeli (jeśli nie używasz semantycznego HTML)
- [ ] Dodaj `aria-live="polite"` na komunikatach błędów
- [ ] Upewnij się, że dialogi mają `role="dialog"` i `aria-labelledby`

#### Krok 6.2: Zarządzanie focusem

- [ ] Focus trap w dialogach (automatyczne w shadcn Dialog)
- [ ] Focus na pierwszym polu po otwarciu AddItemDialog
- [ ] Focus na przycisku "Anuluj" po otwarciu DeleteConfirmationDialog
- [ ] Przywracanie focusu do trigera po zamknięciu dialogu

#### Krok 6.3: Nawigacja klawiaturą

- [ ] Wszystkie interaktywne elementy dostępne przez Tab
- [ ] Enter i Space aktywują przyciski
- [ ] ESC zamyka dialogi
- [ ] Sprawdź kolejność tabulacji (logiczna)

---

### Faza 7: Testowanie

#### Krok 7.1: Testy jednostkowe (Vitest)

- [ ] Testy hooków:
  - `usePantry`: fetch, cache, error handling
  - `useAddPantryItems`: mutation, optimistic update, error handling
  - `useUpdatePantryItem`: analogicznie
  - `useDeletePantryItem`: analogicznie
- [ ] Testy komponentów:
  - `AddItemDialog`: render, walidacja, submit, błędy
  - `EditItemDialog`: analogicznie
  - `DeleteConfirmationDialog`: render, submit, błędy
  - `PantryItemsList`: stany (loading, empty, error, data)
  - `PantryItemRow`: render, callbacks

**Plik**: `src/hooks/__tests__/usePantry.test.ts`, `src/components/pantry/__tests__/AddItemDialog.test.tsx`, itp.

#### Krok 7.2: Testy integracyjne (Vitest + React Testing Library)

- [ ] Test przepływu: dodawanie produktu end-to-end
- [ ] Test przepływu: edycja produktu
- [ ] Test przepływu: usuwanie produktu
- [ ] Test obsługi duplikatu (mock API 409)
- [ ] Test obsługi błędów serwera (mock API 500)

**Plik**: `src/app/pantry/__tests__/PantryPage.integration.test.tsx`

#### Krok 7.3: Testy E2E (Playwright)

- [ ] Test: Użytkownik otwiera stronę /pantry
- [ ] Test: Użytkownik dodaje produkt do spiżarni
- [ ] Test: Użytkownik próbuje dodać duplikat (widzi ostrzeżenie)
- [ ] Test: Użytkownik edytuje produkt
- [ ] Test: Użytkownik usuwa produkt (z potwierdzeniem)
- [ ] Test: Użytkownik bez dostępu widzi błąd 404
- [ ] Test: Responsywność (mobile vs desktop)

**Plik**: `tests/e2e/pantry.spec.ts`

---

### Faza 8: Dokumentacja i czyszczenie kodu

#### Krok 8.1: Dokumentacja kodu

- [ ] Dodaj JSDoc do hooków (opis, parametry, return type)
- [ ] Dodaj komentarze do skomplikowanych fragmentów kodu
- [ ] Upewnij się, że nazwy zmiennych i funkcji są jasne i opisowe

#### Krok 8.2: Przegląd kodu

- [ ] Sprawdź, czy wszystkie komponenty są prawidłowo zaimportowane
- [ ] Sprawdź, czy nie ma unused imports
- [ ] Uruchom linter (ESLint) i napraw wszystkie błędy
- [ ] Uruchom Prettier dla spójnego formatowania

#### Krok 8.3: Optymalizacja wydajności

- [ ] Sprawdź, czy komponenty są zmemoizowane (React.memo) jeśli potrzeba
- [ ] Sprawdź, czy nie ma zbędnych re-renderów (React DevTools)
- [ ] Zoptymalizuj query options (staleTime, cacheTime)

---

### Faza 9: Deployment i monitorowanie

#### Krok 9.1: Pre-deployment checklist

- [ ] Wszystkie testy przechodzą (unit, integration, E2E)
- [ ] Linter nie zwraca błędów
- [ ] Build się udaje (npm run build)
- [ ] Sprawdź zmienne środowiskowe (API URLs, auth)

#### Krok 9.2: Deployment

- [ ] Deploy do staging environment
- [ ] Smoke tests na stagingu
- [ ] Deploy do production
- [ ] Smoke tests na produkcji

#### Krok 9.3: Monitorowanie

- [ ] Sprawdź logi błędów (console.error)
- [ ] Monitoruj metryki wydajności (ładowanie strony, time to interactive)
- [ ] Sprawdź user feedback (jeśli dostępny)

---

## Podsumowanie

Ten plan implementacji zapewnia krok-po-kroku proces tworzenia widoku Pantry. Implementacja powinna zająć około 5-7 dni roboczych dla doświadczonego programisty frontendowego, z uwzględnieniem testowania i dokumentacji.

**Kluczowe założenia**:

- Wykorzystanie istniejących API endpoints (już zaimplementowane)
- Użycie shadcn/ui dla komponentów UI (spójność z resztą aplikacji)
- TanStack Query dla zarządzania stanem serwera
- Zod dla walidacji (zgodność z backendem)
- Pełna dostępność (A11y) i responsywność
- Kompleksowe testowanie (unit, integration, E2E)

**Następne kroki po implementacji**:

1. Integracja z widokiem Shopping List (przenoszenie produktów)
2. Integracja z widokiem Recipe (usuwanie produktów używanych w przepisie)
3. Real-time collaboration (opcjonalnie, Supabase Realtime)
4. Filtry i wyszukiwanie (jeśli lista produktów rośnie)
5. Eksport/import spiżarni (CSV, opcjonalnie)

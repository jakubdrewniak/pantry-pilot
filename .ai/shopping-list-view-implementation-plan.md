# Plan implementacji widoku Listy zakupów

## 1. Przegląd

Widok Listy zakupów umożliwia użytkownikom zarządzanie listą zakupów dla gospodarstwa domowego. Użytkownicy mogą przeglądać, dodawać, edytować, usuwać produkty oraz oznaczać je jako zakupione z automatycznym transferem do spiżarni. Widok wspiera współpracę w czasie rzeczywistym - zmiany wprowadzane przez innych członków gospodarstwa są natychmiast widoczne bez odświeżania strony. Użytkownicy mogą również generować listę zakupów na podstawie wybranych przepisów oraz wykonywać operacje zbiorcze (oznaczanie wielu produktów jako zakupionych, usuwanie wielu produktów).

## 2. Routing widoku

**Ścieżka**: `/shopping-list`

Widok jest dostępny tylko dla zalogowanych użytkowników należących do gospodarstwa domowego. Middleware Next.js (`src/middleware.ts`) weryfikuje autoryzację przed wyświetleniem widoku.

## 3. Struktura komponentów

```
ShoppingListPage (strona główna)
├── ShoppingListHeader (nagłówek z tytułem i akcjami globalnymi)
│   ├── GenerateFromRecipesButton (przycisk do generowania z przepisów)
│   └── BulkActionsMenu (menu akcji zbiorczych)
│
├── AddItemForm (formularz dodawania produktów)
│   ├── Input (nazwa produktu)
│   ├── Input (ilość)
│   ├── Input (jednostka)
│   └── Button (dodaj)
│
├── ShoppingListItems (lista produktów)
│   ├── ItemsFilterBar (filtrowanie i sortowanie)
│   │   ├── Select (filtr: wszystkie / niezakupione / zakupione)
│   │   └── Select (sortowanie: nazwa / status zakupu)
│   │
│   └── ShoppingListItem[] (pojedyncze produkty)
│       ├── Checkbox (zaznaczenie produktu)
│       ├── ItemInfo (nazwa, ilość, jednostka)
│       ├── ItemActions (akcje dla produktu)
│       │   ├── Button (edytuj ilość/jednostkę)
│       │   ├── Button (oznacz jako zakupiony)
│       │   └── Button (usuń)
│       └── PurchasedBadge (znacznik "zakupiony")
│
├── BulkPurchaseConfirmDialog (dialog potwierdzenia zakupu zbiorczego)
├── BulkDeleteConfirmDialog (dialog potwierdzenia usunięcia zbiorczego)
├── EditItemDialog (dialog edycji produktu)
└── GenerateFromRecipesDialog (dialog wyboru przepisów)
```

## 4. Szczegóły komponentów

### ShoppingListPage

**Opis**: Główny komponent strony. Zarządza stanem globalnym, ładowaniem listy zakupów, subskrypcją real-time, oraz koordynuje komunikację między komponentami dziećmi.

**Główne elementy**:

- Layout strony z nagłówkiem
- Formularz dodawania produktów
- Lista produktów z filtrowaniem
- Dialogi modalne

**Obsługiwane interakcje**:

- Inicjalizacja i ładowanie listy zakupów przy montowaniu komponentu
- Subskrypcja do zmian real-time (INSERT, UPDATE, DELETE)
- Odświeżanie listy po operacjach API
- Przekazywanie callbacków do komponentów dzieci

**Obsługiwana walidacja**:

- Weryfikacja, czy użytkownik jest członkiem gospodarstwa domowego (middleware)
- Sprawdzenie, czy lista zakupów istnieje (auto-kreacja przez API)

**Typy**:

- `ShoppingListWithItems` (lista z produktami)
- `ShoppingListItem` (pojedynczy produkt)
- `ShoppingListViewModel` (model widoku)

**Propsy**: Brak (strona główna pobiera householdId z kontekstu lub sesji)

---

### ShoppingListHeader

**Opis**: Nagłówek widoku z tytułem "Lista zakupów" oraz przyciskami do akcji globalnych (generowanie z przepisów, operacje zbiorcze).

**Główne elementy**:

- Tytuł strony (h1)
- Button - "Generuj z przepisów"
- DropdownMenu - akcje zbiorcze (oznacz wybrane jako zakupione, usuń wybrane)

**Obsługiwane interakcje**:

- Kliknięcie "Generuj z przepisów" → otwiera dialog wyboru przepisów
- Kliknięcie "Oznacz wybrane jako zakupione" → wywołuje bulk purchase
- Kliknięcie "Usuń wybrane" → wywołuje bulk delete
- Przyciski akcji zbiorczych są disabled, gdy nie zaznaczono żadnych produktów

**Obsługiwana walidacja**:

- Przyciski akcji zbiorczych aktywne tylko, gdy `selectedItems.length > 0`

**Typy**: Brak specyficznych

**Propsy**:

```typescript
interface ShoppingListHeaderProps {
  selectedItemsCount: number
  onGenerateFromRecipes: () => void
  onBulkPurchase: () => void
  onBulkDelete: () => void
  isLoading: boolean
}
```

---

### AddItemForm

**Opis**: Formularz do ręcznego dodawania produktów do listy zakupów. Umożliwia dodanie wielu produktów na raz (batch).

**Główne elementy**:

- Label + Input (nazwa produktu, required)
- Label + Input (ilość, type="number", default=1)
- Label + Input (jednostka, optional)
- Button ("Dodaj produkt")
- Lista produktów do dodania (przed wysłaniem)
- Button ("Dodaj wszystkie do listy")

**Obsługiwane interakcje**:

- Wypełnienie formularza → kliknięcie "Dodaj produkt" → dodanie do lokalnej listy produktów do wysłania
- Kliknięcie "Dodaj wszystkie do listy" → wywołanie API POST /api/shopping-lists/{listId}/items
- Kliknięcie "Usuń" na produkcie z lokalnej listy → usunięcie z listy przed wysłaniem
- Enter w polu "nazwa" → dodanie produktu (submit formularza)

**Obsługiwana walidacja**:

- Nazwa produktu: wymagana, min. 1 znak, max. 100 znaków
- Ilość: wymagana, liczba >= 0
- Jednostka: opcjonalna, max. 50 znaków
- Maksymalnie 50 produktów w jednym wysłaniu (limit API)
- Duplikaty: sprawdzane case-insensitive, blokowane przez API (409 Conflict)

**Typy**:

- `AddShoppingListItemsRequest` (request)
- `AddShoppingListItemsResponse` (response)
- `AddItemFormData` (local state)
- `AddItemFormErrors` (errory walidacji)

**Propsy**:

```typescript
interface AddItemFormProps {
  listId: string
  onItemsAdded: (items: ShoppingListItem[]) => void
}
```

---

### ItemsFilterBar

**Opis**: Pasek narzędzi do filtrowania i sortowania listy produktów.

**Główne elementy**:

- Select (filtr według statusu zakupu: wszystkie / niezakupione / zakupione)
- Select (sortowanie: alfabetycznie / według statusu)

**Obsługiwane interakcje**:

- Zmiana filtra → aktualizacja query parametru `isPurchased`
- Zmiana sortowania → aktualizacja query parametru `sort`

**Obsługiwana walidacja**:

- Dostępne wartości filtra: `all`, `purchased`, `unpurchased`
- Dostępne wartości sortowania: `name`, `isPurchased`

**Typy**: Brak specyficznych

**Propsy**:

```typescript
interface ItemsFilterBarProps {
  filterStatus: 'all' | 'purchased' | 'unpurchased'
  sortBy: 'name' | 'isPurchased'
  onFilterChange: (filter: 'all' | 'purchased' | 'unpurchased') => void
  onSortChange: (sort: 'name' | 'isPurchased') => void
}
```

---

### ShoppingListItems

**Opis**: Kontener dla listy produktów. Renderuje komponenty `ShoppingListItem` dla każdego produktu.

**Główne elementy**:

- Lista produktów (ul/div)
- ShoppingListItem[] (komponenty dzieci)
- Empty state (gdy lista pusta)
- Loading skeleton (podczas ładowania)

**Obsługiwane interakcje**:

- Przekazywanie eventów z dzieci do rodzica (zaznaczenie, edycja, usunięcie, zakup)

**Obsługiwana walidacja**: Brak

**Typy**:

- `ShoppingListItem[]` (lista produktów)

**Propsy**:

```typescript
interface ShoppingListItemsProps {
  items: ShoppingListItem[]
  selectedItemIds: string[]
  onToggleSelect: (itemId: string) => void
  onEditItem: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
  onPurchaseItem: (itemId: string) => void
  isLoading: boolean
}
```

---

### ShoppingListItem

**Opis**: Pojedynczy produkt na liście zakupów. Wyświetla nazwę, ilość, jednostkę, checkbox do zaznaczenia oraz akcje (edytuj, oznacz jako zakupiony, usuń).

**Główne elementy**:

- Checkbox (zaznaczenie produktu)
- div (nazwa produktu)
- div (ilość + jednostka)
- Badge (jeśli zakupiony: "Zakupiony")
- Button (edytuj)
- Button (oznacz jako zakupiony) - widoczny tylko dla niezakupionych
- Button (usuń)

**Obsługiwane interakcje**:

- Kliknięcie checkboxa → zaznaczenie/odznaczenie produktu
- Kliknięcie "Edytuj" → otwiera dialog edycji (ilość, jednostka)
- Kliknięcie "Oznacz jako zakupiony" → wywołanie PATCH /api/shopping-lists/{listId}/items/{itemId} z `isPurchased: true`
- Kliknięcie "Usuń" → wywołanie DELETE /api/shopping-lists/{listId}/items/{itemId}

**Obsługiwana walidacja**: Brak (walidacja w dialogach edycji)

**Typy**:

- `ShoppingListItem` (produkt)

**Propsy**:

```typescript
interface ShoppingListItemProps {
  item: ShoppingListItem
  isSelected: boolean
  onToggleSelect: (itemId: string) => void
  onEdit: (itemId: string) => void
  onDelete: (itemId: string) => void
  onPurchase: (itemId: string) => void
}
```

---

### EditItemDialog

**Opis**: Dialog modalny do edycji ilości i jednostki produktu.

**Główne elementy**:

- Dialog (shadcn/ui)
- Label + Input (nazwa produktu - readonly, tylko do wyświetlenia)
- Label + Input (ilość, type="number")
- Label + Input (jednostka)
- Button ("Anuluj")
- Button ("Zapisz")

**Obsługiwane interakcje**:

- Zmiana wartości w polach → aktualizacja lokalnego stanu
- Kliknięcie "Zapisz" → walidacja → wywołanie PATCH /api/shopping-lists/{listId}/items/{itemId}
- Kliknięcie "Anuluj" → zamknięcie dialogu bez zapisywania

**Obsługiwana walidacja**:

- Ilość: wymagana, liczba > 0
- Jednostka: opcjonalna, max. 50 znaków
- Przynajmniej jedno pole musi być zmienione

**Typy**:

- `UpdateShoppingListItemRequest` (request)
- `UpdateShoppingListItemResponse` (response)
- `EditItemFormData` (local state)
- `EditItemFormErrors` (errory walidacji)

**Propsy**:

```typescript
interface EditItemDialogProps {
  item: ShoppingListItem | null
  isOpen: boolean
  onClose: () => void
  onSave: (itemId: string, updates: UpdateShoppingListItemRequest) => Promise<void>
}
```

---

### BulkPurchaseConfirmDialog

**Opis**: Dialog potwierdzenia zakupu wielu produktów na raz. Wyświetla listę zaznaczonych produktów i ostrzeżenie, że zostaną przeniesione do spiżarni.

**Główne elementy**:

- Dialog (shadcn/ui)
- Nagłówek ("Oznacz jako zakupione")
- Lista produktów do zakupu (nazwy)
- Tekst ostrzegawczy ("Produkty zostaną przeniesione do spiżarni")
- Button ("Anuluj")
- Button ("Potwierdź zakup", variant="default")

**Obsługiwane interakcje**:

- Kliknięcie "Potwierdź zakup" → wywołanie POST /api/shopping-lists/{listId}/items/bulk-purchase
- Kliknięcie "Anuluj" → zamknięcie dialogu
- Wyświetlenie toastu z wynikiem operacji (ile zakupionych, ile błędów)

**Obsługiwana walidacja**:

- Minimum 1 produkt do zakupu
- Maksymalnie 50 produktów w jednej operacji (limit API)

**Typy**:

- `BulkPurchaseItemsRequest` (request)
- `BulkPurchaseItemsResponse` (response)

**Propsy**:

```typescript
interface BulkPurchaseConfirmDialogProps {
  isOpen: boolean
  selectedItems: ShoppingListItem[]
  onClose: () => void
  onConfirm: (itemIds: string[]) => Promise<void>
}
```

---

### BulkDeleteConfirmDialog

**Opis**: Dialog potwierdzenia usunięcia wielu produktów na raz. Wyświetla listę zaznaczonych produktów i ostrzeżenie o nieodwracalności operacji.

**Główne elementy**:

- Dialog (shadcn/ui)
- Nagłówek ("Usuń produkty")
- Lista produktów do usunięcia (nazwy)
- Tekst ostrzegawczy ("Operacja jest nieodwracalna")
- Button ("Anuluj")
- Button ("Usuń", variant="destructive")

**Obsługiwane interakcje**:

- Kliknięcie "Usuń" → wywołanie DELETE /api/shopping-lists/{listId}/items/bulk-delete
- Kliknięcie "Anuluj" → zamknięcie dialogu
- Wyświetlenie toastu z wynikiem operacji (ile usuniętych, ile błędów)

**Obsługiwana walidacja**:

- Minimum 1 produkt do usunięcia
- Maksymalnie 100 produktów w jednej operacji (limit API)

**Typy**:

- `BulkDeleteItemsRequest` (request)
- `BulkDeleteItemsResponse` (response)

**Propsy**:

```typescript
interface BulkDeleteConfirmDialogProps {
  isOpen: boolean
  selectedItems: ShoppingListItem[]
  onClose: () => void
  onConfirm: (itemIds: string[]) => Promise<void>
}
```

---

### GenerateFromRecipesDialog

**Opis**: Dialog wyboru przepisów do wygenerowania listy zakupów. Wyświetla listę przepisów z możliwością zaznaczenia wielu.

**Główne elementy**:

- Dialog (shadcn/ui)
- Nagłówek ("Generuj z przepisów")
- Input (wyszukiwanie przepisów)
- Lista przepisów z checkboxami
- Button ("Anuluj")
- Button ("Generuj listę")

**Obsługiwane interakcje**:

- Wpisanie w pole wyszukiwania → filtrowanie listy przepisów
- Kliknięcie checkboxa przy przepisie → zaznaczenie/odznaczenie
- Kliknięcie "Generuj listę" → wywołanie POST /api/shopping-lists/generate z `recipeIds[]`
- Kliknięcie "Anuluj" → zamknięcie dialogu

**Obsługiwana walidacja**:

- Minimum 1 przepis musi być zaznaczony
- Maksymalnie 20 przepisów w jednej operacji (limit API)

**Typy**:

- `Recipe[]` (lista przepisów)
- `GenerateShoppingListRequest` (request)
- `GenerateShoppingListResponse` (response)

**Propsy**:

```typescript
interface GenerateFromRecipesDialogProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (recipeIds: string[]) => Promise<void>
}
```

---

## 5. Typy

### Typy bazowe (już zdefiniowane w `src/types/types.ts`)

```typescript
// Bazowe typy (już istnieją)
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
}
```

### Typy Request/Response (już zdefiniowane)

```typescript
// Request types
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

// Response types
export interface UpdateShoppingListItemResponse {
  item: ShoppingListItem
  pantryItem?: PantryItem // Tylko gdy item został zakupiony i przeniesiony
}

export interface BulkPurchaseItemsResponse {
  purchased: string[] // IDs zakupionych produktów
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
  deleted: string[] // IDs usuniętych produktów
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

### Nowe typy ViewModel (do dodania w `src/types/types.ts`)

```typescript
/**
 * ViewModel dla strony Listy zakupów
 */
export interface ShoppingListViewModel {
  shoppingList: ShoppingListWithItems | null // Lista zakupów z produktami
  filteredItems: ShoppingListItem[] // Produkty po zastosowaniu filtrów
  selectedItemIds: string[] // IDs zaznaczonych produktów
  filterStatus: 'all' | 'purchased' | 'unpurchased' // Aktualny filtr
  sortBy: 'name' | 'isPurchased' // Aktualny sposób sortowania
  isLoading: boolean // Czy dane są ładowane
  error: string | null // Komunikat błędu (jeśli wystąpił)
}

/**
 * ViewModel dla formularza dodawania produktów
 */
export interface AddItemFormData {
  name: string // Nazwa produktu
  quantity: number // Ilość (default: 1)
  unit: string // Jednostka (może być pusty string)
  itemsToAdd: Array<{
    // Lokalna lista produktów przed wysłaniem
    name: string
    quantity: number
    unit: string | null
  }>
  isSubmitting: boolean // Czy formularz jest wysyłany
  error: string | null // Komunikat błędu (walidacja lub API)
}

/**
 * Errory walidacji formularza dodawania produktów
 */
export interface AddItemFormErrors {
  name?: string // Błąd pola nazwa
  quantity?: string // Błąd pola ilość
  unit?: string // Błąd pola jednostka
  general?: string // Ogólny błąd (np. duplikaty z API)
}

/**
 * ViewModel dla formularza edycji produktu
 */
export interface EditItemFormData {
  itemId: string // ID produktu (dla identyfikacji)
  itemName: string // Nazwa produktu (readonly, do wyświetlenia)
  quantity: number // Nowa ilość
  unit: string // Nowa jednostka
  isSubmitting: boolean // Czy formularz jest wysyłany
  error: string | null // Komunikat błędu
}

/**
 * Errory walidacji formularza edycji produktu
 */
export interface EditItemFormErrors {
  quantity?: string // Błąd pola ilość
  unit?: string // Błąd pola jednostka
  general?: string // Ogólny błąd (np. z API)
}

/**
 * ViewModel dla dialogu potwierdzenia zakupu zbiorczego
 */
export interface BulkPurchaseDialogData {
  selectedItems: ShoppingListItem[] // Zaznaczone produkty do zakupu
  isPurchasing: boolean // Czy operacja jest w trakcie
  error: string | null // Komunikat błędu (jeśli wystąpił)
}

/**
 * ViewModel dla dialogu potwierdzenia usunięcia zbiorczego
 */
export interface BulkDeleteDialogData {
  selectedItems: ShoppingListItem[] // Zaznaczone produkty do usunięcia
  isDeleting: boolean // Czy operacja jest w trakcie
  error: string | null // Komunikat błędu (jeśli wystąpił)
}

/**
 * ViewModel dla dialogu generowania z przepisów
 */
export interface GenerateFromRecipesDialogData {
  recipes: Recipe[] // Lista dostępnych przepisów
  selectedRecipeIds: string[] // IDs zaznaczonych przepisów
  searchQuery: string // Zapytanie wyszukiwania
  filteredRecipes: Recipe[] // Przepisy po filtrowaniu
  isGenerating: boolean // Czy generowanie jest w trakcie
  error: string | null // Komunikat błędu (jeśli wystąpił)
}
```

---

## 6. Zarządzanie stanem

### Custom hook: `useShoppingList`

**Plik**: `src/lib/hooks/useShoppingList.ts`

**Cel**: Zarządzanie stanem listy zakupów, ładowanie danych, subskrypcja real-time, filtrowanie i sortowanie.

**Stan wewnętrzny**:

```typescript
const [shoppingList, setShoppingList] = useState<ShoppingListWithItems | null>(null)
const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
const [filterStatus, setFilterStatus] = useState<'all' | 'purchased' | 'unpurchased'>('unpurchased')
const [sortBy, setSortBy] = useState<'name' | 'isPurchased'>('name')
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<Error | null>(null)
```

**Obliczane wartości**:

```typescript
const filteredItems = useMemo(() => {
  if (!shoppingList?.items) return []

  let items = [...shoppingList.items]

  // Filtrowanie
  if (filterStatus === 'purchased') {
    items = items.filter(item => item.isPurchased)
  } else if (filterStatus === 'unpurchased') {
    items = items.filter(item => !item.isPurchased)
  }

  // Sortowanie
  if (sortBy === 'name') {
    items.sort((a, b) => a.name.localeCompare(b.name, 'pl'))
  } else if (sortBy === 'isPurchased') {
    items.sort((a, b) => Number(a.isPurchased) - Number(b.isPurchased))
  }

  return items
}, [shoppingList?.items, filterStatus, sortBy])
```

**Funkcje**:

- `fetchShoppingList()` - Pobiera listę zakupów z API
- `handleRealtimeInsert(item)` - Dodaje nowy produkt do lokalnego stanu
- `handleRealtimeUpdate(item)` - Aktualizuje produkt w lokalnym stanie
- `handleRealtimeDelete(item)` - Usuwa produkt z lokalnego stanu
- `toggleSelectItem(itemId)` - Zaznacza/odznacza produkt
- `clearSelection()` - Czyści zaznaczenie

**Return**:

```typescript
return {
  shoppingList,
  filteredItems,
  selectedItemIds,
  filterStatus,
  sortBy,
  isLoading,
  error,
  setFilterStatus,
  setSortBy,
  toggleSelectItem,
  clearSelection,
  refetch: fetchShoppingList,
}
```

---

### Custom hook: `useAddShoppingListItems`

**Plik**: `src/lib/hooks/useAddShoppingListItems.ts`

**Cel**: Dodawanie produktów do listy zakupów.

**Stan wewnętrzny**:

```typescript
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<Error | null>(null)
```

**Funkcje**:

```typescript
const addItems = async (items: AddShoppingListItemsRequest['items']) => {
  setIsLoading(true)
  setError(null)

  try {
    const response = await fetch(`/api/shopping-lists/${listId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Nie udało się dodać produktów')
    }

    const data = await response.json()
    return data.items as ShoppingListItem[]
  } catch (err) {
    setError(err as Error)
    throw err
  } finally {
    setIsLoading(false)
  }
}
```

**Return**:

```typescript
return { addItems, isLoading, error }
```

---

### Custom hook: `useUpdateShoppingListItem`

**Plik**: `src/lib/hooks/useUpdateShoppingListItem.ts`

**Cel**: Aktualizacja produktu (ilość, jednostka, status zakupu).

**Stan wewnętrzny**:

```typescript
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<Error | null>(null)
```

**Funkcje**:

```typescript
const updateItem = async (
  itemId: string,
  updates: UpdateShoppingListItemRequest
): Promise<UpdateShoppingListItemResponse> => {
  setIsLoading(true)
  setError(null)

  try {
    const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Nie udało się zaktualizować produktu')
    }

    return await response.json()
  } catch (err) {
    setError(err as Error)
    throw err
  } finally {
    setIsLoading(false)
  }
}
```

**Return**:

```typescript
return { updateItem, isLoading, error }
```

---

### Custom hook: `useDeleteShoppingListItem`

**Plik**: `src/lib/hooks/useDeleteShoppingListItem.ts`

**Cel**: Usuwanie pojedynczego produktu.

**Stan wewnętrzny**:

```typescript
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<Error | null>(null)
```

**Funkcje**:

```typescript
const deleteItem = async (itemId: string): Promise<void> => {
  setIsLoading(true)
  setError(null)

  try {
    const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Nie udało się usunąć produktu')
    }
  } catch (err) {
    setError(err as Error)
    throw err
  } finally {
    setIsLoading(false)
  }
}
```

**Return**:

```typescript
return { deleteItem, isLoading, error }
```

---

### Custom hook: `useBulkPurchase`

**Plik**: `src/lib/hooks/useBulkPurchase.ts`

**Cel**: Zakup wielu produktów na raz z transferem do spiżarni.

**Stan wewnętrzny**:

```typescript
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<Error | null>(null)
```

**Funkcje**:

```typescript
const bulkPurchase = async (itemIds: string[]): Promise<BulkPurchaseItemsResponse> => {
  setIsLoading(true)
  setError(null)

  try {
    const response = await fetch(`/api/shopping-lists/${listId}/items/bulk-purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIds }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Nie udało się zakupić produktów')
    }

    const result = await response.json()

    // Logowanie ostrzeżeń przy częściowym sukcesie
    if (result.failed.length > 0) {
      console.warn('Niektóre produkty nie zostały zakupione:', result.failed)
    }

    return result
  } catch (err) {
    setError(err as Error)
    throw err
  } finally {
    setIsLoading(false)
  }
}
```

**Return**:

```typescript
return { bulkPurchase, isLoading, error }
```

---

### Custom hook: `useBulkDelete`

**Plik**: `src/lib/hooks/useBulkDelete.ts`

**Cel**: Usuwanie wielu produktów na raz.

**Stan wewnętrzny**:

```typescript
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<Error | null>(null)
```

**Funkcje**:

```typescript
const bulkDelete = async (itemIds: string[]): Promise<BulkDeleteItemsResponse> => {
  setIsLoading(true)
  setError(null)

  try {
    const response = await fetch(`/api/shopping-lists/${listId}/items/bulk-delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIds }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Nie udało się usunąć produktów')
    }

    const result = await response.json()

    // Logowanie ostrzeżeń przy częściowym sukcesie
    if (result.failed.length > 0) {
      console.warn('Niektóre produkty nie zostały usunięte:', result.failed)
    }

    return result
  } catch (err) {
    setError(err as Error)
    throw err
  } finally {
    setIsLoading(false)
  }
}
```

**Return**:

```typescript
return { bulkDelete, isLoading, error }
```

---

### Custom hook: `useShoppingListRealtime`

**Piel**: `src/lib/hooks/useShoppingListRealtime.ts`

**Cel**: Subskrypcja do zmian real-time na liście zakupów (INSERT, UPDATE, DELETE).

**Stan wewnętrzny**:

```typescript
const [isConnected, setIsConnected] = useState(false)
const [connectionStatus, setConnectionStatus] = useState<
  'connecting' | 'connected' | 'disconnected' | 'error'
>('connecting')
const [error, setError] = useState<Error | null>(null)
```

**Funkcje**:

```typescript
useEffect(() => {
  const supabase = createClient()

  const channel = supabase
    .channel(`shopping-list-${listId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'shopping_list_items',
        filter: `shopping_list_id=eq.${listId}`,
      },
      payload => {
        onInsert?.(payload.new as ShoppingListItem)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'shopping_list_items',
        filter: `shopping_list_id=eq.${listId}`,
      },
      payload => {
        onUpdate?.(payload.new as ShoppingListItem, payload.old as ShoppingListItem)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'shopping_list_items',
        filter: `shopping_list_id=eq.${listId}`,
      },
      payload => {
        onDelete?.(payload.old as ShoppingListItem)
      }
    )
    .subscribe(status => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
        setConnectionStatus('connected')
      } else if (status === 'CHANNEL_ERROR') {
        setConnectionStatus('error')
        setError(new Error('Nie udało się połączyć z serwerem aktualizacji'))
      }
    })

  return () => {
    channel.unsubscribe()
  }
}, [listId, onInsert, onUpdate, onDelete])
```

**Return**:

```typescript
return { isConnected, connectionStatus, error }
```

---

## 7. Integracja API

### GET /api/households/{householdId}/shopping-list

**Cel**: Pobranie lub utworzenie listy zakupów dla gospodarstwa domowego.

**Request**:

- Method: GET
- Path: `/api/households/{householdId}/shopping-list`
- Headers: Cookie-based auth (automatyczne)

**Response**:

```typescript
// Status: 200 OK
{
  "id": "uuid",
  "householdId": "uuid",
  "createdAt": "2025-10-13T12:00:00Z",
  "updatedAt": "2025-10-13T12:00:00Z",
  "items": [
    {
      "id": "uuid",
      "name": "Mleko",
      "quantity": 2,
      "unit": "L",
      "isPurchased": false,
      "shoppingListId": "uuid"
    }
  ]
}
```

**Typy**:

- Request: Brak parametrów body
- Response: `GetShoppingListResponse` = `ShoppingListWithItems`

**Obsługa błędów**:

- 400 Bad Request - Nieprawidłowy householdId
- 401 Unauthorized - Brak autoryzacji (redirect do logowania)
- 403 Forbidden - Użytkownik nie jest członkiem gospodarstwa
- 500 Internal Server Error - Błąd serwera

---

### GET /api/shopping-lists/{listId}/items

**Cel**: Pobranie listy produktów z filtrowaniem i sortowaniem.

**Request**:

- Method: GET
- Path: `/api/shopping-lists/{listId}/items?isPurchased=false&sort=name`
- Headers: Cookie-based auth
- Query Params:
  - `isPurchased` (boolean, optional) - Filtr według statusu zakupu
  - `sort` (string, optional, default: "name") - Sortowanie: "name" | "isPurchased"

**Response**:

```typescript
// Status: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "name": "Mleko",
      "quantity": 2,
      "unit": "L",
      "isPurchased": false,
      "shoppingListId": "uuid"
    }
  ]
}
```

**Typy**:

- Request: Query params w URL
- Response: `ListShoppingListItemsResponse`

**Obsługa błędów**:

- 400 Bad Request - Nieprawidłowe parametry
- 401 Unauthorized - Brak autoryzacji
- 404 Not Found - Lista nie istnieje
- 500 Internal Server Error - Błąd serwera

---

### POST /api/shopping-lists/{listId}/items

**Cel**: Dodanie wielu produktów do listy zakupów.

**Request**:

- Method: POST
- Path: `/api/shopping-lists/{listId}/items`
- Headers: `Content-Type: application/json`, Cookie-based auth
- Body:

```typescript
{
  "items": [
    { "name": "Mleko", "quantity": 2, "unit": "L" },
    { "name": "Jaja", "quantity": 12, "unit": "szt" }
  ]
}
```

**Response**:

```typescript
// Status: 201 Created
{
  "items": [
    {
      "id": "uuid",
      "name": "Mleko",
      "quantity": 2,
      "unit": "L",
      "isPurchased": false,
      "shoppingListId": "uuid"
    },
    {
      "id": "uuid",
      "name": "Jaja",
      "quantity": 12,
      "unit": "szt",
      "isPurchased": false,
      "shoppingListId": "uuid"
    }
  ]
}
```

**Typy**:

- Request: `AddShoppingListItemsRequest`
- Response: `AddShoppingListItemsResponse`

**Obsługa błędów**:

- 400 Bad Request - Nieprawidłowe dane, przekroczenie limitu (50 produktów)
- 401 Unauthorized - Brak autoryzacji
- 404 Not Found - Lista nie istnieje
- 409 Conflict - Duplikat nazwy produktu (case-insensitive)
- 500 Internal Server Error - Błąd serwera

---

### PATCH /api/shopping-lists/{listId}/items/{itemId}

**Cel**: Aktualizacja produktu (ilość, jednostka, status zakupu). Gdy `isPurchased=true`, produkt jest przenoszony do spiżarni i usuwany z listy.

**Request**:

- Method: PATCH
- Path: `/api/shopping-lists/{listId}/items/{itemId}`
- Headers: `Content-Type: application/json`, Cookie-based auth
- Body (przynajmniej jedno pole wymagane):

```typescript
{
  "quantity": 3,
  "unit": "L",
  "isPurchased": true
}
```

**Response**:

```typescript
// Status: 200 OK
{
  "item": {
    "id": "uuid",
    "name": "Mleko",
    "quantity": 3,
    "unit": "L",
    "isPurchased": true,
    "shoppingListId": "uuid"
  },
  "pantryItem": { // Tylko gdy isPurchased=true
    "id": "uuid",
    "name": "Mleko",
    "quantity": 3,
    "unit": "L",
    "pantryId": "uuid"
  }
}
```

**Typy**:

- Request: `UpdateShoppingListItemRequest`
- Response: `UpdateShoppingListItemResponse`

**Obsługa błędów**:

- 400 Bad Request - Nieprawidłowe dane, brak pól do aktualizacji
- 401 Unauthorized - Brak autoryzacji
- 404 Not Found - Produkt nie istnieje
- 500 Internal Server Error - Błąd serwera

---

### DELETE /api/shopping-lists/{listId}/items/{itemId}

**Cel**: Usunięcie pojedynczego produktu z listy zakupów.

**Request**:

- Method: DELETE
- Path: `/api/shopping-lists/{listId}/items/{itemId}`
- Headers: Cookie-based auth

**Response**:

```typescript
// Status: 204 No Content
```

**Typy**:

- Request: Brak parametrów body
- Response: Brak (204 No Content)

**Obsługa błędów**:

- 400 Bad Request - Nieprawidłowy itemId
- 401 Unauthorized - Brak autoryzacji
- 404 Not Found - Produkt nie istnieje
- 500 Internal Server Error - Błąd serwera

---

### POST /api/shopping-lists/{listId}/items/bulk-purchase

**Cel**: Zakup wielu produktów na raz z transferem do spiżarni. Operacja wspiera wzorzec częściowego sukcesu (partial success).

**Request**:

- Method: POST
- Path: `/api/shopping-lists/{listId}/items/bulk-purchase`
- Headers: `Content-Type: application/json`, Cookie-based auth
- Body:

```typescript
{
  "itemIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response**:

```typescript
// Status: 200 OK (nawet przy częściowym błędzie)
{
  "purchased": ["uuid1", "uuid2"],
  "transferred": [
    { "itemId": "uuid1", "pantryItemId": "pantry-uuid1" },
    { "itemId": "uuid2", "pantryItemId": "pantry-uuid2" }
  ],
  "failed": [
    { "itemId": "uuid3", "reason": "Produkt nie znaleziony" }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  }
}
```

**Typy**:

- Request: `BulkPurchaseItemsRequest`
- Response: `BulkPurchaseItemsResponse`

**Obsługa błędów**:

- 400 Bad Request - Nieprawidłowe itemIds, pusta tablica, przekroczenie limitu (50 produktów)
- 401 Unauthorized - Brak autoryzacji
- 404 Not Found - Lista nie istnieje
- 500 Internal Server Error - Błąd serwera

**Uwaga**: Endpoint zawsze zwraca 200 OK. Sprawdź `summary.successful` i `summary.failed`, aby określić rzeczywisty wynik operacji.

---

### DELETE /api/shopping-lists/{listId}/items/bulk-delete

**Cel**: Usunięcie wielu produktów na raz. Operacja wspiera wzorzec częściowego sukcesu (partial success).

**Request**:

- Method: DELETE
- Path: `/api/shopping-lists/{listId}/items/bulk-delete`
- Headers: `Content-Type: application/json`, Cookie-based auth
- Body:

```typescript
{
  "itemIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response**:

```typescript
// Status: 200 OK (nawet przy częściowym błędzie)
{
  "deleted": ["uuid1", "uuid2"],
  "failed": [
    { "itemId": "uuid3", "reason": "Produkt nie znaleziony" }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  }
}
```

**Typy**:

- Request: `BulkDeleteItemsRequest`
- Response: `BulkDeleteItemsResponse`

**Obsługa błędów**:

- 400 Bad Request - Nieprawidłowe itemIds, pusta tablica, przekroczenie limitu (100 produktów)
- 401 Unauthorized - Brak autoryzacji
- 404 Not Found - Lista nie istnieje
- 500 Internal Server Error - Błąd serwera

**Uwaga**: Endpoint zawsze zwraca 200 OK. Sprawdź `summary.successful` i `summary.failed`, aby określić rzeczywisty wynik operacji.

---

## 8. Interakcje użytkownika

### Przeglądanie listy zakupów

1. Użytkownik wchodzi na stronę `/shopping-list`
2. System ładuje listę zakupów dla gospodarstwa domowego użytkownika
3. Wyświetlana jest lista produktów z nazwą, ilością i jednostką
4. Domyślnie widoczne są tylko niezakupione produkty (filtr: "Niezakupione")
5. Lista jest posortowana alfabetycznie według nazwy produktu

**Przepływ danych**:

```
ShoppingListPage (mount)
  → useShoppingList()
    → GET /api/households/{householdId}/shopping-list
      → setShoppingList(data)
      → filteredItems (computed)
```

---

### Dodawanie produktów ręcznie

1. Użytkownik wypełnia formularz dodawania produktu (nazwa, ilość, jednostka)
2. Kliknięcie "Dodaj produkt" → produkt jest dodawany do lokalnej listy produktów do wysłania
3. Użytkownik może dodać więcej produktów (max 50)
4. Kliknięcie "Dodaj wszystkie do listy" → wywołanie API POST /items
5. Po sukcesie: lokalny stan jest czyszczony, toast sukcesu jest wyświetlany
6. Real-time: inne użytkownicy widzą nowe produkty natychmiast (INSERT event)

**Przepływ danych**:

```
AddItemForm
  → useState(itemsToAdd)
  → handleAddToLocalList() → push to itemsToAdd
  → handleSubmit()
    → useAddShoppingListItems()
      → POST /api/shopping-lists/{listId}/items
        → Success: toast + clear form
        → Error: display error message
```

**Walidacja**:

- Nazwa: wymagana, 1-100 znaków
- Ilość: wymagana, liczba >= 0
- Jednostka: opcjonalna, max 50 znaków
- Max 50 produktów w jednej operacji

**Obsługa błędów**:

- 409 Conflict (duplikat) → "Produkt o tej nazwie już istnieje na liście"
- 400 Bad Request → wyświetlenie szczegółów walidacji z API
- 500 Internal Server Error → "Nie udało się dodać produktów. Spróbuj ponownie."

---

### Edycja produktu (ilość, jednostka)

1. Użytkownik klika "Edytuj" przy produkcie
2. Otwiera się dialog z formularzem edycji
3. Formularz jest wypełniony aktualnymi wartościami (ilość, jednostka)
4. Nazwa produktu jest wyświetlana jako readonly
5. Użytkownik zmienia wartości i klika "Zapisz"
6. Wywołanie API PATCH /items/{itemId}
7. Po sukcesie: dialog się zamyka, toast sukcesu jest wyświetlany
8. Real-time: inne użytkownicy widzą zmianę natychmiast (UPDATE event)

**Przepływ danych**:

```
ShoppingListItem
  → onClick "Edytuj"
    → setEditDialogOpen(true, item)
      → EditItemDialog
        → useState(formData)
        → handleSubmit()
          → useUpdateShoppingListItem()
            → PATCH /api/shopping-lists/{listId}/items/{itemId}
              → Success: close dialog + toast
              → Error: display error in dialog
```

**Walidacja**:

- Ilość: wymagana, liczba > 0
- Jednostka: opcjonalna, max 50 znaków
- Przynajmniej jedno pole musi być zmienione

**Obsługa błędów**:

- 400 Bad Request → wyświetlenie szczegółów walidacji
- 404 Not Found → "Produkt nie został znaleziony"
- 500 Internal Server Error → "Nie udało się zaktualizować produktu"

---

### Oznaczanie produktu jako zakupionego

1. Użytkownik klika "Oznacz jako zakupiony" przy produkcie
2. Optimistic update: produkt jest wizualnie oznaczony jako zakupiony
3. Wywołanie API PATCH /items/{itemId} z `isPurchased: true`
4. Backend: produkt jest przenoszony do spiżarni (merge ilości jeśli istnieje) i usuwany z listy
5. Real-time: produkt znika z listy (DELETE event)
6. Jeśli operacja się nie powiedzie: revert optimistic update, wyświetlenie błędu

**Przepływ danych**:

```
ShoppingListItem
  → onClick "Oznacz jako zakupiony"
    → optimistic update (setItems)
    → useUpdateShoppingListItem()
      → PATCH /api/shopping-lists/{listId}/items/{itemId} { isPurchased: true }
        → Success: DELETE event from realtime (item removed from list)
        → Error: revert optimistic update + toast error
```

**Logika backendu**:

1. Rozpoczęcie transakcji
2. Znalezienie produktu w pantry (case-insensitive name)
3. Jeśli istnieje: merge ilości (pantry.quantity += item.quantity)
4. Jeśli nie istnieje: stworzenie nowego produktu w pantry
5. Usunięcie produktu z shopping list
6. Commit transakcji
7. DELETE event jest emitowany przez Supabase CDC

**Obsługa błędów**:

- 404 Not Found → "Produkt nie został znaleziony"
- 500 Internal Server Error → "Nie udało się zakupić produktu"

---

### Usuwanie produktu

1. Użytkownik klika "Usuń" przy produkcie
2. Wywołanie API DELETE /items/{itemId} (bez dodatkowego dialogu potwierdzenia)
3. Optimistic update: produkt znika z listy
4. Po sukcesie: toast sukcesu
5. Real-time: inne użytkownicy widzą usunięcie natychmiast (DELETE event)
6. Jeśli operacja się nie powiedzie: revert optimistic update

**Przepływ danych**:

```
ShoppingListItem
  → onClick "Usuń"
    → optimistic update (remove from items)
    → useDeleteShoppingListItem()
      → DELETE /api/shopping-lists/{listId}/items/{itemId}
        → Success: toast + DELETE event from realtime
        → Error: revert optimistic update + toast error
```

**Obsługa błędów**:

- 404 Not Found → "Produkt nie został znaleziony"
- 500 Internal Server Error → "Nie udało się usunąć produktu"

---

### Zaznaczanie produktów (bulk selection)

1. Użytkownik klika checkbox przy produkcie → produkt jest dodawany do `selectedItemIds`
2. Użytkownik może zaznaczyć wiele produktów
3. Gdy przynajmniej jeden produkt jest zaznaczony, przyciski akcji zbiorczych stają się aktywne
4. Użytkownik może kliknąć checkbox ponownie, aby odznaczyć produkt

**Przepływ danych**:

```
ShoppingListItem
  → onChange checkbox
    → toggleSelectItem(itemId)
      → setSelectedItemIds(prev => toggle logic)
```

---

### Zakup wielu produktów na raz (bulk purchase)

1. Użytkownik zaznacza wiele produktów (checkboxy)
2. Kliknięcie "Oznacz wybrane jako zakupione" w menu akcji zbiorczych
3. Otwiera się dialog potwierdzenia z listą zaznaczonych produktów
4. Wyświetlane jest ostrzeżenie: "Produkty zostaną przeniesione do spiżarni"
5. Użytkownik klika "Potwierdź zakup"
6. Wywołanie API POST /bulk-purchase z tablicą itemIds
7. Backend przetwarza każdy produkt niezależnie (partial success pattern)
8. Response zawiera listę zakupionych, przeniesionych i błędnych produktów
9. Wyświetlenie toastu z wynikiem: "Zakupiono X z Y produktów"
10. Jeśli są błędy: dodatkowy toast z ostrzeżeniem
11. Real-time: produkty znikają z listy (DELETE events)

**Przepływ danych**:

```
ShoppingListHeader
  → onClick "Oznacz wybrane jako zakupione"
    → setBulkPurchaseDialogOpen(true)
      → BulkPurchaseConfirmDialog
        → onClick "Potwierdź zakup"
          → useBulkPurchase()
            → POST /api/shopping-lists/{listId}/items/bulk-purchase
              → Success: toast(summary) + clearSelection()
              → Partial success: toast(success) + toast(warnings)
              → Error: toast(error)
```

**Walidacja**:

- Minimum 1 produkt zaznaczony
- Maksymalnie 50 produktów w jednej operacji

**Obsługa błędów i częściowego sukcesu**:

```typescript
if (result.summary.successful > 0) {
  toast.success(`Zakupiono ${result.summary.successful} produktów`)
}

if (result.summary.failed > 0) {
  toast.warning(`${result.summary.failed} produktów nie zostało zakupionych`)
  console.error('Szczegóły błędów:', result.failed)
}
```

---

### Usuwanie wielu produktów na raz (bulk delete)

1. Użytkownik zaznacza wiele produktów (checkboxy)
2. Kliknięcie "Usuń wybrane" w menu akcji zbiorczych
3. Otwiera się dialog potwierdzenia z listą zaznaczonych produktów
4. Wyświetlane jest ostrzeżenie: "Operacja jest nieodwracalna"
5. Użytkownik klika "Usuń"
6. Wywołanie API DELETE /bulk-delete z tablicą itemIds
7. Backend przetwarza każdy produkt niezależnie (partial success pattern)
8. Response zawiera listę usuniętych i błędnych produktów
9. Wyświetlenie toastu z wynikiem: "Usunięto X z Y produktów"
10. Jeśli są błędy: dodatkowy toast z ostrzeżeniem
11. Real-time: produkty znikają z listy (DELETE events)

**Przepływ danych**:

```
ShoppingListHeader
  → onClick "Usuń wybrane"
    → setBulkDeleteDialogOpen(true)
      → BulkDeleteConfirmDialog
        → onClick "Usuń"
          → useBulkDelete()
            → DELETE /api/shopping-lists/{listId}/items/bulk-delete
              → Success: toast(summary) + clearSelection()
              → Partial success: toast(success) + toast(warnings)
              → Error: toast(error)
```

**Walidacja**:

- Minimum 1 produkt zaznaczony
- Maksymalnie 100 produktów w jednej operacji

**Obsługa błędów i częściowego sukcesu**:

```typescript
if (result.summary.successful > 0) {
  toast.success(`Usunięto ${result.summary.successful} produktów`)
}

if (result.summary.failed > 0) {
  toast.warning(`${result.summary.failed} produktów nie zostało usuniętych`)
  console.error('Szczegóły błędów:', result.failed)
}
```

---

### Generowanie listy z przepisów

1. Użytkownik klika "Generuj z przepisów"
2. Otwiera się dialog z listą wszystkich przepisów użytkownika
3. Użytkownik może wpisać zapytanie w pole wyszukiwania → filtrowanie listy
4. Użytkownik zaznacza przepisy (checkboxy)
5. Przycisk "Generuj listę" jest aktywny, gdy zaznaczono przynajmniej 1 przepis
6. Kliknięcie "Generuj listę" → wywołanie API POST /shopping-lists/generate
7. Backend agreguje składniki z wybranych przepisów (merge duplikatów, sumowanie ilości)
8. Response zawiera listę wygenerowanych produktów
9. Dialog się zamyka, toast sukcesu jest wyświetlany
10. Real-time: nowe produkty pojawiają się na liście (INSERT events)

**Przepływ danych**:

```
ShoppingListHeader
  → onClick "Generuj z przepisów"
    → setGenerateDialogOpen(true)
      → GenerateFromRecipesDialog
        → fetch recipes from API
        → useState(selectedRecipeIds)
        → onSearch → filter recipes
        → onClick "Generuj listę"
          → POST /api/shopping-lists/generate { recipeIds }
            → Success: close dialog + toast + INSERT events
            → Error: display error in dialog
```

**Walidacja**:

- Minimum 1 przepis zaznaczony
- Maksymalnie 20 przepisów w jednej operacji

**Logika backendu** (generowanie):

1. Pobranie wybranych przepisów z bazy danych
2. Ekstrahowanie składników z każdego przepisu
3. Grupowanie składników według nazwy (case-insensitive)
4. Sumowanie ilości dla duplikatów (jeśli jednostki się zgadzają)
5. Wstawianie produktów do shopping_list_items (batch insert)
6. INSERT events są emitowane dla każdego produktu

**Obsługa błędów**:

- 400 Bad Request (brak recipeIds) → "Wybierz przynajmniej jeden przepis"
- 400 Bad Request (limit exceeded) → "Możesz wybrać maksymalnie 20 przepisów"
- 404 Not Found → "Niektóre przepisy nie zostały znalezione"
- 500 Internal Server Error → "Nie udało się wygenerować listy zakupów"

---

### Filtrowanie i sortowanie

**Filtrowanie**:

1. Użytkownik klika select "Filtruj według"
2. Wybiera opcję: "Wszystkie" / "Niezakupione" / "Zakupione"
3. Lista produktów jest filtrowana natychmiast (computed value w `useShoppingList`)

**Sortowanie**:

1. Użytkownik klika select "Sortuj według"
2. Wybiera opcję: "Alfabetycznie" / "Status zakupu"
3. Lista produktów jest sortowana natychmiast (computed value w `useShoppingList`)

**Przepływ danych**:

```
ItemsFilterBar
  → onChange select (filter)
    → setFilterStatus(value)
      → filteredItems (recomputed)
  → onChange select (sort)
    → setSortBy(value)
      → filteredItems (recomputed)
```

---

### Real-time collaboration

**Scenariusz**: Dwóch użytkowników (A i B) z tego samego gospodarstwa otwiera stronę listy zakupów.

**INSERT event**:

1. Użytkownik A dodaje produkt "Mleko"
2. API wywołanie: POST /items
3. Supabase emituje INSERT event
4. Użytkownik B otrzymuje event przez subscription
5. `handleRealtimeInsert()` dodaje produkt do lokalnego stanu
6. Produkt "Mleko" pojawia się na liście użytkownika B bez odświeżania

**UPDATE event**:

1. Użytkownik A edytuje ilość produktu "Mleko" z 2 na 3
2. API wywołanie: PATCH /items/{itemId}
3. Supabase emituje UPDATE event
4. Użytkownik B otrzymuje event przez subscription
5. `handleRealtimeUpdate()` aktualizuje produkt w lokalnym stanie
6. Ilość "Mleko" zmienia się z 2 na 3 na liście użytkownika B

**DELETE event**:

1. Użytkownik A usuwa produkt "Mleko"
2. API wywołanie: DELETE /items/{itemId}
3. Supabase emituje DELETE event
4. Użytkownik B otrzymuje event przez subscription
5. `handleRealtimeDelete()` usuwa produkt z lokalnego stanu
6. Produkt "Mleko" znika z listy użytkownika B

**Przepływ danych**:

```
User A: POST /items
  → Supabase INSERT
    → User B: subscription.on('INSERT')
      → handleRealtimeInsert(item)
        → setItems(prev => [...prev, item])
```

**Optymalizacja**:

- Debouncing: wydarzenia real-time są debounced (100ms), aby uniknąć zbyt częstych renderów
- Optimistic updates: operacje użytkownika są wykonywane lokalnie natychmiast, a następnie potwierdzane przez real-time events
- Connection status: użytkownik widzi wskaźnik statusu połączenia ("Połączono" / "Łączenie..." / "Błąd połączenia")

---

## 9. Warunki i walidacja

### Warunki weryfikowane przez interfejs

#### AddItemForm

**Komponenty**: AddItemForm

**Warunki**:

1. **Nazwa produktu**:
   - Walidacja: wymagana, długość 1-100 znaków
   - Weryfikacja: `if (!name.trim()) error = "Nazwa jest wymagana"`
   - Wpływ: przycisk "Dodaj produkt" disabled, komunikat błędu pod polem
   - Gdzie: klient (AddItemForm) + API (Zod schema)

2. **Ilość**:
   - Walidacja: wymagana, liczba >= 0
   - Weryfikacja: `if (quantity < 0) error = "Ilość musi być >= 0"`
   - Wpływ: przycisk "Dodaj produkt" disabled, komunikat błędu pod polem
   - Gdzie: klient (AddItemForm) + API (Zod schema)

3. **Jednostka**:
   - Walidacja: opcjonalna, max 50 znaków
   - Weryfikacja: `if (unit.length > 50) error = "Maksymalnie 50 znaków"`
   - Wpływ: komunikat błędu pod polem
   - Gdzie: klient (AddItemForm) + API (Zod schema)

4. **Limit produktów do dodania**:
   - Walidacja: max 50 produktów w jednej operacji
   - Weryfikacja: `if (itemsToAdd.length >= 50) disable "Dodaj produkt" button`
   - Wpływ: przycisk "Dodaj produkt" disabled, komunikat "Maksymalnie 50 produktów na raz"
   - Gdzie: klient (AddItemForm) + API (Zod schema)

5. **Duplikaty**:
   - Walidacja: nazwa produktu musi być unikalna (case-insensitive)
   - Weryfikacja: wykonywana przez API
   - Wpływ: 409 Conflict → komunikat błędu "Produkt o tej nazwie już istnieje"
   - Gdzie: API (service layer)

---

#### EditItemDialog

**Komponenty**: EditItemDialog

**Warunki**:

1. **Ilość**:
   - Walidacja: wymagana, liczba > 0
   - Weryfikacja: `if (quantity <= 0) error = "Ilość musi być > 0"`
   - Wpływ: przycisk "Zapisz" disabled, komunikat błędu pod polem
   - Gdzie: klient (EditItemDialog) + API (Zod schema)

2. **Jednostka**:
   - Walidacja: opcjonalna, max 50 znaków
   - Weryfikacja: `if (unit.length > 50) error = "Maksymalnie 50 znaków"`
   - Wpływ: komunikat błędu pod polem
   - Gdzie: klient (EditItemDialog) + API (Zod schema)

3. **Zmiana wartości**:
   - Walidacja: przynajmniej jedno pole musi być zmienione
   - Weryfikacja: `if (quantity === item.quantity && unit === item.unit) disable "Zapisz"`
   - Wpływ: przycisk "Zapisz" disabled
   - Gdzie: klient (EditItemDialog)

---

#### BulkPurchaseConfirmDialog

**Komponenty**: BulkPurchaseConfirmDialog

**Warunki**:

1. **Minimum produktów**:
   - Walidacja: przynajmniej 1 produkt musi być zaznaczony
   - Weryfikacja: `if (selectedItemIds.length === 0) disable button`
   - Wpływ: przycisk "Oznacz wybrane jako zakupione" w ShoppingListHeader disabled
   - Gdzie: klient (ShoppingListHeader)

2. **Maksimum produktów**:
   - Walidacja: max 50 produktów w jednej operacji
   - Weryfikacja: `if (selectedItemIds.length > 50) show warning`
   - Wpływ: komunikat ostrzegawczy w dialogu, przycisk disabled
   - Gdzie: klient (BulkPurchaseConfirmDialog) + API (Zod schema)

---

#### BulkDeleteConfirmDialog

**Komponenty**: BulkDeleteConfirmDialog

**Warunki**:

1. **Minimum produktów**:
   - Walidacja: przynajmniej 1 produkt musi być zaznaczony
   - Weryfikacja: `if (selectedItemIds.length === 0) disable button`
   - Wpływ: przycisk "Usuń wybrane" w ShoppingListHeader disabled
   - Gdzie: klient (ShoppingListHeader)

2. **Maksimum produktów**:
   - Walidacja: max 100 produktów w jednej operacji
   - Weryfikacja: `if (selectedItemIds.length > 100) show warning`
   - Wpływ: komunikat ostrzegawczy w dialogu, przycisk disabled
   - Gdzie: klient (BulkDeleteConfirmDialog) + API (Zod schema)

---

#### GenerateFromRecipesDialog

**Komponenty**: GenerateFromRecipesDialog

**Warunki**:

1. **Minimum przepisów**:
   - Walidacja: przynajmniej 1 przepis musi być zaznaczony
   - Weryfikacja: `if (selectedRecipeIds.length === 0) disable button`
   - Wpływ: przycisk "Generuj listę" disabled
   - Gdzie: klient (GenerateFromRecipesDialog)

2. **Maksimum przepisów**:
   - Walidacja: max 20 przepisów w jednej operacji
   - Weryfikacja: `if (selectedRecipeIds.length > 20) show warning`
   - Wpływ: komunikat ostrzegawczy, checkbox disabled dla kolejnych przepisów
   - Gdzie: klient (GenerateFromRecipesDialog) + API (Zod schema)

---

#### ShoppingListPage

**Komponenty**: ShoppingListPage, ShoppingListHeader

**Warunki**:

1. **Członkostwo w gospodarstwie domowym**:
   - Walidacja: użytkownik musi być członkiem gospodarstwa domowego
   - Weryfikacja: wykonywana przez middleware Next.js + API (service layer)
   - Wpływ: 403 Forbidden → przekierowanie do strony głównej lub komunikat błędu
   - Gdzie: middleware + API (service layer)

2. **Autoryzacja**:
   - Walidacja: użytkownik musi być zalogowany
   - Weryfikacja: wykonywana przez middleware Next.js
   - Wpływ: 401 Unauthorized → przekierowanie do /login
   - Gdzie: middleware

3. **Istnienie listy zakupów**:
   - Walidacja: lista zakupów musi istnieć dla gospodarstwa domowego
   - Weryfikacja: API automatycznie tworzy listę, jeśli nie istnieje (get-or-create pattern)
   - Wpływ: brak (zawsze sukces)
   - Gdzie: API (service layer)

---

### Sposób weryfikacji warunków na poziomie komponentów

**Walidacja po stronie klienta (synchroniczna)**:

```typescript
// AddItemForm - walidacja nazwy
const validateName = (name: string): string | null => {
  if (!name.trim()) return 'Nazwa jest wymagana'
  if (name.length > 100) return 'Maksymalnie 100 znaków'
  return null
}

// Walidacja w onChange
const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value
  setName(value)
  setErrors(prev => ({ ...prev, name: validateName(value) }))
}

// Walidacja przed submit
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()

  const nameError = validateName(name)
  const quantityError = quantity < 0 ? 'Ilość musi być >= 0' : null

  if (nameError || quantityError) {
    setErrors({ name: nameError, quantity: quantityError })
    return
  }

  // Submit to API
}
```

**Walidacja po stronie API (asynchroniczna)**:

```typescript
// useAddShoppingListItems - obsługa błędów z API
const addItems = async (items: AddShoppingListItemsRequest['items']) => {
  try {
    const response = await fetch(`/api/shopping-lists/${listId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })

    if (!response.ok) {
      const errorData = await response.json()

      // 409 Conflict - duplikat
      if (response.status === 409) {
        throw new Error('Produkt o tej nazwie już istnieje na liście')
      }

      // 400 Bad Request - walidacja
      if (response.status === 400) {
        throw new Error(errorData.message || 'Nieprawidłowe dane')
      }

      throw new Error('Nie udało się dodać produktów')
    }

    return await response.json()
  } catch (err) {
    setError(err as Error)
    throw err
  }
}
```

**Warunki kontrolujące stan UI**:

```typescript
// ShoppingListHeader - przyciski akcji zbiorczych
<Button
  disabled={selectedItemsCount === 0 || isLoading}
  onClick={onBulkPurchase}
>
  Oznacz wybrane jako zakupione
</Button>

// EditItemDialog - przycisk "Zapisz"
<Button
  disabled={
    quantity === item.quantity &&
    unit === item.unit ||
    isSubmitting
  }
  onClick={handleSubmit}
>
  Zapisz
</Button>

// GenerateFromRecipesDialog - przycisk "Generuj"
<Button
  disabled={
    selectedRecipeIds.length === 0 ||
    selectedRecipeIds.length > 20 ||
    isGenerating
  }
  onClick={handleGenerate}
>
  Generuj listę
</Button>
```

---

## 10. Obsługa błędów

### Błędy po stronie klienta (walidacja)

**Typy błędów**:

1. Puste wymagane pola
2. Nieprawidłowe wartości (np. quantity < 0)
3. Przekroczenie limitów znaków
4. Przekroczenie limitów operacji (50 produktów, 20 przepisów)

**Sposób obsługi**:

- Wyświetlenie komunikatu błędu pod polem formularza (tekst czerwony, mała czcionka)
- Wyłączenie przycisku submit, dopóki błędy nie zostaną naprawione
- Real-time validation (onChange) dla lepszego UX

**Przykład**:

```typescript
{errors.name && (
  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
)}
```

---

### Błędy po stronie API

**Typy błędów**:

1. **400 Bad Request** - nieprawidłowe dane lub parametry
2. **401 Unauthorized** - brak autoryzacji
3. **403 Forbidden** - brak dostępu do zasobu
4. **404 Not Found** - zasób nie istnieje
5. **409 Conflict** - duplikat produktu
6. **500 Internal Server Error** - błąd serwera

**Sposób obsługi**:

```typescript
try {
  await addItems([{ name: 'Mleko', quantity: 2 }])
  toast.success('Dodano produkt')
} catch (err) {
  const errorMessage = err.message

  // Mapowanie błędów na user-friendly messages
  if (errorMessage.includes('już istnieje')) {
    toast.error('Produkt o tej nazwie już istnieje na liście')
  } else if (errorMessage.includes('Unauthorized')) {
    router.push('/login')
  } else if (errorMessage.includes('Forbidden')) {
    toast.error('Nie masz dostępu do tej listy zakupów')
  } else {
    toast.error('Nie udało się dodać produktu. Spróbuj ponownie.')
  }

  // Logowanie szczegółów dla debugowania
  console.error('API error:', err)
}
```

---

### Błędy real-time subscription

**Typy błędów**:

1. Connection error - nie można połączyć się z serwerem
2. Channel error - błąd subskrypcji kanału
3. Network timeout - utrata połączenia

**Sposób obsługi**:

```typescript
const { isConnected, connectionStatus, error } = useShoppingListRealtime(listId, ...)

// Wyświetlenie statusu połączenia
{connectionStatus === 'connecting' && (
  <Badge variant="outline">Łączenie...</Badge>
)}

{connectionStatus === 'connected' && (
  <Badge variant="success">Połączono</Badge>
)}

{connectionStatus === 'error' && (
  <Badge variant="destructive">
    Błąd połączenia
    <Button size="sm" onClick={reconnect}>Połącz ponownie</Button>
  </Badge>
)}
```

---

### Częściowy sukces (partial success) w operacjach zbiorczych

**Scenariusz**: Użytkownik zaznacza 5 produktów do zakupu, ale 2 z nich już nie istnieją.

**Odpowiedź API**:

```json
{
  "purchased": ["uuid1", "uuid2", "uuid3"],
  "transferred": [...],
  "failed": [
    { "itemId": "uuid4", "reason": "Produkt nie znaleziony" },
    { "itemId": "uuid5", "reason": "Produkt nie znaleziony" }
  ],
  "summary": {
    "total": 5,
    "successful": 3,
    "failed": 2
  }
}
```

**Sposób obsługi**:

```typescript
const result = await bulkPurchase(selectedItemIds)

// Wyświetlenie sukcesu
if (result.summary.successful > 0) {
  toast.success(`Zakupiono ${result.summary.successful} z ${result.summary.total} produktów`)
}

// Wyświetlenie ostrzeżenia o błędach
if (result.summary.failed > 0) {
  toast.warning(`${result.summary.failed} produktów nie zostało zakupionych`)

  // Logowanie szczegółów dla debugowania
  console.error('Failed items:', result.failed)
}

// Odświeżenie listy (opcjonalnie)
clearSelection()
```

---

### Obsługa błędów sieci (network errors)

**Typy błędów**:

1. Brak połączenia z internetem
2. Timeout
3. CORS errors

**Sposób obsługi**:

```typescript
try {
  await addItems([...])
} catch (err) {
  if (!navigator.onLine) {
    toast.error('Brak połączenia z internetem')
  } else if (err.name === 'AbortError') {
    toast.error('Żądanie przekroczyło limit czasu')
  } else {
    toast.error('Wystąpił błąd sieci. Sprawdź połączenie.')
  }
}
```

---

### Fallback dla utraty połączenia real-time

**Scenariusz**: Użytkownik traci połączenie z internetem, a następnie je odzyskuje.

**Sposób obsługi**:

```typescript
useEffect(() => {
  const handleOnline = () => {
    console.log('Connection restored, refetching data...')
    refetch() // Odświeżenie listy zakupów
  }

  window.addEventListener('online', handleOnline)

  return () => {
    window.removeEventListener('online', handleOnline)
  }
}, [refetch])
```

---

### Rollback optimistic updates

**Scenariusz**: Użytkownik oznacza produkt jako zakupiony, ale operacja API się nie powodzi.

**Sposób obsługi**:

```typescript
const handlePurchase = async (itemId: string) => {
  // Kopia oryginalnego stanu
  const originalItems = [...items]

  // Optimistic update
  setItems(prev => prev.map(item => (item.id === itemId ? { ...item, isPurchased: true } : item)))

  try {
    await updateItem(itemId, { isPurchased: true })
    toast.success('Produkt zakupiony')
  } catch (err) {
    // Rollback do oryginalnego stanu
    setItems(originalItems)
    toast.error('Nie udało się zakupić produktu')
  }
}
```

---

## 11. Kroki implementacji

### Krok 1: Utworzenie custom hooków (hooks)

**Pliki do utworzenia**:

1. `src/lib/hooks/useShoppingList.ts`
2. `src/lib/hooks/useAddShoppingListItems.ts`
3. `src/lib/hooks/useUpdateShoppingListItem.ts`
4. `src/lib/hooks/useDeleteShoppingListItem.ts`
5. `src/lib/hooks/useBulkPurchase.ts`
6. `src/lib/hooks/useBulkDelete.ts`
7. `src/lib/hooks/useShoppingListRealtime.ts`

**Kolejność implementacji**:

1. Rozpocznij od `useShoppingList` (główny hook)
2. Implementuj `useAddShoppingListItems`, `useUpdateShoppingListItem`, `useDeleteShoppingListItem`
3. Implementuj `useBulkPurchase`, `useBulkDelete`
4. Na koniec zaimplementuj `useShoppingListRealtime`

**Testowanie hooków**:

- Utwórz prosty komponent testowy, który używa każdego hooka
- Przetestuj happy path i error scenarios
- Sprawdź, czy typy są poprawne

---

### Krok 2: Dodanie nowych typów ViewModel

**Plik**: `src/types/types.ts`

**Co dodać**:

- `ShoppingListViewModel`
- `AddItemFormData`
- `AddItemFormErrors`
- `EditItemFormData`
- `EditItemFormErrors`
- `BulkPurchaseDialogData`
- `BulkDeleteDialogData`
- `GenerateFromRecipesDialogData`

**Uwaga**: Typy Request/Response już istnieją w `types.ts`, nie trzeba ich dodawać ponownie.

---

### Krok 3: Implementacja komponentów pomocniczych (dialogi)

**Pliki do utworzenia**:

1. `src/components/shopping-list/EditItemDialog.tsx`
2. `src/components/shopping-list/BulkPurchaseConfirmDialog.tsx`
3. `src/components/shopping-list/BulkDeleteConfirmDialog.tsx`
4. `src/components/shopping-list/GenerateFromRecipesDialog.tsx`

**Kolejność implementacji**:

1. `EditItemDialog` (najprostszy)
2. `BulkPurchaseConfirmDialog`, `BulkDeleteConfirmDialog` (podobne)
3. `GenerateFromRecipesDialog` (najbardziej złożony)

**Uwagi**:

- Używaj komponentów z `shadcn/ui`: Dialog, Input, Button, Label
- Implementuj walidację formularzy
- Obsługuj stany loading i error

---

### Krok 4: Implementacja komponentów listy

**Pliki do utworzenia**:

1. `src/components/shopping-list/ItemsFilterBar.tsx`
2. `src/components/shopping-list/ShoppingListItem.tsx`
3. `src/components/shopping-list/ShoppingListItems.tsx`

**Kolejność implementacji**:

1. `ItemsFilterBar` (najprostszy)
2. `ShoppingListItem` (pojedynczy produkt)
3. `ShoppingListItems` (kontener)

**Uwagi**:

- `ShoppingListItem` powinien być memoized (`React.memo`) dla wydajności
- Implementuj optimistic updates dla akcji użytkownika
- Dodaj skeleton loadery dla stanu ładowania

---

### Krok 5: Implementacja formularza dodawania produktów

**Plik**: `src/components/shopping-list/AddItemForm.tsx`

**Uwagi**:

- Formularz obsługuje batch adding (użytkownik może dodać wiele produktów przed wysłaniem)
- Implementuj walidację po stronie klienta
- Wyświetlaj lokalną listę produktów do dodania przed wysłaniem
- Dodaj przycisk "Usuń" dla każdego produktu z lokalnej listy

---

### Krok 6: Implementacja nagłówka widoku

**Plik**: `src/components/shopping-list/ShoppingListHeader.tsx`

**Uwagi**:

- Nagłówek zawiera tytuł i przyciski akcji zbiorczych
- Przyciski akcji zbiorczych są aktywne tylko, gdy zaznaczono produkty
- Używaj DropdownMenu z `shadcn/ui` dla menu akcji zbiorczych

---

### Krok 7: Implementacja strony głównej

**Plik**: `src/app/shopping-list/page.tsx`

**Uwagi**:

- Strona łączy wszystkie komponenty razem
- Zarządza globalnym stanem (zaznaczone produkty, dialogi)
- Inicjalizuje subskrypcję real-time
- Obsługuje callbacki z komponentów dzieci

**Struktura**:

```typescript
export default function ShoppingListPage() {
  const { householdId } = useHousehold() // lub pobierz z sesji
  const {
    shoppingList,
    filteredItems,
    selectedItemIds,
    filterStatus,
    sortBy,
    isLoading,
    error,
    setFilterStatus,
    setSortBy,
    toggleSelectItem,
    clearSelection,
    refetch
  } = useShoppingList(householdId)

  // Dialogi
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null)
  // ... inne dialogi

  // Subskrypcja real-time
  useShoppingListRealtime(
    shoppingList?.id || '',
    handleRealtimeInsert,
    handleRealtimeUpdate,
    handleRealtimeDelete
  )

  // Callbacki
  const handleEditItem = (itemId: string) => { ... }
  const handleDeleteItem = (itemId: string) => { ... }
  const handlePurchaseItem = (itemId: string) => { ... }

  return (
    <div>
      <ShoppingListHeader ... />
      <AddItemForm ... />
      <ItemsFilterBar ... />
      <ShoppingListItems ... />

      {/* Dialogi */}
      <EditItemDialog ... />
      <BulkPurchaseConfirmDialog ... />
      <BulkDeleteConfirmDialog ... />
      <GenerateFromRecipesDialog ... />
    </div>
  )
}
```

---

### Krok 8: Dodanie routingu

**Plik**: Brak zmian (routing jest automatyczny w Next.js)

**Uwaga**: Strona będzie dostępna pod `/shopping-list` automatycznie, ponieważ plik jest w `src/app/shopping-list/page.tsx`.

**Middleware**: Upewnij się, że route `/shopping-list` jest chroniony w `src/middleware.ts`.

---

### Krok 9: Stylowanie i responsywność

**Uwagi**:

- Używaj Tailwind CSS dla stylowania
- Implementuj layout responsywny (mobile-first)
- Używaj breakpointów Tailwind: `sm:`, `md:`, `lg:`
- Lista produktów powinna być scrollowalna na urządzeniach mobilnych
- Dialogi powinny być pełnoekranowe na urządzeniach mobilnych

**Przykład**:

```tsx
<div className="container mx-auto px-4 py-6">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{/* Produkty */}</div>
</div>
```

---

### Krok 10: Testowanie i debugowanie

**Testy manualne**:

1. Dodawanie produktów (single i batch)
2. Edycja produktu (ilość, jednostka)
3. Oznaczanie produktu jako zakupionego (single)
4. Usuwanie produktu (single)
5. Zaznaczanie wielu produktów
6. Zakup wielu produktów (bulk purchase)
7. Usuwanie wielu produktów (bulk delete)
8. Generowanie listy z przepisów
9. Filtrowanie i sortowanie
10. Real-time collaboration (otwórz 2 przeglądarki)

**Testowanie real-time**:

1. Otwórz stronę w 2 przeglądarkach (lub incognito)
2. Zaloguj się jako 2 różnych użytkowników z tego samego gospodarstwa
3. Wykonaj operacje w jednej przeglądarce
4. Sprawdź, czy zmiany są widoczne w drugiej przeglądarce bez odświeżania

**Testowanie błędów**:

1. Próba dodania duplikatu (409 Conflict)
2. Próba edycji nieistniejącego produktu (404 Not Found)
3. Wylogowanie podczas operacji (401 Unauthorized)
4. Przekroczenie limitów (50/100 produktów)
5. Utrata połączenia z internetem (offline/online)

---

### Krok 11: Optymalizacja wydajności

**Optymalizacje do implementacji**:

1. **Memoizacja komponentów**:

```typescript
export const ShoppingListItem = React.memo(({ item, ... }: ShoppingListItemProps) => {
  // ...
})
```

2. **Debouncing real-time updates**:

```typescript
const debouncedHandleUpdate = debounce((item: ShoppingListItem) => {
  setItems(prev => prev.map(i => (i.id === item.id ? item : i)))
}, 100)
```

3. **Virtual scrolling** (jeśli lista jest bardzo długa):

- Użyj biblioteki `react-window` lub `react-virtualized`
- Renderuj tylko widoczne elementy

4. **Code splitting**:

```typescript
const GenerateFromRecipesDialog = lazy(() => import('./GenerateFromRecipesDialog'))
```

5. **Optimistic updates**:

- Implementuj dla wszystkich mutacji (add, edit, delete, purchase)
- Rollback przy błędzie

---

### Krok 12: Dokumentacja i komentarze

**Co udokumentować**:

1. Wszystkie custom hooki (JSDoc)
2. Złożone funkcje (np. logika filtrowania)
3. Typy ViewModel (komentarze opisujące przeznaczenie)
4. Komponenty (props, cel, użycie)

**Przykład**:

```typescript
/**
 * Custom hook do zarządzania stanem listy zakupów.
 *
 * @param householdId - ID gospodarstwa domowego
 * @returns Stan listy zakupów, produkty po filtrach, funkcje zarządzające
 *
 * @example
 * const { shoppingList, filteredItems, toggleSelectItem } = useShoppingList(householdId)
 */
export function useShoppingList(householdId: string) {
  // ...
}
```

---

### Krok 13: Przegląd kodu i refaktoryzacja

**Co sprawdzić**:

1. Czy wszystkie typy są poprawne (brak `any`)
2. Czy wszystkie funkcje mają jasne nazwy
3. Czy kod jest DRY (Don't Repeat Yourself)
4. Czy wszystkie błędy są obsługiwane
5. Czy wszystkie warunki są weryfikowane

**Refaktoryzacja**:

- Wyodrębnij powtarzające się logiki do funkcji pomocniczych
- Przenieś współdzieloną logikę do custom hooków
- Upewnij się, że komponenty są małe i odpowiedzialne za jedną rzecz

---

### Krok 14: Integracja z resztą aplikacji

**Integracje**:

1. Dodaj link do listy zakupów w menu nawigacji
2. Dodaj notification badge (liczba niezakupionych produktów)
3. Dodaj możliwość przejścia do listy zakupów z widoku przepisu
4. Dodaj możliwość przejścia do spiżarni po zakupie produktów

**Przykład navigation link**:

```tsx
<Link href="/shopping-list">
  Lista zakupów
  {unpurchasedCount > 0 && <Badge variant="secondary">{unpurchasedCount}</Badge>}
</Link>
```

---

### Krok 15: Testy jednostkowe i E2E (opcjonalnie)

**Testy jednostkowe (Vitest + React Testing Library)**:

1. Testy hooków (useShoppingList, useAddShoppingListItems, ...)
2. Testy komponentów (ShoppingListItem, AddItemForm, ...)
3. Testy funkcji walidacji

**Testy E2E (Playwright)**:

1. Scenariusz: Dodanie produktu do listy
2. Scenariusz: Oznaczanie produktu jako zakupionego
3. Scenariusz: Bulk purchase
4. Scenariusz: Generowanie listy z przepisów
5. Scenariusz: Real-time collaboration

---

## Podsumowanie

Plan implementacji widoku Listy zakupów jest gotowy do wykorzystania. Implementacja powinna zająć około **3-5 dni roboczych** doświadczonemu programiście frontendowemu. Kluczowe aspekty do zapamiętania:

1. **Real-time collaboration** jest kluczową funkcjonalnością - zapewnij, że subskrypcja Supabase działa poprawnie
2. **Optimistic updates** poprawiają UX - implementuj je dla wszystkich mutacji
3. **Partial success pattern** w bulk operations - zawsze sprawdzaj `summary.successful` i `summary.failed`
4. **Walidacja** jest wykonywana zarówno po stronie klienta (UX), jak i API (bezpieczeństwo)
5. **Accessibility** - używaj semantycznego HTML, ARIA labels, keyboard navigation

Powodzenia w implementacji! 🚀

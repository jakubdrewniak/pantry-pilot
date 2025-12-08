import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'

/**
 * SearchInput Props
 */
interface SearchInputProps {
  value: string
  onChange: (value: string) => void
}

/**
 * SearchInput Component
 *
 * Text input field for searching recipes with search icon.
 * Supports maximum length of 200 characters.
 * Debounce is handled by useRecipesList hook (300ms).
 *
 * @param value - current search field value
 * @param onChange - function called on value change (already debounced)
 */
export function SearchInput({ value, onChange }: SearchInputProps): JSX.Element {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = event.target.value

    // Length validation - max 200 characters
    if (newValue.length <= 200) {
      onChange(newValue)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="recipe-search" className="text-sm font-medium">
        Search recipes
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="recipe-search"
          type="text"
          placeholder="Search by title or ingredients..."
          value={value}
          onChange={handleChange}
          className="pl-10"
          maxLength={200}
        />
      </div>
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">{value.length}/200 characters</p>
      )}
    </div>
  )
}

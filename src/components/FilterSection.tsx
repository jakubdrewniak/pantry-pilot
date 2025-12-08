import { Label } from '@/components/ui/label'

/**
 * FilterSection Props
 */
interface FilterSectionProps {
  selectedMealType?: string
  selectedCreationMethod?: string
  onMealTypeChange: (value?: string) => void
  onCreationMethodChange: (value?: string) => void
}

/**
 * MealTypeFilter Component
 *
 * Dropdown filter for meal type selection.
 * Options: none, breakfast, lunch, dinner.
 */
function MealTypeFilter({
  selectedMealType,
  onChange,
}: {
  selectedMealType?: string
  onChange: (value?: string) => void
}): JSX.Element {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const value = event.target.value
    onChange(value || undefined)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="meal-type-filter" className="text-sm font-medium">
        Meal type
      </Label>
      <select
        id="meal-type-filter"
        value={selectedMealType || ''}
        onChange={handleChange}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">All meal types</option>
        <option value="breakfast">Breakfast</option>
        <option value="lunch">Lunch</option>
        <option value="dinner">Dinner</option>
      </select>
    </div>
  )
}

/**
 * CreationMethodFilter Component
 *
 * Dropdown filter for creation method selection.
 * Options: none, manual, ai_generated, ai_generated_modified.
 */
function CreationMethodFilter({
  selectedCreationMethod,
  onChange,
}: {
  selectedCreationMethod?: string
  onChange: (value?: string) => void
}): JSX.Element {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const value = event.target.value
    onChange(value || undefined)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="creation-method-filter" className="text-sm font-medium">
        Creation method
      </Label>
      <select
        id="creation-method-filter"
        value={selectedCreationMethod || ''}
        onChange={handleChange}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">All creation methods</option>
        <option value="manual">Manual</option>
        <option value="ai_generated">AI Generated</option>
        <option value="ai_generated_modified">AI Generated (Modified)</option>
      </select>
    </div>
  )
}

/**
 * FilterSection Component
 *
 * Section containing meal type and creation method filters.
 * Updates filters immediately when changed.
 */
export function FilterSection({
  selectedMealType,
  selectedCreationMethod,
  onMealTypeChange,
  onCreationMethodChange,
}: FilterSectionProps): JSX.Element {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <MealTypeFilter selectedMealType={selectedMealType} onChange={onMealTypeChange} />
      <CreationMethodFilter
        selectedCreationMethod={selectedCreationMethod}
        onChange={onCreationMethodChange}
      />
    </div>
  )
}

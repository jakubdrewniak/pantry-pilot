import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * PaginationControls Props
 */
interface PaginationControlsProps {
  currentPage: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

/**
 * PageSelector Component
 *
 * Dropdown for selecting specific page number.
 */
function PageSelector({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}): JSX.Element {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <select
      value={currentPage}
      onChange={e => onPageChange(Number(e.target.value))}
      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {pages.map(page => (
        <option key={page} value={page}>
          Page {page}
        </option>
      ))}
    </select>
  )
}

/**
 * PageSizeSelector Component
 *
 * Dropdown for selecting number of items per page.
 */
function PageSizeSelector({
  pageSize,
  onPageSizeChange,
}: {
  pageSize: number
  onPageSizeChange: (size: number) => void
}): JSX.Element {
  const options = [3, 10, 20, 50]

  return (
    <select
      value={pageSize}
      onChange={e => onPageSizeChange(Number(e.target.value))}
      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {options.map(size => (
        <option key={size} value={size}>
          {size} per page
        </option>
      ))}
    </select>
  )
}

/**
 * PaginationControls Component
 *
 * Controls for navigating through paginated results.
 * Includes Previous/Next buttons, page selector, and page size selector.
 */
export function PaginationControls({
  currentPage,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps): JSX.Element {
  const totalPages = Math.ceil(total / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, total)

  const handlePrevious = (): void => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = (): void => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  // Don't show pagination if there's only one page or no results
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {total} recipes
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {total} recipes
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <PageSelector
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Show:</span>
        <PageSizeSelector pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
      </div>
    </div>
  )
}

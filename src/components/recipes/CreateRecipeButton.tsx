import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

/**
 * Button that navigates to the new recipe creation page.
 *
 * Features:
 * - Icon with Plus (+) to indicate creation action
 * - Clear label "Create new recipe"
 * - Navigates to /recipes/new
 *
 * Accessibility:
 * - Icon is decorative (aria-hidden) since text label is present
 * - Button has clear text label for screen readers
 *
 * Usage:
 * Place in recipes list toolbar alongside AI generation button
 */
export const CreateRecipeButton = (): JSX.Element => {
  const router = useRouter()

  const handleClick = (): void => {
    router.push('/recipes/new')
  }

  return (
    <Button onClick={handleClick} variant="outline" className="gap-2">
      <Plus className="h-4 w-4" aria-hidden="true" />
      Create new recipe
    </Button>
  )
}

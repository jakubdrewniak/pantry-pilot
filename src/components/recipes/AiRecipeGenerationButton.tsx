import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

interface AiRecipeGenerationButtonProps {
  onOpen: () => void
}

/**
 * Button that opens the AI Recipe Generation Modal.
 *
 * Features:
 * - Icon with Sparkles (✨) to indicate AI functionality
 * - Clear label "Generate with AI"
 * - Can be placed in recipes list toolbar or as floating action
 *
 * Accessibility:
 * - Icon is decorative (aria-hidden) since text label is present
 * - Button has clear text label for screen readers
 *
 * Props:
 * - onOpen: Callback invoked when button is clicked
 */
export const AiRecipeGenerationButton: React.FC<AiRecipeGenerationButtonProps> = ({ onOpen }) => {
  return (
    <Button onClick={onOpen} className="gap-2">
      <Sparkles className="h-4 w-4" aria-hidden="true" />
      Generate with AI
    </Button>
  )
}

import { useState } from 'react'
import type { GenerateRecipeRequest, GenerateRecipeResponse } from '@/types/types'

interface UseAiRecipeGenerationResult {
  data?: GenerateRecipeResponse
  pantryEmptyHeader?: boolean
  error?: string
}

interface UseAiRecipeGenerationReturn {
  generate: (request: GenerateRecipeRequest) => Promise<UseAiRecipeGenerationResult>
  isLoading: boolean
  error?: string
}

/**
 * Custom hook for AI recipe generation.
 *
 * Encapsulates:
 * - POST fetch to /api/recipes/generate
 * - Client validation
 * - Header mapping (X-Pantry-Empty)
 * - Error handling with user-friendly messages
 *
 * Usage:
 * ```
 * const { generate, isLoading, error } = useAiRecipeGeneration()
 * const result = await generate({ hint: 'pizza', usePantryItems: true })
 * ```
 */
export const useAiRecipeGeneration = (): UseAiRecipeGenerationReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const generate = async (request: GenerateRecipeRequest): Promise<UseAiRecipeGenerationResult> => {
    setIsLoading(true)
    setError(undefined)

    try {
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      // Check for pantry empty header
      const pantryEmptyHeader = response.headers.get('X-Pantry-Empty') === 'true'

      if (response.status === 202) {
        // Success case
        const data: GenerateRecipeResponse = await response.json()
        return { data, pantryEmptyHeader }
      } else if (response.status === 400) {
        // Validation error
        const errorData = await response.json().catch(() => ({}))
        const errorMessage =
          errorData.message || 'Invalid request. Please check your input and try again.'
        setError(errorMessage)
        return { error: errorMessage, pantryEmptyHeader }
      } else if (response.status === 503) {
        // LLM service unavailable
        const errorMessage = 'Recipe generation is temporarily unavailable. Please try again.'
        setError(errorMessage)
        return { error: errorMessage, pantryEmptyHeader }
      } else {
        // Other server errors
        const errorMessage = 'An error occurred. Please try again later.'
        setError(errorMessage)
        return { error: errorMessage, pantryEmptyHeader }
      }
    } catch (err) {
      // Network/timeout errors
      const errorMessage =
        err instanceof Error && err.message.includes('fetch')
          ? 'Network error. Please check your connection and try again.'
          : 'An unexpected error occurred. Please try again.'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  return { generate, isLoading, error }
}

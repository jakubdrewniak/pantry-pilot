import { useState } from 'react'
import type { GenerateShoppingListResponse } from '@/types/types'

/**
 * Hook for generating shopping list items from selected recipes.
 * Calls POST /api/shopping-lists/generate with an array of recipe IDs.
 * The backend resolves the user's household and shopping list automatically.
 */
export function useGenerateShoppingList() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const generateFromRecipes = async (
    recipeIds: string[]
  ): Promise<GenerateShoppingListResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/shopping-lists/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeIds }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 401) throw new Error('Session expired. Please log in again.')
        if (response.status === 404) throw new Error(errorData.message || 'Recipe not found.')
        if (response.status === 400) throw new Error(errorData.message || 'Invalid request data.')
        throw new Error(errorData.message || 'Failed to generate shopping list.')
      }

      return await response.json()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return { generateFromRecipes, isLoading, error }
}

import { useState, useEffect, useCallback } from 'react'
import type { Recipe, RecipesListResponse } from '@/types/types'

/**
 * RecipesListViewModel
 *
 * View model for recipes list containing all necessary data and functions.
 */
export interface RecipesListViewModel {
  searchTerm: string
  selectedMealType?: string
  selectedCreationMethod?: string
  currentPage: number
  pageSize: number
  recipes: Recipe[]
  total: number
  loading: boolean
  error?: string
  setSearchTerm: (value: string) => void
  setSelectedMealType: (value?: string) => void
  setSelectedCreationMethod: (value?: string) => void
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
}

/**
 * useRecipesList Hook
 *
 * Hook managing recipes list state with search, filtering and pagination.
 *
 * Features:
 * - Debounced search (300ms)
 * - Filtering by meal type and creation method
 * - Pagination with configurable page size
 * - Integration with /api/recipes API
 * - Error handling and loading states
 *
 * @returns RecipesListViewModel - complete view model with data and functions
 */
export function useRecipesList(): RecipesListViewModel {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedMealType, setSelectedMealType] = useState<string | undefined>()
  const [selectedCreationMethod, setSelectedCreationMethod] = useState<string | undefined>()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  /**
   * fetchRecipes
   *
   * Fetches recipes from API based on current filters and pagination parameters.
   * Handles errors and updates loading state.
   */
  const fetchRecipes = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(undefined)

      // Build query parameters
      const params = new URLSearchParams()
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
      if (selectedMealType) params.append('mealType', selectedMealType)
      if (selectedCreationMethod) params.append('creationMethod', selectedCreationMethod)
      params.append('page', currentPage.toString())
      params.append('pageSize', pageSize.toString())
      params.append('sort', '-createdAt') // Domyślne sortowanie - najnowsze pierwsze

      const response = await fetch(`/api/recipes?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please log in.')
          return
        }

        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}))
          setError(errorData.message || 'Invalid request parameters')
          return
        }

        if (response.status === 500) {
          setError('Server error. Please try again later.')
          return
        }

        setError(`Failed to load recipes (${response.status})`)
        return
      }

      const data: RecipesListResponse = await response.json()

      setRecipes(data.data)
      setTotal(data.pagination.total)

      setError(undefined)
    } catch (err) {
      console.error('Error fetching recipes:', err)
      setError('Network error. Please check your connection and try again.')
      setRecipes([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchTerm, selectedMealType, selectedCreationMethod, currentPage, pageSize])

  // Fetch recipes when the component mounts
  useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  // Reset current page once page size, search term, meal type or creation method changes
  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize, debouncedSearchTerm, selectedMealType, selectedCreationMethod])

  return {
    searchTerm,
    selectedMealType,
    selectedCreationMethod,
    currentPage,
    pageSize,
    recipes,
    total,
    loading,
    error,
    setSearchTerm,
    setSelectedMealType,
    setSelectedCreationMethod,
    setCurrentPage,
    setPageSize,
  }
}

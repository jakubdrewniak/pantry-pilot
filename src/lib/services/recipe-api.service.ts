import type { CreateRecipeRequest, Recipe, BulkDeleteRecipesResponse } from '@/types/types'

/**
 * Custom error class for Recipe API errors
 *
 * Contains HTTP status code and response data for detailed error handling.
 * Similar to Angular's HttpErrorResponse.
 */
export class RecipeApiError extends Error {
  constructor(
    public status: number,
    public data: any
  ) {
    super(`Recipe API Error: ${status}`)
    this.name = 'RecipeApiError'
  }
}

/**
 * RecipeApiService
 *
 * Service layer for recipe-related API calls.
 * Encapsulates all HTTP communication with the recipe endpoints.
 *
 * Similar to Angular's HttpClient service pattern - provides a clean
 * interface for API communication with proper error handling.
 *
 * Benefits:
 * - Centralized API logic (DRY principle)
 * - Easy to test (mock the service)
 * - Consistent error handling
 * - Single source of truth for API endpoints
 *
 * Usage:
 * ```typescript
 * try {
 *   const recipe = await RecipeApiService.createRecipe(data)
 * } catch (error) {
 *   if (error instanceof RecipeApiError) {
 *     // Handle specific API errors
 *   }
 * }
 * ```
 */
export class RecipeApiService {
  /**
   * Creates a new recipe
   *
   * @param data - Recipe data to create
   * @returns Promise resolving to the created Recipe
   * @throws RecipeApiError with status code and error details
   *
   * Endpoints: POST /api/recipes
   *
   * Status codes:
   * - 201: Created successfully
   * - 400: Validation error (check error.data.details)
   * - 401: Unauthorized (user not logged in)
   * - 500: Server error
   */
  static async createRecipe(data: CreateRecipeRequest): Promise<Recipe> {
    const response = await fetch('/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Unknown error',
        message: 'Failed to parse error response',
      }))
      throw new RecipeApiError(response.status, errorData)
    }

    return response.json()
  }

  /**
   * Updates an existing recipe
   *
   * @param id - Recipe UUID to update
   * @param data - Updated recipe data
   * @returns Promise resolving to the updated Recipe
   * @throws RecipeApiError with status code and error details
   *
   * Endpoints: PUT /api/recipes/{id}
   *
   * Status codes:
   * - 200: Updated successfully
   * - 400: Validation error
   * - 401: Unauthorized
   * - 404: Recipe not found
   * - 500: Server error
   */
  static async updateRecipe(id: string, data: CreateRecipeRequest): Promise<Recipe> {
    const response = await fetch(`/api/recipes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Unknown error',
        message: 'Failed to parse error response',
      }))
      throw new RecipeApiError(response.status, errorData)
    }

    return response.json()
  }

  /**
   * Retrieves a single recipe by ID
   *
   * @param id - Recipe UUID to retrieve
   * @returns Promise resolving to the Recipe
   * @throws RecipeApiError with status code and error details
   *
   * Endpoints: GET /api/recipes/{id}
   *
   * Status codes:
   * - 200: Retrieved successfully
   * - 401: Unauthorized
   * - 404: Recipe not found
   * - 500: Server error
   */
  static async getRecipe(id: string): Promise<Recipe> {
    const response = await fetch(`/api/recipes/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Unknown error',
        message: 'Failed to parse error response',
      }))
      throw new RecipeApiError(response.status, errorData)
    }

    return response.json()
  }

  /**
   * Deletes a recipe
   *
   * @param id - Recipe UUID to delete
   * @returns Promise resolving when deletion is complete
   * @throws RecipeApiError with status code and error details
   *
   * Endpoints: DELETE /api/recipes/{id}
   *
   * Status codes:
   * - 204: Deleted successfully
   * - 401: Unauthorized
   * - 404: Recipe not found
   * - 500: Server error
   */
  static async deleteRecipe(id: string): Promise<void> {
    const response = await fetch(`/api/recipes/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Unknown error',
        message: 'Failed to parse error response',
      }))
      throw new RecipeApiError(response.status, errorData)
    }

    // 204 No Content - no body to parse
  }

  /**
   * Deletes multiple recipes in a single request
   *
   * @param ids - Array of recipe UUIDs to delete (1-50)
   * @returns Promise resolving to bulk delete results
   * @throws RecipeApiError with status code and error details
   *
   * Endpoints: DELETE /api/recipes
   *
   * Status codes:
   * - 200: Request processed (check response for individual results)
   * - 400: Validation error (invalid IDs or out of range)
   * - 401: Unauthorized
   * - 500: Server error
   *
   * Note: Returns 200 even if some or all deletions fail.
   * Check response.summary and response.failed for details.
   */
  static async bulkDeleteRecipes(ids: string[]): Promise<BulkDeleteRecipesResponse> {
    const response = await fetch('/api/recipes', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Unknown error',
        message: 'Failed to parse error response',
      }))
      throw new RecipeApiError(response.status, errorData)
    }

    return response.json()
  }
}

/**
 * Error handling utilities for Recipe API
 */
export const RecipeApiErrorHandler = {
  /**
   * Maps RecipeApiError to user-friendly error message
   *
   * @param error - The error to handle
   * @returns User-friendly error message
   */
  getUserMessage(error: unknown): string {
    if (error instanceof RecipeApiError) {
      switch (error.status) {
        case 400:
          return error.data.message || 'Invalid recipe data. Please check your input.'
        case 401:
          return 'Authentication required. Please log in.'
        case 404:
          return 'Recipe not found.'
        case 500:
          return 'Server error. Please try again later.'
        default:
          return `An error occurred (${error.status}). Please try again.`
      }
    }

    // Network error or other unexpected error
    return 'Network error. Please check your connection and try again.'
  },

  /**
   * Checks if error requires redirect to login
   *
   * @param error - The error to check
   * @returns true if should redirect to login
   */
  shouldRedirectToLogin(error: unknown): boolean {
    return error instanceof RecipeApiError && error.status === 401
  },

  /**
   * Extracts validation errors from API response
   *
   * @param error - The error to extract from
   * @returns Validation errors object or undefined
   */
  getValidationErrors(error: unknown): Record<string, string> | undefined {
    if (error instanceof RecipeApiError && error.status === 400 && error.data.details) {
      const errors: Record<string, string> = {}

      if (Array.isArray(error.data.details)) {
        error.data.details.forEach((detail: { field: string; message: string }) => {
          errors[detail.field] = detail.message
        })
      }

      return Object.keys(errors).length > 0 ? errors : undefined
    }

    return undefined
  },
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreateRecipeButton } from '@/components/recipes/CreateRecipeButton'
import { AiRecipeGenerationButton } from '@/components/recipes/AiRecipeGenerationButton'
import { AiRecipeGenerationModal } from '@/components/recipes/AiRecipeGenerationModal'
import { SearchInput } from '@/components/SearchInput'
import { FilterSection } from '@/components/FilterSection'
import { RecipeGrid } from '@/components/RecipeGrid'
import { PaginationControls } from '@/components/PaginationControls'
import { useRecipesList } from '@/lib/hooks/useRecipesList'

/**
 * RecipesListPage
 *
 * Main page for recipes list view with search, filtering and pagination.
 *
 * Composed of:
 * - SearchInput (search field)
 * - FilterSection (meal type and creation method filters)
 * - RecipeGrid (recipes grid)
 * - PaginationControls (pagination controls)
 *
 * Manages application state through useRecipesList hook.
 * Handles events: onSearchChange, onFilterChange, onPageChange, onDeleteRecipe.
 *
 * Validation: searchTerm max 200 characters, page >=1, pageSize 1-100,
 * mealType/creationMethod from allowed enums.
 */
export default function RecipesListPage(): JSX.Element {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)

  const {
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
    refetch,
  } = useRecipesList()

  const handleSearchChange = (value: string): void => {
    setSearchTerm(value)
  }

  const handleMealTypeChange = (value?: string): void => {
    setSelectedMealType(value)
  }

  const handleCreationMethodChange = (value?: string): void => {
    setSelectedCreationMethod(value)
  }

  const handlePageChange = (page: number): void => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number): void => {
    setPageSize(size)
  }

  const handleDeleteRecipe = (recipeId: string): void => {
    // TODO: Implement recipe deletion
    console.log('Delete recipe:', recipeId)
  }

  const handleEditRecipe = (recipeId: string): void => {
    // Navigate to edit page using Next.js router (client-side navigation)
    router.push(`/recipes/${recipeId}/edit`)
  }

  const handleRecipeSelect = (recipeId: string): void => {
    // TODO: Navigate to recipe details
    console.log('Select recipe:', recipeId)
  }

  const handleRecipeSaved = (): void => {
    // Refresh the recipes list after saving a new recipe
    refetch()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
            <p className="text-muted-foreground mt-1">
              Manage your recipes and generate new ones with AI
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <CreateRecipeButton />
            <AiRecipeGenerationButton onOpen={() => setModalOpen(true)} />
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-6">
          <SearchInput value={searchTerm} onChange={handleSearchChange} />
        </div>

        {/* Filter Section */}
        <div className="mb-6">
          <FilterSection
            selectedMealType={selectedMealType}
            selectedCreationMethod={selectedCreationMethod}
            onMealTypeChange={handleMealTypeChange}
            onCreationMethodChange={handleCreationMethodChange}
          />
        </div>

        {/* Recipe Grid */}
        <div className="mb-6">
          <RecipeGrid
            recipes={recipes}
            loading={loading}
            onRecipeSelect={handleRecipeSelect}
            onEditRecipe={handleEditRecipe}
            onDeleteRecipe={handleDeleteRecipe}
          />
        </div>

        {/* Pagination Controls */}
        {total > 0 && (
          <div className="mt-8">
            <PaginationControls
              currentPage={currentPage}
              pageSize={pageSize}
              total={total}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* AI Recipe Generation Modal */}
        <AiRecipeGenerationModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onRecipeSaved={handleRecipeSaved}
        />
      </div>
    </div>
  )
}

import { Page, Locator, expect } from '@playwright/test'

/**
 * Page Object Model for Recipes List Page
 *
 * Encapsulates all interactions with the recipes page including:
 * - Navigation
 * - Recipe grid interactions
 * - AI recipe generation modal
 */
export class RecipesPage {
  readonly page: Page

  // Page elements
  readonly pageHeading: Locator
  readonly aiGenerateButton: Locator
  readonly recipesGrid: Locator
  readonly recipeCards: Locator
  readonly emptyState: Locator
  readonly loadingSkeleton: Locator

  // AI Modal elements
  readonly modal: Locator
  readonly modalTitle: Locator
  readonly hintInput: Locator
  readonly pantryCheckbox: Locator
  readonly generateButton: Locator
  readonly cancelButton: Locator
  readonly closeButton: Locator
  readonly saveButton: Locator
  readonly editButton: Locator
  readonly loadingState: Locator
  readonly recipePreview: Locator
  readonly recipePreviewTitle: Locator
  readonly errorAlert: Locator
  readonly saveErrorAlert: Locator

  constructor(page: Page) {
    this.page = page

    // Page elements
    this.pageHeading = page.locator('h1', { hasText: 'Recipes' })
    this.aiGenerateButton = page.getByTestId('ai-generate-button')
    this.recipesGrid = page.getByTestId('recipes-grid')
    this.recipeCards = page.getByTestId('recipe-card')
    this.emptyState = page.getByTestId('recipes-empty-state')
    this.loadingSkeleton = page.getByTestId('recipes-loading-skeleton')

    // Modal elements
    this.modal = page.getByTestId('ai-recipe-generation-modal')
    this.modalTitle = page.getByRole('heading', { name: 'Generate Recipe with AI' })
    this.hintInput = page.getByTestId('ai-recipe-hint-input')
    this.pantryCheckbox = page.getByTestId('ai-recipe-use-pantry-checkbox')
    this.generateButton = page.getByTestId('ai-recipe-generate-button')
    this.cancelButton = page.getByTestId('ai-recipe-cancel-button')
    this.closeButton = page.getByTestId('ai-recipe-close-button')
    this.saveButton = page.getByTestId('ai-recipe-save-button')
    this.editButton = page.getByTestId('ai-recipe-edit-button')
    this.loadingState = page.getByTestId('ai-recipe-loading-state')
    this.recipePreview = page.getByTestId('ai-recipe-preview')
    this.recipePreviewTitle = page.getByTestId('ai-recipe-preview-title')
    this.errorAlert = page.getByTestId('ai-recipe-error')
    this.saveErrorAlert = page.getByTestId('ai-recipe-save-error')
  }

  /**
   * Navigate to recipes page
   */
  async goto() {
    await this.page.goto('/recipes')
    await expect(this.pageHeading).toBeVisible()
  }

  /**
   * Open AI recipe generation modal
   */
  async openAiModal() {
    await this.aiGenerateButton.click()
    await expect(this.modal).toBeVisible()
    await expect(this.modalTitle).toBeVisible()
  }

  /**
   * Fill recipe hint in the modal form
   */
  async fillRecipeHint(hint: string) {
    await this.hintInput.fill(hint)
  }

  /**
   * Toggle pantry checkbox
   */
  async togglePantryCheckbox(checked: boolean) {
    if (checked) {
      await this.pantryCheckbox.check()
    } else {
      await this.pantryCheckbox.uncheck()
    }
  }

  /**
   * Submit the AI generation form
   */
  async submitGeneration() {
    await this.generateButton.click()
  }

  /**
   * Wait for recipe to be generated and preview to appear
   * @param timeout - Maximum time to wait in milliseconds (default: 30000)
   */
  async waitForRecipeGeneration(timeout: number = 30000) {
    // First, loading state should appear
    await expect(this.loadingState).toBeVisible()

    // Then, recipe preview should appear
    await expect(this.recipePreview).toBeVisible({ timeout })
    await expect(this.recipePreviewTitle).toBeVisible()
  }

  /**
   * Get the generated recipe title
   */
  async getGeneratedRecipeTitle(): Promise<string | null> {
    return await this.recipePreviewTitle.textContent()
  }

  /**
   * Save the generated recipe without modifications
   */
  async saveGeneratedRecipe() {
    await this.saveButton.click()
    // Wait for modal to close after saving
    await expect(this.modal).not.toBeVisible({ timeout: 10000 })
  }

  /**
   * Click edit button to navigate to recipe editor
   */
  async editGeneratedRecipe() {
    await this.editButton.click()
  }

  /**
   * Cancel the modal
   */
  async cancelModal() {
    await this.cancelButton.click()
    await expect(this.modal).not.toBeVisible()
  }

  /**
   * Close the modal after generation
   */
  async closeModal() {
    await this.closeButton.click()
    await expect(this.modal).not.toBeVisible()
  }

  /**
   * Complete flow: Generate and save AI recipe
   * @param hint - Recipe hint text
   * @param usePantry - Whether to use pantry items
   * @returns Generated recipe title
   */
  async generateAndSaveRecipe(hint: string, usePantry: boolean = false): Promise<string> {
    await this.openAiModal()
    await this.fillRecipeHint(hint)

    if (usePantry) {
      await this.togglePantryCheckbox(true)
    }

    await this.submitGeneration()
    await this.waitForRecipeGeneration()

    const recipeTitle = await this.getGeneratedRecipeTitle()
    if (!recipeTitle) {
      throw new Error('Recipe title not found')
    }

    await this.saveGeneratedRecipe()

    return recipeTitle
  }

  /**
   * Find recipe card by title
   */
  async findRecipeByTitle(title: string): Promise<Locator> {
    return this.recipeCards.filter({ hasText: title })
  }

  /**
   * Verify recipe exists in the grid by title
   */
  async verifyRecipeExists(title: string) {
    const recipeCard = await this.findRecipeByTitle(title)
    await expect(recipeCard).toBeVisible()
  }

  /**
   * Get the count of recipe cards in the grid
   */
  async getRecipeCount(): Promise<number> {
    await expect(this.recipesGrid).toBeVisible()
    return await this.recipeCards.count()
  }

  /**
   * Edit recipe by title
   */
  async editRecipe(title: string) {
    const recipeCard = await this.findRecipeByTitle(title)
    const editButton = recipeCard.getByTestId('recipe-card-edit-button')
    await editButton.click()
  }

  /**
   * Delete recipe by title
   */
  async deleteRecipe(title: string) {
    const recipeCard = await this.findRecipeByTitle(title)
    const deleteButton = recipeCard.getByTestId('recipe-card-delete-button')
    await deleteButton.click()
  }
}

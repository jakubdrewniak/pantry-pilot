import { test, expect } from '@playwright/test'
import { RecipesPage } from './helpers/page-objects/RecipesPage'
import { loginAsTestUser } from './helpers/auth'
import type { Recipe } from '@/types/types'

/**
 * E2E Test Suite: AI Recipe Generation Flow (Using Page Object Model)
 *
 * Clean, maintainable tests using Page Object pattern.
 * Tests the complete user journey from generation to verification.
 */

test.describe('AI Recipe Generation (POM)', () => {
  let recipesPage: RecipesPage

  test.beforeEach(async ({ page }) => {
    recipesPage = new RecipesPage(page)

    // Login as test user before each test
    await loginAsTestUser(page)

    // Page should already be on /recipes after login
    // Just verify we're there
    await expect(recipesPage.pageHeading).toBeVisible()
  })

  test('should complete full AI recipe generation flow', async () => {
    // Main scenario: Generate and save recipe
    const recipeHint = 'Italian pasta carbonara with crispy bacon'
    const recipeTitle = await recipesPage.generateAndSaveRecipe(recipeHint)

    // Verify recipe appears in the list
    await recipesPage.verifyRecipeExists(recipeTitle)

    // Verify AI badge is present
    const recipeCard = await recipesPage.findRecipeByTitle(recipeTitle)
    await expect(recipeCard.getByText('AI')).toBeVisible()
  })

  test('should validate required hint field', async () => {
    await recipesPage.openAiModal()

    // Submit without hint
    await recipesPage.submitGeneration()

    // Verify error
    await expect(recipesPage.errorAlert).toBeVisible()
    await expect(recipesPage.errorAlert).toContainText('Please provide a hint')
  })

  test('should allow cancelling generation', async () => {
    await recipesPage.openAiModal()
    await recipesPage.cancelModal()
    // Modal close assertion is inside cancelModal method
  })

  test('should allow closing after generation without saving', async () => {
    await recipesPage.openAiModal()
    await recipesPage.fillRecipeHint('quick breakfast oatmeal')
    await recipesPage.submitGeneration()
    await recipesPage.waitForRecipeGeneration()

    await recipesPage.closeModal()
  })

  test('should show loading state during generation', async () => {
    await recipesPage.openAiModal()
    await recipesPage.fillRecipeHint('chocolate chip cookies')
    await recipesPage.submitGeneration()

    // Verify loading state appears
    await expect(recipesPage.loadingState).toBeVisible()
    await expect(recipesPage.page.getByText('Generating your recipe...')).toBeVisible()
    await expect(recipesPage.page.getByText('NON EXISTING')).toBeVisible()

    // Wait for completion
    await recipesPage.waitForRecipeGeneration()

    // Loading state should disappear
    await expect(recipesPage.loadingState).not.toBeVisible()
  })

  test('should display AI-original badge on generated recipe preview', async () => {
    await recipesPage.openAiModal()
    await recipesPage.fillRecipeHint('fresh garden salad')
    await recipesPage.submitGeneration()
    await recipesPage.waitForRecipeGeneration()

    // Verify AI-original badge
    await expect(recipesPage.page.getByText('AI-original')).toBeVisible()
  })

  test('should respect 200 character limit for hint', async () => {
    await recipesPage.openAiModal()

    const longHint = 'a'.repeat(200)
    await recipesPage.fillRecipeHint(longHint)

    // Verify character counter
    await expect(recipesPage.page.getByText('200/200 characters')).toBeVisible()

    // Input should not accept more than 200 characters
    const hintValue = await recipesPage.hintInput.inputValue()
    expect(hintValue.length).toBe(200)
  })

  test('should populate edit form with exact AI-generated data', async ({ page }) => {
    // Intercept API to capture the real response (not mocking!)
    let capturedRecipe: Recipe | null = null

    await page.route('**/api/recipes/generate', async route => {
      // Fetch the real response from the server
      const response = await route.fetch()
      const json = (await response.json()) as { recipe: Recipe; warnings?: string[] }

      // Capture the recipe data for verification
      capturedRecipe = json.recipe

      // Pass through the response unchanged (no mocking)
      await route.fulfill({ response })
    })

    // Generate recipe
    await recipesPage.openAiModal()
    await recipesPage.fillRecipeHint('italian pasta dish')
    await recipesPage.submitGeneration()
    await recipesPage.waitForRecipeGeneration()

    // Verify we captured the API response and extract it
    expect(capturedRecipe).toBeTruthy()
    if (!capturedRecipe) {
      throw new Error('Failed to capture API response')
    }

    // Extract recipe data (TypeScript type narrowing workaround)
    const recipe: Recipe = capturedRecipe
    expect(recipe.title).toBeTruthy()

    // Click edit to navigate to editor
    await recipesPage.editGeneratedRecipe()

    // Verify navigation
    await expect(page).toHaveURL(/\/recipes\/new\?mode=edit-ai-generated/)
    await expect(page.getByRole('heading', { name: 'Edit AI Recipe' })).toBeVisible()

    // Verify form fields match captured JSON exactly

    // Title - exact match
    const titleInput = page.getByTestId('recipe-editor-title')
    await expect(titleInput).toHaveValue(recipe.title)

    // Instructions - exact match
    const instructionsTextarea = page.getByTestId('recipe-editor-instructions')
    await expect(instructionsTextarea).toHaveValue(recipe.instructions)

    // Ingredients - verify count and each ingredient
    const ingredientsList = page.getByTestId('recipe-editor-ingredients-list')
    const ingredientItems = ingredientsList.locator('[data-testid^="ingredient-item-"]')
    const ingredientsCount = await ingredientItems.count()

    // Exact count match
    expect(ingredientsCount).toBe(recipe.ingredients.length)

    // Verify each ingredient matches exactly
    for (let i = 0; i < recipe.ingredients.length; i++) {
      const expected = recipe.ingredients[i]

      // Name
      const nameInput = ingredientsList.locator('input[name^="ingredient-name-"]').nth(i)
      await expect(nameInput).toHaveValue(expected.name)

      // Quantity
      const quantityInput = ingredientsList.locator('input[name^="ingredient-quantity-"]').nth(i)
      await expect(quantityInput).toHaveValue(expected.quantity.toString())

      // Unit
      const unitInput = ingredientsList.locator('input[name^="ingredient-unit-"]').nth(i)
      await expect(unitInput).toHaveValue(expected.unit || '')
    }
  })

  test('should modify AI-generated recipe and save with correct badge', async ({ page }) => {
    // Intercept API to capture the real response
    let capturedRecipe: Recipe | null = null

    await page.route('**/api/recipes/generate', async route => {
      const response = await route.fetch()
      const json = (await response.json()) as { recipe: Recipe; warnings?: string[] }
      capturedRecipe = json.recipe
      await route.fulfill({ response })
    })

    // Generate recipe using POM
    await recipesPage.openAiModal()
    await recipesPage.fillRecipeHint('classic italian pizza')
    await recipesPage.submitGeneration()
    await recipesPage.waitForRecipeGeneration()

    // Verify we captured the response
    expect(capturedRecipe).toBeTruthy()
    if (!capturedRecipe) {
      throw new Error('Failed to capture API response')
    }

    const recipe: Recipe = capturedRecipe

    // Click edit
    await recipesPage.editGeneratedRecipe()
    await expect(page).toHaveURL(/\/recipes\/new\?mode=edit-ai-generated/)

    // Modify the title
    const titleInput = page.getByTestId('recipe-editor-title')
    const modifiedTitle = `${recipe.title} - Modified`
    await titleInput.clear()
    await titleInput.fill(modifiedTitle)

    // Save the recipe
    const submitButton = page.getByRole('button', { name: /create recipe/i })
    await submitButton.click()

    // Wait for redirect to recipes list
    await expect(page).toHaveURL(/\/recipes$/)
    await expect(recipesPage.pageHeading).toBeVisible()

    // Find the recipe card with modified title
    await expect(recipesPage.recipesGrid).toBeVisible()

    const recipeCard = await recipesPage.findRecipeByTitle(modifiedTitle)
    await expect(recipeCard).toBeVisible()

    // Verify it has "AI Modified" badge (not just "AI")
    await expect(recipeCard.getByText('AI Modified')).toBeVisible()

    // Verify the title is correct
    const cardTitle = recipeCard.getByTestId('recipe-card-title')
    await expect(cardTitle).toHaveText(modifiedTitle)
  })
})

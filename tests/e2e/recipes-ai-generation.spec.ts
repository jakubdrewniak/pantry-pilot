import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'
import type { Recipe } from '@/types/types'

/**
 * E2E Test Suite: AI Recipe Generation Flow
 *
 * Tests the complete user journey:
 * 1. Open AI recipe generation modal
 * 2. Enter recipe hint
 * 3. Generate recipe
 * 4. Save recipe without modifications
 * 5. Verify recipe appears in the list
 */

test.describe('AI Recipe Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user before each test
    await loginAsTestUser(page)

    // Wait for page to load (should already be on /recipes after login)
    await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible()
  })

  test('should generate and save AI recipe successfully', async ({ page }) => {
    // Step 1: Open AI recipe generation modal
    const generateButton = page.getByTestId('ai-generate-button')
    await expect(generateButton).toBeVisible()
    await generateButton.click()

    // Verify modal is open
    const modal = page.getByTestId('ai-recipe-generation-modal')
    await expect(modal).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Generate Recipe with AI' })).toBeVisible()

    // Step 2: Enter recipe hint
    const hintInput = page.getByTestId('ai-recipe-hint-input')
    await expect(hintInput).toBeVisible()

    const recipeHint = 'Italian pasta carbonara with crispy bacon'
    await hintInput.fill(recipeHint)

    // Verify character counter (optional)
    await expect(page.getByText(`${recipeHint.length}/200 characters`)).toBeVisible()

    // Step 3: Generate recipe
    const generateFormButton = page.getByTestId('ai-recipe-generate-button')
    await generateFormButton.click()

    // Wait for loading state
    const loadingState = page.getByTestId('ai-recipe-loading-state')
    await expect(loadingState).toBeVisible()
    await expect(page.getByText('Generating your recipe...')).toBeVisible()

    // Wait for recipe preview to appear (with timeout for AI generation)
    const recipePreview = page.getByTestId('ai-recipe-preview')
    await expect(recipePreview).toBeVisible({ timeout: 30000 }) // 30s timeout for AI generation

    // Verify recipe preview has content
    const recipeTitle = page.getByTestId('ai-recipe-preview-title')
    await expect(recipeTitle).toBeVisible()

    // Verify AI-original badge is present
    await expect(page.getByText('AI-original')).toBeVisible()

    // Get the recipe title text for verification later
    const generatedRecipeTitle = await recipeTitle.textContent()
    expect(generatedRecipeTitle).toBeTruthy()

    // Step 4: Save recipe without modifications
    const saveButton = page.getByTestId('ai-recipe-save-button')
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    // Wait for modal to close
    await expect(modal).not.toBeVisible({ timeout: 10000 })

    // Step 5: Verify recipe appears in the list
    // Wait for recipes grid to refresh
    const recipesGrid = page.getByTestId('recipes-grid')
    await expect(recipesGrid).toBeVisible()

    // Find the newly created recipe card
    const recipeCards = page.getByTestId('recipe-card')
    const recipeCount = await recipeCards.count()
    expect(recipeCount).toBeGreaterThan(0)

    // Verify the new recipe title appears in the list
    if (generatedRecipeTitle) {
      const newRecipeCard = page
        .getByTestId('recipe-card')
        .filter({ hasText: generatedRecipeTitle })

      await expect(newRecipeCard).toBeVisible()

      // Verify AI badge on the card
      await expect(newRecipeCard.getByText('AI')).toBeVisible()
    }
  })

  test('should validate required hint field', async ({ page }) => {
    // Open modal
    await page.getByTestId('ai-generate-button').click()
    await expect(page.getByTestId('ai-recipe-generation-modal')).toBeVisible()

    // Try to submit without entering hint
    const generateButton = page.getByTestId('ai-recipe-generate-button')
    await generateButton.click()

    // Verify validation error appears
    const errorAlert = page.getByTestId('ai-recipe-error')
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toContainText('Please provide a hint')
  })

  test('should allow cancelling generation form', async ({ page }) => {
    // Open modal
    await page.getByTestId('ai-generate-button').click()
    const modal = page.getByTestId('ai-recipe-generation-modal')
    await expect(modal).toBeVisible()

    // Click cancel
    const cancelButton = page.getByTestId('ai-recipe-cancel-button')
    await cancelButton.click()

    // Verify modal is closed
    await expect(modal).not.toBeVisible()
  })

  test('should allow closing modal after recipe generation', async ({ page }) => {
    // Open modal and generate recipe
    await page.getByTestId('ai-generate-button').click()
    await page.getByTestId('ai-recipe-hint-input').fill('quick breakfast oatmeal')
    await page.getByTestId('ai-recipe-generate-button').click()

    // Wait for recipe
    await expect(page.getByTestId('ai-recipe-preview')).toBeVisible({ timeout: 30000 })

    // Click close button
    const closeButton = page.getByTestId('ai-recipe-close-button')
    await closeButton.click()

    // Verify modal is closed
    await expect(page.getByTestId('ai-recipe-generation-modal')).not.toBeVisible()
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

    // Open modal and generate recipe
    await page.getByTestId('ai-generate-button').click()
    await page.getByTestId('ai-recipe-hint-input').fill('mexican tacos')
    await page.getByTestId('ai-recipe-generate-button').click()

    // Wait for recipe preview
    await expect(page.getByTestId('ai-recipe-preview')).toBeVisible({ timeout: 30000 })

    // Verify we captured the API response and extract it
    expect(capturedRecipe).toBeTruthy()
    if (!capturedRecipe) {
      throw new Error('Failed to capture API response')
    }

    // Extract recipe data (TypeScript type narrowing workaround)
    const recipe: Recipe = capturedRecipe
    expect(recipe.title).toBeTruthy()

    // Click edit button
    const editButton = page.getByTestId('ai-recipe-edit-button')
    await editButton.click()

    // Verify navigation to edit page
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

    // Generate recipe
    await page.getByTestId('ai-generate-button').click()
    await page.getByTestId('ai-recipe-hint-input').fill('classic italian pizza')
    await page.getByTestId('ai-recipe-generate-button').click()

    // Wait for preview
    await expect(page.getByTestId('ai-recipe-preview')).toBeVisible({ timeout: 30000 })

    // Verify we captured the response
    expect(capturedRecipe).toBeTruthy()
    if (!capturedRecipe) {
      throw new Error('Failed to capture API response')
    }

    const recipe: Recipe = capturedRecipe

    // Click edit
    await page.getByTestId('ai-recipe-edit-button').click()
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
    await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible()

    // Find the recipe card with modified title
    const recipesGrid = page.getByTestId('recipes-grid')
    await expect(recipesGrid).toBeVisible()

    const recipeCard = page.getByTestId('recipe-card').filter({ hasText: modifiedTitle })
    await expect(recipeCard).toBeVisible()

    // Verify it has "AI Modified" badge (not just "AI")
    await expect(recipeCard.getByText('AI Modified')).toBeVisible()

    // Verify the title is correct
    const cardTitle = recipeCard.getByTestId('recipe-card-title')
    await expect(cardTitle).toHaveText(modifiedTitle)
  })
})

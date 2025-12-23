import { test, expect } from '@playwright/test'
import { loginAsTestUser, getTestUserCredentials, isAuthenticated } from './helpers/auth'

/**
 * Authentication Helper Tests
 *
 * Verify that authentication helper works correctly before running other tests.
 * Run this first to ensure your .env.test is configured properly.
 */

test.describe('Authentication Helper', () => {
  test('should load credentials from environment', () => {
    const credentials = getTestUserCredentials()

    expect(credentials.email).toBeTruthy()
    expect(credentials.email).toContain('@')
    expect(credentials.password).toBeTruthy()
    expect(credentials.password.length).toBeGreaterThan(0)

    console.log('✅ Credentials loaded:', {
      email: credentials.email,
      hasPassword: !!credentials.password,
      id: credentials.id,
    })
  })

  test('should successfully login test user', async ({ page }) => {
    // Login using helper
    await loginAsTestUser(page)

    // Verify page heading is visible
    await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible()

    // Verify authentication state
    const authState = await isAuthenticated(page)
    expect(authState).toBe(true)

    console.log('✅ Successfully logged in and redirected to /recipes')
  })

  test('should have access to protected routes after login', async ({ page }) => {
    await loginAsTestUser(page)

    // Verify page heading is visible
    await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible()

    // Try navigating to another protected route
    await page.goto('/recipes/new')

    // Verify page heading is visible
    await expect(page.getByRole('heading', { name: 'New recipe' })).toBeVisible()

    // Should not redirect to login (no /auth/login in URL)
    expect(page.url()).not.toContain('/auth/login')

    console.log('✅ Can access protected routes')
  })
})

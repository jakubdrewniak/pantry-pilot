import { test, expect } from '@playwright/test'
import { LoginPage } from './helpers/page-objects/LoginPage'

/**
 * E2E Test Suite: Login Page Display
 *
 * Simple test to verify the login page renders correctly
 */

test.describe('Login Page', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  test('should display login page with all required elements', async () => {
    // Assert - All form fields are visible
    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.submitButton).toBeVisible()
    await expect(loginPage.heading).toBeVisible()
  })
})

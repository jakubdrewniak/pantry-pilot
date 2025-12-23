import { Page } from '@playwright/test'
import { LoginPage } from './page-objects/LoginPage'

/**
 * Authentication Helper for E2E Tests
 *
 * Provides utilities for logging in users during test setup.
 * Uses credentials from environment variables:
 * - E2E_USERNAME (email)
 * - E2E_PASSWORD (password)
 * - E2E_USERNAME_ID (optional, for identification)
 *
 * Usage:
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   await loginAsTestUser(page)
 * })
 * ```
 */

export interface TestUser {
  id?: string
  email: string
  password: string
}

/**
 * Get test user credentials from environment variables
 * @throws Error if credentials are not configured
 */
export function getTestUserCredentials(): TestUser {
  const email = process.env.E2E_USERNAME
  const password = process.env.E2E_PASSWORD
  const id = process.env.E2E_USERNAME_ID

  if (!email || !password) {
    throw new Error(
      'E2E test credentials not configured. ' +
        'Please set E2E_USERNAME and E2E_PASSWORD in .env.test'
    )
  }

  return { id, email, password }
}

/**
 * Login as test user using credentials from environment
 * Navigates to login page, fills form, and submits
 *
 * @param page - Playwright page instance
 * @param waitForUrl - URL to wait for after successful login (default: '/recipes')
 * @returns Promise that resolves when login is complete
 *
 * @example
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   await loginAsTestUser(page)
 *   // Now authenticated and on /recipes page
 * })
 * ```
 */
export async function loginAsTestUser(page: Page, waitForUrl: string = ''): Promise<void> {
  const credentials = getTestUserCredentials()

  // Navigate to login page
  const loginPage = new LoginPage(page)
  await loginPage.goto()

  // Fill login form
  await loginPage.emailInput.fill(credentials.email)
  await loginPage.passwordInput.fill(credentials.password)

  // Submit and wait for redirect
  await loginPage.submitButton.click()

  // Wait for successful login redirect
  await page.waitForURL(`**${waitForUrl}`, { timeout: 10000 })
}

/**
 * Login with custom credentials (not from env)
 * Useful for testing different user scenarios
 *
 * @param page - Playwright page instance
 * @param email - User email
 * @param password - User password
 * @param waitForUrl - URL to wait for after successful login
 */
export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string,
  waitForUrl: string = '/recipes'
): Promise<void> {
  const loginPage = new LoginPage(page)
  await loginPage.goto()

  await loginPage.emailInput.fill(email)
  await loginPage.passwordInput.fill(password)
  await loginPage.submitButton.click()

  await page.waitForURL(`**${waitForUrl}`, { timeout: 10000 })
}

/**
 * Check if user is currently authenticated
 * Checks for presence of authentication-related elements or cookies
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check if we're on a protected route (not on login/register pages)
  const url = page.url()
  if (url.includes('/auth/login') || url.includes('/auth/register')) {
    return false
  }

  // Check for Supabase auth cookies (adjust cookie names if needed)
  const cookies = await page.context().cookies()
  const hasAuthCookie = cookies.some(
    cookie => cookie.name.includes('sb-') && cookie.name.includes('auth-token')
  )

  return hasAuthCookie
}

/**
 * Logout current user
 * Clears authentication state
 */
export async function logout(page: Page): Promise<void> {
  // Clear all cookies
  await page.context().clearCookies()

  // Clear localStorage (includes Supabase auth)
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  // Navigate to login page to confirm logout
  await page.goto('/auth/login')
}

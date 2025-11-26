import { type Page, type Locator } from '@playwright/test'

/**
 * Page Object Model for Login Page
 *
 * Simple page object for login page elements
 */
export class LoginPage {
  readonly url = '/auth/login'

  // Locators
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly heading: Locator

  constructor(public readonly page: Page) {
    this.emailInput = page.locator('input[name="email"]')
    this.passwordInput = page.locator('input[name="password"]')
    this.submitButton = page.locator('button[type="submit"]')
    this.heading = page.getByText('Sign In', { exact: true }).first()
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await this.page.goto(this.url)
  }
}

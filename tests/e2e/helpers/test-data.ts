/**
 * Test Data Generators
 *
 * Utilities for generating test data with unique identifiers
 * to avoid conflicts between test runs.
 */

/**
 * Generates a unique email address for testing
 * Uses timestamp to ensure uniqueness across test runs
 */
export const generateTestEmail = (prefix = 'test'): string => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `${prefix}-${timestamp}-${random}@example.com`
}

/**
 * Generates a secure test password that meets validation requirements
 * Requirements: min 8 chars, digit, special character
 */
export const generateTestPassword = (): string => {
  const timestamp = Date.now()
  return `Test${timestamp}!`
}

/**
 * Test user data factory
 */
export const createTestUser = (overrides?: Partial<TestUser>): TestUser => {
  return {
    email: generateTestEmail(),
    password: generateTestPassword(),
    ...overrides,
  }
}

/**
 * Test user interface
 */
export interface TestUser {
  email: string
  password: string
}

/**
 * Invalid password test cases for validation testing
 */
export const INVALID_PASSWORDS = {
  tooShort: 'Test1!',
  noDigit: 'TestTest!',
  noSpecialChar: 'TestTest1',
  empty: '',
}

/**
 * Invalid email test cases
 */
export const INVALID_EMAILS = {
  invalid: 'not-an-email',
  empty: '',
  missingAt: 'testexample.com',
  missingDomain: 'test@',
}

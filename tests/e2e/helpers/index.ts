/**
 * E2E Test Helpers - Index
 *
 * Central export point for all test helpers and utilities.
 * Import from this file to keep imports clean and organized.
 */

// Authentication helpers
export {
  loginAsTestUser,
  loginWithCredentials,
  isAuthenticated,
  logout,
  getTestUserCredentials,
  type TestUser as AuthTestUser,
} from './auth'

// Test data generators
export {
  generateTestEmail,
  generateTestPassword,
  createTestUser,
  INVALID_PASSWORDS,
  INVALID_EMAILS,
  type TestUser,
} from './test-data'

// Page objects
export { LoginPage } from './page-objects/LoginPage'
export { RecipesPage } from './page-objects/RecipesPage'

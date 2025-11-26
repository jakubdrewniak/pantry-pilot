/**
 * E2E Test Helpers - Index
 *
 * Central export point for all test helpers and utilities.
 * Import from this file to keep imports clean and organized.
 */

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

/**
 * Manual Teardown Test Script
 *
 * This script allows you to manually test the teardown functionality
 * without running the full Playwright test suite.
 *
 * Usage:
 * ```bash
 * # Make sure .env.test has SUPABASE_SERVICE_ROLE_KEY configured
 * npm run test:e2e:cleanup
 * ```
 *
 * This is useful for:
 * - Verifying teardown works correctly
 * - Cleaning up database manually after failed test runs
 * - Debugging cleanup logic
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import globalTeardown from './global-teardown'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') })

// Run the teardown
globalTeardown()
  .then(() => {
    console.log('✅ Manual cleanup completed successfully')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Teardown test failed:', error)
    process.exit(1)
  })

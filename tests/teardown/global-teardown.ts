/**
 * Playwright Global Teardown
 *
 * This script runs AFTER all tests complete across all projects.
 * It cleans up test data from Supabase database to ensure a clean state.
 *
 * Key Features:
 * - Uses Supabase Service Role Key (bypasses RLS for admin operations)
 * - Deletes recipes created during E2E tests
 * - Only affects test user's data (identified by E2E_USERNAME_ID)
 * - Logs cleanup results for debugging
 *
 * Required Environment Variables (.env.test):
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Admin key for cleanup operations
 * - E2E_USERNAME_ID: Test user ID to identify test data
 *
 * Why Service Role Key?
 * - Tests may create data for multiple users
 * - Service role bypasses Row Level Security (RLS)
 * - Allows complete cleanup of test data
 * - Safe in test environment only (NEVER use in production code)
 *
 * Architecture Decision:
 * We delete only recipes (not entire households) because:
 * 1. Recipes are the primary test artifacts
 * 2. Households may be shared/reused across test runs
 * 3. Keeps setup simpler (no need to recreate household each time)
 *
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../src/db/database.types'

/**
 * Create Supabase admin client with service role key
 * This client bypasses RLS and has full database access
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing required environment variables:\n' +
        '- NEXT_PUBLIC_SUPABASE_URL\n' +
        '- SUPABASE_SERVICE_ROLE_KEY\n' +
        'Please configure them in .env.test'
    )
  }

  // Create client with service role key (admin privileges)
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Delete all recipes created during tests
 * Identifies test recipes by household ownership (test user's households)
 */
async function cleanupRecipes(adminClient: ReturnType<typeof createAdminClient>) {
  const testUserId = process.env.E2E_USERNAME_ID

  if (!testUserId) {
    console.warn(
      '⚠️  E2E_USERNAME_ID not set - skipping recipe cleanup.\n' +
        '   To enable cleanup, set E2E_USERNAME_ID in .env.test'
    )
    return
  }

  console.log('🧹 Starting database cleanup...')
  console.log(`   Test User ID: ${testUserId}`)

  try {
    // Step 1: Find all households owned by or associated with test user
    // TODO: uncomment once households are implemented
    // const { data: userHouseholds, error: householdsError } = await adminClient
    //   .from('user_households')
    //   .select('household_id')
    //   .eq('user_id', testUserId)

    // if (householdsError) {
    //   console.error('❌ Error fetching test user households:', householdsError.message)
    //   throw householdsError
    // }

    const userHouseholds = [{ household_id: '00000000-0000-0000-0000-000000000001' }]
    if (!userHouseholds || userHouseholds.length === 0) {
      console.log('ℹ️  No households found for test user - nothing to clean')
      return
    }

    const householdIds = userHouseholds.map(uh => uh.household_id)
    console.log(`   Found ${householdIds.length} household(s) for test user`)

    // Step 2: Delete all recipes from test user's households
    const { data: deletedRecipes, error: deleteError } = await adminClient
      .from('recipes')
      .delete()
      .in('household_id', householdIds)
      .select('id')

    if (deleteError) {
      console.error('❌ Error deleting recipes:', deleteError.message)
      throw deleteError
    }

    const deletedCount = deletedRecipes?.length || 0
    console.log(`✅ Successfully deleted ${deletedCount} recipe(s)`)

    // Optional: Log deleted recipe IDs for debugging
    if (deletedCount > 0 && deletedRecipes) {
      console.log('   Deleted recipe IDs:', deletedRecipes.map(r => r.id).join(', '))
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    // Don't throw - we don't want teardown failures to fail the entire test run
    // Tests have already completed, cleanup is "nice to have"
  }
}

/**
 * Global teardown function
 * Called by Playwright after all tests complete
 */
async function globalTeardown() {
  console.log('\n' + '='.repeat(60))
  console.log('🧪 PLAYWRIGHT GLOBAL TEARDOWN')
  console.log('='.repeat(60))

  const adminClient = createAdminClient()

  // Clean up recipes
  await cleanupRecipes(adminClient)

  // Future: Add cleanup for other resources if needed
  // Example for pantry items:
  // const { data: pantries } = await adminClient
  //   .from('pantries')
  //   .select('id')
  //   .in('household_id', householdIds)
  // const pantryIds = pantries?.map(p => p.id) || []
  // await adminClient.from('pantry_items').delete().in('pantry_id', pantryIds)

  console.log('='.repeat(60))
  console.log('✨ Teardown complete')
  console.log('='.repeat(60) + '\n')
}

export default globalTeardown

import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './database.types'

// TODO: get user from auth
export const DEFAULT_USER_ID = '7d2cf57a-a623-447b-9b8c-c9c764a958d5'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

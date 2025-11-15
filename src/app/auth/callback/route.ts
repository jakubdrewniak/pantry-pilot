import { createClient } from '@/db/supabase.server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth Callback Route Handler
 *
 * Handles OAuth callbacks and email verification links from Supabase.
 * This route exchanges the code for a session and redirects to the appropriate page.
 *
 * Flow:
 * 1. User clicks email link (signup confirmation or password reset)
 * 2. Supabase redirects to this route with a code
 * 3. We exchange code for session
 * 4. Redirect based on type:
 *    - recovery (password reset) → /auth/reset-password
 *    - signup → /auth/login
 *    - default → /
 *
 * Route: /auth/callback?code=xxx&type=recovery
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const redirectTo = requestUrl.searchParams.get('redirect_to')

  // If no code, redirect to login with error
  if (!code) {
    console.log('❌ No code provided')
    return NextResponse.redirect(new URL('/auth/login?error=missing_code', request.url))
  }

  const supabase = await createClient()

  // Exchange code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/auth/login?error=auth_failed', request.url))
  }

  // Determine redirect destination based on type or session info
  let destination = '/'

  // Priority 1: URL type parameter (if provided)
  if (type === 'recovery') {
    destination = '/auth/reset-password'
    console.log('🔑 Recovery flow detected (URL param) → redirecting to /auth/reset-password')
  }
  // Priority 2: Check if coming from password reset email
  // Supabase doesn't pass 'type' param, but we can detect it by checking if user came from callback
  // For password reset, we'll redirect to reset-password page
  else if (!type && data.session && redirectTo?.includes('reset-password')) {
    destination = '/auth/reset-password'
    console.log('🔑 Recovery flow detected (redirect_to) → redirecting to /auth/reset-password')
  }
  // Priority 3: If no type and we have a fresh session, assume password reset
  // (since normal login doesn't go through callback)
  else if (!type && data.session) {
    destination = '/auth/reset-password'
    console.log(
      '🔑 Recovery flow assumed (callback without type) → redirecting to /auth/reset-password'
    )
  } else if (type === 'signup') {
    destination = '/auth/login?verified=true'
    console.log('📧 Signup flow detected → redirecting to /auth/login')
  } else if (redirectTo) {
    destination = redirectTo
    console.log('🔗 Custom redirect → redirecting to', redirectTo)
  } else {
    console.log('🏠 Default redirect → redirecting to /')
  }

  console.log('➡️ Final destination:', destination)

  // Redirect to destination
  return NextResponse.redirect(new URL(destination, request.url))
}

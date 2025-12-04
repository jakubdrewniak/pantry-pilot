import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import type { Database } from './db/database.types'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options: Record<string, unknown>
          }>
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define public paths that don't require authentication
  const publicPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/callback',
  ]
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))
  const isHomePage = request.nextUrl.pathname === '/'

  // API routes handle their own authentication
  // Skip middleware redirect logic for API endpoints
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  console.log('🔷 Middleware:', {
    pathname: request.nextUrl.pathname,
    hasUser: !!user,
    isPublicPath,
    isHomePage,
    isApiRoute,
  })

  // Home page (/) redirects based on authentication state
  if (isHomePage) {
    const url = request.nextUrl.clone()
    if (user) {
      // TODO: Redirect to /pantry when pantry page is implemented
      url.pathname = '/recipes'
    } else {
      url.pathname = '/auth/login'
    }
    return NextResponse.redirect(url)
  }

  // API routes handle their own authentication - skip redirect logic
  if (isApiRoute) {
    return supabaseResponse
  }

  // Redirect to login if user is not authenticated and trying to access protected route
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    // Preserve the original URL as redirect target after login
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect to recipes if user is authenticated and trying to access auth pages
  // Exceptions:
  // - /auth/callback handles its own redirects
  // - /auth/reset-password allows recovery sessions (user has session but needs to set password)
  const isResetPasswordPage = request.nextUrl.pathname.startsWith('/auth/reset-password')
  if (
    user &&
    isPublicPath &&
    !request.nextUrl.pathname.startsWith('/auth/callback') &&
    !isResetPasswordPage
  ) {
    console.log('🔀 Middleware: Redirecting authenticated user from auth page to /recipes')
    const url = request.nextUrl.clone()
    // TODO: Redirect to /pantry when pantry page is implemented
    url.pathname = '/recipes'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

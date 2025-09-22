import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This is a placeholder middleware file for Next.js
// Add your middleware logic here as the application grows

export function middleware(_request: NextRequest) {
  // Placeholder for future middleware logic
  // Examples: authentication, redirects, headers, etc.

  return NextResponse.next()
}

export const config = {
  // Configure which paths this middleware runs on
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

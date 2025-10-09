# Supabase Next.js Initialization

This document provides a reproducible guide to create the necessary file structure for integrating Supabase with your Next.js project.

## Prerequisites

- Your project should use Next.js (App Router), TypeScript 5, React 19, and Tailwind 4.
- Install the `@supabase/ssr` package (for SSR-compatible Supabase client).
- Install the `@supabase/supabase-js` package (peer dependency).
- Ensure that `/supabase/config.toml` exists.
- Ensure that a file `/src/db/database.types.ts` exists and contains the correct type definitions for your database.

**IMPORTANT:** Check prerequisites before performing actions below. If they're not met, stop and ask a user for the fix.

## File Structure and Setup

### 1. Supabase Client Utilities

Create the file `/src/db/supabase.client.ts` for browser client initialization:

```ts
import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

This file provides a factory function to create a Supabase browser client for use in Client Components.

### 2. Server-Side Supabase Client

Create the file `/src/db/supabase.server.ts` for server-side client initialization:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from './database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

This file provides a factory function to create a Supabase server client for use in Server Components, Server Actions, and Route Handlers. It handles cookie management for SSR authentication.

### 3. Middleware Setup

Update or create the file `/src/middleware.ts` with the following content:

```ts
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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // Optionally protect routes or add additional middleware logic here
  // Example:
  // if (!user && !request.nextUrl.pathname.startsWith('/login')) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = '/login';
  //   return NextResponse.redirect(url);
  // }

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
```

This middleware is **mandatory** for proper session management. It ensures that user sessions are refreshed automatically by checking and refreshing authentication tokens on every request. The middleware must run before any Server Components or API routes that use authentication.

### 4. TypeScript Environment Definitions

Create or update the file `/src/env.d.ts` with the following content:

```ts
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_SUPABASE_URL: string
    readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  }
}
```

This file provides TypeScript type definitions for the environment variables used by Supabase, ensuring proper typing throughout your application.

### 5. Environment Variables

Ensure your `.env.local` file (or appropriate environment configuration) contains:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

These variables should match the configuration from your Supabase project dashboard.

## Usage Examples

### Client Component Example

```tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/db/supabase.client'

export default function ClientComponent() {
  const [user, setUser] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  return <div>User: {user?.email}</div>
}
```

### Server Component Example

```tsx
import { createClient } from '@/db/supabase.server'

export default async function ServerComponent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <div>User: {user?.email}</div>
}
```

### Server Action Example

```ts
'use server'

import { createClient } from '@/db/supabase.server'

export async function serverAction() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('your_table').select('*')
  return { data, error }
}
```

## Important Notes

1. **Middleware is Mandatory**: The middleware pattern is required for proper session management. Without it, authentication tokens may not refresh correctly, leading to session expiration issues.

2. **Cookie Chunking**: The `@supabase/ssr` package automatically handles cookie chunking when the session data exceeds browser cookie size limits (typically 4KB). No additional configuration is needed.

3. **Client vs Server Clients**: Always use the appropriate client for your context:
   - Use `/src/db/supabase.client.ts` in Client Components (marked with `'use client'`)
   - Use `/src/db/supabase.server.ts` in Server Components, Server Actions, and Route Handlers

4. **Environment Variables**: The `NEXT_PUBLIC_` prefix makes these variables available to both client and server code. This is safe for the Supabase URL and anonymous key, which are designed to be public.

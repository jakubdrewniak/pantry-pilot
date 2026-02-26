# Supabase Auth Integration with Next.js

Use this guide when introducing authentication (sign-up & sign-in) in Next.js applications with App Router and SSR support.

## VERY IMPORTANT: Before starting

Ask which pages or components should behave differently after introducing authentication. Adjust further steps accordingly.

## Core Requirements

1. Use `@supabase/ssr` package (NOT `@supabase/auth-helpers-nextjs`)
2. Use ONLY `getAll` and `setAll` for cookie management
3. NEVER use individual `get`, `set`, or `remove` cookie methods
4. Implement proper session management with middleware based on JWT (Supabase Auth)
5. Always use `auth.getUser()` (revalidates token) instead of `auth.getSession()` (only reads cookie)

## Implementation

### Server client (`src/db/supabase.server.ts`)

```typescript
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
            /* ignore errors from Server Components — middleware handles session refresh */
          }
        },
      },
    }
  )
}
```

### Browser client (`src/db/supabase.client.ts`)

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Middleware (`src/middleware.ts`)

Key rules:

- Avoid writing any logic between `createServerClient` and `supabase.auth.getUser()`
- Must return the `supabaseResponse` object as-is to maintain session sync
- Use `auth.getUser()` (not `getSession()`) to revalidate the token
- Run middleware on all routes, handle public paths inside (not via narrow matcher)

### Security Best Practices

- Use `NEXT_PUBLIC_` prefix only for variables needed in the browser; never expose `service_role` key
- Always use `auth.getUser()` instead of `auth.getSession()`
- Validate all user input server-side using Zod
- Always enable RLS on Supabase tables with policies that check `auth.uid()`
- Use `revalidatePath('/', 'layout')` after auth state changes

### Common Pitfalls

- Don't use deprecated `@supabase/auth-helpers-nextjs`
- Don't use individual cookie methods (`get`/`set`/`remove`)
- Don't use `getSession()` — it only reads from cookie (can be stale or tampered)
- Don't create new `NextResponse` without copying cookies in middleware
- Don't forget to `revalidatePath` after sign-out/sign-in

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChefHat, BookOpen, ShoppingCart, Users, Home, LogOut } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { logout } from '@/app/actions/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const navigationItems = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
  },
  {
    name: 'Recipes',
    href: '/recipes',
    icon: BookOpen,
  },
  {
    name: 'Pantry',
    href: '/pantry',
    icon: ChefHat,
  },
  {
    name: 'Shopping',
    href: '/shopping',
    icon: ShoppingCart,
  },
  {
    name: 'Household',
    href: '/household',
    icon: Users,
  },
]

/**
 * Generate user initials from email
 *
 * @param email - User email address
 * @returns Two-letter initials (e.g., "john.doe@example.com" → "JD")
 *
 * @example
 * ```ts
 * getInitials("john.doe@example.com") // "JD"
 * getInitials("alice@example.com")    // "AL"
 * getInitials("x@example.com")        // "X"
 * ```
 */
function getInitials(email: string): string {
  const name = email.split('@')[0]
  const parts = name.split(/[._-]/)

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  return name.slice(0, 2).toUpperCase()
}

/**
 * Main navigation component
 *
 * Features:
 * - Responsive: horizontal on desktop, vertical on mobile
 * - Active state highlighting
 * - Icons with labels
 * - Semantic HTML with <nav> element
 * - Hidden on auth pages (/auth/*)
 * - User avatar and dropdown menu when authenticated
 * - Logout functionality
 *
 * Accessibility:
 * - aria-label on nav for screen readers
 * - aria-current="page" for active link
 * - Icons are decorative when text is visible
 * - Proper focus indicators
 * - Screen reader friendly user menu
 */
export function Navigation() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  // Hide navigation on authentication pages
  if (pathname?.startsWith('/auth')) {
    return null
  }

  /**
   * Handle logout action
   * Calls server action to sign out user and redirect to login
   */
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav
      aria-label="Main navigation"
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold"
            aria-label="Pantry Pilot home"
          >
            <ChefHat className="h-6 w-6" aria-hidden="true" />
            <span className="hidden sm:inline">Pantry Pilot</span>
          </Link>

          {/* Center: Navigation Links */}
          <div className="flex items-center gap-1">
            {navigationItems.map(item => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.name}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden md:inline">{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-2">
            {loading ? (
              // Loading state: Show placeholder to prevent layout shift
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" aria-hidden="true" />
            ) : (
              // Authenticated: Show user dropdown menu
              // Note: Navigation only renders for authenticated users (middleware redirects others)
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                    aria-label="User menu"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user?.email || 'User')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Account</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <button
                      onClick={handleLogout}
                      className="w-full cursor-pointer"
                      aria-label="Sign out"
                    >
                      <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span>Sign out</span>
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

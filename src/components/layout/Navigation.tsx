'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChefHat, BookOpen, ShoppingCart, Users, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

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
 * Main navigation component
 *
 * Features:
 * - Responsive: horizontal on desktop, vertical on mobile
 * - Active state highlighting
 * - Icons with labels
 * - Semantic HTML with <nav> element
 *
 * Accessibility:
 * - aria-label on nav for screen readers
 * - aria-current="page" for active link
 * - Icons are decorative when text is visible
 * - Proper focus indicators
 */
export function Navigation() {
  const pathname = usePathname()

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

          {/* Navigation Links */}
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
        </div>
      </div>
    </nav>
  )
}

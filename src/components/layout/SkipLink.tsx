'use client'

/**
 * SkipLink allows keyboard users to skip navigation and jump to main content.
 *
 * Accessibility Best Practice:
 * - Invisible by default
 * - Becomes visible when focused (Tab key)
 * - Links to main content ID
 * - Essential for keyboard-only users
 *
 * Usage:
 * 1. Add <SkipLink /> at the very top of layout
 * 2. Add id="main-content" to your <main> element
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to main content
    </a>
  )
}

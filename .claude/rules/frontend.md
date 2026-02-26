# Frontend Rules

## Styling with Tailwind

- Use the `@layer` directive to organize styles into components, utilities, and base layers
- Use arbitrary values with square brackets (e.g., `w-[123px]`) for precise one-off designs
- Implement the Tailwind configuration file for customizing theme, plugins, and variants
- Leverage the `theme()` function in CSS for accessing Tailwind theme values
- Implement dark mode with the `dark:` variant
- Use responsive variants (`sm:`, `md:`, `lg:`, etc.) for adaptive designs
- Leverage state variants (`hover:`, `focus-visible:`, `active:`, etc.) for interactive elements

## Accessibility (ARIA)

- Use ARIA landmarks to identify regions of the page (main, navigation, search, etc.)
- Apply appropriate ARIA roles to custom interface elements that lack semantic HTML equivalents
- Set `aria-expanded` and `aria-controls` for expandable content like accordions and dropdowns
- Use `aria-live` regions with appropriate politeness settings for dynamic content updates
- Implement `aria-hidden` to hide decorative or duplicative content from screen readers
- Apply `aria-label` or `aria-labelledby` for elements without visible text labels
- Use `aria-describedby` to associate descriptive text with form inputs or complex elements
- Implement `aria-current` for indicating the current item in a set, navigation, or process
- Avoid redundant ARIA that duplicates the semantics of native HTML elements

## React Coding Standards

- Use functional components (arrow functions) with hooks instead of class components
- Avoid `React.FC` type annotation — use explicit return types (e.g., `const Component = (props: Props): JSX.Element => {}`)
- For components with conditional rendering, use return type `JSX.Element | null`
- Import only what you need from react (e.g., `import { useState } from 'react'`) instead of `import * as React`
- Implement `React.memo()` for expensive components that render often with the same props
- Utilize `React.lazy()` and Suspense for code-splitting and performance optimization
- Use `useCallback` for event handlers passed to child components to prevent unnecessary re-renders
- Prefer `useMemo` for expensive calculations to avoid recomputation on every render
- Implement `useId()` for generating unique IDs for accessibility attributes
- Use the `use` hook for data fetching in React 19+ projects
- Consider using `useOptimistic` for optimistic UI updates in forms
- Use `useTransition` for non-urgent state updates to keep the UI responsive

## Next.js

- Use App Router and Server Components for improved performance and SEO
- Implement route handlers for API endpoints instead of the `pages/api` directory
- Use server actions for form handling and data mutations from Server Components
- Leverage Next.js `Image` component with proper sizing for core web vitals optimization
- Implement the Metadata API for dynamic SEO optimization
- Use React Server Components for data fetching to reduce client-side JavaScript
- Implement Streaming and Suspense for improved loading states
- Use the new `Link` component without requiring a child `<a>` tag
- Leverage parallel routes for complex layouts and parallel data fetching
- Implement intercepting routes for modal patterns and nested UIs

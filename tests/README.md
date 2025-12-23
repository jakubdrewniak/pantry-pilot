# Testing Guide

This directory contains both **unit tests** (Vitest) and **E2E tests** (Playwright).

## Quick Start

### Unit Tests (Vitest)

```bash
# Run tests (watch mode)
npm test

# Run once
npm run test:run

# With coverage
npm run test:coverage

# Interactive UI
npm run test:ui
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests (includes automatic cleanup)
npm run test:e2e

# Run specific test file
npx playwright test recipes-ai-generation.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Manual database cleanup (if needed)
npx tsx tests/teardown/test-teardown.ts
```

> **Note**: E2E tests automatically clean up test data after completion using global teardown. See `tests/teardown/README.md` for details.

## Test Structure

Tests are **colocated** with source files (like Angular):

```
src/lib/validation/
├── auth.ts              ← Source
└── auth.test.ts         ← Test next to it ✅
```

## Creating Tests

### 1. Create test file next to source

```bash
# For src/lib/utils.ts
touch src/lib/utils.test.ts
```

### 2. Write test using relative imports

```typescript
import { describe, it, expect } from 'vitest'
import { cn } from './utils' // ← Relative import

describe('cn utility', () => {
  it('should merge class names', () => {
    // Arrange
    const classes = ['text-red-500', 'bg-blue-500']

    // Act
    const result = cn(...classes)

    // Assert
    expect(result).toBe('text-red-500 bg-blue-500')
  })
})
```

### 3. Run it

```bash
npm test -- utils.test
```

## Test Patterns

### Testing Validation (Zod)

```typescript
import { loginSchema } from './auth'

it('should accept valid email', () => {
  const result = loginSchema.safeParse({
    email: 'user@example.com',
    password: 'pass',
  })

  expect(result.success).toBe(true)
})

it('should reject invalid email', () => {
  const result = loginSchema.safeParse({
    email: 'invalid',
    password: 'pass',
  })

  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.error.errors[0].message).toBe('Please provide a valid email address.')
  }
})
```

### Testing Components (Future)

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginForm } from './LoginForm'

it('should show error on empty submit', async () => {
  render(<LoginForm />)

  fireEvent.click(screen.getByRole('button', { name: /log in/i }))

  expect(await screen.findByText(/email.*required/i)).toBeInTheDocument()
})
```

## Best Practices

### ✅ DO

- Test user-facing behavior
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Test edge cases (empty, null, invalid)
- Keep tests independent

### ❌ DON'T

- Test implementation details
- Test third-party libraries
- Test trivial components (e.g., simple wrappers)
- Share state between tests

## Running Tests

```bash
# All tests
npm test

# Specific file
npm test -- auth.test

# Specific directory
npm test -- src/lib/validation

# By test name
npm test -- -t "should accept valid email"
```

## Examples

### Validation Testing

See `src/lib/validation/auth.test.ts`:

- 40+ test cases
- Zod schema validation patterns
- Edge case coverage
- Error message verification

### Component Testing

See `src/components/auth/LoginForm.test.tsx`:

- 30+ test cases
- User interaction testing
- Loading and error states
- Accessibility testing
- Form submission mocking

## Configuration

- **Test files:** `*.test.ts` or `*.test.tsx` (colocated with source)
- **Setup:** `tests/setup/vitest.setup.ts` (global configuration)
- **Config:** `vitest.config.ts` (test runner settings)

## Resources

### Unit Testing

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/react)
- Example: `src/lib/validation/auth.test.ts`

### E2E Testing

- [Playwright Docs](https://playwright.dev/)
- [Global Teardown Guide](./teardown/README.md)
- [E2E Test Examples](./e2e/)

---

**That's it!** Tests live next to your code, just like Angular. Happy testing! 🧪

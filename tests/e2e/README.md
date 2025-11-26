# E2E Testing Guide

## Overview

This directory contains end-to-end (E2E) tests using Playwright. E2E tests verify critical user journeys by simulating real user interactions with the application.

## Quick Start

### Installation

```bash
npm install
npx playwright install # Install browser binaries
```

### Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Running Specific Tests

```bash
# Run a specific test file
npx playwright test auth-login.spec.ts

# Run tests matching a pattern
npx playwright test --grep "should display"

# Run a specific browser
npx playwright test --project=chromium
```

## Test Structure

```
tests/e2e/
├── README.md                           # This file
├── auth-login.spec.ts                  # Login page tests
└── helpers/
    ├── test-data.ts                    # Test data generators
    └── page-objects/
        └── LoginPage.ts                # Login page object
```

## Writing Tests

### Page Object Model

We use the Page Object Model (POM) pattern to:

- **Encapsulate page interactions**: All selectors and actions for a page are in one place
- **Improve maintainability**: UI changes only require updates in the page object
- **Enhance readability**: Tests read like user stories

Example:

```typescript
import { LoginPage } from './helpers/page-objects/LoginPage'

test('check login page displays', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await expect(loginPage.emailInput).toBeVisible()
})
```

### Test Data Generators

Use test data generators to create unique test data:

```typescript
import { createTestUser } from './helpers/test-data'

const testUser = createTestUser() // Generates unique email and password
```

This prevents test conflicts when running in parallel or repeatedly.

### Test Organization

Tests are organized using `test.describe()` blocks:

1. **Happy Path**: Core functionality that must work
2. **Validation**: Form validation and error handling
3. **User Experience**: UI feedback and loading states
4. **Accessibility**: ARIA attributes, keyboard navigation
5. **Security**: Password fields, autocomplete attributes

### Assertions

Use Playwright's built-in assertions:

```typescript
// Visual assertions
await expect(page.locator('#success')).toBeVisible()
await expect(page.locator('button')).toHaveText('Submit')

// Attribute assertions
await expect(page.locator('input')).toHaveAttribute('type', 'password')

// URL assertions
await expect(page).toHaveURL(/\/dashboard/)
```

## Best Practices

### 1. Test from User's Perspective

❌ **Bad**: Test implementation details

```typescript
await page.locator('.css-class-xyz').click()
```

✅ **Good**: Test user-facing features

```typescript
await registerPage.submitButton.click()
```

### 2. Use Reliable Locators

Priority order:

1. `getByRole()` - Best for accessibility
2. `getByLabel()` - Good for form fields
3. `getByPlaceholder()` - Fallback for inputs
4. `getByTestId()` - Last resort (add data-testid attributes)

### 3. Wait for Elements Properly

Playwright auto-waits, but you can be explicit:

```typescript
// Wait for element to be visible
await expect(element).toBeVisible()

// Wait for specific state
await element.waitFor({ state: 'visible' })
```

### 4. Keep Tests Independent

Each test should:

- Create its own test data
- Clean up after itself (if needed)
- Not depend on other tests

### 5. Handle Test Data

```typescript
// ✅ Good: Unique data per test
const user = createTestUser()

// ❌ Bad: Hardcoded data (fails on second run)
const email = 'test@example.com'
```

## Debugging

### Visual Debugging

```bash
# Run in headed mode
npm run test:e2e:headed

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in debug mode (step through)
npm run test:e2e:debug
```

### Trace Viewer

When a test fails, Playwright automatically captures a trace:

```bash
# View trace for failed test
npx playwright show-trace trace.zip
```

The trace includes:

- Screenshots at each step
- Network requests
- Console logs
- DOM snapshots

### Screenshots and Videos

Failed tests automatically capture:

- Screenshots (saved to `test-results/`)
- Videos (saved to `test-results/`)

## CI/CD Integration

The test configuration automatically adjusts for CI:

- Retries failed tests (2 retries in CI)
- Uses single worker for stability
- Generates GitHub Actions annotations
- Fails if `.only()` is used

## Troubleshooting

### Tests Timeout

```typescript
// Increase timeout for slow operations
test('slow operation', async ({ page }) => {
  test.setTimeout(60000) // 60 seconds
  // ...
})
```

### Flaky Tests

Common causes and solutions:

1. **Race Conditions**: Use proper waits

   ```typescript
   await expect(element).toBeVisible()
   ```

2. **Network Issues**: Mock API responses

   ```typescript
   await page.route('**/api/slow-endpoint', route => {
     route.fulfill({ body: 'mocked response' })
   })
   ```

3. **Timing Issues**: Avoid hardcoded waits

   ```typescript
   // ❌ Bad
   await page.waitForTimeout(1000)

   // ✅ Good
   await expect(element).toBeVisible()
   ```

### Test Database

For development, tests run against your local Supabase instance. For CI, consider:

- Setting up a test database
- Using database transactions for cleanup
- Mocking Supabase responses

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Generator (Codegen)](https://playwright.dev/docs/codegen)
  ```bash
  npx playwright codegen http://localhost:3000
  ```

## Next Steps

Consider adding E2E tests for:

- Login flow with interactions
- Registration flow
- Password reset
- Pantry CRUD operations
- Recipe generation
- Shopping list management
- Real-time collaboration

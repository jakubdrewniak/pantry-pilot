# Testing Rules

## Unit Tests (Vitest)

- Use `vi.fn()` for function mocks, `vi.spyOn()` to monitor existing functions, `vi.stubGlobal()` for global mocks. Prefer spies over mocks when you only need to verify interactions without changing behavior.
- Place `vi.mock()` factory functions at the top level of test files; return typed mock implementations. Use `mockImplementation()` or `mockReturnValue()` for dynamic control. Remember the factory runs before imports are processed.
- Define global mocks, custom matchers, and environment setup in dedicated setup files referenced in `vitest.config.ts`.
- Replace complex equality checks with `expect(value).toMatchInlineSnapshot()` for readable assertions.
- Configure coverage thresholds in `vitest.config.ts` for critical paths — only when explicitly asked.
- Set `environment: 'jsdom'` in configuration for frontend component tests; combine with testing-library utilities.
- Group related tests with descriptive `describe` blocks, use explicit assertion messages, and follow the Arrange-Act-Assert pattern.
- Enable strict typing in tests; use `expectTypeOf()` for type-level assertions; ensure mocks preserve original type signatures.

## E2E Tests (Playwright)

- Initialize configuration only with Chromium/Desktop Chrome browser.
- Use browser contexts for isolating test environments.
- Implement the Page Object Model for maintainable tests.
- Use locators for resilient element selection.
- Leverage API testing for backend validation.
- Implement visual comparison with `expect(page).toHaveScreenshot()`.
- Use the codegen tool for test recording.
- Leverage trace viewer for debugging test failures.
- Implement test hooks for setup and teardown.
- Use `expect` assertions with specific matchers.
- Leverage parallel execution for faster test runs.

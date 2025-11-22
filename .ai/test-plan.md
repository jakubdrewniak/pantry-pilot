# Test Plan for Pantry Pilot

## 1. Overview and Testing Objectives

Pantry Pilot is a full-stack web application that helps users manage pantry inventory, generate recipes with AI, and collaborate in real time. The goal of this test plan is to ensure that the application is reliable, secure, and delivers a seamless user experience.

Specific objectives:

- Validate core user flows: authentication, pantry CRUD, recipe generation/editing, shopping list management, and real-time collaboration.
- Prevent regressions through automated unit, integration, and end-to-end (E2E) tests.
- Verify data integrity and security for Supabase-stored user data (pantries, recipes, credentials).
- Maintain good test coverage without over-engineering the testing infrastructure.

---

## 2. Testing Strategy

### 2.1 Unit Tests (Vitest + React Testing Library)

**Scope:**

- React components and custom hooks
- Utility functions and helper logic (`src/lib/`)
- Form validation and data transformation
- Business logic in API routes (with mocked dependencies)

**Approach:**

- Mock Supabase client for database interactions
- Mock OpenRouter API calls for AI features
- Focus on logic, edge cases, and error handling
- Use React Testing Library for component behavior, not implementation details

### 2.2 Integration Tests (Vitest + Mocked Supabase)

**Scope:**

- API routes with realistic request/response cycles
- Data flow between components and API endpoints
- Form submission and validation workflows
- Authentication and authorization flows

**Approach:**

- Mock Supabase client to simulate database responses
- Test request/response contracts using Zod schemas
- Verify error handling and edge cases
- Test RLS policy logic at the application level

### 2.3 End-to-End Tests (Playwright)

**Scope:**

- Critical user journeys (auth, pantry CRUD, recipe generation, shopping lists)
- Cross-browser compatibility (Chromium, Firefox, WebKit)
- Real-time collaboration features
- Multi-step workflows

**Approach:**

- Test against development/staging environment
- Use Playwright's built-in assertions and auto-waiting
- Keep E2E suite focused on happy paths and critical edge cases
- Device emulation for responsive design validation

### 2.4 Visual Regression Tests (Playwright - Optional)

**Scope:**

- Key UI components and layouts
- Dark/light theme consistency

**Approach:**

- Use Playwright's `expect(page).toHaveScreenshot()` for critical pages
- Run selectively to avoid brittleness
- Update baseline screenshots intentionally when UI changes

---

## 3. Testing Tools

| Layer            | Tool                                    | Purpose                                                  |
| ---------------- | --------------------------------------- | -------------------------------------------------------- |
| Unit/Integration | **Vitest** + React Testing Library      | Fast, TypeScript-native testing with excellent DX        |
| E2E              | **Playwright**                          | Multi-browser automation, built-in tracing & screenshots |
| Validation       | **Zod**                                 | Runtime type checking and API contract validation        |
| Code Quality     | **ESLint** + **TypeScript strict mode** | Static analysis and type safety                          |
| Coverage         | **Vitest built-in (c8)**                | Track test coverage without obsessing over metrics       |
| Mocking          | **Vitest vi.mock()**                    | Simple, built-in mocking for dependencies                |

---

## 4. Testing Priorities

Focus testing efforts on areas with highest risk and user impact:

1. **Authentication & Authorization** - Security-critical, foundation for all features
2. **Data Integrity** - CRUD operations must be reliable and prevent data loss
3. **AI Integration** - Error handling, rate limits, and fallback scenarios
4. **Real-Time Features** - Collaboration requires consistent state across clients
5. **Critical User Flows** - End-to-end journeys that define core value proposition

---

## 5. Coverage Guidelines

| Test Type             | Scope                        | Pragmatic Approach                                    |
| --------------------- | ---------------------------- | ----------------------------------------------------- |
| **Unit**              | Components, hooks, utilities | Test behavior and edge cases; aim for 60-80% coverage |
| **Integration**       | API routes, data flows       | Cover critical paths and error scenarios              |
| **E2E**               | User journeys                | Focus on happy paths + most common edge cases         |
| **Visual** (optional) | Key pages/components         | Selective screenshot tests for critical UI            |

**Philosophy**: Prioritize meaningful tests over coverage metrics. A well-tested critical path is better than 100% coverage of trivial code.

---

## 6. Implementation Roadmap

### Phase 1: Setup & Foundation

- Configure Vitest + React Testing Library
- Set up Playwright for E2E tests
- Create test utilities and helpers (mock factories, test data)
- Define testing patterns and conventions

### Phase 2: Core Unit Tests

- Test utility functions and helpers (`src/lib/`)
- Test React components with RTL
- Test custom hooks
- Mock Supabase and OpenRouter dependencies

### Phase 3: Integration Tests

- Test API routes with mocked Supabase client
- Validate request/response contracts using Zod
- Test authentication and authorization flows
- Cover error handling and edge cases

### Phase 4: E2E Tests

- Set up test environment (dev/staging)
- Implement critical user journeys with Playwright
- Add cross-browser test coverage
- Optional: Add visual regression tests for key pages

### Phase 5: CI/CD Integration (Future)

- Set up GitHub Actions workflow
- Run unit + integration tests on every PR
- Run E2E tests on staging deployments
- Track coverage trends over time

---

## 7. Success Criteria

**Testing is successful when:**

- ✅ Critical user flows are covered by E2E tests
- ✅ Core business logic has unit test coverage
- ✅ Tests catch bugs before production
- ✅ Tests are maintainable and don't create excessive burden
- ✅ Test suite runs fast enough for good developer experience
- ✅ New bugs get regression tests added

**Red flags to avoid:**

- ❌ Testing for coverage metrics rather than real value
- ❌ Brittle tests that break with every UI tweak
- ❌ Slow test suite that developers skip
- ❌ Over-mocked tests that don't catch real issues
- ❌ Complex test infrastructure that's hard to maintain

---

## 8. Project Structure

```
pantry-pilot/
├── src/
│   ├── app/              # Next.js pages & API routes
│   ├── components/       # React components
│   ├── lib/              # Utilities & helpers
│   └── types.ts          # Shared TypeScript types
├── tests/
│   ├── unit/             # Vitest unit tests
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   ├── integration/      # Vitest integration tests
│   │   └── api/
│   ├── e2e/              # Playwright E2E tests
│   │   ├── auth.spec.ts
│   │   ├── pantry.spec.ts
│   │   └── recipes.spec.ts
│   └── helpers/          # Test utilities & mocks
│       ├── mocks/
│       ├── fixtures/
│       └── factories.ts
├── playwright.config.ts
└── vitest.config.ts
```

---

> **Remember**: The goal is confidence in your code, not perfect metrics. Write tests that help you ship features faster and sleep better at night.

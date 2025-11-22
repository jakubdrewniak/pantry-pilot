# Tech Stack Summary

## Frontend

- Next.js (React 19 + TypeScript 5) for performant, modular UI and optional SSR/SSG
- Tailwind CSS for utility-first styling and rapid layout
- shadcn/ui for pre-designed, accessible components to speed up development

## Backend

- Supabase (Postgres, Auth, Realtime, Storage) as Backend-as-a-Service for CRUD, real-time collaboration, and user management
- Next.js API Routes or Supabase Edge Functions for custom serverless logic (e.g., AI integration, additional validation)

## AI Integration

- Openrouter.ai for LLM-powered recipe generation, accessed via lightweight serverless endpoints

## Testing & Quality Assurance

- **Vitest** + React Testing Library for fast, TypeScript-native unit and integration testing
- **Playwright** for multi-browser end-to-end testing with built-in tracing and screenshots
- **Zod** for runtime type checking and API contract validation
- **ESLint** + TypeScript strict mode for static analysis and type safety
- Three-layer testing strategy:
  - Unit tests for components, hooks, and utilities (60-80% coverage goal)
  - Integration tests for API routes and data flows
  - E2E tests for critical user journeys and cross-browser compatibility

## CI/CD & Hosting

- GitHub Actions for automated testing and deployment workflows
- DigitalOcean App Platform or Functions for scalable, managed hosting of frontend and serverless functions

## Key Benefits

1. **Speed to MVP**: Out-of-the-box services and one codebase (TypeScript) accelerate development.
2. **Scalability**: Supabase and serverless functions auto-scale; Next.js supports code-splitting and SSR.
3. **Cost Efficiency**: Minimal infra overhead; Supabase free tier and DigitalOcean's predictable pricing.
4. **Simplicity**: Eliminates full backend framework (NestJS) bloat; single-language stack.
5. **Security**: Supabase Auth (JWT), input validation (Zod), Markdown sanitization, secure secret management in GitHub Actions.
6. **Quality & Reliability**: Comprehensive testing strategy (unit, integration, E2E) with modern tools ensures confidence and prevents regressions.
7. **Maintainability**: Centralized codebase, clear separation of concerns, easy onboarding for new developers.

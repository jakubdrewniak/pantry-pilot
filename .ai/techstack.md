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

## CI/CD & Hosting

- GitHub Actions for automated testing and deployment workflows
- DigitalOcean App Platform or Functions for scalable, managed hosting of frontend and serverless functions

## Key Benefits

1. **Speed to MVP**: Out-of-the-box services and one codebase (TypeScript) accelerate development.
2. **Scalability**: Supabase and serverless functions auto-scale; Next.js supports code-splitting and SSR.
3. **Cost Efficiency**: Minimal infra overhead; Supabase free tier and DigitalOcean’s predictable pricing.
4. **Simplicity**: Eliminates full backend framework (NestJS) bloat; single-language stack.
5. **Security**: Supabase Auth (JWT), input validation (Zod), Markdown sanitization, secure secret management in GitHub Actions.
6. **Maintainability**: Centralized codebase, clear separation of concerns, easy onboarding for new developers.

# Pantry Pilot

Pantry Pilot is a web-based application that streamlines meal planning by combining manual pantry management with AI-powered recipe generation. Users register with email and password, track pantry inventory, create and edit recipes in Markdown, generate recipes based on available ingredients using an LLM, and compile shopping lists. Real-time collaboration allows invited users to jointly manage pantries and shopping lists.

## Tech Stack

- TypeScript 5 / React 19 / Next.js
- Tailwind 4 / Shadcn/ui (new-york style, neutral color, CSS variables)
- Supabase (auth + database + realtime)

## Project Structure

Always follow this structure when introducing changes:

- `src/pages/` – React pages and API endpoints
- `src/layouts/` – layout wrappers and shared templates
- `src/components/ui/` – shadcn/ui components and customizations
- `src/db/` – Supabase config and table type definitions
- `src/types.ts` – DTOs and interfaces shared between front-end and API
- `src/lib/` – helper logic (AI, Markdown, validation)
- `src/middleware.ts` – global Next.js middleware (route protection)
- `public/` & `src/assets/` – public static files vs build-bundled assets

## Coding Practices

- Code and comments must be in English.
- Use linter feedback to improve code when making changes.
- Handle errors and edge cases at the beginning of functions (guard clauses, early returns).
- Avoid unnecessary `else` statements; use if-return pattern instead.
- Implement proper error logging and user-friendly error messages.

---

## AI Mentor Rules (always apply)

@.claude/rules/ai-mentor.md

---

## Frontend Rules

> Apply when working on `.tsx` files, React components, or Next.js pages.

@.claude/rules/frontend.md

---

## Backend & Database Rules

> Apply when working in `src/db/`, `src/middleware/`, or `src/lib/`.

@.claude/rules/backend.md

---

## Supabase Migration Rules

> Apply when creating or modifying migration files in `supabase/migrations/`.

@.claude/rules/db-migrations.md

---

## Shadcn UI Rules

> Apply when adding or using shadcn/ui components.

@.claude/rules/shadcn.md

---

## Supabase Auth Rules

> Apply when implementing or modifying authentication features.

@.claude/rules/supabase-auth.md

---

## Testing Rules

> Apply when writing or modifying tests (Vitest for unit tests, Playwright for E2E).

@.claude/rules/testing.md

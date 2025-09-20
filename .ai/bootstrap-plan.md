# Pantry Pilot Bootstrap Plan

## Overview
Bootstrap plan for Pantry Pilot - a web-based application that streamlines meal planning by combining manual pantry management with AI-powered recipe generation.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, ESLint v9.36.0, Supabase

## Step-by-Step Bootstrap Plan

### Phase 1: Project Initialization
1. **Create Next.js project with modern template**
   - Use `npx create-next-app@latest pantry-pilot --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
   - This creates a Next.js 15 project with App Router, TypeScript, Tailwind CSS 4, and ESLint pre-configured
   - Verification: Run `npm run dev` and check localhost:3000 shows welcome page

2. **Setup Node.js version management**
   - Create `.nvmrc` file with `20.18.0` (latest LTS)
   - Add to `.gitignore`: `node_modules`, `.next`, `.env.local`
   - Verification: Run `nvm use` (if nvm installed) or check Node version

3. **Initialize Git repository**
   - `git init && git add . && git commit -m "feat: initialize pantry pilot project"`
   - Verification: Check git status shows clean working tree

### Phase 2: Core Dependencies & Configuration
4. **Install additional dependencies**
   - `npm install --save-dev @types/node @types/react @types/react-dom`
   - `npm install next-themes class-variance-authority clsx tailwind-merge lucide-react`
   - Verification: Check `package.json` has all dependencies

5. **Configure TypeScript**
   - Update `tsconfig.json` with strict settings and path mapping
   - Add `"baseUrl": ".", "paths": {"@/*": ["./src/*"]}`
   - Verification: Run `npx tsc --noEmit` - should pass without errors

6. **Setup Tailwind CSS 4 with shadcn/ui**
   - Run `npx shadcn@latest init`
   - Choose default settings (yes to all prompts)
   - Install core components: `npx shadcn@latest add button card`
   - Verification: Check `src/components/ui/` contains shadcn components

### Phase 3: Code Quality Tools
7. **Configure Prettier**
   - Create `.prettierrc` with: `{"semi": false, "singleQuote": true, "tabWidth": 2}`
   - Create `.prettierignore` with: `node_modules`, `.next`, `dist`
   - Add format script: `"format": "prettier --write ."`
   - Verification: Create a test file with unformatted code, run `npm run format`

8. **Enhance ESLint configuration**
   - Update `.eslintrc.json` to include Next.js and TypeScript rules
   - Add React 19 compatibility settings
   - Add lint script: `"lint": "next lint && eslint . --ext .ts,.tsx"`
   - Verification: Run `npm run lint` - should show no errors on clean code

### Phase 4: Git Quality Gates
9. **Setup Husky for Git hooks**
   - `npm install --save-dev husky`
   - `npx husky init`
   - Update `package.json` prepare script: `"prepare": "husky"`
   - Verification: Check `.husky/` directory created

10. **Configure commitlint**
    - `npm install --save-dev @commitlint/cli @commitlint/config-conventional`
    - Create `commitlint.config.js`: `module.exports = { extends: ['@commitlint/config-conventional'] }`
    - Create commit-msg hook: `echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg`
    - Verification: Try `git commit -m "test"` - should fail with conventional commit error

11. **Setup lint-staged**
    - `npm install --save-dev lint-staged`
    - Update `package.json`: `"lint-staged": { "*.{js,ts,tsx,json,md}": ["prettier --write", "eslint --fix"] }`
    - Create pre-commit hook: `echo "npx lint-staged" > .husky/pre-commit`
    - Verification: Stage a file, try commit - should run prettier/eslint automatically

### Phase 5: Project Structure & Welcome Page
12. **Create folder structure**
    ```
    src/
    ├── app/           # Next.js app router
    ├── components/    # React components
    │   ├── ui/        # shadcn/ui components
    │   └── layout/    # Layout components
    ├── lib/           # Utilities (AI, validation, etc.)
    ├── types/         # TypeScript interfaces
    ├── db/            # Database configuration
    └── middleware.ts  # Next.js middleware
    ```

13. **Create welcome page**
    - Update `src/app/page.tsx` with a simple welcome page using shadcn/ui components
    - Add basic layout with header and welcome message
    - Verification: Run `npm run dev` and check the welcome page renders correctly

### Phase 6: Verification & Testing
14. **Run complete verification**
    - `npm run build` - should build successfully
    - `npm run lint` - should pass all linting rules
    - `npm run format` - should format all files
    - Test git workflow: make a change, stage, commit with conventional format
    - Verification: All commands pass without errors

15. **Final cleanup and documentation**
    - Update README.md with setup instructions
    - Add `.vscode/settings.json` for consistent editor experience
    - Verification: Project is ready for development

---

## ✅ COMPLETED STEPS SUMMARY

### Step 1: Project Initialization ✅ COMPLETED
**What Was Accomplished:**
- ✅ **Next.js 15.0.0** with App Router initialized
- ✅ **React 19.0.0-rc** (compatible version) configured
- ✅ **TypeScript 5** with strict configuration
- ✅ **Tailwind CSS 3.4.4** with custom design system
- ✅ **ESLint v9.36.0** with modern flat config and Next.js core web vitals rules

**Project Structure Created:**
```
src/
├── app/           # Next.js App Router
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Welcome page
│   └── globals.css   # Global styles + Tailwind
├── components/ui/    # shadcn/ui components (ready for setup)
├── lib/             # Utility functions
├── types/           # TypeScript interfaces
├── db/              # Database configuration
└── middleware.ts    # Next.js middleware (placeholder)
```

**Configuration Files:**
- ✅ `package.json` - Dependencies and scripts configured
- ✅ `tsconfig.json` - TypeScript with path mapping (`@/*`)
- ✅ `tailwind.config.ts` - Tailwind with shadcn/ui variables
- ✅ `postcss.config.mjs` - PostCSS with Tailwind and Autoprefixer
- ✅ `next.config.ts` - Next.js configuration
- ✅ `eslint.config.js` - ESLint v9 flat configuration (modern)
- ✅ `.nvmrc` - Node.js version 20.19.0 specified
- ✅ `.gitignore` - Comprehensive Next.js gitignore rules

**Welcome Page:**
- ✅ Beautiful gradient background with Tailwind CSS
- ✅ Responsive design with proper typography
- ✅ Dark mode CSS variables ready
- ✅ Clean, professional Pantry Pilot branding

**Verification Results:**
- ✅ **Development Server**: `npm run dev` ✅ (HTTP 200 response)
- ✅ **ESLint v9.36.0**: `npm run lint` ✅ (Modern flat config working)
- ✅ **TypeScript**: `npx tsc --noEmit` ✅ (No type errors)
- ✅ **Production Build**: `npm run build` ✅ (Successful compilation)
- ✅ **Dependencies**: `npm install` ✅ (All packages installed)

**Key Features Working:**
- Hot reload development server
- TypeScript compilation and checking
- Tailwind CSS processing and optimization
- ESLint v9 with modern flat configuration
- Next.js App Router with proper file structure

**Next Steps:**
- **Step 2**: Installing additional dependencies (class-variance-authority, etc.)
- **Step 3**: shadcn/ui CLI setup and component installation
- **Step 4**: Git hooks and quality gates
- **Step 5**: Advanced linting and formatting tools

---

*Last Updated: $(date)*
*Status: Ready for Step 2*

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

## _Last Updated: $(date)_

## ✅ COMPLETED STEPS SUMMARY (UPDATED)

### Step 2: Core Dependencies & Configuration ✅ COMPLETED

**What Was Accomplished:**

- ✅ **TypeScript type definitions** installed (@types/node, @types/react, @types/react-dom)
- ✅ **next-themes v0.4.6** installed for dark mode support
- ✅ **class-variance-authority v0.7.1** installed for component variant management
- ✅ **clsx v2.1.1** and **tailwind-merge v3.3.1** installed for utility functions
- ✅ **lucide-react v0.544.0** installed for icons
- ✅ **ThemeProvider component** created with next-themes integration
- ✅ **Button component** created with class-variance-authority variants
- ✅ **Utility functions** (cn) created for Tailwind class merging
- ✅ **Welcome page updated** to demonstrate new dependencies and components
- ✅ **Layout updated** with ThemeProvider for dark mode support

**Key Features Implemented:**

- Dark mode support with system preference detection
- Reusable button component with multiple variants (default, outline, etc.)
- Icon integration with lucide-react
- Utility functions for class name merging
- TypeScript types properly configured
- All dependencies working correctly with React 19

**Verification Results:**

- ✅ **ESLint**: `npm run lint` ✅ (No errors with new components)
- ✅ **TypeScript**: `npx tsc --noEmit` ✅ (All type checks pass)
- ✅ **Production Build**: `npm run build` ✅ (Successful compilation)
- ✅ **Development Server**: `npm run dev` ✅ (Starts without errors)
- ✅ **Dependencies**: All packages installed and working

**Components Created:**

- `src/lib/utils.ts` - Utility functions for Tailwind class merging
- `src/components/theme-provider.tsx` - Theme provider with next-themes
- `src/components/ui/button.tsx` - Reusable button component with variants
- Updated `src/app/layout.tsx` - Integrated theme provider
- Updated `src/app/page.tsx` - Demo page showing new features

**Next Steps:**

- **Step 3**: shadcn/ui CLI setup and component installation
- **Step 4**: Git hooks and quality gates
- **Step 5**: Advanced linting and formatting tools

---

---

## ✅ COMPLETED STEPS SUMMARY (UPDATED)

### Step 3: shadcn/ui CLI Setup and Component Installation ✅ COMPLETED

**What Was Accomplished:**

- ✅ **shadcn/ui CLI initialized** with `npx shadcn@latest init`
- ✅ **Configuration created** (`components.json` with New York style, neutral theme)
- ✅ **Tailwind CSS updated** with shadcn/ui theme variables and animations
- ✅ **CSS variables configured** in `globals.css` for light/dark themes
- ✅ **Component library structure** established in `src/components/ui/`
- ✅ **Card component** installed via CLI (working example)
- ✅ **Badge, Input, Label components** created manually (avoiding dependency conflicts)
- ✅ **All components** fully typed with TypeScript and using class-variance-authority
- ✅ **Component variants** implemented (default, outline, secondary, etc.)
- ✅ **Welcome page updated** to showcase all shadcn/ui components
- ✅ **Demo form created** demonstrating Input, Label, Button, Card components

**shadcn/ui Configuration:**

```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

**Components Created:**

- ✅ `src/components/ui/card.tsx` - Complete card system with Header, Content, Footer
- ✅ `src/components/ui/badge.tsx` - Badge component with variants
- ✅ `src/components/ui/input.tsx` - Form input with proper styling
- ✅ `src/components/ui/label.tsx` - Accessible form labels with Radix UI
- ✅ Updated `src/components/ui/button.tsx` - Enhanced with better variants

**Key Features Implemented:**

- **Modern Design System**: New York style with neutral color scheme
- **Dark Mode Support**: CSS variables for both light and dark themes
- **Component Variants**: Multiple styles for each component using class-variance-authority
- **Accessibility**: Proper ARIA labels, focus states, and keyboard navigation
- **TypeScript**: Full type safety with proper interfaces and props
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Icon Integration**: Lucide React icons throughout the interface

**Verification Results:**

- ✅ **ESLint**: `npm run lint` ✅ (All components pass linting)
- ✅ **TypeScript**: `npx tsc --noEmit` ✅ (All type checks pass)
- ✅ **Production Build**: `npm run build` ✅ (Successful compilation)
- ✅ **shadcn/ui Setup**: Components render correctly with proper styling
- ✅ **Component Variants**: All variants (default, outline, secondary, etc.) working
- ✅ **Form Integration**: Input, Label, and Button components working together

**Components Directory Structure:**

```
src/components/
├── ui/
│   ├── button.tsx       # Enhanced button with variants
│   ├── card.tsx         # Complete card system
│   ├── badge.tsx        # Status badges
│   ├── input.tsx        # Form inputs
│   └── label.tsx        # Form labels
├── theme-provider.tsx   # Dark mode provider
└── ...
```

**Next Steps:**

- **Step 4**: Git hooks and quality gates
- **Step 5**: Advanced linting and formatting tools

---

---

## ✅ COMPLETED STEPS SUMMARY (UPDATED)

### Step 4: Git Hooks and Quality Gates ✅ COMPLETED

**What Was Accomplished:**

- ✅ **Husky v9.1.7** installed and initialized for Git hooks management
- ✅ **Git hooks directory** created (`.husky/`) with proper structure
- ✅ **Package.json prepare script** configured: `"prepare": "husky"`
- ✅ **commitlint** installed with conventional configuration
- ✅ **commitlint.config.js** created with conventional commit rules
- ✅ **commit-msg hook** created to enforce commit message conventions
- ✅ **lint-staged v16.1.6** installed for pre-commit quality checks
- ✅ **Pre-commit hook** created to run lint-staged on staged files
- ✅ **Prettier** installed and configured for code formatting
- ✅ **.prettierrc** created with consistent formatting rules
- ✅ **.prettierignore** created to exclude build files and dependencies
- ✅ **Git workflow tested** with both valid and invalid commit messages
- ✅ **Quality gates verified** - all hooks working correctly

**Git Hooks Configuration:**

```bash
.husky/
├── pre-commit    # Runs lint-staged on staged files
├── commit-msg    # Validates commit messages with commitlint
└── _/           # Husky internal files
```

**commitlint.config.js:**

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
      ],
    ],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
  },
}
```

**lint-staged Configuration:**

```json
{
  "*.{js,ts,tsx,json,md}": ["eslint --fix", "prettier --write --ignore-unknown"]
}
```

**Prettier Configuration (.prettierrc):**

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid"
}
```

**Key Features Implemented:**

- **Pre-commit quality checks** - ESLint and Prettier run automatically
- **Conventional commit enforcement** - Standardized commit message format
- **Code formatting consistency** - Prettier ensures uniform code style
- **Git workflow integration** - Quality gates built into development process
- **CI/CD ready** - Same quality checks can run in CI pipelines

**Verification Results:**

- ✅ **Pre-commit hook**: `lint-staged` runs ESLint and Prettier on staged files
- ✅ **Commit-msg hook**: `commitlint` validates conventional commit format
- ✅ **Invalid commits rejected**: Bad commit messages properly blocked
- ✅ **Valid commits accepted**: Proper conventional commits succeed
- ✅ **Build compatibility**: All hooks work with existing build process
- ✅ **Performance**: Hooks run efficiently without slowing development

**Git Workflow Demonstration:**

```bash
# Bad commit message (rejected)
git commit -m "bad commit message"
# ❌ Fails with commitlint errors

# Good commit message (accepted)
git commit -m "docs: update README with project description"
# ✅ Passes all quality checks and commits successfully
```

**Next Steps:**

- **Step 5**: Advanced linting and formatting tools
- Ready for production development with enforced code quality

---

_Status: Ready for Step 5_

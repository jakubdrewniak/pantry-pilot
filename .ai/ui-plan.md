# UI Architecture for Pantry Pilot

## 1. Overview of UI Structure

The UI is organized around a mobile-first Next.js App Router structure with a persistent bottom navigation bar. Key screens include Authentication, Household Selection, Pantry, Recipes (including AI Generation), Shopping List, and Settings (Invitations). React Context manages auth and selected household state; TanStack Query handles data fetching, caching, and optimistic updates.

## 2. Views

- **Login & Registration**  
  Path: `/login`, `/register`  
  Goal: Authenticate users.  
  Key Info: Email/password form, validation messages, error feedback.  
  Components: Form inputs, submit buttons, toast notifications.  
  UX/Accessibility/Security: Keyboard focus on first input, ARIA labels, HTTPS form submission, password strength hints, avoid revealing validation reasons.

- **Household Dashboard**  
  Path: `/households`  
  Goal: Show current household info, members, pending invitations, and quick links to core sections.  
  Key Info: Household name, member list, invitation status, accept/reject actions.  
  Components: Card list, action buttons, confirmation modal.  
  UX/Accessibility/Security: Confirmation before accept/reject, disable actions for non-owners, ARIA roles for list and buttons.

- **Pantry**  
  Path: `/pantry`  
  Goal: Display and manage pantry items.  
  Key Info: Item list with name, quantity, unit; add/remove controls.  
  Components: Table or list with inputs, add-item form, delete confirmation modal, skeleton loader.  
  UX/Accessibility/Security: Prevent duplicates with inline warning, focus trap in modals, keyboard support for list navigation.

- **Recipes List**  
  Path: `/recipes`  
  Goal: Browse, search, filter recipes.  
  Key Info: Search input, filter selectors (meal type, creation method), paginated recipe cards.  
  Components: Input, dropdowns, recipe card grid, skeleton loader.  
  UX/Accessibility/Security: Debounce search, ARIA live region for result counts, ensure color contrast for cards.

- **Recipe Editor**  
  Path: `/recipes/new`, `/recipes/[id]/edit`  
  Goal: Create or update recipes manually.  
  Key Info: Title, ingredients list, Markdown instructions, optional prep/cook times, save button.  
  Components: Text inputs, dynamic ingredient form, textarea editor, save spinner.  
  UX/Accessibility/Security: Markdown editor accessible labels, error summary on validation failure, prevent XSS.

- **AI Recipe Generation Modal**  
  Trigger: From Recipes List  
  Goal: Generate recipes via AI.  
  Key Info: Free-text hint, "Use pantry" checkbox, progress indicator, warnings panel.  
  Components: Modal/bottom sheet, inputs, spinner, result preview.  
  UX/Accessibility/Security: Disable background, ARIA modal role, show friendly error on LLM failure, handle empty pantry warning.

- **Shopping List**  
  Path: `/shopping-list`  
  Goal: View, generate, and manage shopping list.  
  Key Info: List of items, isPurchased toggles, add-item form, generate-from-recipes button.  
  Components: Checkbox list, add form, action buttons, skeleton loader.  
  UX/Accessibility/Security: Confirmation before transfer, atomic transfers in UI, ARIA checkbox semantics.

- **Settings & Invitations**  
  Path: `/settings`  
  Goal: Manage account settings and household invites.  
  Key Info: Change password form, list of pending invitations, invite form.  
  Components: Tabs, forms with validation, cancel-invite buttons.  
  UX/Accessibility/Security: Strength meter for passwords, confirm before cancel, rate-limit feedback.

## 3. User Journey Map

1. **Authentication**: User visits `/login` → logs in → redirected to `/households`.
2. **Household Dashboard**: Chooses or accepts household → navigates via bottom bar to Pantry.
3. **Pantry Management**: Adds/removes items → switches to Recipes.
4. **Recipe Discovery**: Searches or filters → opens AI modal or editor → saves recipe → returns to list.
5. **Shopping List**: Navigates to Shopping List → generates list from recipes or adds manually → marks purchased → item moves to Pantry.
6. **Settings**: Visits Settings to manage password or invites.

## 4. Navigation Structure

- **Bottom Navbar**: Icons for Pantry (`/pantry`), Recipes (`/recipes`), Shopping List (`/shopping-list`), Settings (`/settings`).
- **Header Links** (for desktop): Logo (home), Search (recipes), User menu (logout).
- **Dynamic Routes**: `/recipes/new`, `/recipes/[id]`, `/recipes/[id]/edit`.

## 5. Key Shared Components

- **FormInput**: Accessible input with label, error message, focus state.
- **Modal**: ARIA-compliant, focus-trap, close on ESC.
- **SkeletonLoader**: For lists and pages.
- **Toast**: For success/error notifications.
- **BottomNav**: Responsive, icons with labels.
- **MarkdownEditor**: Accessible textarea with live preview option.
- **ConfirmationDialog**: Standardized modal for destructive actions.

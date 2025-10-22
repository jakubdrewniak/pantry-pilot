<conversation_summary>
<decisions>

1. Household switching is automatic upon invitation acceptance; users can belong to only one household at a time and return to their own upon leaving.
2. Invitations are managed within the household view, where users can accept or reject without separate notifications.
3. The household view consolidates members list and pending invitations.
4. Recipe search uses a fixed input placed above the recipe list, filtering by title.
5. The recipe editor is implemented as a simple textarea in the MVP.
6. The AI generation modal includes both a free-text hint input and a "Use pantry items" checkbox.
7. The AI generation modal is an extended overlay: a bottom sheet on mobile and a centered overlay on desktop.
8. A bottom navigation bar with icons for Pantry, Recipes, Shopping List, and Settings is used in a mobile-first design.
9. The invite form performs client-side email format validation before calling the API.
10. Lists use skeleton loaders for initial load and spinners within modals for asynchronous actions.
    </decisions>
    <matched_recommendations>
11. Implement a global layout with a bottom navigation bar linking key sections: Pantry, Recipes, Shopping List, and Settings.
12. Use shadcn/ui components for consistent, accessible forms, lists, and modals.
13. Employ TanStack Query (React Query) for data fetching, caching, and synchronization with the API.
14. Adopt a mobile-first responsive design with Tailwind CSS, defining breakpoints and flexible grid/flex layouts.
15. Ensure accessibility via ARIA roles, keyboard support, and sufficient color contrast across components.
16. Centralize authentication state in a React Context or Supabase Provider for app-wide access (to be implemented later).
17. Implement a global ErrorBoundary and toast notification system to handle API errors and warnings.
18. Utilize Next.js App Router dynamic routes (e.g., `/recipes/[id]/edit`, `/households/[id]/pantry`) for clear navigation.
19. Include loader skeletons in lists and spinners in modals to indicate loading states.
20. Build the AI generation component with a progress indicator and warning panel to surface API responses.
    </matched_recommendations>
    <ui_architecture_planning_summary>
    The UI architecture for the MVP will include the following key screens and flows:

• Authentication Flow: Login and registration screens leading to household selection (auto-switch on invite acceptance).
• Household Selection & Management: After login, users land in a household view showing members and pending invitations, with accept/reject actions. An option to leave a household will be placed in settings later.
• Bottom Navigation Layout: A persistent bottom navbar provides quick access to Pantry, Recipes, Shopping List, and Settings (including invitations management).
• Pantry Screen: Displays household pantry items fetched from `/api/households/{id}/pantry` with skeleton loaders on initial load.
• Recipes Screen: Shows a paginated list from `/api/recipes?search=<title>`, includes a fixed search input above the list, and skeleton loaders during fetch.
• Recipe Editor: A simple textarea in a dedicated route (`/recipes/[id]/edit` or `/recipes/new`), with an optional preview toggle after saving.
• AI Generation Modal: Accessible from the Recipes list, opens as an extended overlay/bottom sheet containing a hint input and pantry checkbox, with a spinner and progress UI during API call to `/api/recipes/generate`.
• Shopping List Screen: Lists items from `/api/shopping-lists/{id}/items`, supports marking purchased (via PATCH) and moving items to pantry, with loading skeletons.
• Settings & Invitations: Within the Settings view, display pending invitations and a modal form for new invites, validating email format client-side before POST to `/api/households/{id}/invitations`.

State management will leverage React Context for authentication and selected household ID, and TanStack Query for all CRUD operations, ensuring caching, refetching, and optimistic updates. Dynamic Next.js routes will mirror API structure for clarity and SEO.

Responsive design uses Tailwind CSS mobile-first breakpoints; the bottom navbar simplifies navigation on small screens. Accessibility considerations include ARIA roles, keyboard navigability, and color contrast. A global ErrorBoundary and toast system will surface errors, while loading states use skeletons and spinners.
</ui_architecture_planning_summary>
<unresolved_issues>

- UI flow and confirmation steps for leaving a household remain to be defined.
- Detailed authentication UI patterns (httpOnly cookies vs. token headers) and protected-route handling need specification.
  </unresolved_issues>
  </conversation_summary>

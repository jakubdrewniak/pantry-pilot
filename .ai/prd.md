# Product Requirements Document (PRD) - Pantry Pilot

## 1. Product Overview

Pantry Pilot is a web-based application that streamlines meal planning by combining manual pantry management with AI-powered recipe generation. Users register with email and password, track pantry inventory, create and edit recipes in Markdown, generate recipes based on available ingredients using an LLM, and compile shopping lists. Real-time collaboration allows invited users to jointly manage pantries and shopping lists.

## 2. User Problem

Many individuals waste time and food because they are unsure what to cook with ingredients they already have or they want to make something with a product they have a craving for but don't have an idea what to cook. They spend excessive time searching for recipes that match their preferences and pantry contents. They need a solution that leverages existing ingredients and AI assistance to simplify meal planning and reduce waste.

## 3. Functional Requirements

1. Authentication and Profile Management
   - Users can register with email and password.
   - Users can log in and log out securely.
   - Users can change password.

2. Pantry Management
   - Users can manually add pantry items by name.
   - Users can add items to pantry from shopping list (one by one or in bulk)
   - Users can remove pantry items manually.
   - Users can remove pantry items from recipe

3. Recipe Management
   - Users can create, view, edit, and delete recipes manually.
   - Each recipe includes title, ingredient list, instructions (Markdown), optionally prep time and cook time.
   - Recipes display a badge indicating type: manual, AI-original, or AI-edited.

4. AI-Powered Recipe Generation
   - Users can enter free-text hints to generate recipes based on current pantry items or a product they have a craving for.
   - Generated recipes adhere to the same schema as manual recipes.
   - Users can edit AI-generated recipes.

5. Recipe Search and Filtering
   - Users can search recipes by recipe name or ingredient name.
   - Users can filter recipes by meal type (e.g., breakfast, lunch, dinner).

6. Shopping List Management
   - Users can generate a shopping list from selected recipes or add list manually.
   - Users can mark items as purchased and transfer them to the pantry.
   - Users can remove items from the shopping list.

7. Collaboration
   - Users can invite collaborators via email to shared pantries and shopping lists.
   - Invited collaborators receive an email with a signup link.
   - (Optional in MVP) Shared pantries and lists synchronize in real time for all collaborators.

8. Data Deletion
   - Users receive a confirmation prompt before deleting recipes or pantry items.
   - Deletions are permanent; no recovery or versioning is provided.

## 4. Product Boundaries

In scope for MVP:

- Email/password authentication only.
- Manual pantry entry by name.
- Markdown-only recipe editor without WYSIWYG features.
- Basic search and meal-type filtering.
- Real-time collaboration for pantries and shopping lists.
- Hard deletes with confirmation prompts.

Out of scope for MVP:

- Public recipe database or recipe sharing between users.
- Advanced nutritional analysis or calorie tracking.
- Integration with grocery delivery services.
- Barcode scanning for ingredient input.
- Recipe photo uploads or media management.
- Mobile applications; web-only.
- Advanced meal scheduling or portion calculations.
- Recipe scaling or serving size adjustments.
- Integration with smart kitchen appliances.
- Drag-and-drop calendar for meal planning.
- Recipe rating system or personal note-taking.
- Analytics dashboard or performance SLAs.
- Versioning, recovery workflows, or audit logs.
- Third-party prototypes or external service integrations.

## 5. User Stories

- US-001
  - Title: User registration
  - Description: As a new user, I want to register with my email and password so that I can create an account.
  - Acceptance criteria:
    - Given the registration form, when I enter a valid email and password meeting complexity rules and submit, then my account is created.
    - After successful registration, I see a confirmation message and am redirected to the dashboard.

- US-002
  - Title: User login
  - Description: As a registered user, I want to log in with my email and password so that I can access my account.
  - Acceptance criteria:
    - Given valid credentials, when I submit the login form, then I am authenticated and taken to the dashboard.
    - Given invalid credentials, when I submit the form, then I see an error message explaining the failure.

- US-003
  - Title: Change password
  - Description: As a user, I want to change my account password so that I can maintain security.
  - Acceptance criteria:
    - Given the change password form, when I enter my current password and a new valid password and submit, then my password is updated.
    - After successful change, I receive a confirmation message and must use the new password to log in.

- US-004
  - Title: Add pantry item
  - Description: As a user, I want to add an item to my pantry inventory by entering its name.
  - Acceptance criteria:
    - Given the pantry view, when I input a new item name and confirm, then the item appears in my pantry list.
    - If the item already exists, the system warns me and prevents duplicate entry.

- US-005
  - Title: Remove pantry item
  - Description: As a user, I want to remove an item from my pantry.
  - Acceptance criteria:
    - Given the pantry list, when I select an item to delete and confirm, then the item is removed permanently.
    - A confirmation prompt appears before deletion.

- US-006
  - Title: Create manual recipe
  - Description: As a user, I want to create a recipe manually by entering its details and instructions in Markdown.
  - Acceptance criteria:
    - I can fill out title, ingredients, and instructions in a Markdown editor, and optionally prep time and cook time.
    - Upon saving, the recipe appears in my collection with a manual badge.

- US-007
  - Title: Edit manual recipe
  - Description: As a user, I want to modify an existing manual recipe.
  - Acceptance criteria:
    - I can open a recipe, make changes in the Markdown editor, and save the updates.
    - Updated content is persisted and visible.

- US-008
  - Title: Delete manual recipe
  - Description: As a user, I want to delete a manual recipe.
  - Acceptance criteria:
    - I receive a confirmation prompt before deletion.
    - Upon confirmation, the recipe is removed permanently from my collection.

- US-009
  - Title: Generate AI-powered recipe
  - Description: As a user, I want to input free-text hints based on my pantry contents or a craving to generate a recipe.
  - Acceptance criteria:
    - Given pantry items or a craving hint, when I submit a generation request, then an AI-original recipe is returned.
    - The generated recipe includes title, ingredients, and instructions; prep and cook times are optional.

- US-010
  - Title: Save AI-generated recipe
  - Description: As a user, I want to save an AI-generated recipe to my collection.
  - Acceptance criteria:
    - After generation, I can save the recipe which appears in my collection with an AI-original badge.

- US-011
  - Title: Edit AI-generated recipe
  - Description: As a user, I want to edit an AI-generated recipe in Markdown.
  - Acceptance criteria:
    - I can open the AI-generated recipe, make edits in the Markdown editor, and save the result.
    - The recipe badge updates to AI-edited after saving.

- US-012
  - Title: Search recipes
  - Description: As a user, I want to search my recipes by name or ingredient.
  - Acceptance criteria:
    - Given recipe collection, when I search by a recipe name or ingredient, then matching recipes are listed.

- US-013
  - Title: Filter recipes by meal type
  - Description: As a user, I want to filter recipes by predefined meal types (breakfast, lunch, dinner).
  - Acceptance criteria:
    - I can select a meal type filter and see only recipes tagged with that type.

- US-014
  - Title: Generate shopping list
  - Description: As a user, I want to generate a shopping list based on selected recipes or create one manually.
  - Acceptance criteria:
    - I can select one or more recipes and click "Generate shopping list" to see aggregated ingredients.
    - I can manually add items to the shopping list and see them appear.

- US-015
  - Title: Mark purchased items
  - Description: As a user, I want to mark shopping list items as purchased and transfer them to my pantry.
  - Acceptance criteria:
    - When I mark an item as purchased, it is removed from the list and added to the pantry.

- US-016
  - Title: Invite collaborator
  - Description: As a user, I want to invite another person via email to collaborate on my pantry and shopping list.
  - Acceptance criteria:
    - I can enter an email address and send an invitation link.
    - The invitee receives an email and, upon signup, sees shared pantries and lists.

- US-017
  - Title: Real-time collaboration
  - Description: As a collaborator, I want to see updates to shared pantries and shopping lists in real time when real-time sync is enabled (optional in MVP).

- US-018
  - Title: View recipe type badge
  - Description: As a user, I want to see whether a recipe is manual, AI-original, or AI-edited.
  - Acceptance criteria:
    - Each recipe displays a badge indicating its origin type.

- US-019
  - Title: Handle empty pantry for AI generation
  - Description: As a user, I want to receive feedback when I attempt AI generation with no pantry items.
  - Acceptance criteria:
    - If pantry is empty, there is a warning but AI generation is still possible.

- US-020
  - Title: AI generation error handling
  - Description: As a user, I want to see an error message if AI recipe generation fails.
  - Acceptance criteria:
    - If the AI service returns an error, a user-friendly message appears explaining the issue.

- US-021
  - Title: Prevent duplicate pantry entries
  - Description: As a user, I want to be warned when adding a pantry item that already exists.
  - Acceptance criteria:
    - On attempting to add a duplicate item, the system shows a warning and does not create a second entry.

- US-022
  - Title: Confirm deletion actions
  - Description: As a user, I want confirmation prompts for deleting recipes and pantry items.
  - Acceptance criteria:
    - Before any delete action, a modal asks for confirmation. No deletion occurs if I cancel.

- US-023
  - Title: Add pantry items from shopping list
  - Description: As a user, I want to add items from my shopping list to my pantry in bulk or individually.
  - Acceptance criteria:
    - I can select one or more items and click "Add to pantry" to move them.
    - Selected items appear in my pantry and are removed from the shopping list if marked purchased.

- US-024
  - Title: Remove pantry items via recipe
  - Description: As a user, I want to remove pantry items directly from a recipe's ingredient list to update my pantry stock.
  - Acceptance criteria:
    - From a recipe view, I can select ingredients and click "Remove from pantry" to delete them.
    - Removed items no longer appear in my pantry.

## 6. Success Metrics

- 60% of meal planning sessions result in AI-powered recipe generation.
- 70% of AI-generated recipes are saved to users personal collections.
- Users plan an average of at least 5 meals per week using the application.
- Average user session includes both recipe discovery and shopping list generation.

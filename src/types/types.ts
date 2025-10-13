// Data Transfer Objects (DTOs) and Command Models for Pantry Pilot API
// Derived from database entities in database.types.ts

import { Tables, TablesInsert, TablesUpdate, Database } from '@/db/database.types'

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

/** User DTO for authentication responses */
export type UserDto = {
  id: string
  email: string
  created_at: string
}

/** Auth response containing user and token */
export type AuthResponse = {
  user: UserDto
  token: string
}

/** Register command */
export type RegisterCommand = {
  email: string
  password: string
}

/** Login command */
export type LoginCommand = {
  email: string
  password: string
}

/** Change password command */
export type ChangePasswordCommand = {
  currentPassword: string
  newPassword: string
}

// ============================================================================
// HOUSEHOLD TYPES
// ============================================================================

/** Household DTO */
export type HouseholdDto = Pick<
  Tables<'households'>,
  'id' | 'name' | 'owner_id' | 'created_at' | 'updated_at'
>

/** Create household command */
export type CreateHouseholdCommand = Pick<TablesInsert<'households'>, 'name'>

/** Invite to household command */
export type InviteToHouseholdCommand = {
  invitedEmail: string
}

// ============================================================================
// MEMBERSHIP TYPES
// ============================================================================

/** User membership DTO for household members list */
export type HouseholdMemberDto = {
  user_id: string
  household_id: string
  created_at: string
  email?: string // From auth.users, not in user_households table
}

// ============================================================================
// INVITATION TYPES
// ============================================================================

/** Invitation DTO */
export type InvitationDto = Tables<'household_invitations'>

/** Create invitation command */
export type CreateInvitationCommand = {
  invitedEmail: string
}

/** Accept invitation command */
export type AcceptInvitationCommand = {
  token: string
}

// ============================================================================
// PANTRY TYPES
// ============================================================================

/** Pantry DTO */
export type PantryDto = Tables<'pantries'>

/** Pantry item DTO */
export type PantryItemDto = Tables<'pantry_items'>

/** Add pantry item command */
export type AddPantryItemCommand = Pick<TablesInsert<'pantry_items'>, 'name' | 'quantity' | 'unit'>

/** Update pantry item command */
export type UpdatePantryItemCommand = Pick<TablesUpdate<'pantry_items'>, 'quantity' | 'unit'>

// ============================================================================
// RECIPE TYPES
// ============================================================================

/** Recipe creation method enum from database */
export type RecipeCreationMethod = Database['public']['Enums']['recipe_creation_method']

/** Recipe content structure stored as JSON in database */
export type RecipeContent = {
  title: string
  ingredients: string[]
  instructions: string
  prepTime?: number
  cookTime?: number
  mealType?: 'breakfast' | 'lunch' | 'dinner'
}

/** Recipe DTO with parsed content */
export type RecipeDto = Omit<Tables<'recipes'>, 'content'> & {
  content: RecipeContent
}

/** Create recipe command */
export type CreateRecipeCommand = {
  title: string
  ingredients: string[]
  instructions: string
  prepTime?: number
  cookTime?: number
  mealType?: 'breakfast' | 'lunch' | 'dinner'
}

/** Update recipe command (same structure as create) */
export type UpdateRecipeCommand = CreateRecipeCommand

/** Generate recipe command */
export type GenerateRecipeCommand = {
  hint?: string
  usePantryItems: boolean
}

/** Recipe generation response */
export type GenerateRecipeResponse = {
  recipe: RecipeDto
  warnings?: string[]
}

// ============================================================================
// SHOPPING LIST TYPES
// ============================================================================

/** Shopping list DTO */
export type ShoppingListDto = Tables<'shopping_lists'>

/** Shopping list item DTO */
export type ShoppingListItemDto = Tables<'shopping_list_items'>

/** Generate shopping list command */
export type GenerateShoppingListCommand = {
  recipeIds: string[]
}

/** Add shopping list item command */
export type AddShoppingListItemCommand = Pick<
  TablesInsert<'shopping_list_items'>,
  'name' | 'quantity' | 'unit'
>

/** Mark item purchased command */
export type MarkItemPurchasedCommand = {
  isPurchased: true
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/** Paginated response wrapper */
export type PaginatedResponse<T> = {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

/** Recipe list query parameters */
export type RecipeListQuery = {
  search?: string
  mealType?: 'breakfast' | 'lunch' | 'dinner'
  creationMethod?: RecipeCreationMethod
  page?: number
  pageSize?: number
  sort?: string
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/** API error response */
export type ApiError = {
  error: string
  message?: string
  statusCode: number
}

/** Validation error details */
export type ValidationError = {
  field: string
  message: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Generic success response with message */
export type SuccessResponse = {
  message: string
}

/** Generic ID parameter type */
export type IdParam = {
  id: string
}

/** Household ID parameter type */
export type HouseholdIdParam = {
  householdId: string
}

/** Pantry ID parameter type */
export type PantryIdParam = {
  pantryId: string
}

/** Shopping list ID parameter type */
export type ShoppingListIdParam = {
  listId: string
}

/** Token parameter type for invitations */
export type TokenParam = {
  token: string
}

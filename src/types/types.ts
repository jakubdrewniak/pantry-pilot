import type { Enums } from '@/db/database.types'

// ============================================================================
// BASE TYPES AND ENUMS
// ============================================================================

export type RecipeCreationMethod = Enums<'recipe_creation_method'>

// User type (from Supabase Auth)
export interface User {
  id: string
  email: string
  createdAt?: string
}

// Common types
export interface Ingredient {
  name: string
  quantity: number
  unit?: string
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
}

// ============================================================================
// DTO TYPES (Data Transfer Objects)
// ============================================================================

// Household DTOs
export interface Household {
  id: string
  name: string
  createdAt: string
  memberCount?: number
  ownerId?: string
}

export type HouseholdWithMembers = Household & {
  members: User[]
  ownerId: string
}

// Membership DTOs
export interface Membership {
  householdId: string
  userId: string
  createdAt: string
  role: 'owner' | 'member'
  joinedAt: string
}

// Invitation DTOs
export interface Invitation {
  id: string
  householdId: string
  invitedEmail: string
  token: string
  expiresAt: string
  createdAt: string
}

// Invitation with household context (for current user invitations)
export interface InvitationWithHousehold extends Invitation {
  householdName: string
  ownerEmail: string
}

// Pantry DTOs
export interface Pantry {
  id: string
  householdId: string
  createdAt: string
}

export type PantryWithItems = Pantry & {
  items: PantryItem[]
}

export interface PantryItem {
  id: string
  name: string
  pantryId: string
  quantity: number
  unit: string | null
}

// Recipe DTOs
// Note: Recipes store content as Json in DB, but we transform it to structured data for API
export interface Recipe {
  id: string
  title: string
  ingredients: Ingredient[]
  instructions: string
  mealType?: string
  creationMethod: RecipeCreationMethod
  prepTime?: number
  cookTime?: number
  createdAt: string
  updatedAt?: string
  householdId: string
}

// Shopping List DTOs
export interface ShoppingList {
  id: string
  householdId: string
  createdAt: string
}

export type ShoppingListWithItems = ShoppingList & {
  items: ShoppingListItem[]
}

export interface ShoppingListItem {
  id: string
  name: string
  quantity: number
  shoppingListId: string
  unit: string | null
  isPurchased: boolean
}

// ============================================================================
// COMMAND MODELS (Request DTOs)
// ============================================================================

// Authentication Commands
export interface RegisterRequest {
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// Household Commands
export interface CreateHouseholdRequest {
  name: string
}

export interface InviteMemberRequest {
  invitedEmail: string
}

// Invitation Commands
export interface CreateInvitationRequest {
  invitedEmail: string
}

export interface AcceptInvitationRequest {
  token: string
}

// Pantry Commands
export interface AddPantryItemsRequest {
  items: Array<{
    name: string
    quantity?: number
    unit?: string | null
  }>
}

export interface UpdatePantryItemRequest {
  quantity?: number
  unit?: string | null
}

// Recipe Commands
export interface CreateRecipeRequest {
  title: string
  ingredients: Ingredient[]
  instructions: string
  prepTime?: number
  cookTime?: number
  mealType?: string
  creationMethod?: 'manual' | 'ai_generated' | 'ai_generated_modified'
}

export type UpdateRecipeRequest = CreateRecipeRequest

export interface GenerateRecipeRequest {
  hint?: string
  usePantryItems: boolean
}

// Shopping List Commands
export interface GenerateShoppingListRequest {
  recipeIds: string[]
}

export interface AddShoppingListItemsRequest {
  items: Array<{
    name: string
    quantity?: number
    unit?: string | null
    isPurchased?: boolean
  }>
}

export interface MarkPurchasedRequest {
  isPurchased: boolean
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

// Authentication Responses
export interface RegisterResponse {
  user: User
  token: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface ChangePasswordResponse {
  message: string
}

// Household Responses
export interface HouseholdsListResponse {
  data: Household[]
}

export type CreateHouseholdResponse = Household

export type GetHouseholdResponse = HouseholdWithMembers

export interface MembersListResponse {
  data: User[]
}

export interface InviteMemberResponse {
  invitation: Invitation
}

// Invitation Responses
export interface InvitationsListResponse {
  data: Invitation[]
}

export interface CreateInvitationResponse {
  invitation: Invitation
}

export interface AcceptInvitationResponse {
  membership: Membership
}

export interface CurrentUserInvitationsResponse {
  data: InvitationWithHousehold[]
}

// Pantry Responses
export type GetPantryResponse = PantryWithItems

export interface AddPantryItemsResponse {
  items: PantryItem[]
}

export interface ListPantryItemsResponse {
  data: PantryItem[]
}

export type UpdatePantryItemResponse = PantryItem

// Recipe Responses
export interface RecipesListResponse {
  data: Recipe[]
  pagination: Pagination
}

export type CreateRecipeResponse = Recipe

export type GetRecipeResponse = Recipe

export type UpdateRecipeResponse = Recipe

export interface GenerateRecipeResponse {
  recipe: Recipe
  warnings?: string[]
}

// Bulk Delete Response
export interface BulkDeleteRecipesResponse {
  deleted: string[]
  failed: Array<{
    id: string
    reason: string
  }>
  summary: {
    total: number
    successful: number
    failed: number
  }
}

// Shopping List Responses
export type GetShoppingListResponse = ShoppingListWithItems

export interface GenerateShoppingListResponse {
  items: ShoppingListItem[]
}

export interface ListShoppingListItemsResponse {
  data: ShoppingListItem[]
}

export interface AddShoppingListItemsResponse {
  items: ShoppingListItem[]
}

export interface MarkPurchasedResponse {
  item: ShoppingListItem
  pantryItem: PantryItem
}

// ============================================================================
// HOUSEHOLD DASHBOARD TYPES (View Models)
// ============================================================================

// User's role in the household
export type HouseholdRole = 'owner' | 'member'

// Dashboard page view model
export interface HouseholdDashboardViewModel {
  household: HouseholdWithMembers | null
  userRole: HouseholdRole | null
  isLoading: boolean
  error: string | null
}

// Member with role information (extends User with role details)
export interface MemberWithRole extends User {
  role: HouseholdRole
  joinedAt: string
  isCurrentUser: boolean
}

// Edit household name form state
export interface EditHouseholdNameFormData {
  name: string
  isSubmitting: boolean
  error: string | null
}

// Create household form state
export interface CreateHouseholdFormData {
  name: string
  isSubmitting: boolean
  error: string | null
}

// API errors mapped to user-friendly messages
export interface HouseholdError {
  code: 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'VALIDATION' | 'NETWORK' | 'UNKNOWN'
  message: string
  details?: unknown
}

// ============================================================================
// INVITATION VIEW MODELS
// ============================================================================

/**
 * View model for invitation notification badge
 * Used in: InvitationNotificationBadge
 */
export interface InvitationNotificationViewModel {
  count: number // number of pending invitations
  isLoading: boolean
}

/**
 * View model for create invitation form
 * Used in: CreateInvitationForm
 */
export interface CreateInvitationFormData {
  invitedEmail: string // email address of the person being invited
  isSubmitting: boolean // whether the form is being submitted
  error: string | null // validation or API error
}

/**
 * View model for sent invitations list
 * Used in: SentInvitationsList
 */
export interface SentInvitationsViewModel {
  invitations: Invitation[] // list of sent invitations
  isLoading: boolean // whether data is being loaded
  error: string | null // error fetching data
}

/**
 * View model for received invitations list
 * Used in: ReceivedInvitationsList
 */
export interface ReceivedInvitationsViewModel {
  invitations: InvitationWithHousehold[] // list of received invitations with context
  isLoading: boolean // whether data is being loaded
  error: string | null // error fetching data
}

// ============================================================================
// RECIPE EDITOR TYPES (View Models)
// ============================================================================

// Recipe editor mode
export type RecipeEditorMode = 'create' | 'edit' | 'save-generated'

// Form data for recipe editor (view model with temporary IDs for ingredients)
export interface RecipeFormData {
  title: string
  ingredients: IngredientFormData[]
  instructions: string
  prepTime?: number
  cookTime?: number
  mealType?: 'breakfast' | 'lunch' | 'dinner'
}

// Ingredient form data with temporary ID for React keys
export interface IngredientFormData {
  id: string // temporary ID for React keys (crypto.randomUUID())
  name: string
  quantity: number
  unit?: string
}

// Recipe form validation errors
export interface RecipeFormErrors {
  title?: string
  ingredients?: string // error for entire ingredients section
  ingredientItems?: Record<
    string,
    {
      name?: string
      quantity?: string
    }
  > // errors for individual ingredients, key = ingredient.id
  instructions?: string
  prepTime?: string
  cookTime?: string
  general?: string // general form error or API error
}

// Return type for useRecipeEditor hook
export interface UseRecipeEditorReturn {
  formData: RecipeFormData
  errors: RecipeFormErrors
  isSubmitting: boolean
  isDirty: boolean
  handleFieldChange: (field: string, value: any) => void
  handleIngredientsChange: (ingredients: IngredientFormData[]) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  validateField: (field: string) => void
  resetForm: () => void
}

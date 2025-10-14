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
}

export type HouseholdWithMembers = Household & {
  members: User[]
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

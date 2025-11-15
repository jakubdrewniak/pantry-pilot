'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/db/supabase.server'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/lib/validation/auth'

/**
 * Server Action: User Login
 *
 * Authenticates a user with email and password.
 * On success, sets HTTP-only session cookies and redirects to home.
 *
 * @param formData - Form data containing email and password
 * @returns Error message if validation/auth fails, otherwise redirects
 */
export async function login(
  prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  // 1. Extract and validate input
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const validationResult = loginSchema.safeParse(rawData)

  if (!validationResult.success) {
    return { error: validationResult.error.errors[0].message }
  }

  const { email, password } = validationResult.data

  // 2. Authenticate with Supabase
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // 3. Handle authentication errors
  if (error) {
    console.error('Login error:', error)
    return { error: 'Invalid email or password.' }
  }

  // 4. Success: revalidate and redirect
  // TODO: Redirect to /pantry when pantry page is implemented
  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Server Action: User Registration
 *
 * Creates a new user account with email and password.
 * Note: Email verification is DISABLED for MVP.
 *
 * @param formData - Form data containing email, password, and confirmPassword
 * @returns Error or success message
 */
export async function signup(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  // 1. Extract and validate input
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const validationResult = registerSchema.safeParse(rawData)

  if (!validationResult.success) {
    return { error: validationResult.error.errors[0].message }
  }

  const { email, password } = validationResult.data

  // 2. Create user in Supabase
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // TODO: Enable email verification for production
      // emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      emailRedirectTo: undefined, // Disable email verification for MVP
    },
  })

  // 3. Handle registration errors
  if (error) {
    console.error('Signup error:', error)

    // User-friendly error messages
    if (error.message.includes('already registered')) {
      return { error: 'An account with this email already exists.' }
    }

    return { error: 'Registration failed. Please try again.' }
  }

  // 4. Success: return success state (form will show success message)
  // Note: Auto-login happens via Supabase (session created automatically)
  return { success: true }
}

/**
 * Server Action: User Logout
 *
 * Signs out the current user and clears session cookies.
 * Redirects to login page.
 */
export async function logout(): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error)
    // Continue with redirect even if logout fails
  }

  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

/**
 * Server Action: Forgot Password
 *
 * Sends a password reset email to the user.
 * Always returns success to prevent user enumeration.
 *
 * @param formData - Form data containing email
 * @returns Success message (always, even if email doesn't exist)
 */
export async function forgotPassword(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  // 1. Extract and validate input
  const rawData = {
    email: formData.get('email'),
  }

  const validationResult = forgotPasswordSchema.safeParse(rawData)

  if (!validationResult.success) {
    return { error: validationResult.error.errors[0].message }
  }

  const { email } = validationResult.data

  // 2. Send reset email via Supabase
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
  })

  // 3. Log error but don't expose to user (prevent enumeration)
  if (error) {
    console.error('Forgot password error:', error)
  }

  // 4. Always return success (security best practice)
  return { success: true }
}

/**
 * Server Action: Reset Password
 *
 * Updates user password using a valid reset token.
 * Token is set in session via hash fragment on reset-password page.
 *
 * @param formData - Form data containing new password and confirmPassword
 * @returns Error or success message
 */
export async function resetPassword(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  // 1. Extract and validate input (token should be set in session by reset-password page)
  const rawData = {
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    token: 'placeholder', // Token is verified via session, not form data
  }

  const validationResult = resetPasswordSchema.safeParse(rawData)

  if (!validationResult.success) {
    return { error: validationResult.error.errors[0].message }
  }

  const { password } = validationResult.data

  // 2. Update password (Supabase verifies token automatically from session)
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  // 3. Handle errors
  if (error) {
    console.error('Reset password error:', error)

    if (error.message.includes('session')) {
      return { error: 'Invalid or expired reset link. Please request a new one.' }
    }

    return { error: 'Password reset failed. Please try again.' }
  }

  // 4. Success - Sign out user so they can login with new password
  // Note: User currently has a recovery session, we want them to login normally
  await supabase.auth.signOut()

  return { success: true }
}

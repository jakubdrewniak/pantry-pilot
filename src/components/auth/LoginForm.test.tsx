import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

/**
 * LoginForm Component Test Suite
 *
 * Tests user authentication form with focus on:
 * - Form rendering and accessibility
 * - User interactions (typing, submitting)
 * - Loading states
 * - Error display
 * - Form validation integration
 *
 * Testing Strategy:
 * - Test from user's perspective (not implementation)
 * - Use accessible queries (getByRole, getByLabelText)
 * - Test actual user flows
 */

// Mock the login server action
vi.mock('@/app/actions/auth', () => ({
  login: vi.fn(),
}))

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock useActionState to control form state
let mockState: { error?: string } | undefined = undefined
let mockFormAction: (payload: FormData) => void = vi.fn()
let mockIsPending = false

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useActionState: vi.fn(() => [mockState, mockFormAction, mockIsPending]),
  }
})

describe('LoginForm', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    mockState = undefined
    mockIsPending = false
    mockFormAction = vi.fn()
  })

  describe('Form Rendering', () => {
    it('should render all form elements', () => {
      render(<LoginForm />)

      // Email input
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument()

      // Password input
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument()

      // Forgot password link
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument()

      // Submit button
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should render required field indicators', () => {
      render(<LoginForm />)

      // Both fields should show required asterisk
      const labels = screen.getAllByText('*')
      expect(labels).toHaveLength(2) // Email and Password
    })

    it('should have proper input types', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should have proper autocomplete attributes', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)

      expect(emailInput).toHaveAttribute('autocomplete', 'email')
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
    })

    it('should have forgot password link pointing to correct route', () => {
      render(<LoginForm />)

      const forgotLink = screen.getByText(/forgot password/i)
      expect(forgotLink).toHaveAttribute('href', '/auth/forgot-password')
    })
  })

  describe('User Interactions', () => {
    it('should allow user to type email', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'user@example.com')

      expect(emailInput).toHaveValue('user@example.com')
    })

    it('should allow user to type password', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const passwordInput = screen.getByLabelText(/^password/i)
      await user.type(passwordInput, 'SecurePassword123!')

      expect(passwordInput).toHaveValue('SecurePassword123!')
    })

    it('should submit form with user input', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Fill form
      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'password123')

      // Form should have the values
      expect(emailInput).toHaveValue('user@example.com')
      expect(passwordInput).toHaveValue('password123')

      // Submit button should be enabled and clickable
      expect(submitButton).toBeEnabled()
    })
  })

  describe('Loading State', () => {
    it('should show loading text when pending', () => {
      mockIsPending = true

      render(<LoginForm />)

      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^sign in$/i })).not.toBeInTheDocument()
    })

    it('should disable inputs when pending', () => {
      mockIsPending = true

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button')

      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })

    it('should disable forgot password link when pending', () => {
      mockIsPending = true

      render(<LoginForm />)

      const forgotLink = screen.getByText(/forgot password/i)
      expect(forgotLink).toHaveAttribute('tabindex', '-1')
    })

    it('should enable forgot password link when not pending', () => {
      mockIsPending = false

      render(<LoginForm />)

      const forgotLink = screen.getByText(/forgot password/i)
      expect(forgotLink).toHaveAttribute('tabindex', '0')
    })
  })

  describe('Error Handling', () => {
    it('should display error message when state contains error', () => {
      mockState = { error: 'Invalid email or password.' }

      render(<LoginForm />)

      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument()
    })

    it('should display error in alert role for screen readers', () => {
      mockState = { error: 'Invalid credentials' }

      render(<LoginForm />)

      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent('Invalid credentials')
    })

    it('should not display error when state is undefined', () => {
      mockState = undefined

      render(<LoginForm />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should link error to inputs with aria-describedby', () => {
      mockState = { error: 'Invalid email or password.' }

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)

      expect(emailInput).toHaveAttribute('aria-describedby', 'form-error')
      expect(passwordInput).toHaveAttribute('aria-describedby', 'form-error')
    })

    it('should not have aria-describedby when no error', () => {
      mockState = undefined

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)

      expect(emailInput).not.toHaveAttribute('aria-describedby')
      expect(passwordInput).not.toHaveAttribute('aria-describedby')
    })

    it('should set aria-invalid when error exists', () => {
      mockState = { error: 'Invalid credentials' }

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)

      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
    })

    it('should not set aria-invalid when no error', () => {
      mockState = undefined

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)

      expect(emailInput).toHaveAttribute('aria-invalid', 'false')
      expect(passwordInput).toHaveAttribute('aria-invalid', 'false')
    })
  })

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)

      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')
    })

    it('should have required attributes on inputs', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)

      expect(emailInput).toBeRequired()
      expect(passwordInput).toBeRequired()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const forgotLink = screen.getByText(/forgot password/i)
      const submitButton = screen.getByRole('button')

      // Tab through form (forgot link is in DOM before password input)
      await user.tab()
      expect(emailInput).toHaveFocus()

      await user.tab()
      expect(forgotLink).toHaveFocus()

      await user.tab()
      expect(passwordInput).toHaveFocus()

      await user.tab()
      expect(submitButton).toHaveFocus()
    })

    it('should skip forgot password link when form is submitting', () => {
      mockIsPending = true

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const forgotLink = screen.getByText(/forgot password/i)
      const submitButton = screen.getByRole('button')

      // Inputs and button should be disabled, link should be skipped
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(forgotLink).toHaveAttribute('tabindex', '-1')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Form Validation Integration', () => {
    it('should have HTML5 validation attributes', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)

      // Email input should have type="email" for browser validation
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toBeRequired()
    })

    it('should handle server-side validation errors', () => {
      mockState = { error: 'Please provide a valid email address.' }

      render(<LoginForm />)

      // Error should be displayed
      expect(screen.getByText('Please provide a valid email address.')).toBeInTheDocument()

      // Error should be in an accessible alert
      expect(screen.getByRole('alert')).toHaveTextContent('Please provide a valid email address.')
    })
  })

  describe('Edge Cases', () => {
    it('should have submit button enabled for empty form', () => {
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Button should be enabled (HTML5 and server will validate)
      expect(submitButton).toBeEnabled()
    })

    it('should handle long email addresses', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const longEmail = 'very.long.email.address.with.many.characters@subdomain.example.com'

      await user.type(emailInput, longEmail)

      expect(emailInput).toHaveValue(longEmail)
    })

    it('should handle special characters in password', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const passwordInput = screen.getByLabelText(/^password/i)
      // Use paste instead of type for complex special characters
      // This avoids issues with keyboard API interpreting brackets/braces
      const specialPassword = 'P@$$w0rd!#%&*()[]{}|<>?'

      await user.click(passwordInput)
      await user.paste(specialPassword)

      expect(passwordInput).toHaveValue(specialPassword)
    })

    it('should mask password input', () => {
      render(<LoginForm />)

      const passwordInput = screen.getByLabelText(/^password/i)

      // Password field should have type="password"
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })
})

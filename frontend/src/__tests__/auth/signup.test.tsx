import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import SignUpPage from '@/app/auth/signup/page'
import toast from 'react-hot-toast'

// Mock dependencies
jest.mock('next/navigation')
jest.mock('next-auth/react')
jest.mock('react-hot-toast')

// Mock fetch
global.fetch = jest.fn()

const mockRouter = {
  push: jest.fn(),
}

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
}

describe('SignUpPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(toast as any).success = mockToast.success
    ;(toast as any).error = mockToast.error
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    })
  })

  it('renders signup form with all required fields', () => {
    render(<SignUpPage />)
    
    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone (Optional)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
  })

  it('renders OAuth providers', () => {
    render(<SignUpPage />)
    
    expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /GitHub/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty required fields', async () => {
    render(<SignUpPage />)
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument()
      expect(screen.getByText('Last name is required')).toBeInTheDocument()
      expect(screen.getByText('Invalid email format')).toBeInTheDocument()
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    render(<SignUpPage />)
    
    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument()
    })
  })

  it('shows validation error for short password', async () => {
    render(<SignUpPage />)
    
    const passwordInput = screen.getByLabelText('Password')
    fireEvent.change(passwordInput, { target: { value: '123' } })
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
  })

  it('submits form successfully with valid data', async () => {
    const mockResponse = {
      success: true,
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe'
        },
        token: 'mock-jwt-token'
      }
    }
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue(mockResponse),
    })
    
    render(<SignUpPage />)
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Phone (Optional)'), { target: { value: '+1234567890' } })
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'password123',
          phone: '+1234567890'
        }),
      })
    })
    
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Account created successfully!')
      expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', 'mock-jwt-token')
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles signup failure', async () => {
    const mockResponse = {
      success: false,
      error: {
        message: 'User already exists with this email'
      }
    }
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue(mockResponse),
    })
    
    render(<SignUpPage />)
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'existing@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('User already exists with this email')
    })
  })

  it('handles network error during signup', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    
    render(<SignUpPage />)
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('An error occurred during signup')
    })
  })

  it('handles Google OAuth signup', async () => {
    mockSignIn.mockResolvedValueOnce({
      error: null,
      url: '/dashboard',
      ok: true,
      status: 200
    })
    
    mockGetSession.mockResolvedValueOnce({
      backendToken: 'oauth-token',
      user: { email: 'test@example.com' }
    } as any)
    
    render(<SignUpPage />)
    
    const googleButton = screen.getByRole('button', { name: /Google/i })
    fireEvent.click(googleButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/dashboard',
        redirect: false,
      })
    })
    
    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', 'oauth-token')
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles GitHub OAuth signup', async () => {
    mockSignIn.mockResolvedValueOnce({
      error: null,
      url: '/dashboard',
      ok: true,
      status: 200
    })
    
    mockGetSession.mockResolvedValueOnce({
      backendToken: 'oauth-token',
      user: { email: 'test@example.com' }
    } as any)
    
    render(<SignUpPage />)
    
    const githubButton = screen.getByRole('button', { name: /GitHub/i })
    fireEvent.click(githubButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('github', {
        callbackUrl: '/dashboard',
        redirect: false,
      })
    })
    
    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', 'oauth-token')
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles OAuth signup failure', async () => {
    mockSignIn.mockResolvedValueOnce({
      error: 'OAuthAccountNotLinked',
      url: null,
      ok: false,
      status: 400
    })
    
    render(<SignUpPage />)
    
    const googleButton = screen.getByRole('button', { name: /Google/i })
    fireEvent.click(googleButton)
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('OAuth sign-up failed')
    })
  })

  it('shows loading state during form submission', async () => {
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
    
    render(<SignUpPage />)
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    fireEvent.click(submitButton)
    
    // Should show loading spinner
    expect(submitButton).toBeDisabled()
    expect(screen.getByTestId('loading-spinner') || submitButton.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('contains link to signin page', () => {
    render(<SignUpPage />)
    
    const signinLink = screen.getByRole('link', { name: 'Sign in' })
    expect(signinLink).toBeInTheDocument()
    expect(signinLink).toHaveAttribute('href', '/auth/signin')
  })

  it('validates password confirmation', async () => {
    render(<SignUpPage />)
    
    // Fill form with mismatched passwords
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'different123' } })
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    })
    
    expect(fetch).not.toHaveBeenCalled()
  })

  it('toggles password visibility', () => {
    render(<SignUpPage />)

    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    
    // Get toggle buttons (there should be 2)
    const toggleButtons = screen.getAllByRole('button', { name: '' })
    const passwordToggle = toggleButtons[0]
    const confirmPasswordToggle = toggleButtons[1]

    // Initially passwords should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')

    // Click to show password
    fireEvent.click(passwordToggle)
    expect(passwordInput).toHaveAttribute('type', 'text')

    // Click to show confirm password
    fireEvent.click(confirmPasswordToggle)
    expect(confirmPasswordInput).toHaveAttribute('type', 'text')

    // Click to hide passwords again
    fireEvent.click(passwordToggle)
    fireEvent.click(confirmPasswordToggle)
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')
  })

  it('submits form with matching passwords', async () => {
    const mockResponse = {
      success: true,
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe'
        },
        token: 'mock-jwt-token'
      }
    }
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue(mockResponse),
    })
    
    render(<SignUpPage />)
    
    // Fill form with matching passwords
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } })
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'password123',
          // Note: confirmPassword should not be in the request
        }),
      })
    })
  })
}) 
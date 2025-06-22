import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import SignInPage from '@/app/auth/signin/page'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  getSession: jest.fn(),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('SignInPage', () => {
  const mockPush = jest.fn()
  const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders sign-in form with OAuth options', () => {
    render(<SignInPage />)

    expect(screen.getByText('Sign in to Job Tracker')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /GitHub/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('handles traditional email/password login successfully', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: { id: '1', email: 'test@example.com' }
        }
      })
    }
    ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

    // Mock localStorage
    const mockSetItem = jest.fn()
    Object.defineProperty(window, 'localStorage', {
      value: { setItem: mockSetItem },
      writable: true,
    })

    render(<SignInPage />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    })

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      )
    })

    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith('authToken', 'mock-jwt-token')
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles login failure', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: false,
        message: 'Invalid credentials'
      })
    }
    ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

    render(<SignInPage />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' }
    })

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })

    // Should not redirect on failure
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('validates email format', async () => {
    render(<SignInPage />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' }
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    })

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument()
    })

    expect(fetch).not.toHaveBeenCalled()
  })

  it('validates required password', async () => {
    render(<SignInPage />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    })
    // Leave password empty

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })

    expect(fetch).not.toHaveBeenCalled()
  })

  it('handles Google OAuth sign-in', async () => {
    mockSignIn.mockResolvedValueOnce({
      error: null,
      url: '/dashboard',
      ok: true,
      status: 200
    })

    render(<SignInPage />)

    fireEvent.click(screen.getByRole('button', { name: /Google/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/dashboard',
        redirect: false,
      })
    })
  })

  it('handles GitHub OAuth sign-in', async () => {
    mockSignIn.mockResolvedValueOnce({
      error: null,
      url: '/dashboard',
      ok: true,
      status: 200
    })

    render(<SignInPage />)

    fireEvent.click(screen.getByRole('button', { name: /GitHub/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('github', {
        callbackUrl: '/dashboard',
        redirect: false,
      })
    })
  })

  it('toggles password visibility', () => {
    render(<SignInPage />)

    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByRole('button', { name: '' }) // Eye/EyeOff button

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Click to show password
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    // Click to hide password again
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('handles OAuth sign-in error', async () => {
    mockSignIn.mockResolvedValueOnce({
      error: 'OAuth error',
      url: null,
      ok: false,
      status: 401
    })

    render(<SignInPage />)

    fireEvent.click(screen.getByRole('button', { name: /Google/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled()
    })

    // Should not redirect on error
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('disables OAuth buttons during loading', async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<SignInPage />)

    const googleButton = screen.getByRole('button', { name: /Google/i })
    const githubButton = screen.getByRole('button', { name: /GitHub/i })

    fireEvent.click(googleButton)

    await waitFor(() => {
      expect(googleButton).toBeDisabled()
      expect(githubButton).toBeDisabled()
    })
  })

  it('disables form during traditional login', async () => {
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<SignInPage />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    })

    const submitButton = screen.getByRole('button', { name: /Sign In/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
  })
}) 
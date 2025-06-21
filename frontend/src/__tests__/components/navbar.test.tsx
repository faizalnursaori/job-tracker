import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/lib/hooks/useAuth';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock auth hook
jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

const mockedUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Navbar', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsePathname.mockReturnValue('/');
  });

  describe('Loading State', () => {
    it('should show loading skeleton when auth is loading', () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        logout: mockLogout,
        getAuthToken: jest.fn(),
        session: null,
      });

      render(<Navbar />);

      expect(screen.getByText('Job Tracker')).toBeInTheDocument();
      expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
    });
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        logout: mockLogout,
        getAuthToken: jest.fn(),
        session: null,
      });
    });

    it('should render logo and auth buttons when not authenticated', () => {
      render(<Navbar />);

      expect(screen.getByText('Job Tracker')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
    });

    it('should not show navigation links when not authenticated', () => {
      render(<Navbar />);

      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Applications')).not.toBeInTheDocument();
    });

    it('should link logo to home page when not authenticated', () => {
      render(<Navbar />);

      const logoLink = screen.getByRole('link', { name: /job tracker/i });
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('Authenticated State', () => {
    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        logout: mockLogout,
        getAuthToken: jest.fn(),
        session: { user: mockUser },
      });
    });

    it('should render navigation links when authenticated', () => {
      render(<Navbar />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Applications')).toBeInTheDocument();
    });

    it('should show user welcome message', () => {
      render(<Navbar />);

      expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument();
    });

    it('should show user email when name is not available', () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { ...mockUser, name: undefined },
        logout: mockLogout,
        getAuthToken: jest.fn(),
        session: { user: { ...mockUser, name: undefined } },
      });

      render(<Navbar />);

      expect(screen.getByText('Welcome, john@example.com')).toBeInTheDocument();
    });

    it('should render logout button', () => {
      render(<Navbar />);

      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('should call logout function when logout button is clicked', async () => {
      render(<Navbar />);

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });

    it('should link logo to dashboard when authenticated', () => {
      render(<Navbar />);

      const logoLink = screen.getByRole('link', { name: /job tracker/i });
      expect(logoLink).toHaveAttribute('href', '/dashboard');
    });

    it('should not show auth buttons when authenticated', () => {
      render(<Navbar />);

      expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /get started/i })).not.toBeInTheDocument();
    });
  });

  describe('Active Navigation', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        logout: mockLogout,
        getAuthToken: jest.fn(),
        session: null,
      });
    });

    it('should highlight active dashboard link', () => {
      mockedUsePathname.mockReturnValue('/dashboard');
      render(<Navbar />);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('text-blue-600', 'bg-blue-50');
    });

    it('should highlight active applications link', () => {
      mockedUsePathname.mockReturnValue('/applications');
      render(<Navbar />);

      const applicationsLink = screen.getByRole('link', { name: /applications/i });
      expect(applicationsLink).toHaveClass('text-blue-600', 'bg-blue-50');
    });

    it('should not highlight inactive links', () => {
      mockedUsePathname.mockReturnValue('/dashboard');
      render(<Navbar />);

      const applicationsLink = screen.getByRole('link', { name: /applications/i });
      expect(applicationsLink).toHaveClass('text-gray-700');
      expect(applicationsLink).not.toHaveClass('text-blue-600', 'bg-blue-50');
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        logout: mockLogout,
        getAuthToken: jest.fn(),
        session: null,
      });
    });

    it('should show mobile menu button', () => {
      render(<Navbar />);

      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('should toggle mobile menu when menu button is clicked', () => {
      render(<Navbar />);

      const menuButton = screen.getByRole('button', { name: /menu/i });
      
      // Menu should be closed initially
      expect(screen.queryByText('Dashboard')).toBeInTheDocument(); // Desktop nav
      
      // Click to open mobile menu
      fireEvent.click(menuButton);
      
      // Mobile menu content should be visible
      const mobileMenus = screen.getAllByText('Dashboard');
      expect(mobileMenus).toHaveLength(2); // Desktop + Mobile
    });

    it('should close mobile menu when navigation link is clicked', () => {
      render(<Navbar />);

      const menuButton = screen.getByRole('button', { name: /menu/i });
      fireEvent.click(menuButton);

      // Find mobile navigation links (they should have different attributes than desktop)
      const mobileNavigation = screen.getByRole('generic', { hidden: true });
      const mobileDashboardLink = mobileNavigation.querySelector('a[href="/dashboard"]');
      
      if (mobileDashboardLink) {
        fireEvent.click(mobileDashboardLink);
      }

      // Menu should close - we can verify this by checking if menu items are still visible
      expect(screen.getAllByText('Dashboard')).toHaveLength(1); // Only desktop nav visible
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes for desktop and mobile', () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        logout: mockLogout,
        getAuthToken: jest.fn(),
        session: null,
      });

      render(<Navbar />);

      // Desktop navigation should have md:flex class
      const desktopNav = screen.getByRole('navigation').parentElement;
      expect(desktopNav).toHaveClass('hidden', 'md:flex');

      // Mobile menu button should have md:hidden class
      const mobileMenuButton = screen.getByRole('button', { name: /menu/i }).parentElement;
      expect(mobileMenuButton).toHaveClass('md:hidden');
    });
  });
}); 
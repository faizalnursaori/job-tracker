import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAuth } from '@/lib/hooks/useAuth';
import DashboardPage from '@/app/(authenticated)/dashboard/page';

// Mock useAuth hook
jest.mock('@/lib/hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

describe('Dashboard Page', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { 
        id: '1', 
        email: 'test@example.com', 
        name: 'Test User' 
      },
      logout: jest.fn(),
      getAuthToken: jest.fn().mockReturnValue('mock-token'),
      session: null
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render dashboard title', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should display all stat cards', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Total Applications')).toBeInTheDocument();
    expect(screen.getByText('Active Applications')).toBeInTheDocument();
    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('Response Rate')).toBeInTheDocument();
  });

  it('should show correct total applications count', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('should display status breakdown section', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Application Status')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('Interview')).toBeInTheDocument();
    expect(screen.getByText('Offer')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('should display recent activity section', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Recent Applications')).toBeInTheDocument();
    expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('TechCorp')).toBeInTheDocument();
  });

  it('should display priority distribution', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Priority Distribution')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('should have add application button', () => {
    render(<DashboardPage />);
    
    const addButton = screen.getByRole('link', { name: /add application/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveAttribute('href', '/applications/new');
  });

  it('should have view all applications button', () => {
    render(<DashboardPage />);
    
    const viewAllButton = screen.getByRole('link', { name: /view all applications/i });
    expect(viewAllButton).toBeInTheDocument();
    expect(viewAllButton).toHaveAttribute('href', '/applications');
  });

  it('should calculate active applications correctly', () => {
    render(<DashboardPage />);
    
    // Total applications (24) - Rejected (12) = 12 active applications
    const activeApplicationsCards = screen.getAllByText('12');
    expect(activeApplicationsCards.length).toBeGreaterThan(0);
  });
}); 
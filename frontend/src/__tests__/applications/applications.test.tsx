import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAuth } from '@/lib/hooks/useAuth';
import ApplicationsPage from '@/app/(authenticated)/applications/page';

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

describe('Applications Page', () => {
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

  it('should render applications title', () => {
    render(<ApplicationsPage />);
    
    expect(screen.getByText('Job Applications')).toBeInTheDocument();
  });

  it('should display filter section', () => {
    render(<ApplicationsPage />);
    
    expect(screen.getByText('Filter Applications')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by job title, company, or notes...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
  });

  it('should display applications table with headers', () => {
    render(<ApplicationsPage />);
    
    expect(screen.getByText('Position')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Applied Date')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should display mock application data', () => {
    render(<ApplicationsPage />);
    
    expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('TechCorp')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Interview')).toBeInTheDocument();
    
    expect(screen.getByText('Full Stack Engineer')).toBeInTheDocument();
    expect(screen.getByText('StartupXYZ')).toBeInTheDocument();
    expect(screen.getByText('Fintech')).toBeInTheDocument();
    
    expect(screen.getByText('React Developer')).toBeInTheDocument();
    expect(screen.getByText('BigCorp')).toBeInTheDocument();
    expect(screen.getByText('E-commerce')).toBeInTheDocument();
  });

  it('should display priority badges correctly', () => {
    render(<ApplicationsPage />);
    
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('should display formatted salaries', () => {
    render(<ApplicationsPage />);
    
    expect(screen.getByText('$120,000 - $150,000')).toBeInTheDocument();
    expect(screen.getByText('$100,000 - $130,000')).toBeInTheDocument();
    expect(screen.getByText('$90,000 - $110,000')).toBeInTheDocument();
  });

  it('should display location information correctly', () => {
    render(<ApplicationsPage />);
    
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
  });

  it('should have add application button', () => {
    render(<ApplicationsPage />);
    
    const addButton = screen.getByRole('link', { name: /add application/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveAttribute('href', '/applications/new');
  });

  it('should have action buttons for each application', () => {
    render(<ApplicationsPage />);
    
    // Each application should have view, edit, and delete buttons
    const viewButtons = screen.getAllByRole('link').filter(link => 
      link.getAttribute('href')?.includes('/applications/') && 
      !link.getAttribute('href')?.includes('edit') &&
      !link.getAttribute('href')?.includes('new')
    );
    expect(viewButtons.length).toBe(3);

    const editButtons = screen.getAllByRole('link').filter(link => 
      link.getAttribute('href')?.includes('/edit')
    );
    expect(editButtons.length).toBe(3);
  });

  it('should display applications count', () => {
    render(<ApplicationsPage />);
    
    expect(screen.getByText('Applications (3)')).toBeInTheDocument();
  });

  it('should display external job posting links', () => {
    render(<ApplicationsPage />);
    
    const externalLinks = screen.getAllByText('View Job Posting');
    expect(externalLinks.length).toBe(3);
  });
}); 
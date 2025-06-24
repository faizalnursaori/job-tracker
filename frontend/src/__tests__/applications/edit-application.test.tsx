import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAuth } from '@/lib/hooks/useAuth';
import EditApplicationPage from '@/app/(authenticated)/applications/[id]/edit/page';

// Mock useAuth hook
jest.mock('@/lib/hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ id: 'test-application-id' })),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: {
      id: 'test-application-id',
      jobTitle: 'Senior Frontend Developer',
      company: { id: 'company-1', name: 'TechCorp' },
      companyId: 'company-1',
      status: 'APPLIED',
      jobLevel: 'SENIOR',
      employmentType: 'FULL_TIME',
      salaryMin: 120000,
      salaryMax: 150000,
      currency: 'USD',
      location: 'San Francisco, CA',
      isRemote: false,
      jobUrl: 'https://techcorp.com/jobs/1',
      jobDescription: 'Great opportunity for a senior frontend developer...',
      requirements: 'React, TypeScript, 5+ years experience',
      appliedDate: '2023-12-01T00:00:00Z',
      responseDeadline: '2023-12-15T00:00:00Z',
      personalNotes: 'Looks like a great fit',
      priority: 1,
      source: 'LinkedIn',
      isFavorite: true,
    },
    isLoading: false,
    error: null,
  })),
  useMutation: jest.fn(() => ({
    mutateAsync: jest.fn(),
    isPending: false,
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  jobApplicationsApi: {
    getById: jest.fn(),
    update: jest.fn(),
  },
  companiesApi: {
    getAll: jest.fn(),
  },
  statusesApi: {
    getAll: jest.fn(),
  },
}));

describe('Edit Application Page', () => {
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

  it('should render edit application title', () => {
    render(<EditApplicationPage />);
    
    expect(screen.getByText('Edit Application')).toBeInTheDocument();
  });

  it('should display back navigation button', () => {
    render(<EditApplicationPage />);
    
    expect(screen.getByText('Back to Application')).toBeInTheDocument();
  });

  it('should render form sections', () => {
    render(<EditApplicationPage />);
    
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Job Details')).toBeInTheDocument();
    expect(screen.getByText('Compensation')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Additional Information')).toBeInTheDocument();
  });

  it('should display required form fields', () => {
    render(<EditApplicationPage />);
    
    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/applied date/i)).toBeInTheDocument();
  });

  it('should display optional form fields', () => {
    render(<EditApplicationPage />);
    
    expect(screen.getByLabelText(/job level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/employment type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remote work/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/minimum salary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/maximum salary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
  });

  it('should display job posting and notes fields', () => {
    render(<EditApplicationPage />);
    
    expect(screen.getByLabelText(/job posting url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/source/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/requirements/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/personal notes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mark as favorite/i)).toBeInTheDocument();
  });

  it('should have submit and cancel buttons', () => {
    render(<EditApplicationPage />);
    
    expect(screen.getByText('Update Application')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should display priority options', () => {
    render(<EditApplicationPage />);
    
    // Priority select should be present
    const priorityLabel = screen.getByLabelText(/priority/i);
    expect(priorityLabel).toBeInTheDocument();
  });

  it('should display status options', () => {
    render(<EditApplicationPage />);
    
    // Status select should be present
    const statusLabel = screen.getByLabelText(/status/i);
    expect(statusLabel).toBeInTheDocument();
  });

  it('should display timeline fields', () => {
    render(<EditApplicationPage />);
    
    expect(screen.getByLabelText(/applied date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/response deadline/i)).toBeInTheDocument();
  });

  it('should have proper form sections layout', () => {
    render(<EditApplicationPage />);
    
    // Check that all major sections are present
    const sections = [
      'Basic Information',
      'Job Details', 
      'Compensation',
      'Timeline',
      'Additional Information'
    ];
    
    sections.forEach(section => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });
  });

  it('should display form descriptions', () => {
    render(<EditApplicationPage />);
    
    expect(screen.getByText('Update the basic details about the job position')).toBeInTheDocument();
    expect(screen.getByText('Additional information about the position')).toBeInTheDocument();
    expect(screen.getByText('Salary and compensation details')).toBeInTheDocument();
    expect(screen.getByText('Important dates and deadlines')).toBeInTheDocument();
    expect(screen.getByText('Extra details and notes')).toBeInTheDocument();
  });
}); 
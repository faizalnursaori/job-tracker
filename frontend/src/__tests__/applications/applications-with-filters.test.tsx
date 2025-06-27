import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ApplicationsPage from '@/app/(authenticated)/applications/page';
import { jobApplicationsApi } from '@/lib/api';
import '@testing-library/jest-dom';

// Mock the API
jest.mock('@/lib/api', () => ({
  jobApplicationsApi: {
    getAll: jest.fn(),
    getFilterOptions: jest.fn(),
  },
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockJobApplicationsApi = jobApplicationsApi as jest.Mocked<typeof jobApplicationsApi>;

const mockApplicationsData = {
  jobApplications: [
    {
      id: '1',
      jobTitle: 'Senior Frontend Developer',
      status: 'APPLIED',
      priority: 1,
      appliedDate: '2024-01-15T00:00:00.000Z',
      responseDeadline: '2024-02-15T00:00:00.000Z',
      salaryMin: 15000000,
      salaryMax: 20000000,
      currency: 'IDR',
      location: 'Jakarta',
      isRemote: false,
      isFavorite: true,
      jobLevel: 'SENIOR',
      employmentType: 'FULL_TIME',
      company: {
        id: '1',
        name: 'Tech Company',
        industry: 'Technology',
      },
      _count: {
        notes: 2,
      },
    },
    {
      id: '2',
      jobTitle: 'Backend Developer',
      status: 'PHONE_SCREEN',
      priority: 2,
      appliedDate: '2024-01-10T00:00:00.000Z',
      salaryMin: 12000000,
      salaryMax: 18000000,
      currency: 'IDR',
      location: 'Bandung',
      isRemote: true,
      isFavorite: false,
      jobLevel: 'MID',
      employmentType: 'CONTRACT',
      company: {
        id: '2',
        name: 'Another Company',
        industry: 'Technology',
      },
      _count: {
        notes: 1,
      },
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    pages: 1,
  },
};

const mockFilterOptions = {
  companies: [{ id: '1', name: 'Tech Company' }],
  statuses: ['APPLIED', 'PHONE_SCREEN'],
  jobLevels: ['SENIOR', 'MID'],
  employmentTypes: ['FULL_TIME', 'CONTRACT'],
  sources: ['LinkedIn'],
  locations: ['Jakarta', 'Bandung'],
  priorities: [
    { value: 1, label: 'High' },
    { value: 2, label: 'Medium' },
  ],
  currencies: ['IDR'],
  searchFields: [{ value: 'jobTitle', label: 'Job Title' }],
};

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ApplicationsPage with Advanced Filters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJobApplicationsApi.getAll.mockResolvedValue({
      data: { data: mockApplicationsData },
    } as any);
    mockJobApplicationsApi.getFilterOptions.mockResolvedValue({
      data: { data: mockFilterOptions },
    } as any);
  });

  it('renders applications page with advanced filters', async () => {
    renderWithQueryClient(<ApplicationsPage />);

    expect(screen.getByText('Job Applications')).toBeInTheDocument();
    expect(screen.getByText('Add Application')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Applications (2)')).toBeInTheDocument();
    });
  });

  it('displays job applications in table format', async () => {
    renderWithQueryClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Backend Developer')).toBeInTheDocument();
      expect(screen.getByText('Tech Company')).toBeInTheDocument();
      expect(screen.getByText('Another Company')).toBeInTheDocument();
    });
  });

  it('shows priority badges correctly', async () => {
    renderWithQueryClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });

  it('displays salary information', async () => {
    renderWithQueryClient(<ApplicationsPage />);

    await waitFor(() => {
      // The exact format depends on the formatSalary function
      expect(screen.getByText(/IDR/)).toBeInTheDocument();
    });
  });

  it('shows remote work badges', async () => {
    renderWithQueryClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Remote')).toBeInTheDocument();
    });
  });

  it('shows favorite star for favorite applications', async () => {
    renderWithQueryClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText('★')).toBeInTheDocument();
    });
  });

  it('displays response deadlines', async () => {
    renderWithQueryClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Deadline:/)).toBeInTheDocument();
    });
  });

  it('calls API with correct initial filters', () => {
    renderWithQueryClient(<ApplicationsPage />);

    expect(mockJobApplicationsApi.getAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('handles API errors gracefully', async () => {
    mockJobApplicationsApi.getAll.mockRejectedValue(new Error('API Error'));

    renderWithQueryClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Error loading applications')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('shows empty state when no applications found', async () => {
    mockJobApplicationsApi.getAll.mockResolvedValue({
      data: {
        data: {
          jobApplications: [],
          pagination: { page: 1, limit: 10, total: 0, pages: 0 },
        },
      },
    } as any);

    renderWithQueryClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText('No job applications found.')).toBeInTheDocument();
      expect(screen.getByText('Add Your First Application')).toBeInTheDocument();
    });
  });

  it('displays pagination when there are multiple pages', async () => {
    const multiPageData = {
      ...mockApplicationsData,
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        pages: 3,
      },
    };

    mockJobApplicationsApi.getAll.mockResolvedValue({
      data: { data: multiPageData },
    } as any);

    renderWithQueryClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Showing 1 to 10 of 25 applications')).toBeInTheDocument();
    });
  });
}); 
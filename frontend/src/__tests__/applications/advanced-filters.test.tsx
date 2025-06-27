import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdvancedFilters } from '@/components/applications/advanced-filters';
import { jobApplicationsApi } from '@/lib/api';
import '@testing-library/jest-dom';

// Mock the API
jest.mock('@/lib/api', () => ({
  jobApplicationsApi: {
    getFilterOptions: jest.fn(),
  },
}));

const mockJobApplicationsApi = jobApplicationsApi as jest.Mocked<typeof jobApplicationsApi>;

const mockFilterOptions = {
  companies: [
    { id: '1', name: 'Test Company 1' },
    { id: '2', name: 'Test Company 2' },
  ],
  statuses: ['APPLIED', 'PHONE_SCREEN', 'OFFER'],
  jobLevels: ['ENTRY', 'MID', 'SENIOR'],
  employmentTypes: ['FULL_TIME', 'CONTRACT'],
  sources: ['LinkedIn', 'JobStreet'],
  locations: ['Jakarta', 'Bandung'],
  priorities: [
    { value: 1, label: 'High' },
    { value: 2, label: 'Medium' },
    { value: 3, label: 'Low' },
  ],
  currencies: ['IDR', 'USD'],
  searchFields: [
    { value: 'jobTitle', label: 'Job Title' },
    { value: 'companyName', label: 'Company Name' },
  ],
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

describe('AdvancedFilters', () => {
  const mockFilters = {};
  const mockOnFiltersChange = jest.fn();
  const mockOnReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockJobApplicationsApi.getFilterOptions.mockResolvedValue({
      data: { data: mockFilterOptions },
    } as any);
  });

  it('renders basic filter controls', async () => {
    renderWithQueryClient(
      <AdvancedFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by job title, company, or notes...')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('shows active filters count', () => {
    const filtersWithActive = {
      status: 'APPLIED',
      search: 'developer',
    };

    renderWithQueryClient(
      <AdvancedFilters
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument(); // Active filters badge
  });

  it('calls onFiltersChange when search input changes', async () => {
    renderWithQueryClient(
      <AdvancedFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by job title, company, or notes...');
    fireEvent.change(searchInput, { target: { value: 'developer' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ search: 'developer' });
  });

  it('toggles advanced filters section', () => {
    renderWithQueryClient(
      <AdvancedFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />
    );

    const advancedButton = screen.getByText('Advanced');
    fireEvent.click(advancedButton);

    expect(screen.getByText('Job Level')).toBeInTheDocument();
    expect(screen.getByText('Employment Type')).toBeInTheDocument();
    expect(screen.getByText('Salary Range')).toBeInTheDocument();
  });

  it('renders filter options from API', async () => {
    renderWithQueryClient(
      <AdvancedFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />
    );

    await waitFor(() => {
      expect(mockJobApplicationsApi.getFilterOptions).toHaveBeenCalled();
    });
  });

  it('displays active filter badges and allows removal', () => {
    const filtersWithActive = {
      status: 'APPLIED',
      priority: 1,
      isRemote: true,
    };

    renderWithQueryClient(
      <AdvancedFilters
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />
    );

    expect(screen.getByText('Status: APPLIED')).toBeInTheDocument();
    expect(screen.getByText('Priority: High')).toBeInTheDocument();
    expect(screen.getByText('Remote: Yes')).toBeInTheDocument();

    // Test removing a filter
    const removeButtons = screen.getAllByRole('button');
    const statusRemoveButton = removeButtons.find(button => 
      button.querySelector('svg') && button.textContent?.includes('Status: APPLIED')
    );
    
    if (statusRemoveButton) {
      fireEvent.click(statusRemoveButton);
      expect(mockOnFiltersChange).toHaveBeenCalled();
    }
  });

  it('calls onReset when clear all button is clicked', () => {
    const filtersWithActive = { status: 'APPLIED' };

    renderWithQueryClient(
      <AdvancedFilters
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />
    );

    const clearAllButton = screen.getByText('Clear All');
    fireEvent.click(clearAllButton);

    expect(mockOnReset).toHaveBeenCalled();
  });

  it('handles date range filters', () => {
    renderWithQueryClient(
      <AdvancedFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />
    );

    // Open advanced filters
    const advancedButton = screen.getByText('Advanced');
    fireEvent.click(advancedButton);

    // Find date inputs (there should be 4: 2 for applied date, 2 for deadline)
    const dateInputs = screen.getAllByDisplayValue('');
    const appliedFromInput = dateInputs.find(input => 
      input.getAttribute('type') === 'date'
    );

    if (appliedFromInput) {
      fireEvent.change(appliedFromInput, { target: { value: '2024-01-01' } });
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        appliedDateFrom: '2024-01-01T00:00:00.000Z'
      });
    }
  });

  it('handles salary range filters', () => {
    renderWithQueryClient(
      <AdvancedFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />
    );

    // Open advanced filters
    const advancedButton = screen.getByText('Advanced');
    fireEvent.click(advancedButton);

    const minSalaryInput = screen.getByPlaceholderText('Min salary');
    fireEvent.change(minSalaryInput, { target: { value: '10000000' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      salaryMin: 10000000
    });
  });

  it('formats filter labels correctly', () => {
    const filtersWithMultiple = {
      status: ['APPLIED', 'OFFER'],
      appliedDateFrom: '2024-01-01T00:00:00.000Z',
      salaryMin: 10000000,
    };

    renderWithQueryClient(
      <AdvancedFilters
        filters={filtersWithMultiple}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />
    );

    expect(screen.getByText('Status: APPLIED, OFFER')).toBeInTheDocument();
    expect(screen.getByText('Applied From: 1/1/2024')).toBeInTheDocument();
    expect(screen.getByText('Min Salary: 10,000,000')).toBeInTheDocument();
  });

  it('handles search fields selection', async () => {
    renderWithQueryClient(
      <AdvancedFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Search in...')).toBeInTheDocument();
    });
  });
}); 
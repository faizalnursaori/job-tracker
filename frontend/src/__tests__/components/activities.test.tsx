import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityForm } from '@/components/activities/activity-form';
import { ActivityList } from '@/components/activities/activity-list';
import { activitiesApi } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  activitiesApi: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getByJobApplication: jest.fn(),
  },
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
}));

// Mock the ActivityTimeline component
jest.mock('@/components/ui/activity-timeline', () => ({
  ActivityTimeline: ({ activities }: { activities: any[] }) => (
    <div data-testid="activity-timeline">
      {activities.map((activity, index) => (
        <div key={index} data-testid={`timeline-activity-${index}`}>
          {activity.activity}
        </div>
      ))}
    </div>
  ),
}));

const mockActivitiesApi = activitiesApi as jest.Mocked<typeof activitiesApi>;

// Test utilities
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

const mockActivities = [
  {
    id: '1',
    jobApplicationId: 'job-1',
    activity: 'Application submitted',
    description: 'Initial application submitted through company website',
    metadata: { source: 'Company Website' },
    createdAt: '2023-12-01T10:00:00Z',
  },
  {
    id: '2',
    jobApplicationId: 'job-1',
    activity: 'Status changed from Applied to Phone Screen',
    description: 'HR contacted for initial phone screening',
    metadata: { oldStatus: 'APPLIED', newStatus: 'PHONE_SCREEN' },
    createdAt: '2023-12-02T14:30:00Z',
  },
];

describe('ActivityForm', () => {
  const mockProps = {
    jobApplicationId: 'job-1',
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form correctly', () => {
    renderWithQueryClient(<ActivityForm {...mockProps} />);
    
    expect(screen.getByText('Add New Activity')).toBeInTheDocument();
    expect(screen.getByText('Record a new activity for this job application')).toBeInTheDocument();
    expect(screen.getByLabelText(/activity description/i)).toBeInTheDocument();
    expect(screen.getByText('Add Activity')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ActivityForm {...mockProps} />);
    
    const submitButton = screen.getByText('Add Activity');
    await user.click(submitButton);
    
    expect(screen.getByText('Activity description is required')).toBeInTheDocument();
    expect(mockActivitiesApi.create).not.toHaveBeenCalled();
  });

  it('creates new activity successfully', async () => {
    const user = userEvent.setup();
    mockActivitiesApi.create.mockResolvedValue({ data: { success: true } });
    
    renderWithQueryClient(<ActivityForm {...mockProps} />);
    
    const activityInput = screen.getByLabelText(/activity description/i);
    await user.type(activityInput, 'New activity');
    
    const submitButton = screen.getByText('Add Activity');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockActivitiesApi.create).toHaveBeenCalledWith({
        jobApplicationId: 'job-1',
        activity: 'New activity',
        description: '',
        metadata: undefined,
      });
      expect(mockProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ActivityForm {...mockProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockProps.onCancel).toHaveBeenCalled();
  });
});

describe('ActivityList', () => {
  const mockProps = {
    jobApplicationId: 'job-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state', async () => {
    mockActivitiesApi.getByJobApplication.mockResolvedValue({
      data: { activities: [] },
    });
    
    renderWithQueryClient(<ActivityList {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('No activities recorded yet')).toBeInTheDocument();
      expect(screen.getByText('Add First Activity')).toBeInTheDocument();
    });
  });

  it('renders activities correctly', async () => {
    mockActivitiesApi.getByJobApplication.mockResolvedValue({
      data: { activities: mockActivities },
    });
    
    renderWithQueryClient(<ActivityList {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Activity Timeline')).toBeInTheDocument();
      expect(screen.getByText('Application submitted')).toBeInTheDocument();
      expect(screen.getByText('Status changed from Applied to Phone Screen')).toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    mockActivitiesApi.getByJobApplication.mockRejectedValue({
      response: { data: { message: 'Failed to load activities' } },
    });
    
    renderWithQueryClient(<ActivityList {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Activities')).toBeInTheDocument();
      expect(screen.getByText('Failed to load activities')).toBeInTheDocument();
    });
  });
}); 
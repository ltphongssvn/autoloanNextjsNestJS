// apps/frontend/src/app/dashboard/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DashboardPage from './page';

const mockLogout = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, full_name: 'John Doe', role: 'customer', email: 'john@test.com' },
    logout: mockLogout,
    login: vi.fn(),
    signup: vi.fn(),
    token: 'tok',
    isLoading: false,
  }),
}));

const mockList = vi.fn();
vi.mock('../../services/api', () => ({
  api: {
    applications: {
      list: (...args: unknown[]) => mockList(...args),
    },
  },
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    mockList.mockReturnValue(new Promise(() => {}));
    render(<DashboardPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
  });

  it('should render applications list', async () => {
    mockList.mockResolvedValue({
      data: [
        { id: 1, application_number: 'AL-000001', status: 'draft' },
        { id: 2, application_number: 'AL-000002', status: 'submitted' },
      ],
    });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
    expect(screen.getByText(/AL-000001/)).toBeInTheDocument();
    expect(screen.getByText(/AL-000002/)).toBeInTheDocument();
  });

  it('should show empty state', async () => {
    mockList.mockResolvedValue({ data: [] });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('No applications found.')).toBeInTheDocument());
  });

  it('should show error on fetch failure', async () => {
    mockList.mockRejectedValue(new Error('Network error'));
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Network error'));
  });

  it('should handle non-Error failure', async () => {
    mockList.mockRejectedValue('string error');
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load applications'));
  });

  it('should show user info', async () => {
    mockList.mockResolvedValue({ data: [] });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe (customer)'));
  });

  it('should call logout on button click', async () => {
    mockList.mockResolvedValue({ data: [] });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('Logout')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalled();
  });
});

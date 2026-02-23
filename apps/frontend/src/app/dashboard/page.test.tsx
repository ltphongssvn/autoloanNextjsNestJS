import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DashboardPage from './page';

const mockApplications = [
  { id: 1, application_number: 'APP-0001', status: 'submitted', loan_amount: 25000, loan_term: 48, car_details: { make: 'Toyota', model: 'Camry', year: '2024' }, created_at: '2024-01-15T00:00:00Z', updated_at: '2024-01-15T00:00:00Z' },
  { id: 2, application_number: 'APP-0002', status: 'draft', loan_amount: 0, loan_term: 36, car_details: {}, created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-12T00:00:00Z' },
];
const mockList = vi.fn();
const mockDelete = vi.fn();
vi.mock('../../services/api', () => ({
  api: {
    applications: {
      list: (...args: unknown[]) => mockList(...args),
      remove: (...args: unknown[]) => mockDelete(...args),
    },
  },
}));
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { first_name: 'Tiffany', role: 'customer' }, token: 'abc' }),
}));

describe('DashboardPage', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

  it('renders dashboard heading and welcome message', async () => {
    mockList.mockResolvedValue({ data: mockApplications });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
    expect(screen.getByText(/Welcome back, Tiffany/)).toBeInTheDocument();
  });

  it('shows new application link for customers', async () => {
    mockList.mockResolvedValue({ data: mockApplications });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByTestId('new-app-link')).toBeInTheDocument());
  });

  it('renders application cards with vehicle and loan info', async () => {
    mockList.mockResolvedValue({ data: mockApplications });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getAllByTestId('app-card')).toHaveLength(2));
    expect(screen.getByText('APP-0001')).toBeInTheDocument();
    expect(screen.getByText('2024 Toyota Camry')).toBeInTheDocument();
    expect(screen.getByText(/\$25,000/)).toBeInTheDocument();
  });

  it('shows draft status with incomplete label and delete button', async () => {
    mockList.mockResolvedValue({ data: mockApplications });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('(Incomplete)')).toBeInTheDocument());
    expect(screen.getByTestId('delete-btn')).toBeInTheDocument();
  });

  it('shows Continue link for draft and View link for submitted', async () => {
    mockList.mockResolvedValue({ data: mockApplications });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('Continue')).toBeInTheDocument());
    expect(screen.getByText('View')).toBeInTheDocument();
  });

  it('deletes application on confirm', async () => {
    mockList.mockResolvedValue({ data: mockApplications });
    mockDelete.mockResolvedValue({});
    vi.stubGlobal('confirm', vi.fn(() => true));
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByTestId('delete-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('delete-btn'));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(2));
  });

  it('filters applications by status', async () => {
    mockList.mockResolvedValue({ data: mockApplications });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getAllByTestId('app-card')).toHaveLength(2));
    fireEvent.change(screen.getByTestId('status-filter'), { target: { value: 'submitted' } });
    expect(screen.getAllByTestId('app-card')).toHaveLength(1);
  });

  it('shows empty state when no applications', async () => {
    mockList.mockResolvedValue({ data: [] });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument());
    expect(screen.getByText('Start your first loan application today!')).toBeInTheDocument();
  });

  it('shows filter-aware empty state message', async () => {
    mockList.mockResolvedValue({ data: mockApplications });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getAllByTestId('app-card')).toHaveLength(2));
    fireEvent.change(screen.getByTestId('status-filter'), { target: { value: 'approved' } });
    expect(screen.getByText('Try changing your filter settings')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockList.mockReturnValue(new Promise(() => {}));
    render(<DashboardPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading applications...');
  });

  it('shows error state', async () => {
    mockList.mockRejectedValue(new Error('Network error'));
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Network error'));
  });

  it('renders settings link', async () => {
    mockList.mockResolvedValue({ data: mockApplications });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('Settings')).toBeInTheDocument());
  });

  it('renders order select', async () => {
    mockList.mockResolvedValue({ data: mockApplications });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByTestId('order-select')).toBeInTheDocument());
  });

  it('handles nested envelope response format', async () => {
    mockList.mockResolvedValue({ data: { data: mockApplications } });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getAllByTestId('app-card')).toHaveLength(2));
  });

  it('handles bare array response format', async () => {
    mockList.mockResolvedValue(mockApplications);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getAllByTestId('app-card')).toHaveLength(2));
  });

  it('handles empty object response gracefully', async () => {
    mockList.mockResolvedValue({});
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument());
  });

  it('shows error when delete fails', async () => {
    mockList.mockResolvedValue({ data: mockApplications });
    mockDelete.mockRejectedValue(new Error('Delete failed'));
    vi.stubGlobal('confirm', vi.fn(() => true));
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByTestId('delete-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('delete-btn'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Delete failed'));
  });

  it('generates fallback app ID when no application_number', async () => {
    mockList.mockResolvedValue({ data: [{ ...mockApplications[0], application_number: undefined }] });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('#APP-0001')).toBeInTheDocument());
  });
});

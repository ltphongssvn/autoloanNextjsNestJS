// apps/frontend/src/app/dashboard/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './page';

const mockList = vi.fn();
vi.mock('../../services/api', () => ({
  api: { applications: { list: (...args: unknown[]) => mockList(...args) } },
}));

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const apps = [
  { id: 1, application_number: 'AL-000001', status: 'submitted', loan_amount: '25000.00', created_at: '2026-01-01T00:00:00Z' },
  { id: 2, application_number: 'AL-000002', status: 'approved', loan_amount: null, created_at: '2026-01-02T00:00:00Z' },
];

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 1, role: 'customer' } });
  });

  it('should show loading state', () => {
    mockList.mockReturnValue(new Promise(() => {}));
    render(<DashboardPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
  });

  it('should render applications table', async () => {
    mockList.mockResolvedValue({ data: apps });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getAllByTestId('app-row')).toHaveLength(2));
    expect(screen.getByText('AL-000001')).toBeInTheDocument();
    expect(screen.getByText('$25,000')).toBeInTheDocument();
  });

  it('should render with array response', async () => {
    mockList.mockResolvedValue(apps);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getAllByTestId('app-row')).toHaveLength(2));
  });

  it('should show empty state', async () => {
    mockList.mockResolvedValue({ data: [] });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByTestId('empty-state')).toHaveTextContent('No applications found.'));
  });

  it('should show error', async () => {
    mockList.mockRejectedValue(new Error('Server error'));
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Server error'));
  });

  it('should handle non-Error failure', async () => {
    mockList.mockRejectedValue('fail');
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load applications'));
  });

  it('should show New Application link for customers', async () => {
    mockList.mockResolvedValue({ data: [] });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByTestId('new-app-link')).toBeInTheDocument());
  });

  it('should hide New Application link for staff', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockList.mockResolvedValue({ data: [] });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument());
    expect(screen.queryByTestId('new-app-link')).toBeNull();
  });

  it('should show dash for null loan amount', async () => {
    mockList.mockResolvedValue({ data: [apps[1]] });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('—')).toBeInTheDocument());
  });

  it('should display status badges with formatted text', async () => {
    mockList.mockResolvedValue({ data: [{ ...apps[0], status: 'under_review' }] });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByTestId('status-badge')).toHaveTextContent('under review'));
  });
});

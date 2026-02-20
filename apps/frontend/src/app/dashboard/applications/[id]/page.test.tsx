// apps/frontend/src/app/dashboard/applications/[id]/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ApplicationDetailPage from './page';

const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ back: mockBack }),
}));

const mockGet = vi.fn();
const mockUpdateStatus = vi.fn();
vi.mock('../../../../services/api', () => ({
  api: {
    applications: {
      get: (...args: unknown[]) => mockGet(...args),
      updateStatus: (...args: unknown[]) => mockUpdateStatus(...args),
    },
  },
}));

const mockUseAuth = vi.fn();
vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const baseApp = {
  id: 1,
  application_number: 'AL-000001',
  status: 'submitted',
  loan_details: { amount: 25000, down_payment: 5000 },
  loan_term: 60,
};

describe('ApplicationDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 1, role: 'customer' } });
  });

  it('should show loading state', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<ApplicationDetailPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
  });

  it('should render application details', async () => {
    mockGet.mockResolvedValue({ data: baseApp });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Application AL-000001')).toBeInTheDocument());
    expect(screen.getByTestId('status')).toHaveTextContent('submitted');
    expect(screen.getByTestId('loan-amount')).toHaveTextContent('$25,000');
    expect(screen.getByTestId('loan-term')).toHaveTextContent('60 months');
  });

  it('should show error on fetch failure', async () => {
    mockGet.mockRejectedValue(new Error('Not found'));
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Not found'));
  });

  it('should handle non-Error fetch failure', async () => {
    mockGet.mockRejectedValue('string error');
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load application'));
  });

  it('should not show staff actions for customers', async () => {
    mockGet.mockResolvedValue({ data: baseApp });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Application AL-000001')).toBeInTheDocument());
    expect(screen.queryByTestId('staff-actions')).toBeNull();
  });

  it('should show Start Review for staff on submitted app', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockGet.mockResolvedValue({ data: baseApp });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Start Review')).toBeInTheDocument());
  });

  it('should show Approve/Reject for staff on under_review app', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'underwriter' } });
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'under_review' } });
    render(<ApplicationDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Approve')).toBeInTheDocument();
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });
  });

  it('should handle status update', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockGet.mockResolvedValue({ data: baseApp });
    mockUpdateStatus.mockResolvedValue({ data: { ...baseApp, status: 'under_review' } });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Start Review')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Start Review'));
    await waitFor(() => expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'under_review'));
  });

  it('should show error on status update failure', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockGet.mockResolvedValue({ data: baseApp });
    mockUpdateStatus.mockRejectedValue(new Error('Forbidden'));
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Start Review')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Start Review'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Forbidden'));
  });

  it('should handle non-Error status update failure', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockGet.mockResolvedValue({ data: baseApp });
    mockUpdateStatus.mockRejectedValue('fail');
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Start Review')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Start Review'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to update status'));
  });

  it('should navigate back on Back button click', async () => {
    mockGet.mockResolvedValue({ data: baseApp });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Back')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('should handle approve status update', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'underwriter' } });
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'under_review' } });
    mockUpdateStatus.mockResolvedValue({ data: { ...baseApp, status: 'approved' } });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Approve')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Approve'));
    await waitFor(() => expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'approved'));
  });

  it('should handle reject status update', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'underwriter' } });
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'under_review' } });
    mockUpdateStatus.mockResolvedValue({ data: { ...baseApp, status: 'rejected' } });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Reject')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Reject'));
    await waitFor(() => expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'rejected'));
  });

  it('should show N/A for missing loan fields', async () => {
    mockGet.mockResolvedValue({ data: { ...baseApp, loan_details: {}, loan_term: null } });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByTestId('loan-amount')).toHaveTextContent('N/A'));
    expect(screen.getByTestId('down-payment')).toHaveTextContent('N/A');
    expect(screen.getByTestId('loan-term')).toHaveTextContent('N/A');
  });
});

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
const mockHistory = vi.fn();
const mockSubmit = vi.fn();
const mockSign = vi.fn();
const mockAgreementPdf = vi.fn();
vi.mock('../../../../services/api', () => ({
  api: {
    applications: {
      get: (...args: unknown[]) => mockGet(...args),
      updateStatus: (...args: unknown[]) => mockUpdateStatus(...args),
      history: (...args: unknown[]) => mockHistory(...args),
      submit: (...args: unknown[]) => mockSubmit(...args),
      sign: (...args: unknown[]) => mockSign(...args),
      agreementPdf: (...args: unknown[]) => mockAgreementPdf(...args),
    },
    documents: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      upload: vi.fn(),
      updateStatus: vi.fn(),
    },
    notes: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      create: vi.fn(),
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
  loan_amount: '25000.00',
  down_payment: '5000.00',
  loan_term: 60,
};

describe('ApplicationDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 1, role: 'customer' } });
    mockHistory.mockResolvedValue({ data: [] });
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

  it('should render with res fallback (no data wrapper)', async () => {
    mockGet.mockResolvedValue(baseApp);
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Application AL-000001')).toBeInTheDocument());
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
    await waitFor(() => expect(screen.getByText(/Back/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Back/));
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
    mockGet.mockResolvedValue({ data: { ...baseApp, loan_amount: null, down_payment: null, loan_term: null } });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByTestId('loan-amount')).toHaveTextContent('N/A'));
    expect(screen.getByTestId('down-payment')).toHaveTextContent('N/A');
    expect(screen.getByTestId('loan-term')).toHaveTextContent('N/A');
  });

  it('should render StatusHistory section', async () => {
    mockGet.mockResolvedValue({ data: baseApp });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('No status changes yet.')).toBeInTheDocument());
  });

  it('should render Documents section', async () => {
    mockGet.mockResolvedValue({ data: baseApp });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Documents')).toBeInTheDocument());
  });

  it('should show Submit button for customer with draft app', async () => {
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'draft' } });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Submit Application')).toBeInTheDocument());
  });

  it('should handle submit', async () => {
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'draft' } });
    mockSubmit.mockResolvedValue({ data: { ...baseApp, status: 'submitted' } });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Submit Application')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => expect(mockSubmit).toHaveBeenCalledWith(1));
  });

  it('should show error on submit failure', async () => {
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'draft' } });
    mockSubmit.mockRejectedValue(new Error('Incomplete'));
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Submit Application')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Incomplete'));
  });

  it('should handle non-Error submit failure', async () => {
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'draft' } });
    mockSubmit.mockRejectedValue('fail');
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Submit Application')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to submit application'));
  });

  it('should show Sign and Download for customer with approved app', async () => {
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'approved' } });
    render(<ApplicationDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Sign Agreement')).toBeInTheDocument();
      expect(screen.getByText('Download Agreement')).toBeInTheDocument();
    });
  });

  it('should handle sign', async () => {
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'approved' } });
    mockSign.mockResolvedValue({ data: { ...baseApp, status: 'signed' } });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Sign Agreement')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Sign Agreement'));
    await waitFor(() => expect(mockSign).toHaveBeenCalledWith(1, 'electronic-signature'));
  });

  it('should show error on sign failure', async () => {
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'approved' } });
    mockSign.mockRejectedValue(new Error('Sign error'));
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Sign Agreement')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Sign Agreement'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Sign error'));
  });

  it('should handle non-Error sign failure', async () => {
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'approved' } });
    mockSign.mockRejectedValue('fail');
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Sign Agreement')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Sign Agreement'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to sign agreement'));
  });

  it('should handle PDF download', async () => {
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'approved' } });
    const blob = new Blob(['pdf']);
    mockAgreementPdf.mockResolvedValue(blob);
    const createObjectURL = vi.fn().mockReturnValue('blob:url');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Download Agreement')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Download Agreement'));
    await waitFor(() => {
      expect(mockAgreementPdf).toHaveBeenCalledWith(1);
      expect(revokeObjectURL).toHaveBeenCalled();
    });
  });

  it('should show error on PDF download failure', async () => {
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'approved' } });
    mockAgreementPdf.mockRejectedValue(new Error('PDF error'));
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Download Agreement')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Download Agreement'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('PDF error'));
  });

  it('should handle non-Error PDF download failure', async () => {
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'approved' } });
    mockAgreementPdf.mockRejectedValue('fail');
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Download Agreement')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Download Agreement'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to download agreement'));
  });

  it('should show Download section for signed app', async () => {
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'signed' } });
    render(<ApplicationDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('download-section')).toBeInTheDocument();
      expect(screen.getByText('Download Agreement')).toBeInTheDocument();
    });
  });

  it('should not show submit for non-customer', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockGet.mockResolvedValue({ data: { ...baseApp, status: 'draft' } });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Application AL-000001')).toBeInTheDocument());
    expect(screen.queryByText('Submit Application')).toBeNull();
  });
});

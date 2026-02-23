import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ApplicationDetailPage from './page';

const mockApp = {
  id: 1, application_number: 'APP-0001', status: 'draft',
  loan_amount: 25000, down_payment: 5000, loan_term: 48,
  interest_rate: 6.9, monthly_payment: 475.50,
  personal_info: { first_name: 'John', last_name: 'Doe', email: 'john@test.com', phone: '555-1234', dob: '1990-01-01', address: '123 Main St', city: 'LA', state: 'CA', zip: '90001' },
  car_details: { make: 'Toyota', model: 'Camry', year: '2024', price: '30000', condition: 'New', vin: 'ABC123' },
  loan_details: { amount: '25000', down_payment: '5000' },
  employment_info: { employer: 'Acme', job_title: 'Engineer', years: '5', income: '80000', credit_score: '750' },
  created_at: '2024-01-15T00:00:00Z', updated_at: '2024-01-15T00:00:00Z',
  submitted_at: null, decided_at: null,
};

const mockGet = vi.fn();
const mockSubmit = vi.fn();
const mockSign = vi.fn();
const mockUpdateStatus = vi.fn();
const mockAgreementPdf = vi.fn();
const mockBack = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ back: mockBack, push: vi.fn() }),
}));
vi.mock('../../../../services/api', () => ({
  api: {
    applications: {
      get: (...args: unknown[]) => mockGet(...args),
      submit: (...args: unknown[]) => mockSubmit(...args),
      sign: (...args: unknown[]) => mockSign(...args),
      updateStatus: (...args: unknown[]) => mockUpdateStatus(...args),
      agreementPdf: (...args: unknown[]) => mockAgreementPdf(...args),
    },
  },
}));
vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));
vi.mock('../../../../components/StatusHistory', () => ({ default: () => <div data-testid="status-history" /> }));
vi.mock('../../../../components/NotesList', () => ({ default: () => <div data-testid="notes-list" /> }));
vi.mock('../../../../components/DocumentUpload', () => ({ default: () => <div data-testid="doc-upload" /> }));

describe('ApplicationDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { role: 'customer' }, token: 'abc' });
  });

  it('renders loading state', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<ApplicationDetailPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
  });

  it('renders error state', async () => {
    mockGet.mockRejectedValue(new Error('Not found'));
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Not found'));
  });

  it('renders application heading and status badge', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Application APP-0001')).toBeInTheDocument());
    expect(screen.getByTestId('status')).toHaveTextContent('DRAFT');
  });

  it('renders personal information section', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByTestId('personal-section')).toBeInTheDocument());
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
    expect(screen.getByText('555-1234')).toBeInTheDocument();
  });

  it('renders vehicle details section', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByTestId('vehicle-section')).toBeInTheDocument());
    expect(screen.getByText('Toyota')).toBeInTheDocument();
    expect(screen.getByText('Camry')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });

  it('renders loan details section', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByTestId('loan-section')).toBeInTheDocument());
    expect(screen.getByText('48 months')).toBeInTheDocument();
    expect(screen.getByText('6.9%')).toBeInTheDocument();
  });

  it('renders employment section', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByTestId('employment-section')).toBeInTheDocument());
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('Engineer')).toBeInTheDocument();
    expect(screen.getByText('750')).toBeInTheDocument();
  });

  it('renders timeline section', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByTestId('timeline-section')).toBeInTheDocument());
  });

  it('renders timeline with submitted and decided dates', async () => {
    mockGet.mockResolvedValue({ ...mockApp, submitted_at: '2024-01-20T00:00:00Z', decided_at: '2024-01-25T00:00:00Z' });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText(/Submitted:/)).toBeInTheDocument());
    expect(screen.getByText(/Decided:/)).toBeInTheDocument();
  });

  it('shows submit button for draft applications', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Submit Application')).toBeInTheDocument());
  });

  it('submits application', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockSubmit.mockResolvedValue({ ...mockApp, status: 'submitted' });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Submit Application')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => expect(mockSubmit).toHaveBeenCalledWith(1));
  });

  it('shows sign and download for approved applications', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'approved' });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Sign Agreement')).toBeInTheDocument());
    expect(screen.getByText('Download Agreement')).toBeInTheDocument();
  });

  it('signs agreement', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'approved' });
    mockSign.mockResolvedValue({ ...mockApp, status: 'signed' });
    render(<ApplicationDetailPage />);
    await waitFor(() => fireEvent.click(screen.getByText('Sign Agreement')));
    await waitFor(() => expect(mockSign).toHaveBeenCalledWith(1, 'electronic-signature'));
  });

  it('handles submit failure', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockSubmit.mockRejectedValue(new Error('Submit error'));
    render(<ApplicationDetailPage />);
    await waitFor(() => fireEvent.click(screen.getByText('Submit Application')));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('handles sign failure', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'approved' });
    mockSign.mockRejectedValue(new Error('Sign error'));
    render(<ApplicationDetailPage />);
    await waitFor(() => fireEvent.click(screen.getByText('Sign Agreement')));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('handles download pdf failure', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'approved' });
    mockAgreementPdf.mockRejectedValue(new Error('PDF error'));
    render(<ApplicationDetailPage />);
    await waitFor(() => fireEvent.click(screen.getByText('Download Agreement')));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('navigates back', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<ApplicationDetailPage />);
    await waitFor(() => fireEvent.click(screen.getByText(/Back to Dashboard/)));
    expect(mockBack).toHaveBeenCalled();
  });

  it('renders sub-components', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<ApplicationDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('status-history')).toBeInTheDocument();
      expect(screen.getByTestId('notes-list')).toBeInTheDocument();
      expect(screen.getByTestId('doc-upload')).toBeInTheDocument();
    });
  });

  it('handles unwrapped response', async () => {
    mockGet.mockResolvedValue({ data: mockApp });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Application APP-0001')).toBeInTheDocument());
  });

  it('shows staff actions for loan officer on submitted app', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'loan_officer' }, token: 'abc' });
    mockGet.mockResolvedValue({ ...mockApp, status: 'submitted' });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Start Review')).toBeInTheDocument());
  });

  it('shows approve/reject for staff on under_review app', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'underwriter' }, token: 'abc' });
    mockGet.mockResolvedValue({ ...mockApp, status: 'under_review' });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByText('Approve')).toBeInTheDocument());
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('handles status update failure', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'loan_officer' }, token: 'abc' });
    mockGet.mockResolvedValue({ ...mockApp, status: 'submitted' });
    mockUpdateStatus.mockRejectedValue(new Error('Update failed'));
    render(<ApplicationDetailPage />);
    await waitFor(() => fireEvent.click(screen.getByText('Start Review')));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows download section for signed status', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'signed' });
    render(<ApplicationDetailPage />);
    await waitFor(() => expect(screen.getByTestId('download-section')).toBeInTheDocument());
  });
});

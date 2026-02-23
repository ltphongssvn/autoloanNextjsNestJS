import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ApplicationStatusPage from './page';

const mockApp = {
  id: 1, application_number: 'APP-0001', status: 'submitted',
  loan_amount: 25000, down_payment: 5000, loan_term: 48,
  monthly_payment: 475.50, interest_rate: 6.9,
  car_details: { make: 'Toyota', model: 'Camry', year: '2024' },
  created_at: '2024-01-15T00:00:00Z', updated_at: '2024-01-20T00:00:00Z',
  submitted_at: '2024-01-18T00:00:00Z',
};

const mockGet = vi.fn();
const mockDocList = vi.fn();
const mockDocUpload = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
}));
vi.mock('../../../../../services/api', () => ({
  api: {
    applications: { get: (...a: unknown[]) => mockGet(...a) },
    documents: { list: (...a: unknown[]) => mockDocList(...a), upload: (...a: unknown[]) => mockDocUpload(...a) },
  },
}));

describe('ApplicationStatusPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders loading state', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<ApplicationStatusPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
  });

  it('renders error state', async () => {
    mockGet.mockRejectedValue(new Error('Not found'));
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Not found'));
  });

  it('renders stepper and status badge', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockDocList.mockResolvedValue([]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('stepper')).toBeInTheDocument());
    expect(screen.getByTestId('status-badge')).toHaveTextContent('SUBMITTED');
  });

  it('renders status description for submitted', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockDocList.mockResolvedValue([]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('status-desc')).toHaveTextContent('waiting to be processed'));
  });

  it('renders application details', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockDocList.mockResolvedValue([]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('app-details')).toBeInTheDocument());
    expect(screen.getByText('$25,000')).toBeInTheDocument();
    expect(screen.getByText('48 months')).toBeInTheDocument();
  });

  it('renders documents section', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockDocList.mockResolvedValue([]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('documents-section')).toBeInTheDocument());
    expect(screen.getByText("Driver's License")).toBeInTheDocument();
  });

  it('renders status history', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockDocList.mockResolvedValue([]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('history-section')).toBeInTheDocument());
    expect(screen.getByTestId('history-section').textContent).toContain('Submitted');
    expect(screen.getByText(/Draft Created/)).toBeInTheDocument();
  });

  it('shows pending documents alert with upload buttons', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'pending_documents' });
    mockDocList.mockResolvedValue([{ id: 10, doc_type: 'proof_income', status: 'requested' }]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('pending-docs-alert')).toBeInTheDocument());
    expect(screen.getByText('Action Required')).toBeInTheDocument();
    expect(screen.getByText(/Upload proof income/)).toBeInTheDocument();
  });

  it('renders approved status description', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'approved' });
    mockDocList.mockResolvedValue([]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('status-desc')).toHaveTextContent('approved'));
  });

  it('renders rejected status description', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'rejected' });
    mockDocList.mockResolvedValue([]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('status-desc')).toHaveTextContent('not approved'));
  });

  it('renders pending status description', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'pending' });
    mockDocList.mockResolvedValue([]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('status-desc')).toHaveTextContent('Intake started'));
  });

  it('renders under_review status description', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'under_review' });
    mockDocList.mockResolvedValue([]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('status-desc')).toHaveTextContent('underwriting review'));
  });

  it('renders pending_documents status description', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'pending_documents' });
    mockDocList.mockResolvedValue([]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('status-desc')).toHaveTextContent('Additional documents'));
  });

  it('shows uploaded document with replace button', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockDocList.mockResolvedValue([{ id: 5, doc_type: 'drivers_license', status: 'uploaded', file_attached: true, file_name: 'license.pdf' }]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByText('license.pdf')).toBeInTheDocument());
    expect(screen.getByText('Replace')).toBeInTheDocument();
  });

  it('renders navigation links', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockDocList.mockResolvedValue([]);
    render(<ApplicationStatusPage />);
    await waitFor(() => {
      expect(screen.getByText('← Back to Application')).toBeInTheDocument();
      expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument();
    });
  });

  it('handles doc list failure gracefully', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockDocList.mockRejectedValue(new Error('Docs failed'));
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('stepper')).toBeInTheDocument());
  });

  it('handles unwrapped response', async () => {
    mockGet.mockResolvedValue({ data: mockApp });
    mockDocList.mockResolvedValue([]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByText('Application APP-0001')).toBeInTheDocument());
  });

  it('uploads file on pending doc button click', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'pending_documents' });
    mockDocList.mockResolvedValue([{ id: 10, doc_type: 'proof_income', status: 'requested' }]);
    mockDocUpload.mockResolvedValue({});
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('pending-docs-alert')).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Upload proof income/));
    // Simulate file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);
    await waitFor(() => expect(mockDocUpload).toHaveBeenCalled());
  });

  it('shows upload error', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'pending_documents' });
    mockDocList.mockResolvedValue([{ id: 10, doc_type: 'proof_income', status: 'requested' }]);
    mockDocUpload.mockRejectedValue(new Error('Upload failed'));
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('pending-docs-alert')).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Upload proof income/));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Upload failed'));
  });

  it('clicks replace on uploaded document', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockDocList.mockResolvedValue([{ id: 5, doc_type: 'drivers_license', status: 'uploaded', file_attached: true, file_name: 'license.pdf' }]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByText('Replace')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Replace'));
    // fileInput click triggered
  });

  it('does not show status desc for draft', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'draft' });
    mockDocList.mockResolvedValue([]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('stepper')).toBeInTheDocument());
    expect(screen.queryByTestId('status-desc')).not.toBeInTheDocument();
  });

  it('generates fallback app ID', async () => {
    mockGet.mockResolvedValue({ ...mockApp, application_number: undefined });
    mockDocList.mockResolvedValue([]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByText(/APP-0001/)).toBeInTheDocument());
  });

  it('handles doc list returning wrapped data', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockDocList.mockResolvedValue({ data: [{ id: 5, doc_type: 'drivers_license', status: 'uploaded', file_attached: true, file_name: 'dl.pdf' }] });
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByText('dl.pdf')).toBeInTheDocument());
  });

  it('does not show pending alert when no requested docs', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'pending_documents' });
    mockDocList.mockResolvedValue([{ id: 5, doc_type: 'proof_income', status: 'uploaded', file_attached: true }]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('stepper')).toBeInTheDocument());
    expect(screen.queryByTestId('pending-docs-alert')).not.toBeInTheDocument();
  });

  it('does not show submitted in history when no submitted_at', async () => {
    mockGet.mockResolvedValue({ ...mockApp, submitted_at: null, status: 'draft' });
    mockDocList.mockResolvedValue([]);
    render(<ApplicationStatusPage />);
    await waitFor(() => expect(screen.getByTestId('history-section')).toBeInTheDocument());
    expect(screen.getByTestId('history-section').textContent).not.toContain('Submitted —');
  });
});

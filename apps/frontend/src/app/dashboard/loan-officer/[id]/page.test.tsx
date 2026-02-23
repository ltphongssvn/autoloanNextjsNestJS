import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LoanOfficerReviewPage from './page';

const mockApp = {
  id: 1, application_number: 'APP-0001', status: 'submitted',
  loan_amount: 25000, down_payment: 5000, loan_term: 48,
  interest_rate: 6.9, monthly_payment: 475.50,
  personal_info: { first_name: 'John', last_name: 'Doe', email: 'john@test.com', phone: '555-1234', dob: '1990-01-01', ssn: '123456789', address: '123 Main', city: 'LA', state: 'CA', zip: '90001' },
  car_details: { make: 'Toyota', model: 'Camry', year: '2024', vin: 'VIN123', condition: 'New', price: '30000' },
  loan_details: { amount: '25000', down_payment: '5000' },
  employment_info: { employer: 'Acme', job_title: 'Eng', years: '5', income: '80000' },
  created_at: '2024-01-15T00:00:00Z', updated_at: '2024-01-20T00:00:00Z',
};

const mockGet = vi.fn();
const mockGetNotes = vi.fn();
const mockDocList = vi.fn();
const mockStartVerification = vi.fn();
const mockReview = vi.fn();
const mockAddNote = vi.fn();
const mockDocRemove = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
}));
vi.mock('../../../../services/api', () => ({
  api: {
    loanOfficer: {
      get: (...a: unknown[]) => mockGet(...a),
      getNotes: (...a: unknown[]) => mockGetNotes(...a),
      startVerification: (...a: unknown[]) => mockStartVerification(...a),
      review: (...a: unknown[]) => mockReview(...a),
      addNote: (...a: unknown[]) => mockAddNote(...a),
      requestDocuments: vi.fn(),
    },
    documents: {
      list: (...a: unknown[]) => mockDocList(...a),
      remove: (...a: unknown[]) => mockDocRemove(...a),
    },
    underwriter: { requestDocuments: vi.fn() },
  },
}));
vi.mock('../../../../components/RequestDocumentsModal', () => ({ default: ({ onClose }: { onClose: () => void }) => <div data-testid="request-docs-modal"><button onClick={onClose}>Close</button></div> }));

describe('LoanOfficerReviewPage', () => {
  beforeEach(() => { vi.clearAllMocks(); mockGetNotes.mockResolvedValue([]); mockDocList.mockResolvedValue([]); });

  it('renders loading state', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<LoanOfficerReviewPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
  });

  it('renders error state', async () => {
    mockGet.mockRejectedValue(new Error('Not found'));
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Not found'));
  });

  it('renders all detail sections', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('applicant-section')).toBeInTheDocument());
    expect(screen.getByTestId('vehicle-section')).toBeInTheDocument();
    expect(screen.getByTestId('loan-section')).toBeInTheDocument();
    expect(screen.getByTestId('employment-section')).toBeInTheDocument();
    expect(screen.getByTestId('documents-section')).toBeInTheDocument();
    expect(screen.getByTestId('verification-section')).toBeInTheDocument();
    expect(screen.getByTestId('notes-section')).toBeInTheDocument();
    expect(screen.getByTestId('decision-section')).toBeInTheDocument();
  });

  it('renders applicant info', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());
    expect(screen.getByText('***-**-6789')).toBeInTheDocument();
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
  });

  it('renders vehicle info', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByText('Toyota')).toBeInTheDocument());
    expect(screen.getByText('VIN123')).toBeInTheDocument();
  });

  it('renders loan calculations', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('loan-section')).toBeInTheDocument());
    expect(screen.getByText('$25,000')).toBeInTheDocument();
    expect(screen.getByText('48 mo')).toBeInTheDocument();
  });

  it('renders verification checklist', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByText('Applicant 18+')).toBeInTheDocument());
    expect(screen.getByText('ID matches')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Applicant 18+'));
    expect(screen.getByLabelText('Applicant 18+')).toBeChecked();
  });

  it('renders status badge', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('status-badge')).toHaveTextContent('SUBMITTED'));
  });

  it('renders notes list', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockGetNotes.mockResolvedValue([{ id: 1, note: 'Test note', internal: true, created_at: '2024-01-20T00:00:00Z', user_id: 1 }]);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByText('Test note')).toBeInTheDocument());
  });

  it('adds a note', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockAddNote.mockResolvedValue({});
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('notes-section')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'New note' } });
    fireEvent.click(screen.getByText('Add Note'));
    await waitFor(() => expect(mockAddNote).toHaveBeenCalledWith(1, 'New note'));
  });

  it('does not add empty note', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('notes-section')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Add Note'));
    expect(mockAddNote).not.toHaveBeenCalled();
  });

  it('starts verification via decision center', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockStartVerification.mockResolvedValue({ ...mockApp, status: 'pending' });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('decision-section')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Action'), { target: { value: 'start_verification' } });
    fireEvent.click(screen.getByTestId('decision-btn'));
    await waitFor(() => expect(mockStartVerification).toHaveBeenCalled());
  });

  it('forwards to underwriter via decision center', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockReview.mockResolvedValue({ ...mockApp, status: 'under_review' });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('decision-section')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Action'), { target: { value: 'review' } });
    fireEvent.change(screen.getByLabelText('Decision notes'), { target: { value: 'Looks good' } });
    fireEvent.click(screen.getByTestId('decision-btn'));
    await waitFor(() => expect(mockAddNote).toHaveBeenCalledWith(1, 'Looks good', true));
    await waitFor(() => expect(mockReview).toHaveBeenCalled());
  });

  it('opens request docs modal', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('decision-section')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Action'), { target: { value: 'request_docs' } });
    fireEvent.click(screen.getByTestId('decision-btn'));
    await waitFor(() => expect(screen.getByTestId('request-docs-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Close'));
    await waitFor(() => expect(screen.queryByTestId('request-docs-modal')).not.toBeInTheDocument());
  });

  it('renders documents table', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockDocList.mockResolvedValue([{ id: 5, doc_type: 'drivers_license', status: 'verified', file_url: 'http://test.com/file' }]);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByText('Drivers License')).toBeInTheDocument());
    expect(screen.getByText('verified')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
  });

  it('deletes a document', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockDocList.mockResolvedValue([{ id: 5, doc_type: 'proof_income', status: 'uploaded' }]);
    mockDocRemove.mockResolvedValue({});
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByText('Delete')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Delete'));
    await waitFor(() => expect(mockDocRemove).toHaveBeenCalledWith(5));
  });

  it('navigates back', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => fireEvent.click(screen.getByText('← Back to Dashboard')));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/loan-officer');
  });

  it('handles unwrapped response', async () => {
    mockGet.mockResolvedValue({ data: mockApp });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByText('Review Application APP-0001')).toBeInTheDocument());
  });

  it('handles action failure', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockStartVerification.mockRejectedValue(new Error('Server error'));
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('decision-section')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Action'), { target: { value: 'start_verification' } });
    fireEvent.click(screen.getByTestId('decision-btn'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Server error'));
  });

  it('handles add note failure', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockAddNote.mockRejectedValue(new Error('Note error'));
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('notes-section')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Add Note'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Note error'));
  });

  it('does not submit without action selected', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('decision-btn')).toBeDisabled());
  });

  it('renders no documents message', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByText('No documents uploaded yet.')).toBeInTheDocument());
  });

  it('shows review option for pending status', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'pending' });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('decision-section')).toBeInTheDocument());
    const select = screen.getByLabelText('Action');
    expect(select).toContainHTML('Forward to Underwriter');
  });

  it('renders with missing personal/car/employment data', async () => {
    mockGet.mockResolvedValue({ ...mockApp, personal_info: null, car_details: null, loan_details: null, employment_info: null, monthly_payment: null });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('applicant-section')).toBeInTheDocument());
  });

  it('renders fallback app number', async () => {
    mockGet.mockResolvedValue({ ...mockApp, application_number: undefined });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByText(/APP-0001/)).toBeInTheDocument());
  });

  it('renders doc with rejected status color', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockDocList.mockResolvedValue([{ id: 6, doc_type: 'bank_statement', status: 'rejected' }]);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByText('rejected')).toBeInTheDocument());
  });

  it('renders doc with pending status and no file_url', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockDocList.mockResolvedValue([{ id: 7, doc_type: 'proof_income', status: 'pending' }]);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByText('pending')).toBeInTheDocument());
    expect(screen.queryByText('View')).not.toBeInTheDocument();
  });

  it('handles non-Error action failure', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockStartVerification.mockRejectedValue('string error');
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('decision-section')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Action'), { target: { value: 'start_verification' } });
    fireEvent.click(screen.getByTestId('decision-btn'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to start-verification'));
  });

  it('handles non-Error add note failure', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockAddNote.mockRejectedValue('fail');
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('notes-section')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'x' } });
    fireEvent.click(screen.getByText('Add Note'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to add note'));
  });

  it('handles non-Error load failure', async () => {
    mockGet.mockRejectedValue('string error');
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load'));
  });

  it('decision with no action does nothing', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('decision-btn')).toBeDisabled());
  });

  it('renders SSN dash when missing', async () => {
    mockGet.mockResolvedValue({ ...mockApp, personal_info: { ...mockApp.personal_info, ssn: undefined } });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('applicant-section')).toBeInTheDocument());
  });

  it('renders with zero vehicle price and income', async () => {
    mockGet.mockResolvedValue({ ...mockApp, car_details: { ...mockApp.car_details, price: '0' }, employment_info: { ...mockApp.employment_info, income: '0' } });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(2));
  });

  it('renders wrapped notes response', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockGetNotes.mockResolvedValue({ data: [{ id: 2, note: 'Wrapped', internal: true, created_at: '2024-01-20T00:00:00Z', user_id: 1 }] });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByText('Wrapped')).toBeInTheDocument());
  });

  it('renders wrapped docs response', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockDocList.mockResolvedValue({ data: [{ id: 8, doc_type: 'insurance', status: 'uploaded' }] });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByText('Insurance')).toBeInTheDocument());
  });

  it('does not show start verification for non-submitted', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'under_review' });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('decision-section')).toBeInTheDocument());
    expect(screen.getByLabelText('Action')).not.toContainHTML('Start Verification');
  });

  it('does not show forward option for under_review', async () => {
    mockGet.mockResolvedValue({ ...mockApp, status: 'under_review' });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByTestId('decision-section')).toBeInTheDocument());
    expect(screen.getByLabelText('Action')).not.toContainHTML('Forward to Underwriter');
  });
});

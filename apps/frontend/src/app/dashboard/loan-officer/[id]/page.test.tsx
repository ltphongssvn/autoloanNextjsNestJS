import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import LoanOfficerReviewPage from './page';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ push: mockPush }),
}));
vi.mock('../../../../services/api', () => ({
  api: { loanOfficer: { get: vi.fn(), startVerification: vi.fn(), review: vi.fn(), requestDocuments: vi.fn(), addNote: vi.fn() } },
}));
vi.mock('../../../../components/DocumentUpload', () => ({ default: () => <div data-testid="doc-upload" /> }));

import { api } from '../../../../services/api';
const mockGet = vi.mocked(api.loanOfficer.get);
const mockStartV = vi.mocked(api.loanOfficer.startVerification);
const mockReview = vi.mocked(api.loanOfficer.review);
const mockReqDocs = vi.mocked(api.loanOfficer.requestDocuments);
const mockAddNote = vi.mocked(api.loanOfficer.addNote);

describe('LoanOfficerReviewPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('shows loading', () => { mockGet.mockReturnValue(new Promise(() => {})); render(<LoanOfficerReviewPage />); expect(screen.getByRole('status')).toBeInTheDocument(); });
  it('shows error', async () => { mockGet.mockRejectedValue(new Error('fail')); render(<LoanOfficerReviewPage />); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('fail')); });
  it('shows application details', async () => {
    mockGet.mockResolvedValue({ id: 1, application_number: 'AL-001', status: 'submitted', loan_amount: '25000', down_payment: '5000', loan_term: 60 });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByText(/AL-001/)).toBeInTheDocument());
    expect(screen.getByTestId('lo-actions')).toBeInTheDocument();
  });
  it('handles start verification', async () => {
    mockGet.mockResolvedValue({ id: 1, application_number: 'AL-001', status: 'submitted', loan_amount: '25000', down_payment: '5000', loan_term: 60 });
    mockStartV.mockResolvedValue({ id: 1, status: 'under_review' });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => screen.getByText('Start Verification'));
    fireEvent.click(screen.getByText('Start Verification'));
    await waitFor(() => expect(mockStartV).toHaveBeenCalledWith(1));
  });
  it('handles move to review', async () => {
    mockGet.mockResolvedValue({ id: 1, application_number: 'AL-001', status: 'submitted', loan_amount: '25000', down_payment: '5000', loan_term: 60 });
    mockReview.mockResolvedValue({ id: 1, status: 'under_review' });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => screen.getByText('Move to Review'));
    fireEvent.click(screen.getByText('Move to Review'));
    await waitFor(() => expect(mockReview).toHaveBeenCalledWith(1));
  });
  it('handles request documents', async () => {
    mockGet.mockResolvedValue({ id: 1, application_number: 'AL-001', status: 'under_review', loan_amount: '25000', down_payment: '5000', loan_term: 60 });
    mockReqDocs.mockResolvedValue({ id: 1, status: 'pending_documents' });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => screen.getByText('Request Documents'));
    fireEvent.change(screen.getByPlaceholderText('Add a note...'), { target: { value: 'need docs' } });
    fireEvent.click(screen.getByText('Request Documents'));
    await waitFor(() => expect(mockReqDocs).toHaveBeenCalledWith(1, { notes: 'need docs' }));
  });
  it('handles add note', async () => {
    mockGet.mockResolvedValue({ id: 1, application_number: 'AL-001', status: 'submitted', loan_amount: null, down_payment: null, loan_term: null });
    mockAddNote.mockResolvedValue({});
    render(<LoanOfficerReviewPage />);
    await waitFor(() => screen.getByPlaceholderText('Add a note...'));
    fireEvent.change(screen.getByPlaceholderText('Add a note...'), { target: { value: 'test note' } });
    fireEvent.click(screen.getByText('Add Note'));
    await waitFor(() => expect(mockAddNote).toHaveBeenCalledWith(1, 'test note'));
  });
  it('skips empty note', async () => {
    mockGet.mockResolvedValue({ id: 1, application_number: 'AL-001', status: 'submitted', loan_amount: '25000', down_payment: '5000', loan_term: 60 });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => screen.getByText('Add Note'));
    fireEvent.click(screen.getByText('Add Note'));
    expect(mockAddNote).not.toHaveBeenCalled();
  });
  it('shows pending_documents actions', async () => {
    mockGet.mockResolvedValue({ id: 1, application_number: 'AL-001', status: 'pending_documents', loan_amount: '25000', down_payment: '5000', loan_term: 60 });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => expect(screen.getByText('Move to Review')).toBeInTheDocument());
  });
  it('handles action error', async () => {
    mockGet.mockResolvedValue({ id: 1, application_number: 'AL-001', status: 'submitted', loan_amount: '25000', down_payment: '5000', loan_term: 60 });
    mockStartV.mockRejectedValue(new Error('action failed'));
    render(<LoanOfficerReviewPage />);
    await waitFor(() => screen.getByText('Start Verification'));
    fireEvent.click(screen.getByText('Start Verification'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('action failed'));
  });
  it('handles add note error', async () => {
    mockGet.mockResolvedValue({ id: 1, application_number: 'AL-001', status: 'submitted', loan_amount: '25000', down_payment: '5000', loan_term: 60 });
    mockAddNote.mockRejectedValue(new Error('note failed'));
    render(<LoanOfficerReviewPage />);
    await waitFor(() => screen.getByPlaceholderText('Add a note...'));
    fireEvent.change(screen.getByPlaceholderText('Add a note...'), { target: { value: 'x' } });
    fireEvent.click(screen.getByText('Add Note'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('note failed'));
  });
  it('navigates back', async () => {
    mockGet.mockResolvedValue({ id: 1, application_number: 'AL-001', status: 'submitted', loan_amount: '25000', down_payment: '5000', loan_term: 60 });
    render(<LoanOfficerReviewPage />);
    await waitFor(() => screen.getByText(/Back to Dashboard/));
    fireEvent.click(screen.getByText(/Back to Dashboard/));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/loan-officer');
  });
  it('shows error on null response', async () => { mockGet.mockResolvedValue(null); render(<LoanOfficerReviewPage />); await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument()); });
});

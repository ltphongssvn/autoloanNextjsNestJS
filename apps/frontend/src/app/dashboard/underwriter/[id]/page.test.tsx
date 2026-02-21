import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import UnderwriterReviewPage from './page';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useParams: () => ({ id: '1' }), useRouter: () => ({ push: mockPush }) }));
vi.mock('../../../../services/api', () => ({
  api: { underwriter: { get: vi.fn(), approve: vi.fn(), reject: vi.fn(), requestDocuments: vi.fn() } },
}));
vi.mock('../../../../components/DocumentUpload', () => ({ default: () => <div data-testid="doc-upload" /> }));

import { api } from '../../../../services/api';
const mockGet = vi.mocked(api.underwriter.get);
const mockApprove = vi.mocked(api.underwriter.approve);
const mockReject = vi.mocked(api.underwriter.reject);
const mockReqDocs = vi.mocked(api.underwriter.requestDocuments);

const baseApp = { id: 1, application_number: 'AL-001', loan_amount: '25000', down_payment: '5000', loan_term: 60, rejection_reason: null };

describe('UnderwriterReviewPage', () => {
  it('shows loading', () => { mockGet.mockReturnValue(new Promise(() => {})); render(<UnderwriterReviewPage />); expect(screen.getByRole('status')).toBeInTheDocument(); });
  it('shows error', async () => { mockGet.mockRejectedValue(new Error('fail')); render(<UnderwriterReviewPage />); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('fail')); });
  it('shows application with actions', async () => {
    mockGet.mockResolvedValue({ ...baseApp, status: 'under_review' });
    render(<UnderwriterReviewPage />);
    await waitFor(() => expect(screen.getByText('Approve')).toBeInTheDocument());
    expect(screen.getByText('Reject')).toBeInTheDocument();
    expect(screen.getByText('Request Documents')).toBeInTheDocument();
  });
  it('handles approve with loan terms', async () => {
    mockGet.mockResolvedValue({ ...baseApp, status: 'under_review' });
    mockApprove.mockResolvedValue({ id: 1, status: 'approved' });
    render(<UnderwriterReviewPage />);
    await waitFor(() => screen.getByText('Approve'));
    fireEvent.change(screen.getByPlaceholderText('60'), { target: { value: '48' } });
    fireEvent.change(screen.getByPlaceholderText('5.99'), { target: { value: '4.5' } });
    fireEvent.change(screen.getByPlaceholderText('450.00'), { target: { value: '500' } });
    fireEvent.change(screen.getByPlaceholderText('Decision notes...'), { target: { value: 'good credit' } });
    fireEvent.click(screen.getByText('Approve'));
    await waitFor(() => expect(mockApprove).toHaveBeenCalledWith(1, {
      loan_term: 48, interest_rate: 4.5, monthly_payment: 500, decision_notes: 'good credit',
    }));
  });
  it('handles reject with reason', async () => {
    mockGet.mockResolvedValue({ ...baseApp, status: 'under_review' });
    mockReject.mockResolvedValue({ id: 1, status: 'rejected' });
    render(<UnderwriterReviewPage />);
    await waitFor(() => screen.getByText('Reject'));
    fireEvent.change(screen.getByPlaceholderText('Reason for rejection...'), { target: { value: 'bad credit' } });
    fireEvent.click(screen.getByText('Reject'));
    await waitFor(() => expect(mockReject).toHaveBeenCalledWith(1, { rejection_reason: 'bad credit', decision_notes: undefined }));
  });
  it('handles request documents', async () => {
    mockGet.mockResolvedValue({ ...baseApp, status: 'under_review' });
    mockReqDocs.mockResolvedValue({ id: 1, status: 'pending_documents' });
    render(<UnderwriterReviewPage />);
    await waitFor(() => screen.getByText('Request Documents'));
    fireEvent.change(screen.getByPlaceholderText('Decision notes...'), { target: { value: 'need paystubs' } });
    fireEvent.click(screen.getByText('Request Documents'));
    await waitFor(() => expect(mockReqDocs).toHaveBeenCalledWith(1, { notes: 'need paystubs' }));
  });
  it('handles action error', async () => {
    mockGet.mockResolvedValue({ ...baseApp, status: 'under_review' });
    mockApprove.mockRejectedValue(new Error('approve failed'));
    render(<UnderwriterReviewPage />);
    await waitFor(() => screen.getByText('Approve'));
    fireEvent.click(screen.getByText('Approve'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('approve failed'));
  });
  it('shows approved state', async () => {
    mockGet.mockResolvedValue({ ...baseApp, status: 'approved' });
    render(<UnderwriterReviewPage />);
    await waitFor(() => expect(screen.getByText(/has been approved/)).toBeInTheDocument());
  });
  it('shows rejected state', async () => {
    mockGet.mockResolvedValue({ ...baseApp, status: 'rejected', rejection_reason: 'Bad credit' });
    render(<UnderwriterReviewPage />);
    await waitFor(() => expect(screen.getByText(/Bad credit/)).toBeInTheDocument());
  });
  it('shows pending_documents actions', async () => {
    mockGet.mockResolvedValue({ ...baseApp, status: 'pending_documents' });
    render(<UnderwriterReviewPage />);
    await waitFor(() => expect(screen.getByText('Approve')).toBeInTheDocument());
  });
  it('navigates back', async () => {
    mockGet.mockResolvedValue({ ...baseApp, status: 'under_review' });
    render(<UnderwriterReviewPage />);
    await waitFor(() => screen.getByText(/Back to Dashboard/));
    fireEvent.click(screen.getByText(/Back to Dashboard/));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/underwriter');
  });
  it('shows error on null response', async () => { mockGet.mockResolvedValue(null); render(<UnderwriterReviewPage />); await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument()); });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RequestDocumentsModal from './RequestDocumentsModal';

const mockRequestDocs = vi.fn();
vi.mock('../services/api', () => ({
  api: {
    loanOfficer: { requestDocuments: (...a: unknown[]) => mockRequestDocs(...a) },
    underwriter: { requestDocuments: (...a: unknown[]) => mockRequestDocs(...a) },
  },
}));

const defaultProps = { applicationId: 1, applicationNumber: 'APP-0001', role: 'loan_officer' as const, onClose: vi.fn(), onSuccess: vi.fn() };

describe('RequestDocumentsModal', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders modal with application number', () => {
    render(<RequestDocumentsModal {...defaultProps} />);
    expect(screen.getByTestId('request-docs-modal')).toBeInTheDocument();
    expect(screen.getByText('Application APP-0001')).toBeInTheDocument();
  });

  it('renders fallback app label', () => {
    render(<RequestDocumentsModal {...defaultProps} applicationNumber={undefined} />);
    expect(screen.getByText('Application #APP-0001')).toBeInTheDocument();
  });

  it('renders all document types', () => {
    render(<RequestDocumentsModal {...defaultProps} />);
    expect(screen.getByText('Bank Statements (3 months)')).toBeInTheDocument();
    expect(screen.getByText('Tax Returns')).toBeInTheDocument();
    expect(screen.getByText('Proof of Insurance')).toBeInTheDocument();
  });

  it('shows error when sending without selection', async () => {
    render(<RequestDocumentsModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('send-btn'));
    expect(screen.getByRole('alert')).toHaveTextContent('Select at least one document type');
  });

  it('toggles doc selection', () => {
    render(<RequestDocumentsModal {...defaultProps} />);
    const checkbox = screen.getByLabelText('Bank Statements (3 months)');
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('shows other text field when Other selected', () => {
    render(<RequestDocumentsModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Other'));
    expect(screen.getByPlaceholderText('Specify document type...')).toBeInTheDocument();
  });

  it('sends request successfully', async () => {
    mockRequestDocs.mockResolvedValue({});
    render(<RequestDocumentsModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Bank Statements (3 months)'));
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Please send' } });
    fireEvent.click(screen.getByTestId('send-btn'));
    await waitFor(() => expect(mockRequestDocs).toHaveBeenCalledWith(1, expect.objectContaining({ notes: 'Please send' })));
    expect(defaultProps.onSuccess).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles send failure', async () => {
    mockRequestDocs.mockRejectedValue(new Error('Server error'));
    render(<RequestDocumentsModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Tax Returns'));
    fireEvent.click(screen.getByTestId('send-btn'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Server error'));
  });

  it('handles non-Error send failure', async () => {
    mockRequestDocs.mockRejectedValue('fail');
    render(<RequestDocumentsModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Tax Returns'));
    fireEvent.click(screen.getByTestId('send-btn'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to send'));
  });

  it('calls onClose on cancel', () => {
    render(<RequestDocumentsModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('sends other text as note', async () => {
    mockRequestDocs.mockResolvedValue({});
    render(<RequestDocumentsModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Other'));
    fireEvent.change(screen.getByPlaceholderText('Specify document type...'), { target: { value: 'Custom doc' } });
    fireEvent.click(screen.getByTestId('send-btn'));
    await waitFor(() => expect(mockRequestDocs).toHaveBeenCalledWith(1, expect.objectContaining({
      document_requests: [{ doc_type: 'other', note: 'Custom doc' }],
    })));
  });

  it('works with underwriter role', async () => {
    mockRequestDocs.mockResolvedValue({});
    render(<RequestDocumentsModal {...defaultProps} role="underwriter" />);
    fireEvent.click(screen.getByLabelText('Proof of Insurance'));
    fireEvent.click(screen.getByTestId('send-btn'));
    await waitFor(() => expect(mockRequestDocs).toHaveBeenCalled());
  });
});

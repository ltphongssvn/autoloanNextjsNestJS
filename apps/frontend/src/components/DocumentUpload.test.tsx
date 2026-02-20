// apps/frontend/src/components/DocumentUpload.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DocumentUpload from './DocumentUpload';

const mockDocList = vi.fn();
const mockDocUpload = vi.fn();
const mockDocUpdateStatus = vi.fn();
vi.mock('../services/api', () => ({
  api: {
    documents: {
      list: (...args: unknown[]) => mockDocList(...args),
      upload: (...args: unknown[]) => mockDocUpload(...args),
      updateStatus: (...args: unknown[]) => mockDocUpdateStatus(...args),
    },
  },
}));

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const sampleDocs = [
  { id: 1, file_name: 'license.pdf', doc_type: 'drivers_license', status: 'pending', created_at: '2026-01-01T00:00:00Z' },
  { id: 2, file_name: 'payslip.pdf', doc_type: 'proof_income', status: 'verified', created_at: '2026-01-02T00:00:00Z' },
];

describe('DocumentUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 1, role: 'customer' } });
  });

  it('should show loading state', () => {
    mockDocList.mockReturnValue(new Promise(() => {}));
    render(<DocumentUpload applicationId={1} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading documents...');
  });

  it('should render documents list', async () => {
    mockDocList.mockResolvedValue({ data: sampleDocs });
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getAllByTestId('doc-item')).toHaveLength(2));
    expect(screen.getByText('license.pdf')).toBeInTheDocument();
  });

  it('should render with array response', async () => {
    mockDocList.mockResolvedValue(sampleDocs);
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getAllByTestId('doc-item')).toHaveLength(2));
  });

  it('should show empty state', async () => {
    mockDocList.mockResolvedValue({ data: [] });
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('no-docs')).toHaveTextContent('No documents uploaded yet.'));
  });

  it('should show error on fetch failure', async () => {
    mockDocList.mockRejectedValue(new Error('Network error'));
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Network error'));
  });

  it('should handle non-Error fetch failure', async () => {
    mockDocList.mockRejectedValue('fail');
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load documents'));
  });

  it('should upload a document', async () => {
    mockDocList.mockResolvedValue({ data: [] });
    mockDocUpload.mockResolvedValue({ data: { id: 3, file_name: 'new.pdf', doc_type: 'other', status: 'pending', created_at: '2026-01-03T00:00:00Z' } });
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('upload-form')).toBeInTheDocument());
    const fileInput = screen.getByLabelText('File upload');
    const file = new File(['test'], 'new.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.click(screen.getByText('Upload'));
    await waitFor(() => expect(screen.getByText('new.pdf')).toBeInTheDocument());
  });

  it('should upload with res fallback', async () => {
    mockDocList.mockResolvedValue({ data: [] });
    mockDocUpload.mockResolvedValue({ id: 4, file_name: 'direct.pdf', doc_type: 'other', status: 'pending', created_at: '2026-01-04T00:00:00Z' });
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('upload-form')).toBeInTheDocument());
    const fileInput = screen.getByLabelText('File upload');
    const file = new File(['test'], 'direct.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.click(screen.getByText('Upload'));
    await waitFor(() => expect(screen.getByText('direct.pdf')).toBeInTheDocument());
  });

  it('should not upload without file', async () => {
    mockDocList.mockResolvedValue({ data: [] });
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('upload-form')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Upload'));
    expect(mockDocUpload).not.toHaveBeenCalled();
  });

  it('should show uploading state', async () => {
    mockDocList.mockResolvedValue({ data: [] });
    mockDocUpload.mockReturnValue(new Promise(() => {}));
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('upload-form')).toBeInTheDocument());
    const fileInput = screen.getByLabelText('File upload');
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.click(screen.getByText('Upload'));
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });

  it('should show error on upload failure', async () => {
    mockDocList.mockResolvedValue({ data: [] });
    mockDocUpload.mockRejectedValue(new Error('Too large'));
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('upload-form')).toBeInTheDocument());
    const fileInput = screen.getByLabelText('File upload');
    const file = new File(['test'], 'big.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.click(screen.getByText('Upload'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Too large'));
  });

  it('should handle non-Error upload failure', async () => {
    mockDocList.mockResolvedValue({ data: [] });
    mockDocUpload.mockRejectedValue('fail');
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('upload-form')).toBeInTheDocument());
    const fileInput = screen.getByLabelText('File upload');
    const file = new File(['test'], 'x.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.click(screen.getByText('Upload'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to upload document'));
  });

  it('should change doc type', async () => {
    mockDocList.mockResolvedValue({ data: [] });
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('upload-form')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Document type'), { target: { value: 'bank_statement' } });
    expect(screen.getByLabelText('Document type')).toHaveValue('bank_statement');
  });

  it('should hide verify/reject for customers', async () => {
    mockDocList.mockResolvedValue({ data: sampleDocs });
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getAllByTestId('doc-item')).toHaveLength(2));
    expect(screen.queryByTestId('doc-actions')).toBeNull();
  });

  it('should show verify/reject for staff on pending docs', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockDocList.mockResolvedValue({ data: sampleDocs });
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('doc-actions')).toBeInTheDocument());
    expect(screen.getByText('Verify')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('should verify a document', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockDocList.mockResolvedValue({ data: [sampleDocs[0]] });
    mockDocUpdateStatus.mockResolvedValue({});
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByText('Verify')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Verify'));
    await waitFor(() => expect(screen.getByTestId('doc-status')).toHaveTextContent('verified'));
  });

  it('should reject a document', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'underwriter' } });
    mockDocList.mockResolvedValue({ data: [sampleDocs[0]] });
    mockDocUpdateStatus.mockResolvedValue({});
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByText('Reject')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Reject'));
    await waitFor(() => expect(screen.getByTestId('doc-status')).toHaveTextContent('rejected'));
  });

  it('should show error on verify failure', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockDocList.mockResolvedValue({ data: [sampleDocs[0]] });
    mockDocUpdateStatus.mockRejectedValue(new Error('Forbidden'));
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByText('Verify')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Verify'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Forbidden'));
  });

  it('should handle non-Error verify failure', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockDocList.mockResolvedValue({ data: [sampleDocs[0]] });
    mockDocUpdateStatus.mockRejectedValue('fail');
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByText('Verify')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Verify'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to verify document'));
  });

  it('should show error on reject failure', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'underwriter' } });
    mockDocList.mockResolvedValue({ data: [sampleDocs[0]] });
    mockDocUpdateStatus.mockRejectedValue(new Error('Bad request'));
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByText('Reject')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Reject'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Bad request'));
  });

  it('should handle non-Error reject failure', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'underwriter' } });
    mockDocList.mockResolvedValue({ data: [sampleDocs[0]] });
    mockDocUpdateStatus.mockRejectedValue('fail');
    render(<DocumentUpload applicationId={1} />);
    await waitFor(() => expect(screen.getByText('Reject')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Reject'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to reject document'));
  });
});

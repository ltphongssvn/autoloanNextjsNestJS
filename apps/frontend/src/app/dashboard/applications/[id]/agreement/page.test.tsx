import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LoanAgreementPage from './page';

const mockApp = {
  id: 1, application_number: 'APP-0001', status: 'approved',
  loan_amount: 30000, down_payment: 5000, loan_term: 60,
  interest_rate: 5.9, monthly_payment: 483.65, signed_at: null,
  personal_info: { first_name: 'Jane', last_name: 'Smith' },
  car_details: { make: 'Honda', model: 'Civic', year: '2024', vin: 'XYZ789' },
  loan_details: { amount: '30000', down_payment: '5000' },
  created_at: '2024-01-15T00:00:00Z', updated_at: '2024-01-20T00:00:00Z',
};

const mockGet = vi.fn();
const mockSign = vi.fn();
const mockAgreementPdf = vi.fn();
vi.mock('next/navigation', () => ({ useParams: () => ({ id: '1' }) }));
vi.mock('../../../../../services/api', () => ({
  api: {
    applications: {
      get: (...a: unknown[]) => mockGet(...a),
      sign: (...a: unknown[]) => mockSign(...a),
      agreementPdf: (...a: unknown[]) => mockAgreementPdf(...a),
    },
  },
}));

describe('LoanAgreementPage', () => {
  const mockCtx = { beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), clearRect: vi.fn(), strokeStyle: "", lineWidth: 0 };
  beforeAll(() => { HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx) as unknown as typeof HTMLCanvasElement.prototype.getContext; });
  beforeEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

  it('renders loading state', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<LoanAgreementPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
  });

  it('renders error state', async () => {
    mockGet.mockRejectedValue(new Error('Not found'));
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Not found'));
  });

  it('renders congratulations banner and agreement details', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('congrats-banner')).toBeInTheDocument());
    expect(screen.getByText('Congratulations!')).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    expect(screen.getByText(/\$25,000/)).toBeInTheDocument();
    expect(screen.getByText(/5.9% APR/)).toBeInTheDocument();
    expect(screen.getByText(/60 months/)).toBeInTheDocument();
    expect(screen.getByText(/XYZ789/)).toBeInTheDocument();
  });

  it('renders signature section with checkboxes and disabled sign button', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('signature-section')).toBeInTheDocument());
    expect(screen.getByText('I have read and agree to the loan terms')).toBeInTheDocument();
    expect(screen.getByText('I authorize electronic signature')).toBeInTheDocument();
    expect(screen.getByTestId('sign-btn')).toBeDisabled();
  });

  it('renders signed state when already signed', async () => {
    mockGet.mockResolvedValue({ ...mockApp, signed_at: '2024-02-01T00:00:00Z' });
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('signed-section')).toBeInTheDocument());
    expect(screen.getByText('Agreement Signed & Submitted')).toBeInTheDocument();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('handles unwrapped response', async () => {
    mockGet.mockResolvedValue({ data: mockApp });
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('congrats-banner')).toBeInTheDocument());
  });

  it('handles download PDF failure', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockAgreementPdf.mockRejectedValue(new Error('PDF error'));
    render(<LoanAgreementPage />);
    await waitFor(() => fireEvent.click(screen.getByText(/Download PDF/)));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('PDF error'));
  });

  it('handles download PDF success', async () => {
    mockGet.mockResolvedValue(mockApp);
    const mockBlob = new Blob(['test'], { type: 'application/pdf' });
    mockAgreementPdf.mockResolvedValue(mockBlob);
    const mockRevoke = vi.fn();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:test');
    globalThis.URL.revokeObjectURL = mockRevoke;
    render(<LoanAgreementPage />);
    await waitFor(() => fireEvent.click(screen.getByText(/Download PDF/)));
    await waitFor(() => expect(mockRevoke).toHaveBeenCalled());
  });

  it('download on signed page failure', async () => {
    mockGet.mockResolvedValue({ ...mockApp, signed_at: '2024-02-01T00:00:00Z' });
    mockAgreementPdf.mockRejectedValue(new Error('err'));
    render(<LoanAgreementPage />);
    await waitFor(() => fireEvent.click(screen.getByText('Download PDF')));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('handles non-Error download failure', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockAgreementPdf.mockRejectedValue('string error');
    render(<LoanAgreementPage />);
    await waitFor(() => fireEvent.click(screen.getByText(/Download PDF/)));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to download'));
  });

  it('clears signature', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByText('Clear Signature')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Clear Signature'));
  });

  it('renders back link', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByText('← Back')).toBeInTheDocument());
  });

  it('shows VIN N/A when missing', async () => {
    mockGet.mockResolvedValue({ ...mockApp, car_details: { make: 'Honda', model: 'Civic', year: '2024' } });
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByText('N/A')).toBeInTheDocument());
  });

  it('canvas drawing sets signature and enables sign after checkboxes', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('signature-section')).toBeInTheDocument());
    const canvas = document.querySelector('canvas')!;
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);
    fireEvent.click(screen.getByText('I have read and agree to the loan terms'));
    fireEvent.click(screen.getByText('I authorize electronic signature'));
    expect(screen.getByTestId('sign-btn')).not.toBeDisabled();
  });

  it('signs agreement successfully', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockSign.mockResolvedValue({ ...mockApp, signed_at: '2024-02-01T00:00:00Z' });
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('signature-section')).toBeInTheDocument());
    const canvas = document.querySelector('canvas')!;
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);
    fireEvent.click(screen.getByText('I have read and agree to the loan terms'));
    fireEvent.click(screen.getByText('I authorize electronic signature'));
    fireEvent.click(screen.getByTestId('sign-btn'));
    await waitFor(() => expect(mockSign).toHaveBeenCalledWith(1, 'drawn'));
    await waitFor(() => expect(screen.getByTestId('signed-section')).toBeInTheDocument());
  });

  it('handles sign failure', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockSign.mockRejectedValue(new Error('Sign failed'));
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('signature-section')).toBeInTheDocument());
    const canvas = document.querySelector('canvas')!;
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);
    fireEvent.click(screen.getByText('I have read and agree to the loan terms'));
    fireEvent.click(screen.getByText('I authorize electronic signature'));
    fireEvent.click(screen.getByTestId('sign-btn'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Sign failed'));
  });

  it('handles non-Error sign failure', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockSign.mockRejectedValue('string error');
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('signature-section')).toBeInTheDocument());
    const canvas = document.querySelector('canvas')!;
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);
    fireEvent.click(screen.getByText('I have read and agree to the loan terms'));
    fireEvent.click(screen.getByText('I authorize electronic signature'));
    fireEvent.click(screen.getByTestId('sign-btn'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to sign'));
  });

  it('mouseLeave stops drawing', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('signature-section')).toBeInTheDocument());
    const canvas = document.querySelector('canvas')!;
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseLeave(canvas);
    fireEvent.mouseMove(canvas, { clientX: 30, clientY: 30 });
  });

  it('does not sign without all conditions', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('sign-btn')).toBeDisabled());
    fireEvent.click(screen.getByText('I have read and agree to the loan terms'));
    expect(screen.getByTestId('sign-btn')).toBeDisabled();
  });

  it('handles non-Error load failure', async () => {
    mockGet.mockRejectedValue('string error');
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load'));
  });

  it('does not draw when not mouseDown', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('signature-section')).toBeInTheDocument());
    const canvas = document.querySelector('canvas')!;
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    expect(mockCtx.lineTo).not.toHaveBeenCalled();
  });

  it('handles sign without conditions being met (no-op)', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('sign-btn')).toBeDisabled());
  });

  it('renders with missing loan/personal/car data', async () => {
    mockGet.mockResolvedValue({ ...mockApp, personal_info: null, car_details: null, loan_amount: 0, down_payment: 0, loan_term: null, monthly_payment: null });
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('agreement-section')).toBeInTheDocument());
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('download success on signed page', async () => {
    mockGet.mockResolvedValue({ ...mockApp, signed_at: '2024-02-01T00:00:00Z' });
    const mockBlob = new Blob(['test'], { type: 'application/pdf' });
    mockAgreementPdf.mockResolvedValue(mockBlob);
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:test');
    globalThis.URL.revokeObjectURL = vi.fn();
    render(<LoanAgreementPage />);
    await waitFor(() => fireEvent.click(screen.getByText('Download PDF')));
    await waitFor(() => expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled());
  });
});

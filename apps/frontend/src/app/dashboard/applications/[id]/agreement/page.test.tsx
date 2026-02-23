import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LoanAgreementPage from './page';

const mockApp = {
  id: 1, application_number: 'APP-0001', status: 'approved',
  loan_amount: 30000, down_payment: 5000, loan_term: 60,
  interest_rate: 5.9, monthly_payment: 483.65, signed_at: null,
  personal_info: { first_name: 'Jane', last_name: 'Smith' },
  car_details: { make: 'Honda', model: 'Civic', year: '2024', vin: 'XYZ789' },
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
  beforeEach(() => { vi.clearAllMocks(); });

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

  it('renders congratulations banner', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('congrats-banner')).toBeInTheDocument());
    expect(screen.getByText('Congratulations!')).toBeInTheDocument();
  });

  it('renders agreement details', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('agreement-section')).toBeInTheDocument());
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    expect(screen.getByText(/\$25,000/)).toBeInTheDocument();
    expect(screen.getByText(/5.9% APR/)).toBeInTheDocument();
    expect(screen.getByText(/60 months/)).toBeInTheDocument();
    expect(screen.getByText(/XYZ789/)).toBeInTheDocument();
  });

  it('renders signature section with checkboxes', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('signature-section')).toBeInTheDocument());
    expect(screen.getByText('I have read and agree to the loan terms')).toBeInTheDocument();
    expect(screen.getByText('I authorize electronic signature')).toBeInTheDocument();
  });

  it('sign button disabled without checkboxes', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('sign-btn')).toBeDisabled());
  });

  it('renders signed state when already signed', async () => {
    mockGet.mockResolvedValue({ ...mockApp, signed_at: '2024-02-01T00:00:00Z' });
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('signed-section')).toBeInTheDocument());
    expect(screen.getByText('Agreement Signed & Submitted')).toBeInTheDocument();
  });

  it('handles unwrapped response', async () => {
    mockGet.mockResolvedValue({ data: mockApp });
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByTestId('congrats-banner')).toBeInTheDocument());
  });

  it('renders download PDF link', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByText(/Download PDF/)).toBeInTheDocument());
  });

  it('handles download failure', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockAgreementPdf.mockRejectedValue(new Error('PDF error'));
    render(<LoanAgreementPage />);
    await waitFor(() => fireEvent.click(screen.getByText(/Download PDF/)));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('PDF error'));
  });

  it('renders clear signature button', async () => {
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

  it('download on signed page', async () => {
    mockGet.mockResolvedValue({ ...mockApp, signed_at: '2024-02-01T00:00:00Z' });
    mockAgreementPdf.mockRejectedValue(new Error('err'));
    render(<LoanAgreementPage />);
    await waitFor(() => fireEvent.click(screen.getByText('Download PDF')));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows VIN N/A when missing', async () => {
    mockGet.mockResolvedValue({ ...mockApp, car_details: { make: 'Honda', model: 'Civic', year: '2024' } });
    render(<LoanAgreementPage />);
    await waitFor(() => expect(screen.getByText('N/A')).toBeInTheDocument());
  });
});

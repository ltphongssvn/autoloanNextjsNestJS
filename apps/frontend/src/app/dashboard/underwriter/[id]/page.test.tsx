import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import UnderwriterAnalysisPage from './page';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useParams: () => ({ id: '1' }), useRouter: () => ({ push: mockPush }) }));
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock('../../../../services/api', () => ({
  api: { underwriter: { get: vi.fn(), approve: vi.fn(), reject: vi.fn(), requestDocuments: vi.fn(), getNotes: vi.fn() } },
}));

import { api } from '../../../../services/api';
const mockGet = vi.mocked(api.underwriter.get);
const mockApprove = vi.mocked(api.underwriter.approve);
const mockReject = vi.mocked(api.underwriter.reject);
const mockReqDocs = vi.mocked(api.underwriter.requestDocuments);
const mockGetNotes = vi.mocked(api.underwriter.getNotes);

const mockApp = {
  id: 1, application_number: 'APP-001', status: 'under_review',
  personal_info: { first_name: 'John', last_name: 'Doe', dob: '1990-01-15' },
  car_details: { year: '2024', make: 'Toyota', model: 'Camry', price: '30000' },
  loan_details: { amount: '25000', down_payment: '5000' },
  employment_info: { income: '80000', years: '5' },
  loan_amount: '25000', down_payment: '5000',
  created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-02T00:00:00Z',
};

describe('UnderwriterAnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNotes.mockResolvedValue({ data: [] });
    window.alert = vi.fn();
  });

  describe('loading & error', () => {
    it('shows loading', () => { mockGet.mockReturnValue(new Promise(() => {})); mockGetNotes.mockReturnValue(new Promise(() => {})); render(<UnderwriterAnalysisPage />); expect(screen.getByRole('status')).toBeInTheDocument(); });
    it('shows error', async () => { mockGet.mockRejectedValue(new Error('fail')); render(<UnderwriterAnalysisPage />); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('fail')); });
    it('shows error on null response', async () => { mockGet.mockResolvedValue(null); render(<UnderwriterAnalysisPage />); await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument()); });
  });

  describe('page title & nav', () => {
    it('renders Financial Analysis title', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('Financial Analysis')).toBeInTheDocument());
    });
    it('renders back to dashboard', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText(/Back to Dashboard/));
      fireEvent.click(screen.getByText(/Back to Dashboard/));
      expect(mockPush).toHaveBeenCalledWith('/dashboard/underwriter');
    });
    it('renders app ID in header', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText(/APP-001/)).toBeInTheDocument());
    });
    it('generates app ID when missing', async () => {
      mockGet.mockResolvedValue({ ...mockApp, application_number: '' });
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText(/#APP-0001/)).toBeInTheDocument());
    });
  });

  describe('risk assessment', () => {
    it('renders risk assessment section', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('RISK ASSESSMENT')).toBeInTheDocument());
    });
    it('renders DTI ratio', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('Debt-to-Income Ratio')).toBeInTheDocument());
    });
    it('renders LTV ratio', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('Loan-to-Value Ratio')).toBeInTheDocument());
    });
    it('renders employment stability', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('Employment Stability')).toBeInTheDocument());
    });
    it('renders income verification', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('Income Verification')).toBeInTheDocument());
    });
    it('shows failing employment when years < 2', async () => {
      mockGet.mockResolvedValue({ ...mockApp, employment_info: { income: '80000', years: '1' } });
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('1 years')).toBeInTheDocument());
    });
  });

  describe('applicant summary', () => {
    it('renders applicant name', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText(/John Doe/)).toBeInTheDocument());
    });
    it('renders vehicle info', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText(/2024 Toyota Camry/)).toBeInTheDocument());
    });
    it('renders vehicle value', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('$30,000')).toBeInTheDocument());
    });
    it('renders down payment', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('$5,000')).toBeInTheDocument());
    });
    it('renders age from DOB', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText(/Age:/)).toBeInTheDocument());
    });
    it('renders age dash when DOB missing', async () => {
      mockGet.mockResolvedValue({ ...mockApp, personal_info: { first_name: 'John', last_name: 'Doe' } });
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText(/Age:/)).toBeInTheDocument());
    });
    it('renders view full application link', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('View Full Application')).toBeInTheDocument());
    });
  });

  describe('loan calculation', () => {
    it('renders loan calculation section', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('LOAN CALCULATION')).toBeInTheDocument());
    });
    it('renders principal', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('$20,000')).toBeInTheDocument());
    });
    it('renders interest rate', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('6.9% APR')).toBeInTheDocument());
    });
    it('renders term', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('48 months')).toBeInTheDocument());
    });
    it('handles zero principal', async () => {
      mockGet.mockResolvedValue({ ...mockApp, loan_details: { amount: '5000', down_payment: '5000' } });
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('$0')).toBeInTheDocument());
    });
  });

  describe('officer notes', () => {
    it('renders officer notes when present', async () => {
      mockGet.mockResolvedValue(mockApp);
      mockGetNotes.mockResolvedValue({ data: [{ id: 1, note: 'Test officer note', created_at: '2024-01-05T00:00:00Z' }] });
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('OFFICER NOTES')).toBeInTheDocument());
      expect(screen.getByText(/Test officer note/)).toBeInTheDocument();
    });
    it('does not render officer notes when empty', async () => {
      mockGet.mockResolvedValue(mockApp);
      mockGetNotes.mockResolvedValue({ data: [] });
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('Financial Analysis')).toBeInTheDocument());
      expect(screen.queryByText('OFFICER NOTES')).not.toBeInTheDocument();
    });
    it('handles failed notes fetch', async () => {
      mockGet.mockResolvedValue(mockApp);
      mockGetNotes.mockRejectedValue(new Error('fail'));
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('Financial Analysis')).toBeInTheDocument());
      expect(screen.queryByText('OFFICER NOTES')).not.toBeInTheDocument();
    });
  });

  describe('decision buttons', () => {
    it('renders approve button', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('Approve')).toBeInTheDocument());
    });
    it('renders reject button', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('Reject')).toBeInTheDocument());
    });
    it('renders docs button', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('Docs')).toBeInTheDocument());
    });
    it('allows entering decision notes', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByLabelText(/decision notes/i)).toBeInTheDocument());
      fireEvent.change(screen.getByLabelText(/decision notes/i), { target: { value: 'Test note' } });
      expect(screen.getByLabelText(/decision notes/i)).toHaveValue('Test note');
    });
  });

  describe('approve modal', () => {
    it('opens and closes approve modal', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Approve'));
      fireEvent.click(screen.getByText('Approve'));
      expect(screen.getByText('Approve Application')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Cancel'));
      await waitFor(() => expect(screen.queryByText('Approve Application')).not.toBeInTheDocument());
    });
    it('displays app info in approve modal', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Approve'));
      fireEvent.click(screen.getByText('Approve'));
      expect(screen.getAllByText(/APP-001/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/John Doe/).length).toBeGreaterThan(0);
    });
    it('submits approval', async () => {
      mockGet.mockResolvedValue(mockApp);
      mockApprove.mockResolvedValue({});
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Approve'));
      fireEvent.click(screen.getByText('Approve'));
      fireEvent.click(screen.getByText('Confirm Approval'));
      await waitFor(() => expect(mockApprove).toHaveBeenCalledWith(1, expect.objectContaining({ loan_term: 48, interest_rate: 6.9 })));
    });
    it('changes term and rate', async () => {
      mockGet.mockResolvedValue(mockApp);
      mockApprove.mockResolvedValue({});
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Approve'));
      fireEvent.click(screen.getByText('Approve'));
      fireEvent.change(screen.getByLabelText(/term/i), { target: { value: '72' } });
      fireEvent.change(screen.getByLabelText(/apr/i), { target: { value: '7.5' } });
      fireEvent.click(screen.getByText('Confirm Approval'));
      await waitFor(() => expect(mockApprove).toHaveBeenCalledWith(1, expect.objectContaining({ loan_term: 72 })));
    });
    it('changes conditions', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Approve'));
      fireEvent.click(screen.getByText('Approve'));
      fireEvent.change(screen.getByLabelText(/conditions/i), { target: { value: 'Special terms' } });
      expect(screen.getByLabelText(/conditions/i)).toHaveValue('Special terms');
    });
  });

  describe('reject modal', () => {
    it('opens and closes reject modal', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Reject'));
      fireEvent.click(screen.getByText('Reject'));
      expect(screen.getByText('Reject Application')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Cancel'));
      await waitFor(() => expect(screen.queryByText('Reject Application')).not.toBeInTheDocument());
    });
    it('displays all rejection reasons', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Reject'));
      fireEvent.click(screen.getByText('Reject'));
      expect(screen.getByLabelText('Debt-to-income ratio too high')).toBeInTheDocument();
      expect(screen.getByLabelText('Insufficient income')).toBeInTheDocument();
      expect(screen.getByLabelText('Loan-to-value ratio too high')).toBeInTheDocument();
      expect(screen.getByLabelText('Employment history insufficient')).toBeInTheDocument();
      expect(screen.getByLabelText('Unable to verify information')).toBeInTheDocument();
      expect(screen.getByLabelText('Other')).toBeInTheDocument();
    });
    it('requires rejection reason', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Reject'));
      fireEvent.click(screen.getByText('Reject'));
      fireEvent.click(screen.getByText('Confirm Rejection'));
      expect(window.alert).toHaveBeenCalledWith('Please select a rejection reason');
    });
    it('submits rejection with reason', async () => {
      mockGet.mockResolvedValue(mockApp);
      mockReject.mockResolvedValue({});
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Reject'));
      fireEvent.click(screen.getByText('Reject'));
      fireEvent.click(screen.getByLabelText('Insufficient income'));
      fireEvent.click(screen.getByText('Confirm Rejection'));
      await waitFor(() => expect(mockReject).toHaveBeenCalledWith(1, expect.objectContaining({ rejection_reason: 'Insufficient income' })));
    });
    it('submits rejection with additional explanation', async () => {
      mockGet.mockResolvedValue(mockApp);
      mockReject.mockResolvedValue({});
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Reject'));
      fireEvent.click(screen.getByText('Reject'));
      fireEvent.click(screen.getByLabelText('Other'));
      fireEvent.change(screen.getByLabelText(/additional explanation/i), { target: { value: 'Custom reason' } });
      fireEvent.click(screen.getByText('Confirm Rejection'));
      await waitFor(() => expect(mockReject).toHaveBeenCalledWith(1, expect.objectContaining({ rejection_reason: 'Other: Custom reason' })));
    });
  });

  describe('request documents modal', () => {
    it('opens docs modal', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Docs'));
      fireEvent.click(screen.getByText('Docs'));
      expect(screen.getByRole('heading', { name: 'Request Documents' })).toBeInTheDocument();
    });
    it('displays all document types', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Docs'));
      fireEvent.click(screen.getByText('Docs'));
      expect(screen.getByLabelText('Proof of Income (Pay Stubs)')).toBeInTheDocument();
      expect(screen.getByLabelText('Bank Statements (Last 3 months)')).toBeInTheDocument();
      expect(screen.getByLabelText('Tax Returns (Last 2 years)')).toBeInTheDocument();
      expect(screen.getByLabelText('Employment Verification Letter')).toBeInTheDocument();
      expect(screen.getByLabelText('Government ID')).toBeInTheDocument();
      expect(screen.getByLabelText('Proof of Residence')).toBeInTheDocument();
      expect(screen.getByLabelText('Vehicle Purchase Agreement')).toBeInTheDocument();
      expect(screen.getByLabelText('Proof of Insurance')).toBeInTheDocument();
    });
    it('disables request button when no docs selected', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Docs'));
      fireEvent.click(screen.getByText('Docs'));
      expect(screen.getByRole('button', { name: 'Request Documents' })).toBeDisabled();
    });
    it('toggles document selection', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Docs'));
      fireEvent.click(screen.getByText('Docs'));
      const cb = screen.getByLabelText('Bank Statements (Last 3 months)');
      fireEvent.click(cb);
      expect(cb).toBeChecked();
      fireEvent.click(cb);
      expect(cb).not.toBeChecked();
    });
    it('submits document request', async () => {
      mockGet.mockResolvedValue(mockApp);
      mockReqDocs.mockResolvedValue({});
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Docs'));
      fireEvent.click(screen.getByText('Docs'));
      fireEvent.click(screen.getByLabelText('Bank Statements (Last 3 months)'));
      fireEvent.click(screen.getByRole('button', { name: 'Request Documents' }));
      await waitFor(() => expect(mockReqDocs).toHaveBeenCalledWith(1, expect.objectContaining({ documents: ['bank_statements'] })));
    });
    it('shows success alert after request', async () => {
      mockGet.mockResolvedValue(mockApp);
      mockReqDocs.mockResolvedValue({});
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Docs'));
      fireEvent.click(screen.getByText('Docs'));
      fireEvent.click(screen.getByLabelText('Government ID'));
      fireEvent.click(screen.getByRole('button', { name: 'Request Documents' }));
      await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Documents requested successfully!'));
    });
    it('submits with notes', async () => {
      mockGet.mockResolvedValue(mockApp);
      mockReqDocs.mockResolvedValue({});
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Docs'));
      fireEvent.click(screen.getByText('Docs'));
      fireEvent.click(screen.getByLabelText('Proof of Income (Pay Stubs)'));
      fireEvent.change(screen.getByLabelText(/notes for applicant/i), { target: { value: 'Need last 3 pay stubs' } });
      fireEvent.click(screen.getByRole('button', { name: 'Request Documents' }));
      await waitFor(() => expect(mockReqDocs).toHaveBeenCalledWith(1, expect.objectContaining({ notes: 'Need last 3 pay stubs' })));
    });
    it('cancels docs modal', async () => {
      mockGet.mockResolvedValue(mockApp);
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => screen.getByText('Docs'));
      fireEvent.click(screen.getByText('Docs'));
      expect(screen.getByRole('heading', { name: 'Request Documents' })).toBeInTheDocument();
      fireEvent.click(screen.getByText('Cancel'));
      await waitFor(() => expect(screen.queryByText('Select Documents to Request:')).not.toBeInTheDocument());
    });
  });

  describe('empty data fallbacks', () => {
    it('handles empty personal_info', async () => {
      mockGet.mockResolvedValue({ ...mockApp, personal_info: {} });
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('Financial Analysis')).toBeInTheDocument());
    });
    it('handles empty car_details', async () => {
      mockGet.mockResolvedValue({ ...mockApp, car_details: {} });
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('Financial Analysis')).toBeInTheDocument());
    });
    it('handles empty loan_details', async () => {
      mockGet.mockResolvedValue({ ...mockApp, loan_details: {} });
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('Financial Analysis')).toBeInTheDocument());
    });
    it('handles empty employment_info', async () => {
      mockGet.mockResolvedValue({ ...mockApp, employment_info: {} });
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('Financial Analysis')).toBeInTheDocument());
    });
    it('handles zero income', async () => {
      mockGet.mockResolvedValue({ ...mockApp, employment_info: { income: '0', years: '5' } });
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('Income Verification')).toBeInTheDocument());
    });
    it('handles zero vehicle price', async () => {
      mockGet.mockResolvedValue({ ...mockApp, car_details: { year: '2024', make: 'Toyota', model: 'Camry', price: '0' } });
      render(<UnderwriterAnalysisPage />);
      await waitFor(() => expect(screen.getByText('RISK ASSESSMENT')).toBeInTheDocument());
    });
  });
});

describe('UnderwriterAnalysisPage error paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNotes.mockResolvedValue({ data: [] });
    window.alert = vi.fn();
  });

  it('shows error when approve fails', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockApprove.mockRejectedValue(new Error('approve failed'));
    render(<UnderwriterAnalysisPage />);
    await waitFor(() => screen.getByText('Approve'));
    fireEvent.click(screen.getByText('Approve'));
    fireEvent.click(screen.getByText('Confirm Approval'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('approve failed'));
  });

  it('shows error when reject fails', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockReject.mockRejectedValue(new Error('reject failed'));
    render(<UnderwriterAnalysisPage />);
    await waitFor(() => screen.getByText('Reject'));
    fireEvent.click(screen.getByText('Reject'));
    fireEvent.click(screen.getByLabelText('Insufficient income'));
    fireEvent.click(screen.getByText('Confirm Rejection'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('reject failed'));
  });

  it('shows error when request docs fails', async () => {
    mockGet.mockResolvedValue(mockApp);
    mockReqDocs.mockRejectedValue(new Error('docs failed'));
    render(<UnderwriterAnalysisPage />);
    await waitFor(() => screen.getByText('Docs'));
    fireEvent.click(screen.getByText('Docs'));
    fireEvent.click(screen.getByLabelText('Government ID'));
    fireEvent.click(screen.getByRole('button', { name: 'Request Documents' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('docs failed'));
  });

  it('closes approve modal via backdrop', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<UnderwriterAnalysisPage />);
    await waitFor(() => screen.getByText('Approve'));
    fireEvent.click(screen.getByText('Approve'));
    expect(screen.getByText('Approve Application')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Approve Application').closest('.fixed')!);
    await waitFor(() => expect(screen.queryByText('Approve Application')).not.toBeInTheDocument());
  });

  it('closes reject modal via backdrop', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<UnderwriterAnalysisPage />);
    await waitFor(() => screen.getByText('Reject'));
    fireEvent.click(screen.getByText('Reject'));
    expect(screen.getByText('Reject Application')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Reject Application').closest('.fixed')!);
    await waitFor(() => expect(screen.queryByText('Reject Application')).not.toBeInTheDocument());
  });

  it('closes docs modal via backdrop', async () => {
    mockGet.mockResolvedValue(mockApp);
    render(<UnderwriterAnalysisPage />);
    await waitFor(() => screen.getByText('Docs'));
    fireEvent.click(screen.getByText('Docs'));
    expect(screen.getByRole('heading', { name: 'Request Documents' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('heading', { name: 'Request Documents' }).closest('.fixed')!);
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Request Documents' })).not.toBeInTheDocument());
  });
});

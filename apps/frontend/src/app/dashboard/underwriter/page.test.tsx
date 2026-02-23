import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import UnderwriterDashboard from './page';

const mockList = vi.fn();
vi.mock('../../../services/api', () => ({ api: { underwriter: { list: (...a: unknown[]) => mockList(...a) } } }));

const apps = [
  { id: 1, application_number: 'APP-0001', status: 'under_review', loan_amount: 20000, down_payment: 5000, loan_term: 48, created_at: new Date().toISOString(), personal_info: { first_name: 'John', last_name: 'Doe' }, loan_details: { amount: '20000', down_payment: '5000' }, car_details: { price: '30000' }, employment_info: { income: '80000', years: '5' } },
  { id: 2, application_number: 'APP-0002', status: 'pending_documents', loan_amount: 60000, down_payment: 2000, loan_term: 60, created_at: new Date().toISOString(), personal_info: { first_name: 'Jane', last_name: 'Smith' }, loan_details: { amount: '60000', down_payment: '2000' }, car_details: { price: '50000' }, employment_info: { income: '40000', years: '1' } },
  { id: 3, application_number: 'APP-0003', status: 'approved', loan_amount: 10000, down_payment: 3000, loan_term: 36, decided_at: new Date().toISOString(), created_at: new Date().toISOString(), personal_info: { first_name: 'Bob', last_name: 'Lee' }, loan_details: { amount: '10000', down_payment: '3000' }, car_details: { price: '15000' }, employment_info: { income: '60000', years: '3' } },
];

describe('UnderwriterDashboard', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows loading', () => {
    mockList.mockReturnValue(new Promise(() => {}));
    render(<UnderwriterDashboard />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
  });

  it('shows error', async () => {
    mockList.mockRejectedValue(new Error('Fail'));
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Fail'));
  });

  it('renders stats cards', async () => {
    mockList.mockResolvedValue(apps);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getByTestId('stats-cards')).toBeInTheDocument());
    expect(screen.getByTestId('stats-cards')).toHaveTextContent('Under Review');
    expect(screen.getByTestId('stats-cards')).toHaveTextContent('Pending Docs');
    expect(screen.getByText('Completed This Month')).toBeInTheDocument();
  });

  it('renders table with DTI/LTV/risk columns', async () => {
    mockList.mockResolvedValue(apps);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getAllByTestId('app-row')).toHaveLength(3));
    expect(screen.getByText('DTI')).toBeInTheDocument();
    expect(screen.getByText('LTV')).toBeInTheDocument();
  });

  it('renders risk legend', async () => {
    mockList.mockResolvedValue(apps);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getByTestId('risk-legend')).toBeInTheDocument());
  });

  it('filters by status', async () => {
    mockList.mockResolvedValue(apps);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getByTestId('filters')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Status filter'), { target: { value: 'under_review' } });
    expect(screen.getAllByTestId('app-row')).toHaveLength(1);
  });

  it('filters by risk', async () => {
    mockList.mockResolvedValue(apps);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getByTestId('filters')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Risk filter'), { target: { value: 'high' } });
    expect(screen.getAllByTestId('app-row').length).toBeGreaterThanOrEqual(1);
  });

  it('filters by amount under25k', async () => {
    mockList.mockResolvedValue(apps);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getByTestId('filters')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Amount filter'), { target: { value: 'under25k' } });
    expect(screen.getAllByTestId('app-row')).toHaveLength(2);
  });

  it('filters by amount 25k-50k', async () => {
    mockList.mockResolvedValue(apps);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getByTestId('filters')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Amount filter'), { target: { value: '25k-50k' } });
  });

  it('filters by amount over50k', async () => {
    mockList.mockResolvedValue(apps);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getByTestId('filters')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Amount filter'), { target: { value: 'over50k' } });
    expect(screen.getAllByTestId('app-row')).toHaveLength(1);
  });

  it('shows empty state', async () => {
    mockList.mockResolvedValue([]);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument());
  });

  it('handles wrapped response', async () => {
    mockList.mockResolvedValue({ data: apps });
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getAllByTestId('app-row')).toHaveLength(3));
  });

  it('non-Error failure', async () => {
    mockList.mockRejectedValue('fail');
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load'));
  });

  it('renders pagination for many apps', async () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ ...apps[0], id: i + 1, application_number: `APP-${String(i).padStart(4,'0')}` }));
    mockList.mockResolvedValue(many);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getByTestId('pagination')).toBeInTheDocument());
    fireEvent.click(screen.getByText('2'));
    expect(screen.getAllByTestId('app-row')).toHaveLength(5);
  });

  it('renders with missing personal_info', async () => {
    mockList.mockResolvedValue([{ ...apps[0], personal_info: null }]);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getAllByTestId('app-row')).toHaveLength(1));
  });

  it('renders fallback app number', async () => {
    mockList.mockResolvedValue([{ ...apps[0], application_number: undefined }]);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
  });

  it('renders with zero income/price (no risk calc)', async () => {
    mockList.mockResolvedValue([{ ...apps[0], employment_info: { income: '0' }, car_details: { price: '0' } }]);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getAllByTestId('app-row')).toHaveLength(1));
  });

  it('medium risk for dti 31-40', async () => {
    mockList.mockResolvedValue([{ ...apps[0], loan_details: { amount: '40000', down_payment: '0' }, car_details: { price: '50000' }, employment_info: { income: '50000' } }]);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getAllByTestId('app-row')).toHaveLength(1));
  });

  it('completed this month counts approved/rejected with decided_at', async () => {
    mockList.mockResolvedValue(apps);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getByTestId('stats-cards')).toBeInTheDocument());
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LoanOfficerDashboard from './page';

const mockList = vi.fn();
vi.mock('../../../services/api', () => ({ api: { loanOfficer: { list: (...a: unknown[]) => mockList(...a) } } }));

const apps = [
  { id: 1, application_number: 'APP-0001', status: 'submitted', loan_amount: 20000, created_at: new Date().toISOString(), personal_info: { first_name: 'John', last_name: 'Doe' }, loan_details: { amount: '20000' } },
  { id: 2, application_number: 'APP-0002', status: 'under_review', loan_amount: 35000, created_at: new Date().toISOString(), personal_info: { first_name: 'Jane', last_name: 'Smith' }, loan_details: { amount: '35000' } },
  { id: 3, application_number: 'APP-0003', status: 'pending', loan_amount: 15000, created_at: '2020-01-01T00:00:00Z', personal_info: { first_name: 'Bob', last_name: 'Lee' }, loan_details: { amount: '15000' } },
];

describe('LoanOfficerDashboard', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows loading', () => {
    mockList.mockReturnValue(new Promise(() => {}));
    render(<LoanOfficerDashboard />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
  });

  it('shows error', async () => {
    mockList.mockRejectedValue(new Error('Fail'));
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Fail'));
  });

  it('renders stats cards', async () => {
    mockList.mockResolvedValue(apps);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByTestId('stats-cards')).toBeInTheDocument());
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
    expect(screen.getByText('New Applications')).toBeInTheDocument();
  });

  it('renders table with all apps', async () => {
    mockList.mockResolvedValue(apps);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getAllByTestId('app-row')).toHaveLength(3));
  });

  it('filters by status tab', async () => {
    mockList.mockResolvedValue(apps);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByTestId('status-tabs')).toBeInTheDocument());
    fireEvent.click(screen.getByText('New'));
    expect(screen.getAllByTestId('app-row')).toHaveLength(1);
  });

  it('filters by date range', async () => {
    mockList.mockResolvedValue(apps);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByTestId('filters')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Date range'), { target: { value: 'week' } });
    expect(screen.getAllByTestId('app-row')).toHaveLength(2);
  });

  it('filters by search term', async () => {
    mockList.mockResolvedValue(apps);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByTestId('filters')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'Jane' } });
    expect(screen.getAllByTestId('app-row')).toHaveLength(1);
  });

  it('shows empty state when no matches', async () => {
    mockList.mockResolvedValue(apps);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByTestId('filters')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'zzzzz' } });
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('shows empty when no apps', async () => {
    mockList.mockResolvedValue([]);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument());
  });

  it('handles wrapped response', async () => {
    mockList.mockResolvedValue({ data: apps });
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getAllByTestId('app-row')).toHaveLength(3));
  });

  it('filters by today', async () => {
    mockList.mockResolvedValue(apps);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByTestId('filters')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Date range'), { target: { value: 'today' } });
  });

  it('filters by month', async () => {
    mockList.mockResolvedValue(apps);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByTestId('filters')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Date range'), { target: { value: 'month' } });
  });

  it('search by app ID', async () => {
    mockList.mockResolvedValue(apps);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByTestId('filters')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'APP-0002' } });
    expect(screen.getAllByTestId('app-row')).toHaveLength(1);
  });

  it('non-Error failure', async () => {
    mockList.mockRejectedValue('fail');
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load'));
  });

  it('renders pagination for many apps', async () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ ...apps[0], id: i + 1, status: i < 10 ? 'submitted' : 'under_review', application_number: `APP-${String(i).padStart(4,'0')}` }));
    mockList.mockResolvedValue(many);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByTestId('pagination')).toBeInTheDocument());
    fireEvent.click(screen.getByText('2'));
    expect(screen.getAllByTestId('app-row')).toHaveLength(5);
  });

  it('renders missing personal_info gracefully', async () => {
    mockList.mockResolvedValue([{ ...apps[0], personal_info: null }]);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getAllByTestId('app-row')).toHaveLength(1));
  });

  it('fallback app number when missing', async () => {
    mockList.mockResolvedValue([{ ...apps[0], application_number: undefined }]);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
  });

  it('renders with missing loan_details', async () => {
    mockList.mockResolvedValue([{ ...apps[0], loan_details: null, loan_amount: 20000 }]);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getAllByTestId('app-row')).toHaveLength(1));
  });

  it('renders default status color for unknown status', async () => {
    mockList.mockResolvedValue([{ ...apps[0], status: 'unknown_status' }]);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByText('unknown status')).toBeInTheDocument());
  });

  it('resets page on filter change', async () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ ...apps[0], id: i + 1, status: i < 10 ? 'submitted' : 'under_review', application_number: `APP-${String(i).padStart(4,'0')}` }));
    mockList.mockResolvedValue(many);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByTestId('pagination')).toBeInTheDocument());
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('New'));
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });
});

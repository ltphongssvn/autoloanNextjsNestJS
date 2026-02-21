import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LoanOfficerDashboard from './page';

vi.mock('../../../services/api', () => ({
  api: {
    loanOfficer: {
      list: vi.fn(),
    },
  },
}));

import { api } from '../../../services/api';
const mockList = vi.mocked(api.loanOfficer.list);

describe('LoanOfficerDashboard', () => {
  it('should show loading state', () => {
    mockList.mockReturnValue(new Promise(() => {}));
    render(<LoanOfficerDashboard />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('should show empty state', async () => {
    mockList.mockResolvedValue([]);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument());
  });

  it('should show applications table', async () => {
    mockList.mockResolvedValue([
      { id: 1, application_number: 'AL-001', status: 'submitted', loan_amount: '25000', submitted_at: '2025-01-15', user: { first_name: 'John', last_name: 'Doe' } },
    ]);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByTestId('applications-table')).toBeInTheDocument());
    expect(screen.getByText('AL-001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should handle camelCase response', async () => {
    mockList.mockResolvedValue([
      { id: 2, applicationNumber: 'AL-002', status: 'under_review', loanAmount: 30000, submittedAt: '2025-02-01', user: { firstName: 'Jane', lastName: 'Smith' } },
    ]);
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByText('AL-002')).toBeInTheDocument());
  });

  it('should handle wrapped response', async () => {
    mockList.mockResolvedValue({ data: [{ id: 3, application_number: 'AL-003', status: 'pending_documents', user: null }] });
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByText('AL-003')).toBeInTheDocument());
  });

  it('should show error state', async () => {
    mockList.mockRejectedValue(new Error('Network error'));
    render(<LoanOfficerDashboard />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Network error'));
  });
});

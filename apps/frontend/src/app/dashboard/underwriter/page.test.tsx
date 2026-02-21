import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import UnderwriterDashboard from './page';

vi.mock('../../../services/api', () => ({ api: { underwriter: { list: vi.fn() } } }));
import { api } from '../../../services/api';
const mockList = vi.mocked(api.underwriter.list);

describe('UnderwriterDashboard', () => {
  it('shows loading', () => { mockList.mockReturnValue(new Promise(() => {})); render(<UnderwriterDashboard />); expect(screen.getByRole('status')).toBeInTheDocument(); });
  it('shows empty state', async () => { mockList.mockResolvedValue([]); render(<UnderwriterDashboard />); await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument()); });
  it('shows table', async () => {
    mockList.mockResolvedValue([{ id: 1, application_number: 'AL-001', status: 'under_review', loan_amount: '30000', user: { first_name: 'Jane', last_name: 'Doe' } }]);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getByTestId('applications-table')).toBeInTheDocument());
  });
  it('handles camelCase', async () => {
    mockList.mockResolvedValue([{ id: 2, applicationNumber: 'AL-002', status: 'pending_documents', loanAmount: 20000, user: { firstName: 'Bob', lastName: 'Smith' } }]);
    render(<UnderwriterDashboard />);
    await waitFor(() => expect(screen.getByText('AL-002')).toBeInTheDocument());
  });
  it('handles wrapped response', async () => { mockList.mockResolvedValue({ data: [] }); render(<UnderwriterDashboard />); await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument()); });
  it('shows error', async () => { mockList.mockRejectedValue(new Error('fail')); render(<UnderwriterDashboard />); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('fail')); });
});

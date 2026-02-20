// apps/frontend/src/components/StatusHistory.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import StatusHistoryList from './StatusHistory';

const mockHistory = vi.fn();
vi.mock('../services/api', () => ({
  api: { applications: { history: (...args: unknown[]) => mockHistory(...args) } },
}));

describe('StatusHistoryList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should show loading state', () => {
    mockHistory.mockReturnValue(new Promise(() => {}));
    render(<StatusHistoryList applicationId={1} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading history...');
  });

  it('should render history entries', async () => {
    mockHistory.mockResolvedValue({ data: [
      { id: 1, from_status: 'draft', to_status: 'submitted', comment: 'Submitted', created_at: '2026-01-01T00:00:00Z' },
      { id: 2, from_status: 'submitted', to_status: 'under_review', comment: null, created_at: '2026-01-02T00:00:00Z' },
    ]});
    render(<StatusHistoryList applicationId={1} />);
    await waitFor(() => expect(screen.getAllByTestId('history-entry')).toHaveLength(2));
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('should render with array response', async () => {
    mockHistory.mockResolvedValue([
      { id: 1, from_status: 'draft', to_status: 'submitted', comment: null, created_at: '2026-01-01T00:00:00Z' },
    ]);
    render(<StatusHistoryList applicationId={1} />);
    await waitFor(() => expect(screen.getAllByTestId('history-entry')).toHaveLength(1));
  });

  it('should show empty message', async () => {
    mockHistory.mockResolvedValue({ data: [] });
    render(<StatusHistoryList applicationId={1} />);
    await waitFor(() => expect(screen.getByText('No status changes yet.')).toBeInTheDocument());
  });

  it('should show error on failure', async () => {
    mockHistory.mockRejectedValue(new Error('Network error'));
    render(<StatusHistoryList applicationId={1} />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Network error'));
  });

  it('should handle non-Error failure', async () => {
    mockHistory.mockRejectedValue('fail');
    render(<StatusHistoryList applicationId={1} />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load history'));
  });

  it('should show N/A for null statuses', async () => {
    mockHistory.mockResolvedValue({ data: [
      { id: 1, from_status: null, to_status: null, comment: null, created_at: '2026-01-01T00:00:00Z' },
    ]});
    render(<StatusHistoryList applicationId={1} />);
    await waitFor(() => expect(screen.getAllByText('N/A')).toHaveLength(2));
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import AccountLockedPage from './page';

const mockGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockGet }),
}));

describe('AccountLockedPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    mockGet.mockReturnValue('user@example.com');
  });

  it('renders locked state with lock icon and message', () => {
    render(<AccountLockedPage />);
    expect(screen.getByText('Account Locked')).toBeInTheDocument();
    expect(screen.getByTestId('locked-icon')).toBeInTheDocument();
    expect(screen.getByText(/too many failed login attempts/)).toBeInTheDocument();
  });

  it('shows unlock button and back to login link', () => {
    render(<AccountLockedPage />);
    expect(screen.getByTestId('request-unlock')).toBeInTheDocument();
    expect(screen.getByText('Back to Login')).toBeInTheDocument();
  });

  it('shows sending state when unlock requested', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<AccountLockedPage />);
    fireEvent.click(screen.getByTestId('request-unlock'));
    expect(screen.getByTestId('locked-sending')).toBeInTheDocument();
  });

  it('shows success after unlock email sent', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<AccountLockedPage />);
    fireEvent.click(screen.getByTestId('request-unlock'));
    await waitFor(() => {
      expect(screen.getByTestId('locked-sent')).toBeInTheDocument();
      expect(screen.getByText('Unlock instructions have been sent to your email.')).toBeInTheDocument();
    });
  });

  it('shows error on failed unlock request', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Account not found' }),
    });
    render(<AccountLockedPage />);
    fireEvent.click(screen.getByTestId('request-unlock'));
    await waitFor(() => {
      expect(screen.getByTestId('locked-error')).toBeInTheDocument();
      expect(screen.getByText('Account not found')).toBeInTheDocument();
    });
  });

  it('shows error on network failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    render(<AccountLockedPage />);
    fireEvent.click(screen.getByTestId('request-unlock'));
    await waitFor(() => {
      expect(screen.getByTestId('locked-error')).toBeInTheDocument();
      expect(screen.getByText('Unable to send unlock request. Please try again later.')).toBeInTheDocument();
    });
  });

  it('shows error when no email in params', async () => {
    mockGet.mockReturnValue(null);
    render(<AccountLockedPage />);
    fireEvent.click(screen.getByTestId('request-unlock'));
    await waitFor(() => {
      expect(screen.getByTestId('locked-error')).toBeInTheDocument();
      expect(screen.getByText('No email address available for unlock request.')).toBeInTheDocument();
    });
  });

  it('allows retry after error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
    render(<AccountLockedPage />);
    fireEvent.click(screen.getByTestId('request-unlock'));
    await waitFor(() => expect(screen.getByTestId('locked-error')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.getByTestId('locked-actions')).toBeInTheDocument();
  });
});

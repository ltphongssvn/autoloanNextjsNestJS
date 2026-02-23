import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ConfirmEmailPage from './page';

const mockGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockGet }),
}));

describe('ConfirmEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('shows error when no token provided', () => {
    mockGet.mockReturnValue(null);
    render(<ConfirmEmailPage />);
    expect(screen.getByTestId('confirm-error')).toBeInTheDocument();
    expect(screen.getByText('No confirmation token provided.')).toBeInTheDocument();
  });

  it('shows loading state with token', () => {
    mockGet.mockReturnValue('pending-token');
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<ConfirmEmailPage />);
    expect(screen.getByTestId('confirm-loading')).toBeInTheDocument();
    expect(screen.getByText('Confirming your email...')).toBeInTheDocument();
  });

  it('shows success on valid confirmation', async () => {
    mockGet.mockReturnValue('valid-token');
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { message: 'Email confirmed successfully' } }),
    });
    render(<ConfirmEmailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('confirm-success')).toBeInTheDocument();
      expect(screen.getByText('Email confirmed successfully')).toBeInTheDocument();
      expect(screen.getByText('Go to Login')).toBeInTheDocument();
    });
  });

  it('shows already confirmed message', async () => {
    mockGet.mockReturnValue('used-token');
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { message: 'Email already confirmed' } }),
    });
    render(<ConfirmEmailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('confirm-already')).toBeInTheDocument();
      expect(screen.getByText('Email already confirmed')).toBeInTheDocument();
    });
  });

  it('shows error on invalid token', async () => {
    mockGet.mockReturnValue('bad-token');
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid or expired token' }),
    });
    render(<ConfirmEmailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('confirm-error')).toBeInTheDocument();
      expect(screen.getByText('Invalid or expired token')).toBeInTheDocument();
    });
  });

  it('shows error on network failure', async () => {
    mockGet.mockReturnValue('some-token');
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    render(<ConfirmEmailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('confirm-error')).toBeInTheDocument();
      expect(screen.getByText('Unable to confirm email. Please try again later.')).toBeInTheDocument();
    });
  });
});

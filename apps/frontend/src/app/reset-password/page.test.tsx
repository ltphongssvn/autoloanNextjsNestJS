import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

const mockPush = vi.fn();
let mockToken = 'valid-token';
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(mockToken ? `token=${mockToken}` : ''),
  useRouter: () => ({ push: mockPush }),
}));
vi.mock('../../services/api', () => ({ api: { auth: { resetPassword: vi.fn() } } }));
import { api } from '../../services/api';
const mockResetPw = vi.mocked(api.auth.resetPassword);

import ResetPasswordPage from './page';

describe('ResetPasswordPage', () => {
  beforeEach(() => { mockToken = 'valid-token'; vi.clearAllMocks(); });

  it('renders form with token', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('shows mismatch error', async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'password1' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password2' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset Password/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('do not match'));
  });

  it('resets password successfully', async () => {
    mockResetPw.mockResolvedValue({ message: 'ok' });
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset Password/ }));
    await waitFor(() => expect(mockResetPw).toHaveBeenCalledWith('valid-token', 'newpass123'));
    expect(mockPush).toHaveBeenCalledWith('/login?reset=success');
  });

  it('shows error on API failure', async () => {
    mockResetPw.mockRejectedValue(new Error('expired'));
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset Password/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('expired'));
  });

  it('shows invalid link when no token', () => {
    mockToken = '';
    render(<ResetPasswordPage />);
    expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
    expect(screen.getByText(/Request a new reset link/)).toBeInTheDocument();
  });
});

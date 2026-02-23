import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetPasswordPage from './page';
const mockPush = vi.fn();
let mockToken = 'valid-token';
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (key: string) => key === 'token' ? mockToken : null }),
  useRouter: () => ({ push: mockPush }),
}));
const mockResetPassword = vi.fn();
vi.mock('../../services/api', () => ({
  api: { auth: { resetPassword: (...args: unknown[]) => mockResetPassword(...args) } },
}));
describe('ResetPasswordPage', () => {
  beforeEach(() => { vi.clearAllMocks(); mockToken = 'valid-token'; });
  it('renders branding and description', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText('Auto Loan')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    expect(screen.getByText('Enter your new password below.')).toBeInTheDocument();
  });
  it('renders form fields and back to login link', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
    expect(screen.getByText('Back to login')).toBeInTheDocument();
  });
  it('shows error when passwords do not match', () => {
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'abcdef' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'ghijkl' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match');
  });
  it('shows error when password too short', () => {
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'ab' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'ab' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Password must be at least 6 characters');
  });
  it('shows success message on success', async () => {
    mockResetPassword.mockResolvedValue({ message: 'Password reset!' });
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Password reset!'));
  });
  it('shows error on failure', async () => {
    mockResetPassword.mockRejectedValue(new Error('Token expired'));
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Token expired'));
  });
  it('shows invalid token page when no token', () => {
    mockToken = '';
    render(<ResetPasswordPage />);
    expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
    expect(screen.getByText('Request a new reset link')).toBeInTheDocument();
  });
  it('shows loading state', async () => {
    mockResetPassword.mockReturnValue(new Promise(() => {}));
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Resetting...'));
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

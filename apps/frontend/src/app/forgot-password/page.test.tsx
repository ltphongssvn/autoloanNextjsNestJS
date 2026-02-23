import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordPage from './page';
const mockRequestPasswordReset = vi.fn();
vi.mock('../../services/api', () => ({
  api: { auth: { requestPasswordReset: (...args: unknown[]) => mockRequestPasswordReset(...args) } },
}));
describe('ForgotPasswordPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('renders branding and description', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText('Auto Loan')).toBeInTheDocument();
    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByText(/send you instructions/)).toBeInTheDocument();
  });
  it('renders form fields and button', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Instructions' })).toBeInTheDocument();
  });
  it('renders back to login link', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText('Back to login')).toBeInTheDocument();
  });
  it('shows success message and clears email on success', async () => {
    mockRequestPasswordReset.mockResolvedValue({ message: 'Instructions sent' });
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Instructions' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Instructions sent'));
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('');
  });
  it('shows default success message when none returned', async () => {
    mockRequestPasswordReset.mockResolvedValue({});
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Instructions' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Password reset instructions sent'));
  });
  it('shows error on failure', async () => {
    mockRequestPasswordReset.mockRejectedValue(new Error('Not found'));
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Instructions' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Not found'));
  });
  it('handles non-Error throw', async () => {
    mockRequestPasswordReset.mockRejectedValue('fail');
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Instructions' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to send reset instructions'));
  });
  it('shows loading state', async () => {
    mockRequestPasswordReset.mockReturnValue(new Promise(() => {}));
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Instructions' }));
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Sending...'));
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

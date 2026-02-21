import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ForgotPasswordPage from './page';

vi.mock('../../services/api', () => ({ api: { auth: { requestPasswordReset: vi.fn() } } }));
import { api } from '../../services/api';
const mockReset = vi.mocked(api.auth.requestPasswordReset);

describe('ForgotPasswordPage', () => {
  it('renders form', () => { render(<ForgotPasswordPage />); expect(screen.getByText('Forgot Password')).toBeInTheDocument(); expect(screen.getByLabelText('Email')).toBeInTheDocument(); });
  it('submits and shows success', async () => {
    mockReset.mockResolvedValue({ message: 'If the email exists, a reset link has been sent.' });
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText('Send Reset Link'));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('reset link'));
  });
  it('shows error on failure', async () => {
    mockReset.mockRejectedValue(new Error('Network error'));
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText('Send Reset Link'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Network error'));
  });
});

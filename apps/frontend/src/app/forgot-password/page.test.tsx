import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordPage from './page';

describe('ForgotPasswordPage', () => {
  const mockFetch = vi.fn();
  beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('fetch', mockFetch); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('renders branding, title, and description', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText('Auto Loan')).toBeInTheDocument();
    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByText(/send you instructions/)).toBeInTheDocument();
  });

  it('renders email input and submit button', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset instructions/i })).toBeInTheDocument();
  });

  it('renders back to login link', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  it('shows success message on successful request', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: 'Instructions sent!' }) });
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset instructions/i }));
    await waitFor(() => expect(screen.getByText('Instructions sent!')).toBeInTheDocument());
  });

  it('shows default success message when none provided', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset instructions/i }));
    await waitFor(() => expect(screen.getByText('Password reset instructions sent to your email')).toBeInTheDocument());
  });

  it('clears email on success', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: 'Sent!' }) });
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset instructions/i }));
    await waitFor(() => expect(screen.getByLabelText(/email/i)).toHaveValue(''));
  });

  it('shows loading state during submission', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset instructions/i }));
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
  });

  it('handles object errors format', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ errors: { email: ['not found', 'invalid'] } }) });
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset instructions/i }));
    await waitFor(() => expect(screen.getByText('email: not found, invalid')).toBeInTheDocument());
  });

  it('handles array errors format', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ errors: ['Error 1', 'Error 2'] }) });
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset instructions/i }));
    await waitFor(() => expect(screen.getByText('Error 1, Error 2')).toBeInTheDocument());
  });

  it('handles single error format', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Email not found' }) });
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset instructions/i }));
    await waitFor(() => expect(screen.getByText('Email not found')).toBeInTheDocument());
  });

  it('shows default error when no error message', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) });
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset instructions/i }));
    await waitFor(() => expect(screen.getByText('Failed to send reset instructions')).toBeInTheDocument());
  });

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset instructions/i }));
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
  });

  it('handles non-Error exception', async () => {
    mockFetch.mockRejectedValueOnce('unknown');
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset instructions/i }));
    await waitFor(() => expect(screen.getByText('An error occurred')).toBeInTheDocument());
  });
});

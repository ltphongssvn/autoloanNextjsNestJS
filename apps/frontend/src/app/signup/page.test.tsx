import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from './page';
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
const mockSignup = vi.fn();
vi.mock('../../services/api', () => ({
  api: { auth: { signup: (...args: unknown[]) => mockSignup(...args) } },
}));
describe('SignupPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('renders branding and subtitle', () => {
    render(<SignupPage />);
    expect(screen.getByText('Auto Loan')).toBeInTheDocument();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
  });
  it('renders all form fields', () => {
    render(<SignupPage />);
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument(); // pragma: allowlist secret
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument(); // pragma: allowlist secret
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });
  it('renders navigation links', () => {
    render(<SignupPage />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Back to home')).toBeInTheDocument();
  });
  it('shows error when passwords do not match', async () => {
    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John', name: 'first_name' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe', name: 'last_name' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'j@d.com', name: 'email' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass1', name: 'password' } }); // pragma: allowlist secret
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass2', name: 'password_confirmation' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match');
    expect(mockSignup).not.toHaveBeenCalled();
  });
  it('calls signup and redirects on success', async () => {
    mockSignup.mockResolvedValue({ token: 'abc123' });
    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John', name: 'first_name' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe', name: 'last_name' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'j@d.com', name: 'email' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass1', name: 'password' } }); // pragma: allowlist secret
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass1', name: 'password_confirmation' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
  });
  it('shows error on signup failure', async () => {
    mockSignup.mockRejectedValue(new Error('Email taken'));
    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'J', name: 'first_name' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'D', name: 'last_name' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'j@d.com', name: 'email' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'p', name: 'password' } }); // pragma: allowlist secret
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'p', name: 'password_confirmation' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Email taken'));
  });
  it('handles non-Error throw', async () => {
    mockSignup.mockRejectedValue('fail');
    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'J', name: 'first_name' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'D', name: 'last_name' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'j@d.com', name: 'email' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'p', name: 'password' } }); // pragma: allowlist secret
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'p', name: 'password_confirmation' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Signup failed'));
  });
  it('shows loading state', async () => {
    mockSignup.mockReturnValue(new Promise(() => {}));
    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'J', name: 'first_name' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'D', name: 'last_name' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'j@d.com', name: 'email' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'p', name: 'password' } }); // pragma: allowlist secret
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'p', name: 'password_confirmation' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Creating account...'));
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

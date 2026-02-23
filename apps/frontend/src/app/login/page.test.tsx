import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';
const mockPush = vi.fn();
const mockLogin = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    token: null,
    isLoading: false,
    signup: vi.fn(),
    logout: vi.fn(),
  }),
}));
describe('LoginPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('renders branding and welcome text', () => {
    render(<LoginPage />);
    expect(screen.getByText('Auto Loan')).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });
  it('renders login form fields', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument(); // pragma: allowlist secret
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });
  it('renders navigation links', () => {
    render(<LoginPage />);
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
    expect(screen.getByText('Back to home')).toBeInTheDocument();
  });
  it('calls login and redirects on success', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'testpass' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'testpass'); // pragma: allowlist secret
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
  it('shows error on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials'));
  });
  it('handles non-Error throw', async () => {
    mockLogin.mockRejectedValue('string error');
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'x' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Login failed'));
  });
  it('shows loading state while submitting', async () => {
    let resolveLogin: () => void;
    mockLogin.mockReturnValue(new Promise<void>((r) => { resolveLogin = r; }));
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'x' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Signing in...'));
    expect(screen.getByRole('button')).toBeDisabled();
    resolveLogin!();
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Sign In'));
  });
});

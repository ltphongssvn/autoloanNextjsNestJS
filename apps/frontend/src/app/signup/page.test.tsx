// apps/frontend/src/app/signup/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from './page';

const mockPush = vi.fn();
const mockSignup = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
    user: null,
    token: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const fillForm = (overrides: Record<string, string> = {}) => {
  const defaults: Record<string, string> = {
    'First Name': 'John',
    'Last Name': 'Doe',
    'Email': 'john@test.com',
    'Password': 'testpass123', // pragma: allowlist secret
    'Confirm Password': 'testpass123', // pragma: allowlist secret
  };
  const values = { ...defaults, ...overrides };
  Object.entries(values).forEach(([label, value]) => {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  });
};

describe('SignupPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should render all form fields', () => {
    render(<SignupPage />);
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument(); // pragma: allowlist secret
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument(); // pragma: allowlist secret
  });

  it('should call signup on valid submit', async () => {
    mockSignup.mockResolvedValue(undefined);
    render(<SignupPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show error when passwords do not match', async () => {
    render(<SignupPage />);
    fillForm({ 'Confirm Password': 'different' }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match'));
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('should show error on signup failure', async () => {
    mockSignup.mockRejectedValue(new Error('Email taken'));
    render(<SignupPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Email taken'));
  });

  it('should handle non-Error failure', async () => {
    mockSignup.mockRejectedValue('unknown');
    render(<SignupPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Signup failed'));
  });

  it('should disable button while submitting', async () => {
    let resolveSignup: () => void;
    mockSignup.mockReturnValue(new Promise<void>((r) => { resolveSignup = r; }));
    render(<SignupPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Creating...'));
    expect(screen.getByRole('button')).toBeDisabled();
    resolveSignup!();
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Create Account'));
  });
});

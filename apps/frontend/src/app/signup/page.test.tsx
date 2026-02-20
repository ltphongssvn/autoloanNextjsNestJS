// apps/frontend/src/app/signup/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from './page';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignup = vi.fn();
vi.mock('../../services/api', () => ({
  api: {
    auth: {
      signup: (...args: unknown[]) => mockSignup(...args),
    },
  },
}));

describe('SignupPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should render all form fields', () => {
    render(<SignupPage />);
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument(); // pragma: allowlist secret
  });

  it('should call signup on valid submit', async () => {
    mockSignup.mockResolvedValue({ token: 'jwt-token' }); // pragma: allowlist secret
    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'testpass123' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({ email: 'john@test.com', password: 'testpass123', first_name: 'John', last_name: 'Doe' }); // pragma: allowlist secret
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show error on signup failure', async () => {
    mockSignup.mockRejectedValue(new Error('Email taken'));
    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'x' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Email taken'));
  });

  it('should handle non-Error failure', async () => {
    mockSignup.mockRejectedValue('unknown');
    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'x' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Signup failed'));
  });

  it('should disable button while submitting', async () => {
    mockSignup.mockReturnValue(new Promise(() => {}));
    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'x' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Creating...'));
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should not redirect if no token returned', async () => {
    mockSignup.mockResolvedValue({});
    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'x' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => expect(mockSignup).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });
});

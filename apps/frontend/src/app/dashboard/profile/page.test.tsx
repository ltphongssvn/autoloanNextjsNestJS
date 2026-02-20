// apps/frontend/src/app/dashboard/profile/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from './page';

const mockUpdateProfile = vi.fn();
vi.mock('../../../services/api', () => ({
  api: {
    users: {
      updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
    },
  },
}));

const mockUseAuth = vi.fn();
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'john@test.com', role: 'customer', first_name: 'John', last_name: 'Doe', phone: '555-0100' },
      login: vi.fn(), signup: vi.fn(), logout: vi.fn(), token: 'tok', isLoading: false,
    });
  });

  it('should render profile info and form', () => {
    render(<ProfilePage />);
    expect(screen.getByRole('heading', { name: 'My Profile' })).toBeInTheDocument();
    expect(screen.getByTestId('email')).toHaveTextContent('john@test.com');
    expect(screen.getByTestId('role')).toHaveTextContent('customer');
    expect(screen.getByLabelText('First Name')).toHaveValue('John');
    expect(screen.getByLabelText('Last Name')).toHaveValue('Doe');
    expect(screen.getByLabelText('Phone')).toHaveValue('555-0100');
  });

  it('should update profile on submit', async () => {
    mockUpdateProfile.mockResolvedValue({ data: {} });
    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Profile updated successfully'));
    expect(mockUpdateProfile).toHaveBeenCalled();
  });

  it('should show error on failure', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('Server error'));
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Server error'));
  });

  it('should handle non-Error failure', async () => {
    mockUpdateProfile.mockRejectedValue('unknown');
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to update profile'));
  });

  it('should disable button while submitting', async () => {
    mockUpdateProfile.mockReturnValue(new Promise(() => {}));
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Saving...'));
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should handle null user fields with empty defaults', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'test@test.com', role: 'customer', first_name: null, last_name: null, phone: null },
      login: vi.fn(), signup: vi.fn(), logout: vi.fn(), token: 'tok', isLoading: false,
    });
    render(<ProfilePage />);
    expect(screen.getByLabelText('First Name')).toHaveValue('');
    expect(screen.getByLabelText('Last Name')).toHaveValue('');
    expect(screen.getByLabelText('Phone')).toHaveValue('');
  });
});
